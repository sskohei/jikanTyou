import { describe, expect, it } from "vitest";
import type { TimeEntryDto } from "../../shared/types";
import { addCalendarDays, calendarDateRange, minutesToTime, positionOverlappingSegments, splitEntryIntoDays, startOfCalendarWeek } from "./calendar";

describe("calendar helpers", () => {
  it("月曜日を週の先頭として扱う", () => {
    expect(startOfCalendarWeek("2026-09-18")).toBe("2026-09-14");
    expect(startOfCalendarWeek("2026-09-20")).toBe("2026-09-14");
    expect(startOfCalendarWeek("2026-09-21")).toBe("2026-09-21");
    expect(calendarDateRange("2026-09-14").at(-1)).toBe("2026-09-20");
  });

  it("月をまたいで日付を移動できる", () => {
    expect(addCalendarDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addCalendarDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("日をまたぐ記録をJSTの日ごとに分割する", () => {
    const entry: TimeEntryDto = {
      id: "entry-1",
      activityId: "activity-1",
      activityName: "開発",
      startedAt: Math.floor(new Date("2026-09-18T23:30:00+09:00").getTime() / 1000),
      endedAt: Math.floor(new Date("2026-09-19T01:00:00+09:00").getTime() / 1000),
      durationSeconds: 5400,
      createdAt: 0,
      updatedAt: 0,
    };
    const segments = splitEntryIntoDays(entry, ["2026-09-18", "2026-09-19"]);
    expect(segments.map(({ date, startMinute, endMinute }) => ({ date, startMinute, endMinute }))).toEqual([
      { date: "2026-09-18", startMinute: 1410, endMinute: 1440 },
      { date: "2026-09-19", startMinute: 0, endMinute: 60 },
    ]);
  });

  it("分を時刻入力用の値に変換する", () => {
    expect(minutesToTime(555)).toBe("09:15");
    expect(minutesToTime(1440)).toBe("23:59");
  });

  it("重なった記録を別の列に配置する", () => {
    const base = {
      entry: {} as TimeEntryDto,
      date: "2026-09-18",
    };
    const positioned = positionOverlappingSegments([
      { ...base, startMinute: 540, endMinute: 600 },
      { ...base, startMinute: 570, endMinute: 630 },
      { ...base, startMinute: 630, endMinute: 660 },
    ]);
    expect(positioned.map(({ column, columnCount }) => ({ column, columnCount }))).toEqual([
      { column: 0, columnCount: 2 },
      { column: 1, columnCount: 2 },
      { column: 0, columnCount: 1 },
    ]);
  });
});
