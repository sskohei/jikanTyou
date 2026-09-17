import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
};

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [index("activities_user_id_idx").on(table.userId)],
);

export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").notNull(),
    startedAt: integer("started_at", { mode: "number" }).notNull(),
    endedAt: integer("ended_at", { mode: "number" }),
    durationSeconds: integer("duration_seconds", { mode: "number" }),
    ...timestamps,
  },
  (table) => [
    index("time_entries_user_id_idx").on(table.userId),
    index("time_entries_user_started_idx").on(table.userId, table.startedAt),
    index("time_entries_user_activity_idx").on(table.userId, table.activityId),
  ],
);

export const weeklyGoals = sqliteTable(
  "weekly_goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    activityId: text("activity_id").notNull(),
    targetMinutes: integer("target_minutes", { mode: "number" }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("weekly_goals_user_id_idx").on(table.userId),
    uniqueIndex("weekly_goals_user_activity_unique").on(table.userId, table.activityId),
  ],
);

export type Activity = typeof activities.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type WeeklyGoal = typeof weeklyGoals.$inferSelect;
