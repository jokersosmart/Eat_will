import { z } from "zod";
import { createDinnerRecord, getUserPreferences, listDinnerRecords, saveUserPreferences } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { cuisines, guestCounts, stages, timeSlots } from "./knowledge";

const dinnerInput = z.object({
  title: z.string().trim().min(1).max(255),
  guestCount: z.enum(guestCounts),
  cuisine: z.enum(cuisines),
  timeSlot: z.enum(timeSlots),
  objective: z.string().trim().min(1).max(1500),
  stage: z.enum(stages),
  layer: z.number().int().min(1).max(3),
  context: z.string().max(4000).optional(),
  aiAdvice: z.string().max(12000).optional(),
  reflection: z.string().max(4000).optional(),
});

export const dinnerRouter = router({
  records: protectedProcedure.query(({ ctx }) => listDinnerRecords(ctx.user.id)),
  saveRecord: protectedProcedure.input(dinnerInput).mutation(async ({ ctx, input }) => {
    await createDinnerRecord({ userId: ctx.user.id, ...input });
    return { success: true } as const;
  }),
  preferences: protectedProcedure.query(async ({ ctx }) => (await getUserPreferences(ctx.user.id)) ?? null),
  savePreferences: protectedProcedure.input(z.object({
    defaultGuestCount: z.enum(guestCounts).optional(),
    defaultCuisine: z.enum(cuisines).optional(),
    defaultTimeSlot: z.enum(timeSlots).optional(),
  })).mutation(async ({ ctx, input }) => {
    await saveUserPreferences({ userId: ctx.user.id, ...input });
    return { success: true } as const;
  }),
});
