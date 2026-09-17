import { z } from "zod";

export const idSchema = z.string().min(1).max(80);
export const activityNameSchema = z.string().trim().min(1, "活動名を入力してください").max(40, "活動名は40文字以内で入力してください");
export const activityCreateSchema = z.object({ name: activityNameSchema });
export const activityUpdateSchema = z.object({ name: activityNameSchema });
export const timerStartSchema = z.object({ activityId: idSchema });
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻の形式が正しくありません");
export const timeEntryInputSchema = z.object({
  activityId: idSchema,
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
});
export const goalCreateSchema = z.object({
  activityId: idSchema,
  targetMinutes: z.number().int().positive().max(10080),
});
export const goalUpdateSchema = z.object({ targetMinutes: z.number().int().positive().max(10080) });

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;
