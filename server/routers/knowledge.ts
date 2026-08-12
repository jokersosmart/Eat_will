import { z } from "zod";
import { listConversationStages, listKnowledgeEntries, listRoles } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const sections = ["目標與框架", "人物與角色", "場景", "時機", "話題與五局", "實戰與長期養成"] as const;
export const stages = ["破冰", "探索", "推進", "成交", "關係"] as const;
export const guestCounts = ["2人", "3-4人", "5-8人", "10人以上"] as const;
export const cuisines = ["中式合菜", "西餐", "日式", "火鍋"] as const;
export const timeSlots = ["早餐", "午餐", "下午茶", "晚餐", "宵夜"] as const;

export const knowledgeRouter = router({
  list: publicProcedure.input(z.object({
    section: z.enum(sections).optional(),
    category: z.string().max(64).optional(),
    guestCount: z.enum(guestCounts).optional(),
    cuisine: z.enum(cuisines).optional(),
    timeSlot: z.enum(timeSlots).optional(),
  }).optional()).query(({ input }) => listKnowledgeEntries(input)),
  sections: publicProcedure.query(async () => {
    const rows = await listKnowledgeEntries();
    const categories = Array.from(new Set(rows.map((row) => row.category)));
    return { sections, categories, total: rows.length };
  }),
  roles: publicProcedure.query(() => listRoles()),
  stages: publicProcedure.query(() => listConversationStages()),
});
