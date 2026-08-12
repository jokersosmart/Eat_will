import { describe, expect, it } from "vitest";
import { dinnerExamples, getExampleFormValues, layerStarterHints, stageStarterHints } from "./Home";

describe("首頁新手引導", () => {
  it("提供五個固定局別與三層推進深度的白話提示", () => {
    expect(Object.keys(stageStarterHints)).toEqual(["破冰", "探索", "推進", "成交", "關係"]);
    expect(Object.keys(layerStarterHints).map(Number)).toEqual([1, 2, 3]);
    expect(layerStarterHints[1].description).toContain("暖場");
  });

  it("提供三個可直接套用、且包含完整局前條件的模擬飯局", () => {
    expect(dinnerExamples).toHaveLength(3);
    for (const example of dinnerExamples) {
      expect(example.objective.length).toBeGreaterThan(0);
      expect(example.personContext.length).toBeGreaterThan(0);
      expect(example.route).toContain("→");
      expect(example.layer).toBeGreaterThanOrEqual(1);
      expect(example.layer).toBeLessThanOrEqual(3);
    }
  });

  it("一鍵套用會完整帶入局前規劃的所有必要欄位", () => {
    const example = dinnerExamples[1];
    const values = getExampleFormValues(example);

    expect(values).toEqual({
      guestCount: "3-4人",
      cuisine: "西餐",
      timeSlot: "晚餐",
      stage: "探索",
      layer: 1,
      objective: example.objective,
      personContext: example.personContext,
    });
  });
});
