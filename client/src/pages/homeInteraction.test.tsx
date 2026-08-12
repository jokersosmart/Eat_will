import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, error: null, isAuthenticated: false, logout: vi.fn() }),
}));

vi.mock("@/const", () => ({ startLogin: vi.fn() }));

vi.mock("@/lib/trpc", () => {
  const queryResult = () => ({ data: [], isLoading: false, refetch: vi.fn() });
  const mutationResult = () => ({ data: null, isPending: false, mutate: vi.fn() });
  return {
    trpc: {
      knowledge: {
        list: { useQuery: queryResult },
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
      advice: { generate: { useMutation: mutationResult } },
    },
  };
});

import Home from "./Home";

describe("模擬飯局範例按鈕", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
