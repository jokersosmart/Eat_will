import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  createDinnerRecord: vi.fn(),
  getUserPreferences: vi.fn(),
  listDinnerRecords: vi.fn(),
  saveUserPreferences: vi.fn(),
}));

import { createDinnerRecord, getUserPreferences, listDinnerRecords, saveUserPreferences } from "./db";
import { dinnerRouter } from "./routers/dinner";

const authenticatedContext = {
  user: {
    id: 42,
    openId: "dinner-test-user",
    email: "test@example.com",
    name: "Dinner Tester",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} as TrpcContext;

describe("登入使用者飯局紀錄與偏好", () => {
  it("以目前登入使用者身分儲存一局飯局紀錄", async () => {
    const caller = dinnerRouter.createCaller(authenticatedContext);
    await caller.saveRecord({
      title: "合作交流晚餐",
      guestCount: "5-8人",
      cuisine: "中式合菜",
      timeSlot: "晚餐",
      objective: "先建立信任。",
      stage: "破冰",
      layer: 1,
      context: "主揪人與目標對象都在場。",
    });

    expect(vi.mocked(createDinnerRecord)).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      title: "合作交流晚餐",
      stage: "破冰",
      layer: 1,
    }));
  });

  it("讀寫登入使用者的局前預設與飯局紀錄清單", async () => {
    vi.mocked(getUserPreferences).mockResolvedValue(null);
    vi.mocked(listDinnerRecords).mockResolvedValue([]);
    const caller = dinnerRouter.createCaller(authenticatedContext);

    await caller.savePreferences({ defaultGuestCount: "3-4人", defaultCuisine: "日式", defaultTimeSlot: "午餐" });
    await expect(caller.preferences()).resolves.toBeNull();
    await expect(caller.records()).resolves.toEqual([]);
    expect(vi.mocked(saveUserPreferences)).toHaveBeenCalledWith({
      userId: 42,
      defaultGuestCount: "3-4人",
      defaultCuisine: "日式",
      defaultTimeSlot: "午餐",
    });
  });
});
