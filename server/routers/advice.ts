import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getConversationStage, listKnowledgeEntries, listRoles } from "../db";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { cuisines, guestCounts, stages, timeSlots } from "./knowledge";

const adviceInput = z.object({
  guestCount: z.enum(guestCounts),
  cuisine: z.enum(cuisines),
  timeSlot: z.enum(timeSlots),
  stage: z.enum(stages),
  layer: z.number().int().min(1).max(3),
  personContext: z.string().trim().max(3000).default(""),
  objective: z.string().trim().min(1).max(1500),
  reflectionNotes: z.string().trim().max(3000).default(""),
});

const adviceSchema = z.object({
  executiveSummary: z.string(),
  postDinnerSummary: z.string(),
  suggestedTopics: z.array(z.object({ title: z.string(), question: z.string(), reasoning: z.string() })).min(1).transform((items) => items.slice(0, 4)),
  roleStrategy: z.array(z.object({ role: z.string(), action: z.string() })).transform((items) => items.slice(0, 7)),
  riskWatch: z.array(z.string()).transform((items) => items.slice(0, 5)),
  reflectionPrompts: z.array(z.string()).min(2).transform((items) => items.slice(0, 8)),
});

function buildSourcePacket(entries: Awaited<ReturnType<typeof listKnowledgeEntries>>, roles: Awaited<ReturnType<typeof listRoles>>, stageDetail: Awaited<ReturnType<typeof getConversationStage>>) {
  const strategySources = entries.slice(0, 6).map((entry) => `【${entry.section}｜${entry.title}】${entry.content}`).join("\n");
  const roleSources = roles.map((role) => `【${role.name}】${role.strategy}`).join("\n");
  const stageSource = stageDetail
    ? `【${stageDetail.stage}｜第 ${stageDetail.layer} 層｜${stageDetail.coreFocus}】\n話題方向：${stageDetail.topicGuidance}\n注意事項：${stageDetail.cautions}`
    : "目前沒有對應局別層次資料。";
  return { strategySources, roleSources, stageSource };
}

export function parseAdviceResponse(raw: string) {
  const normalized = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  const json = firstBrace >= 0 && lastBrace > firstBrace
    ? normalized.slice(firstBrace, lastBrace + 1)
    : normalized;
  return adviceSchema.parse(JSON.parse(json));
}

export function createKnowledgeFallback(
  input: z.infer<typeof adviceInput>,
  entries: Awaited<ReturnType<typeof listKnowledgeEntries>>,
  roles: Awaited<ReturnType<typeof listRoles>>,
  stageDetail: NonNullable<Awaited<ReturnType<typeof getConversationStage>>>,
) {
  const brief = (value: string) => value.split(/[。！？]/)[0]?.trim() || value;
  const topics = entries.slice(0, 4).map((entry) => ({
    title: `${entry.section}｜${entry.title}`,
    question: stageDetail.topicGuidance,
    reasoning: `依據「${entry.title}」：${brief(entry.content)}。`,
  }));

  return {
    executiveSummary: `此局位於${stageDetail.stage}第${stageDetail.layer}層，核心是「${stageDetail.coreFocus}」。先依「${entries[0]?.title}」安排節奏，再以「${input.objective}」作為本次推進的檢查點。`,
    postDinnerSummary: input.reflectionNotes
      ? `局後筆記記錄「${input.reflectionNotes.slice(0, 140)}」。請對照本局的「${stageDetail.coreFocus}」檢視互動是否推進，避免把觀察延伸為來源外的結論。`
      : `尚未提供局後筆記。飯後可依「${stageDetail.coreFocus}」回看哪些互動讓關係推進，並記錄下一次可延續的線索。`,
    suggestedTopics: topics,
    roleStrategy: roles.slice(0, 4).map((role) => ({ role: role.name, action: role.strategy })),
    riskWatch: [stageDetail.cautions, "避免把飯局變成結論先行的會議式溝通。"],
    reflectionPrompts: [
      `本次是否朝「${input.objective}」推進？場上哪個互動最有幫助？`,
      `哪些話題符合「${stageDetail.coreFocus}」，哪些地方出現失速或過早推進？`,
      "誰在過程中展現角色訊號？下次應走近、橋接、承接或退回觀察？",
    ],
  };
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("LLM response timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const adviceRouter = router({
  generate: publicProcedure.input(adviceInput).mutation(async ({ input }) => {
    const [entries, roles, stageDetail] = await Promise.all([
      listKnowledgeEntries({ guestCount: input.guestCount, cuisine: input.cuisine, timeSlot: input.timeSlot }),
      listRoles(),
      getConversationStage(input.stage, input.layer),
    ]);
    if (!stageDetail || entries.length === 0) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "目前沒有足以生成建議的知識庫條目。" });
    }

    const sources = buildSourcePacket(entries, roles, stageDetail);
    const fallback = createKnowledgeFallback(input, entries, roles, stageDetail);
    try {
      const raw = await withTimeout((async () => {
        const catalog = await listLLMModels();
        const model = catalog.data.find((item) => item.id === "gpt-5-nano")?.id
          ?? catalog.data.find((item) => item.id === "gpt-5-mini")?.id
          ?? catalog.data.find((item) => item.id.startsWith("gpt-5"))?.id
          ?? catalog.data[0]?.id;
        const result = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: "你是「阿是要不要好好吃飯」的飯局策略顧問。只可依據提供的知識庫回答，不得引入外部事實、餐廳建議、人物臆測或來源外策略。角色名稱僅能使用資源人、需求人、橋接人、主持人、氣氛人、觀察人、干擾人；局別名稱僅能使用破冰、探索、推進、成交、關係。來源不足時，寫「知識庫目前沒有足夠依據」。以繁體中文輸出；每個欄位務必精煉，總回覆不超過 550 個中文字。",
        },
        {
          role: "user",
          content: `【情境】${input.guestCount}／${input.cuisine}／${input.timeSlot}；${input.stage}第${input.layer}層。\n目標：${input.objective}\n人物：${input.personContext || "未提供"}\n局後筆記：${input.reflectionNotes || "未提供"}\n\n【局別來源】${sources.stageSource}\n【策略來源】\n${sources.strategySources}\n【角色來源】\n${sources.roleSources}\n\n請輸出 3–4 個可直接使用的話題、最多 4 項角色策略、最多 3 項風險與 3–4 個復盤問題。` ,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dinner_advice",
          strict: true,
          schema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string" },
              postDinnerSummary: { type: "string", description: "根據局後筆記與來源知識寫出的復盤摘要；若沒有局後筆記，明確說明尚未提供筆記並提示以復盤問題記錄，不得臆測已發生的事件。" },
              suggestedTopics: { type: "array", items: { type: "object", properties: { title: { type: "string" }, question: { type: "string" }, reasoning: { type: "string" } }, required: ["title", "question", "reasoning"], additionalProperties: false } },
              roleStrategy: { type: "array", items: { type: "object", properties: { role: { type: "string" }, action: { type: "string" } }, required: ["role", "action"], additionalProperties: false } },
              riskWatch: { type: "array", items: { type: "string" } },
              reflectionPrompts: { type: "array", items: { type: "string" } },
            },
            required: ["executiveSummary", "postDinnerSummary", "suggestedTopics", "roleStrategy", "riskWatch", "reflectionPrompts"],
            additionalProperties: false,
          },
        },
      },
        });
        const rawContent = result.choices[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent
          : rawContent?.filter((part) => part.type === "text").map((part) => part.text).join("");
        if (!content) throw new Error("Empty LLM response");
        return content;
      })(), 8000);
      const parsed = parseAdviceResponse(raw);
      return {
        ...parsed,
        sourceTitles: entries.slice(0, 10).map((entry) => entry.title),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    } catch (error) {
      console.warn("[Dinner advice] Falling back to knowledge-grounded plan", {
        reason: error instanceof Error ? error.message : "Unknown advice error",
      });
      return {
        ...fallback,
        sourceTitles: entries.slice(0, 10).map((entry) => entry.title),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    }
  }),
});
