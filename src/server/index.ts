import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, gt, gte, isNull, lt, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { cors } from "hono/cors";
import { z } from "zod";
import { activities, timeEntries, weeklyGoals } from "./db/schema";
import { createAuth } from "./auth/auth";
import type { Env } from "./env";
import { fail, nowSeconds, ok, randomId } from "./http";
import {
  activityCreateSchema,
  activityUpdateSchema,
  goalCreateSchema,
  goalUpdateSchema,
  idSchema,
  timeEntryInputSchema,
  timerStartSchema,
} from "../shared/schemas";
import { getPeriodBounds, jstDateFromSeconds, overlapSeconds, parseJstDateTime, TIME_ZONE } from "./services/time";
import type { ActivityDto, GoalDto, ReportDto, TimeEntryDto, TimerDto } from "../shared/types";

type AppEnv = {
  Bindings: Env;
  Variables: { user: { id: string }; session: unknown };
};

const app = new Hono<AppEnv>();

const jsonValidator = <T extends z.ZodType>(schema: T) => zValidator("json", schema, (result, c) => {
  if (!result.success) return fail(c, 400, "INVALID_INPUT", "入力内容を確認してください。");
});

app.onError((error, c) => {
  console.error(error);
  return fail(c, 500, "INTERNAL_ERROR", "サーバーで問題が発生しました。");
});

app.use("/api/auth/*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && origin === c.env.BETTER_AUTH_URL) {
    return cors({ origin, credentials: true })(c, next);
  }
  return next();
});
app.all("/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw));

app.get("/api/dev-preview", (c) => {
  const enabled = c.env.APP_ENV === "test" && c.env.DEV_PREVIEW_ENABLED === "true";
  if (!enabled) return fail(c, 404, "NOT_FOUND", "ページが見つかりません。");
  return ok(c, { enabled: true, environment: "test" });
});

const authRequired = createMiddleware<AppEnv>(async (c, next) => {
  const auth = createAuth(c.env);
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result?.user) return fail(c, 401, "UNAUTHORIZED", "ログインが必要です。");
  c.set("user", { id: result.user.id });
  c.set("session", result.session);
  await next();
});

const dbFor = (env: Env) => drizzle(env.DB);
const userId = (c: Context<AppEnv>) => c.get("user").id;

function toActivityDto(row: typeof activities.$inferSelect): ActivityDto {
  return { id: row.id, name: row.name, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

function toEntryDto(row: { entry: typeof timeEntries.$inferSelect; activityName: string }): TimeEntryDto {
  return {
    id: row.entry.id,
    activityId: row.entry.activityId,
    activityName: row.activityName,
    startedAt: row.entry.startedAt,
    endedAt: row.entry.endedAt,
    durationSeconds: row.entry.durationSeconds,
    createdAt: row.entry.createdAt,
    updatedAt: row.entry.updatedAt,
  };
}

async function ownedActivity(env: Env, uid: string, activityId: string) {
  return dbFor(env).select().from(activities).where(and(eq(activities.id, activityId), eq(activities.userId, uid))).get();
}

async function currentEntry(env: Env, uid: string) {
  const row = await dbFor(env)
    .select({ entry: timeEntries, activityName: activities.name })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .where(and(eq(timeEntries.userId, uid), isNull(timeEntries.endedAt)))
    .get();
  return row;
}

app.get("/api/activities", authRequired, async (c) => {
  const rows = await dbFor(c.env).select().from(activities).where(eq(activities.userId, userId(c))).orderBy(asc(activities.createdAt));
  return ok(c, rows.map(toActivityDto));
});

app.post("/api/activities", authRequired, jsonValidator(activityCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const now = nowSeconds();
  const row = { id: randomId(), userId: userId(c), name: input.name, createdAt: now, updatedAt: now };
  await dbFor(c.env).insert(activities).values(row).run();
  return ok(c, toActivityDto(row), 201);
});

app.patch("/api/activities/:id", authRequired, jsonValidator(activityUpdateSchema), async (c) => {
  const id = c.req.param("id");
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail(c, 400, "INVALID_ID", "活動IDが正しくありません。");
  const activity = await ownedActivity(c.env, userId(c), id);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "活動が見つかりません。");
  const input = c.req.valid("json");
  const updatedAt = nowSeconds();
  await dbFor(c.env).update(activities).set({ name: input.name, updatedAt }).where(and(eq(activities.id, id), eq(activities.userId, userId(c)))).run();
  return ok(c, toActivityDto({ ...activity, name: input.name, updatedAt }));
});

app.delete("/api/activities/:id", authRequired, async (c) => {
  const id = c.req.param("id");
  if (!idSchema.safeParse(id).success) return fail(c, 400, "INVALID_ID", "活動IDが正しくありません。");
  const uid = userId(c);
  const activity = await ownedActivity(c.env, uid, id);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "活動が見つかりません。");
  const db = dbFor(c.env);
  await db.batch([
    db.delete(weeklyGoals).where(and(eq(weeklyGoals.activityId, id), eq(weeklyGoals.userId, uid))),
    db.delete(timeEntries).where(and(eq(timeEntries.activityId, id), eq(timeEntries.userId, uid))),
    db.delete(activities).where(and(eq(activities.id, id), eq(activities.userId, uid))),
  ]);
  return ok(c, { id });
});

app.get("/api/timer/current", authRequired, async (c) => {
  const row = await currentEntry(c.env, userId(c));
  if (!row) return ok(c, null);
  const dto = toEntryDto(row);
  const timer: TimerDto = { ...dto, elapsedSeconds: Math.max(0, nowSeconds() - row.entry.startedAt) };
  return ok(c, timer);
});

app.post("/api/timer/start", authRequired, jsonValidator(timerStartSchema), async (c) => {
  const uid = userId(c);
  const input = c.req.valid("json");
  const activity = await ownedActivity(c.env, uid, input.activityId);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "その活動は見つかりません。");
  if (await currentEntry(c.env, uid)) return fail(c, 409, "TIMER_ALREADY_RUNNING", "すでにタイマーが動いています。");
  const now = nowSeconds();
  const row = { id: randomId(), userId: uid, activityId: input.activityId, startedAt: now, endedAt: null, durationSeconds: null, createdAt: now, updatedAt: now };
  try {
    await dbFor(c.env).insert(timeEntries).values(row).run();
  } catch {
    return fail(c, 409, "TIMER_ALREADY_RUNNING", "すでにタイマーが動いています。");
  }
  return ok(c, { ...toEntryDto({ entry: row, activityName: activity.name }), elapsedSeconds: 0 }, 201);
});

app.post("/api/timer/stop", authRequired, async (c) => {
  const uid = userId(c);
  const current = await currentEntry(c.env, uid);
  if (!current) return fail(c, 404, "TIMER_NOT_RUNNING", "動いているタイマーはありません。");
  const endedAt = nowSeconds();
  const durationSeconds = endedAt - current.entry.startedAt;
  if (durationSeconds <= 0) return fail(c, 400, "ZERO_DURATION", "記録できる時間がありません。");
  await dbFor(c.env).update(timeEntries).set({ endedAt, durationSeconds, updatedAt: endedAt }).where(and(eq(timeEntries.id, current.entry.id), eq(timeEntries.userId, uid), isNull(timeEntries.endedAt))).run();
  return ok(c, toEntryDto({ entry: { ...current.entry, endedAt, durationSeconds, updatedAt: endedAt }, activityName: current.activityName }));
});

async function getEntryWithActivity(env: Env, uid: string, id: string) {
  return dbFor(env).select({ entry: timeEntries, activityName: activities.name }).from(timeEntries).innerJoin(activities, eq(timeEntries.activityId, activities.id)).where(and(eq(timeEntries.id, id), eq(timeEntries.userId, uid))).get();
}

app.get("/api/time-entries", authRequired, async (c) => {
  const uid = userId(c);
  const rows = await dbFor(c.env).select({ entry: timeEntries, activityName: activities.name }).from(timeEntries).innerJoin(activities, eq(timeEntries.activityId, activities.id)).where(eq(timeEntries.userId, uid)).orderBy(desc(timeEntries.startedAt)).limit(200);
  return ok(c, rows.map(toEntryDto));
});

app.post("/api/time-entries", authRequired, jsonValidator(timeEntryInputSchema), async (c) => {
  const input = c.req.valid("json");
  const uid = userId(c);
  const activity = await ownedActivity(c.env, uid, input.activityId);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "その活動は見つかりません。");
  let startedAt: number;
  let endedAt: number;
  try {
    startedAt = parseJstDateTime(input.date, input.startTime);
    endedAt = parseJstDateTime(input.date, input.endTime);
  } catch {
    return fail(c, 400, "INVALID_DATETIME", "日時が正しくありません。");
  }
  if (endedAt <= startedAt) return fail(c, 400, "INVALID_DURATION", "終了時刻は開始時刻より後にしてください。");
  const now = nowSeconds();
  const row = { id: randomId(), userId: uid, activityId: input.activityId, startedAt, endedAt, durationSeconds: endedAt - startedAt, createdAt: now, updatedAt: now };
  await dbFor(c.env).insert(timeEntries).values(row).run();
  return ok(c, toEntryDto({ entry: row, activityName: activity.name }), 201);
});

app.patch("/api/time-entries/:id", authRequired, jsonValidator(timeEntryInputSchema), async (c) => {
  const id = c.req.param("id");
  const uid = userId(c);
  const existing = await getEntryWithActivity(c.env, uid, id);
  if (!existing) return fail(c, 404, "TIME_ENTRY_NOT_FOUND", "記録が見つかりません。");
  if (existing.entry.endedAt === null) return fail(c, 400, "TIMER_IS_RUNNING", "記録中のタイマーは停止してから編集してください。");
  const input = c.req.valid("json");
  const activity = await ownedActivity(c.env, uid, input.activityId);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "その活動は見つかりません。");
  let startedAt: number;
  let endedAt: number;
  try {
    startedAt = parseJstDateTime(input.date, input.startTime);
    endedAt = parseJstDateTime(input.date, input.endTime);
  } catch {
    return fail(c, 400, "INVALID_DATETIME", "日時が正しくありません。");
  }
  if (endedAt <= startedAt) return fail(c, 400, "INVALID_DURATION", "終了時刻は開始時刻より後にしてください。");
  const updatedAt = nowSeconds();
  await dbFor(c.env).update(timeEntries).set({ activityId: input.activityId, startedAt, endedAt, durationSeconds: endedAt - startedAt, updatedAt }).where(and(eq(timeEntries.id, id), eq(timeEntries.userId, uid))).run();
  return ok(c, toEntryDto({ entry: { ...existing.entry, activityId: input.activityId, startedAt, endedAt, durationSeconds: endedAt - startedAt, updatedAt }, activityName: activity.name }));
});

app.delete("/api/time-entries/:id", authRequired, async (c) => {
  const id = c.req.param("id");
  if (!idSchema.safeParse(id).success) return fail(c, 400, "INVALID_ID", "記録IDが正しくありません。");
  const result = await dbFor(c.env).delete(timeEntries).where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId(c)))).run();
  if (!result.meta.changes) return fail(c, 404, "TIME_ENTRY_NOT_FOUND", "記録が見つかりません。");
  return ok(c, { id });
});

type Period = "day" | "week" | "month";

async function buildReport(env: Env, uid: string, period: Period, dateValue?: string): Promise<ReportDto> {
  const bounds = getPeriodBounds(period, dateValue);
  const rows = await dbFor(env).select({ entry: timeEntries, activityName: activities.name }).from(timeEntries).innerJoin(activities, eq(timeEntries.activityId, activities.id)).where(and(eq(timeEntries.userId, uid), lt(timeEntries.startedAt, bounds.toSeconds), or(isNull(timeEntries.endedAt), gt(timeEntries.endedAt, bounds.fromSeconds)))).orderBy(asc(timeEntries.startedAt));
  const totals = new Map<string, { name: string; seconds: number }>();
  const daily = new Map<string, number>();
  const entries: TimeEntryDto[] = [];
  for (const row of rows) {
    const dto = toEntryDto(row);
    entries.push(dto);
    if (row.entry.endedAt === null) continue;
    const clipped = overlapSeconds(row.entry.startedAt, row.entry.endedAt, bounds.fromSeconds, bounds.toSeconds);
    if (!clipped) continue;
    const current = totals.get(row.entry.activityId) ?? { name: row.activityName, seconds: 0 };
    current.seconds += clipped;
    totals.set(row.entry.activityId, current);
    let cursor = Math.max(row.entry.startedAt, bounds.fromSeconds);
    while (cursor < Math.min(row.entry.endedAt, bounds.toSeconds)) {
      const date = jstDateFromSeconds(cursor);
      const next = parseJstDateTime(date, "00:00") + 86400;
      const segment = Math.min(row.entry.endedAt, bounds.toSeconds, next) - cursor;
      daily.set(date, (daily.get(date) ?? 0) + Math.max(0, segment));
      cursor = next;
    }
  }
  const totalSeconds = [...totals.values()].reduce((sum, value) => sum + value.seconds, 0);
  return {
    period,
    from: bounds.fromDate,
    to: bounds.toDate,
    totalSeconds,
    byActivity: [...totals.entries()].sort((a, b) => b[1].seconds - a[1].seconds).map(([activityId, value]) => ({ activityId, name: value.name, seconds: value.seconds, percentage: totalSeconds ? Math.round((value.seconds / totalSeconds) * 1000) / 10 : 0 })),
    byDay: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, seconds]) => ({ date, seconds })),
    entries,
  };
}

app.get("/api/reports/:period", authRequired, async (c) => {
  const period = c.req.param("period") as Period;
  if (!(["day", "week", "month"] as string[]).includes(period)) return fail(c, 400, "INVALID_PERIOD", "集計期間が正しくありません。");
  try {
    return ok(c, await buildReport(c.env, userId(c), period, c.req.query("date")));
  } catch {
    return fail(c, 400, "INVALID_DATE", "日付が正しくありません。");
  }
});

app.get("/api/goals", authRequired, async (c) => {
  const uid = userId(c);
  const report = await buildReport(c.env, uid, "week", c.req.query("date"));
  const rows = await dbFor(c.env).select({ goal: weeklyGoals, activityName: activities.name }).from(weeklyGoals).innerJoin(activities, eq(weeklyGoals.activityId, activities.id)).where(eq(weeklyGoals.userId, uid)).orderBy(asc(weeklyGoals.createdAt));
  const actual = new Map(report.byActivity.map((item) => [item.activityId, item.seconds]));
  const result: GoalDto[] = rows.map((row) => {
    const actualSeconds = actual.get(row.goal.activityId) ?? 0;
    return { id: row.goal.id, activityId: row.goal.activityId, activityName: row.activityName, targetMinutes: row.goal.targetMinutes, actualSeconds, progressPercent: Math.min(100, Math.round((actualSeconds / (row.goal.targetMinutes * 60)) * 100)) };
  });
  return ok(c, result);
});

app.post("/api/goals", authRequired, jsonValidator(goalCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const uid = userId(c);
  const activity = await ownedActivity(c.env, uid, input.activityId);
  if (!activity) return fail(c, 404, "ACTIVITY_NOT_FOUND", "その活動は見つかりません。");
  const now = nowSeconds();
  const row = { id: randomId(), userId: uid, activityId: input.activityId, targetMinutes: input.targetMinutes, createdAt: now, updatedAt: now };
  try {
    await dbFor(c.env).insert(weeklyGoals).values(row).run();
  } catch {
    return fail(c, 409, "GOAL_ALREADY_EXISTS", "その活動の目標はすでにあります。");
  }
  return ok(c, { id: row.id }, 201);
});

app.patch("/api/goals/:id", authRequired, jsonValidator(goalUpdateSchema), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const uid = userId(c);
  const existing = await dbFor(c.env).select().from(weeklyGoals).where(and(eq(weeklyGoals.id, id), eq(weeklyGoals.userId, uid))).get();
  if (!existing) return fail(c, 404, "GOAL_NOT_FOUND", "目標が見つかりません。");
  const updatedAt = nowSeconds();
  await dbFor(c.env).update(weeklyGoals).set({ targetMinutes: input.targetMinutes, updatedAt }).where(and(eq(weeklyGoals.id, id), eq(weeklyGoals.userId, uid))).run();
  return ok(c, { id, targetMinutes: input.targetMinutes });
});

app.delete("/api/goals/:id", authRequired, async (c) => {
  const id = c.req.param("id");
  const result = await dbFor(c.env).delete(weeklyGoals).where(and(eq(weeklyGoals.id, id), eq(weeklyGoals.userId, userId(c)))).run();
  if (!result.meta.changes) return fail(c, 404, "GOAL_NOT_FOUND", "目標が見つかりません。");
  return ok(c, { id });
});

app.get("/api/health", (c) => c.json({ ok: true, timeZone: TIME_ZONE }));
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
