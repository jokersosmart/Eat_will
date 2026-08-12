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

const scenarioInput = z.object({
  guestCount: z.enum(guestCounts),
  cuisine: z.enum(cuisines),
  timeSlot: z.enum(timeSlots),
  stage: z.enum(stages),
  layer: z.number().int().min(1).max(3),
  objective: z.string().trim().max(1500).default(""),
  personContext: z.string().trim().max(3000).default(""),
});

const adviceSchema = z.object({
  executiveSummary: z.string(),
  postDinnerSummary: z.string(),
  suggestedTopics: z.array(z.object({ title: z.string(), question: z.string(), reasoning: z.string() })).min(1).transform((items) => items.slice(0, 4)),
  roleStrategy: z.array(z.object({ role: z.string(), action: z.string() })).transform((items) => items.slice(0, 7)),
  riskWatch: z.array(z.string()).transform((items) => items.slice(0, 5)),
  reflectionPrompts: z.array(z.string()).min(2).transform((items) => items.slice(0, 8)),
});

const scenarioSchema = z.object({
  knownContext: z.array(z.string()).min(1).transform((items) => items.slice(0, 6)),
  assumptions: z.array(z.string()).min(1).transform((items) => items.slice(0, 3)),
  clarificationQuestions: z.array(z.object({
    question: z.string(),
    reason: z.string(),
    field: z.enum(["objective", "personContext"]),
  })).min(1).transform((items) => items.slice(0, 4)),
  attentionPoints: z.array(z.string()).min(1).transform((items) => items.slice(0, 4)),
  nextStep: z.string(),
});

function buildSourcePacket(entries: Awaited<ReturnType<typeof listKnowledgeEntries>>, roles: Awaited<ReturnType<typeof listRoles>>, stageDetail: Awaited<ReturnType<typeof getConversationStage>>) {
  const strategySources = entries.slice(0, 6).map((entry) => {
    const attribution = entry.sourceName ? `來源：${entry.sourceName}` : "來源：平台課程知識庫";
    const boundary = entry.sourceScope ? `使用邊界：${entry.sourceScope}` : "";
    return `【${entry.section}｜${entry.title}】${entry.content}\n${attribution}${boundary ? `\n${boundary}` : ""}`;
  }).join("\n");
  const roleSources = roles.map((role) => `【${role.name}】${role.strategy}`).join("\n");
  const stageSource = stageDetail
    ? `【${stageDetail.stage}｜第 ${stageDetail.layer} 層｜${stageDetail.coreFocus}】\n話題方向：${stageDetail.topicGuidance}\n注意事項：${stageDetail.cautions}`
    : "目前沒有對應局別層次資料。";
  return { strategySources, roleSources, stageSource };
}

function buildSourceReferences(entries: Awaited<ReturnType<typeof listKnowledgeEntries>>) {
  return entries.slice(0, 10).map((entry) => ({
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    sourceScope: entry.sourceScope,
  }));
}

export function selectAdviceEntries<T extends { category: string }>(entries: T[]) {
  const courseEntries = entries.filter((entry) => entry.category !== "研究補充").slice(0, 4);
  const auxiliaryEntries = entries.filter((entry) => entry.category === "研究補充").slice(0, 3);
  return [...courseEntries, ...auxiliaryEntries];
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

export function parseScenarioResponse(raw: string) {
  const normalized = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  const json = firstBrace >= 0 && lastBrace > firstBrace
    ? normalized.slice(firstBrace, lastBrace + 1)
    : normalized;
  return scenarioSchema.parse(JSON.parse(json));
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

export function createScenarioFallback(
  input: z.infer<typeof scenarioInput>,
  entries: Awaited<ReturnType<typeof listKnowledgeEntries>>,
  stageDetail: NonNullable<Awaited<ReturnType<typeof getConversationStage>>>,
) {
  const primaryEntry = entries[0];
  const knownContext = [
    `飯局條件：${input.guestCount}／${input.cuisine}／${input.timeSlot}。`,
    `目前選擇：${input.stage}第${input.layer}層，核心是「${stageDetail.coreFocus}」。`,
    input.objective ? `已填目標：${input.objective}` : "尚未填寫明確飯局目標。",
    input.personContext ? `已填人物背景：${input.personContext}` : "尚未提供人物背景與關係線索。",
  ];
  const assumptions = [
    input.objective
      ? "若目前目標仍可調整，先把本局要確認的一個具體下一步說清楚，再決定是否推進。"
      : "尚未確認這一局最重要的收穫；先把它設定為可觀察或可安排的下一步，而非要求立刻達成結果。",
    input.personContext
      ? "已提供的人物關係僅作為待驗證線索；不預設任何人具有決策權、資源或引介意願。"
      : "尚未確認誰主揪、誰彼此熟識及誰影響節奏；先觀察與提問，不急著替場上角色下定義。",
    `若對方尚未主動分享或出現共鳴，維持在${input.stage}第${input.layer}層的「${stageDetail.coreFocus}」，避免跳級推進。`,
  ];
  const clarificationQuestions = [
    {
      question: input.objective ? "這一局結束前，哪一個可被確認的下一步最能證明目標有推進？" : "你希望這一局結束時，留下哪一個可被確認的下一步？",
      reason: "可把抽象期待收束成不過度承諾的行動檢查點。",
      field: "objective" as const,
    },
    {
      question: input.personContext ? "已知人物之中，誰是你最需要先理解其關注點的人？彼此關係還有哪些地方尚未確認？" : "誰主揪、誰彼此熟識、誰可能影響對話節奏？哪些資訊只是推測？",
      reason: "有助於區分已知事實與待驗證關係線索，避免過早判讀角色。",
      field: "personContext" as const,
    },
    {
      question: "若對方沒有立刻談到合作或資源，你仍希望用什麼方式讓關係自然延續？",
      reason: "可先準備低壓的後續選項，避免把飯局變成結論先行的會議。",
      field: "objective" as const,
    },
  ];
  const attentionPoints = [
    stageDetail.cautions,
    primaryEntry ? `策略依據「${primaryEntry.title}」：先依情境逐步驗證，不將條目外推為對他人的結論。` : "知識庫目前沒有足夠依據。",
    "任何招待、付款或正式合作條件，都應依適用規範與當事人選擇處理，不以飯局交換決策承諾。",
  ];

  return {
    knownContext,
    assumptions,
    clarificationQuestions,
    attentionPoints,
    nextStep: input.objective
      ? "先補上一個最關鍵的關係或決策線索，再取得完整智慧建議。"
      : "先回答第一題，將可確認的下一步寫入飯局目標後，再取得完整智慧建議。",
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
  assessScenario: publicProcedure.input(scenarioInput).mutation(async ({ input }) => {
    const [entries, roles, stageDetail] = await Promise.all([
      listKnowledgeEntries({ guestCount: input.guestCount, cuisine: input.cuisine, timeSlot: input.timeSlot }),
      listRoles(),
      getConversationStage(input.stage, input.layer),
    ]);
    if (!stageDetail || entries.length === 0) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "目前沒有足以釐清此情境的知識庫條目。" });
    }

    const scenarioEntries = selectAdviceEntries(entries);
    const sources = buildSourcePacket(scenarioEntries, roles, stageDetail);
    const fallback = createScenarioFallback(input, scenarioEntries, stageDetail);
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
              content: "你是「阿是要不要好好吃飯」的局前釐清助手。只可依據提供的知識庫回答，不得引入外部事實、餐廳建議、人物臆測或來源外策略。角色名稱僅能使用資源人、需求人、橋接人、主持人、氣氛人、觀察人、干擾人；局別名稱僅能使用破冰、探索、推進、成交、關係。所有未知資訊必須寫成待驗證假設或釐清問題，不得寫成既定事實。以繁體中文輸出；每個欄位精煉，總回覆不超過 420 個中文字。",
            },
            {
              role: "user",
              content: `【情境】${input.guestCount}／${input.cuisine}／${input.timeSlot}；${input.stage}第${input.layer}層。\n目標：${input.objective || "未提供"}\n人物：${input.personContext || "未提供"}\n\n【局別來源】${sources.stageSource}\n【策略來源】\n${sources.strategySources}\n【角色來源】\n${sources.roleSources}\n\n請輸出已知條件、最多 3 項可修正的情境假設、最多 4 題釐清問題（每題指定應填入 objective 或 personContext）、最多 4 項注意事項，以及 1 項最小可執行下一步。`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "dinner_scenario_guidance",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  knownContext: { type: "array", items: { type: "string" } },
                  assumptions: { type: "array", items: { type: "string" } },
                  clarificationQuestions: { type: "array", items: { type: "object", properties: { question: { type: "string" }, reason: { type: "string" }, field: { type: "string", enum: ["objective", "personContext"] } }, required: ["question", "reason", "field"], additionalProperties: false } },
                  attentionPoints: { type: "array", items: { type: "string" } },
                  nextStep: { type: "string" },
                },
                required: ["knownContext", "assumptions", "clarificationQuestions", "attentionPoints", "nextStep"],
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
      const parsed = parseScenarioResponse(raw);
      return {
        ...parsed,
        sourceTitles: scenarioEntries.map((entry) => entry.title),
        sourceReferences: buildSourceReferences(scenarioEntries),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    } catch (error) {
      console.warn("[Dinner scenario guidance] Falling back to knowledge-grounded plan", {
        reason: error instanceof Error ? error.message : "Unknown scenario guidance error",
      });
      return {
        ...fallback,
        sourceTitles: scenarioEntries.map((entry) => entry.title),
        sourceReferences: buildSourceReferences(scenarioEntries),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    }
  }),
  generate: publicProcedure.input(adviceInput).mutation(async ({ input }) => {
    const [entries, roles, stageDetail] = await Promise.all([
      listKnowledgeEntries({ guestCount: input.guestCount, cuisine: input.cuisine, timeSlot: input.timeSlot }),
      listRoles(),
      getConversationStage(input.stage, input.layer),
    ]);
    if (!stageDetail || entries.length === 0) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "目前沒有足以生成建議的知識庫條目。" });
    }

    const adviceEntries = selectAdviceEntries(entries);
    const sources = buildSourcePacket(adviceEntries, roles, stageDetail);
    const fallback = createKnowledgeFallback(input, adviceEntries, roles, stageDetail);
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
        sourceTitles: adviceEntries.map((entry) => entry.title),
        sourceReferences: buildSourceReferences(adviceEntries),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    } catch (error) {
      console.warn("[Dinner advice] Falling back to knowledge-grounded plan", {
        reason: error instanceof Error ? error.message : "Unknown advice error",
      });
      return {
        ...fallback,
        sourceTitles: adviceEntries.map((entry) => entry.title),
        sourceReferences: buildSourceReferences(adviceEntries),
        sourceStage: { stage: stageDetail.stage, layer: stageDetail.layer, coreFocus: stageDetail.coreFocus },
      };
    }
  }),
});
