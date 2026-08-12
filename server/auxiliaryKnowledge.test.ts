import { describe, expect, it } from "vitest";
import { auxiliaryKnowledgeEntries } from "./data/auxiliaryKnowledge";
import { sections } from "./routers/knowledge";

describe("輔助知識庫研究條目", () => {
  it("涵蓋六大部分，並維持研究補充分類與既有篩選標籤格式", () => {
    expect(auxiliaryKnowledgeEntries).toHaveLength(15);
    expect(new Set(auxiliaryKnowledgeEntries.map((entry) => entry.section))).toEqual(new Set(sections));
    for (const entry of auxiliaryKnowledgeEntries) {
      expect(entry.category).toBe("研究補充");
      expect(entry.peopleTags.length).toBeGreaterThan(0);
      expect(entry.cuisineTags.length).toBeGreaterThan(0);
      expect(entry.timeTags.length).toBeGreaterThan(0);
    }
  });

  it("每筆資料均保留可追溯來源與明確使用邊界", () => {
    for (const entry of auxiliaryKnowledgeEntries) {
      expect(entry.sourceName.length).toBeGreaterThan(8);
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.sourceScope.length).toBeGreaterThan(12);
    }
  });
});
