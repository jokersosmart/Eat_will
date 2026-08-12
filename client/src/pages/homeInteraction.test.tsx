import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, error: null, isAuthenticated: false, logout: vi.fn() }),
}));

vi.mock("@/const", () => ({ startLogin: vi.fn() }));

vi.mock("@/lib/trpc", () => {
  const queryResult = () => ({ data: [], isLoading: false, refetch: vi.fn() });
  const mutationResult = () => ({ data: null, isPending: false, mutate: vi.fn() });
  const knowledgeEntries = [
    { id: 1, section: "話題與五局", category: "研究補充", title: "探索時使用一問一反映一確認", content: "以反映確認理解。", peopleTags: "不限", cuisineTags: "不限", timeTags: "不限", sourceName: "Center for Creative Leadership｜Active Listening Techniques", sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/", sourceScope: "不可把推測當成事實。" },
    { id: 2, section: "目標與框架", category: "目標設定", title: "既有課程條目", content: "課程原始策略。", peopleTags: "不限", cuisineTags: "不限", timeTags: "不限", sourceName: null, sourceUrl: null, sourceScope: null },
  ];
  const adviceResult = {
    executiveSummary: "依既有課程與研究補充建立建議。",
    suggestedTopics: [{ title: "開放問題", question: "你目前最在意什麼？", reasoning: "先確認理解。" }],
    roleStrategy: [{ role: "主持人", action: "留出回應空間。" }],
    riskWatch: ["不要將推測當成事實。"],
    postDinnerSummary: "記錄待確認的下一步。",
    reflectionPrompts: ["哪些資訊仍需驗證？"],
    sourceTitles: ["既有課程條目", "探索時使用一問一反映一確認"],
    sourceReferences: [
      { title: "既有課程條目", sourceName: null, sourceUrl: null, sourceScope: null },
      { title: "探索時使用一問一反映一確認", sourceName: "Center for Creative Leadership｜Active Listening Techniques", sourceUrl: "https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/", sourceScope: "不可把推測當成事實。" },
    ],
  };
  return {
    trpc: {
      knowledge: {
        list: { useQuery: () => ({ data: knowledgeEntries, isLoading: false, refetch: vi.fn() }) },
        roles: { useQuery: queryResult },
        stages: { useQuery: queryResult },
        sections: { useQuery: queryResult },
      },
      dinner: {
        records: { useQuery: queryResult },
        preferences: { useQuery: () => ({ ...queryResult(), data: null }) },
        saveRecord: { useMutation: mutationResult },
        savePreferences: { useMutation: mutationResult },
      },
      advice: { generate: { useMutation: () => ({ data: adviceResult, isPending: false, mutate: vi.fn() }) } },
    },
  };
});

import Home from "./Home";

describe("模擬飯局範例按鈕", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("點擊朋友引介資源人後，會同步更新所有局前規劃欄位", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /朋友引介資源人：先理解對方在意什麼/ }));

    const [guestCount, cuisine, timeSlot] = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(guestCount.value).toBe("3-4人");
    expect(cuisine.value).toBe("西餐");
    expect(timeSlot.value).toBe("晚餐");
    expect(screen.getByRole("button", { name: "探索" }).className).toContain("bg-[#102a43]");
    expect(screen.getAllByRole("button", { name: "第 1 層" })[0].className).toContain("bg-[#f4e8cd]");
    expect((screen.getByPlaceholderText(/認識對方的決策考量/) as HTMLTextAreaElement).value).toBe("理解對方目前關注的方向，找出我能提供價值的切入點。");
    expect((screen.getByPlaceholderText(/主揪人、已知與會者/) as HTMLTextAreaElement).value).toBe("主揪人認識目標對象，也知道我正在做的計畫；這次的目標不是提出完整提案，而是確認對方願不願意再聊。");
    expect(screen.queryByText(/已套用「朋友引介資源人」範例/)).not.toBeNull();
  });

  it("在公開知識庫呈現研究來源與使用邊界，並保留課程條目的簡潔卡片", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getAllByRole("button", { name: "瀏覽六大部分" })[0]);

    const sourceLink = screen.getByRole("link", { name: /Center for Creative Leadership/ });
    expect(sourceLink.getAttribute("href")).toBe("https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/");
    expect(screen.getByText("使用邊界：不可把推測當成事實。")).not.toBeNull();
    expect(screen.getAllByText("既有課程條目").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /課程原始資料/ })).toBeNull();
  });

  it("在智慧建議中呈現研究補充來源與使用邊界，且課程條目不被誤列為研究來源", () => {
    render(<Home />);

    const sourceLink = screen.getByRole("link", { name: /Center for Creative Leadership/ });
    expect(sourceLink.getAttribute("href")).toBe("https://www.ccl.org/articles/leading-effectively-articles/coaching-others-use-active-listening-skills/");
    expect(screen.getByText("本次研究補充來源")).not.toBeNull();
    expect(screen.getByText("使用邊界：不可把推測當成事實。")).not.toBeNull();
    expect(screen.getByText(/依據條目：既有課程條目、探索時使用一問一反映一確認/)).not.toBeNull();
    expect(screen.queryByRole("link", { name: /既有課程條目/ })).toBeNull();
  });

  it("可由 view 查詢參數直接開啟知識庫，方便分享與驗證研究來源", () => {
    window.history.replaceState({}, "", "/?view=library");
    render(<Home />);

    expect(screen.getByRole("heading", { name: "把底層邏輯留在桌上" })).not.toBeNull();
    expect(screen.getByRole("link", { name: /Center for Creative Leadership/ })).not.toBeNull();
  });
});
