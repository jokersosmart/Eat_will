import { describe, expect, it } from "vitest";
import { createKnowledgeFallback, createScenarioFallback, parseAdviceResponse, parseScenarioResponse, selectAdviceEntries } from "./routers/advice";

describe("智慧建議結構化輸出", () => {
  it("接受 JSON 程式碼區塊並將過多建議截取為介面可讀範圍", () => {
    const topic = { title: "開場", question: "如何開始？", reasoning: "破冰策略" };
    const payload = {
      executiveSummary: "依課程資料建立安全的開場節奏。",
      postDinnerSummary: "尚未提供局後筆記，請依復盤問題記錄觀察。",
      suggestedTopics: Array.from({ length: 5 }, () => topic),
      roleStrategy: Array.from({ length: 8 }, () => ({ role: "主持人", action: "控制節奏。" })),
      riskWatch: Array.from({ length: 6 }, () => "避免過早進入結論。"),
      reflectionPrompts: Array.from({ length: 9 }, () => "誰在場上改變了節奏？"),
    };

    const parsed = parseAdviceResponse(`\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);

    expect(parsed.postDinnerSummary).toContain("尚未提供局後筆記");
    expect(parsed.suggestedTopics).toHaveLength(4);
    expect(parsed.roleStrategy).toHaveLength(7);
    expect(parsed.riskWatch).toHaveLength(5);
    expect(parsed.reflectionPrompts).toHaveLength(8);
  });

  it("拒絕缺少必要智慧建議欄位的回覆", () => {
    expect(() => parseAdviceResponse('{"executiveSummary":"僅有摘要"}')).toThrow();
  });

  it("在模型逾時時仍以知識庫內容建立固定結構的備援建議", () => {
    const fallback = createKnowledgeFallback(
      { guestCount: "5-8人", cuisine: "中式合菜", timeSlot: "晚餐", stage: "破冰", layer: 1, objective: "先建立信任", personContext: "", reflectionNotes: "" },
      [{ id: 1, section: "目標與框架", category: "目標設定", title: "飯局最低與最高目標", content: "最低收穫是讓人記得你。", peopleTags: "不限", cuisineTags: "不限", timeTags: "不限", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }] as never,
      [{ id: 1, name: "主持人", definition: "主導節奏", signals: "掌控節奏", strategy: "控制整體節奏。", notes: "", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }] as never,
      { id: 1, stage: "破冰", layer: 1, coreFocus: "建立安全感", topicGuidance: "從輕鬆話題開始。", cautions: "避免過早推進。", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() } as never,
    );

    expect(fallback.executiveSummary).toContain("建立安全感");
    expect(fallback.suggestedTopics[0]?.reasoning).toContain("飯局最低與最高目標");
    expect(fallback.roleStrategy[0]?.role).toBe("主持人");
    expect(fallback.postDinnerSummary).toContain("尚未提供局後筆記");
  });

  it("保留課程條目並加入研究補充，避免只使用單一資料來源", () => {
    const entries = [
      { category: "目標設定", title: "課程 1" },
      { category: "做局原則", title: "課程 2" },
      { category: "研究補充", title: "研究 1" },
      { category: "研究補充", title: "研究 2" },
    ];

    expect(selectAdviceEntries(entries).map((entry) => entry.title)).toEqual(["課程 1", "課程 2", "研究 1", "研究 2"]);
  });

  it("接受情境引導結構化結果並限制假設、提問與注意事項數量", () => {
    const payload = {
      knownContext: ["已知條件"],
      assumptions: Array.from({ length: 4 }, (_, index) => `假設 ${index + 1}`),
      clarificationQuestions: Array.from({ length: 5 }, (_, index) => ({ question: `問題 ${index + 1}`, reason: "用於確認下一步。", field: "objective" })),
      attentionPoints: Array.from({ length: 5 }, (_, index) => `注意 ${index + 1}`),
      nextStep: "先確認一個下一步。",
    };

    const parsed = parseScenarioResponse(`\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);

    expect(parsed.assumptions).toHaveLength(3);
    expect(parsed.clarificationQuestions).toHaveLength(4);
    expect(parsed.attentionPoints).toHaveLength(4);
  });

  it("在情境分析逾時時，以知識庫建立明確標示假設的備援結果", () => {
    const fallback = createScenarioFallback(
      { guestCount: "5-8人", cuisine: "中式合菜", timeSlot: "晚餐", stage: "破冰", layer: 1, objective: "", personContext: "" },
      [{ id: 1, section: "目標與框架", category: "目標設定", title: "飯局最低與最高目標", content: "最低收穫是讓人記得你。", peopleTags: "不限", cuisineTags: "不限", timeTags: "不限", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }] as never,
      { id: 1, stage: "破冰", layer: 1, coreFocus: "建立安全感", topicGuidance: "從輕鬆話題開始。", cautions: "避免過早推進。", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() } as never,
    );

    expect(fallback.knownContext).toContain("尚未填寫明確飯局目標。");
    expect(fallback.assumptions[0]).toContain("尚未確認");
    expect(fallback.clarificationQuestions[0]?.field).toBe("objective");
    expect(fallback.attentionPoints[0]).toBe("避免過早推進。");
  });
});
