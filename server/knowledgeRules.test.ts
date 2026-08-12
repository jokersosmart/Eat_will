import { describe, expect, it } from "vitest";
import { isPublicKnowledgeEntry, matchesPlanningTag } from "./db";
import { cuisines, guestCounts, stages, timeSlots } from "./routers/knowledge";

describe("局前規劃知識庫篩選", () => {
  it("保留不限標籤，並只匹配使用者選取的特定情境", () => {
    expect(matchesPlanningTag("不限", "晚餐")).toBe(true);
    expect(matchesPlanningTag("早餐|午餐|晚餐", "晚餐")).toBe(true);
    expect(matchesPlanningTag("早餐|午餐", "晚餐")).toBe(false);
    expect(matchesPlanningTag("中式合菜|火鍋", undefined)).toBe(true);
  });

  it("只公開指定的人數、菜系、時段與五局名稱", () => {
    expect(guestCounts).toEqual(["2人", "3-4人", "5-8人", "10人以上"]);
    expect(cuisines).toEqual(["中式合菜", "西餐", "日式", "火鍋"]);
    expect(timeSlots).toEqual(["早餐", "午餐", "下午茶", "晚餐", "宵夜"]);
    expect(stages).toEqual(["破冰", "探索", "推進", "成交", "關係"]);
  });

  it("保留 QA 資料於知識庫，但不將其提供給前台清單", () => {
    expect(isPublicKnowledgeEntry({ category: "Q&A" })).toBe(false);
    expect(isPublicKnowledgeEntry({ category: "演練題" })).toBe(true);
    expect(isPublicKnowledgeEntry({ category: "吃飯中" })).toBe(true);
  });
});
