import { describe, expect, it } from "vitest";
import { getPeriodBounds, jstDateFromSeconds, overlapSeconds, parseJstDateTime } from "./time";

describe("時間と日本時間の境界", () => {
  it("JSTの日付をUTCの秒へ変換する", () => {
    const midnight = parseJstDateTime("2026-09-17", "00:00");
    expect(new Date(midnight * 1000).toISOString()).toBe("2026-09-16T15:00:00.000Z");
    expect(jstDateFromSeconds(midnight)).toBe("2026-09-17");
  });

  it("23時から翌1時の記録を日付ごとに分割できる", () => {
    const start = parseJstDateTime("2026-09-17", "23:00");
    const end = parseJstDateTime("2026-09-18", "01:00");
    const firstDay = getPeriodBounds("day", "2026-09-17");
    const secondDay = getPeriodBounds("day", "2026-09-18");
    expect(overlapSeconds(start, end, firstDay.fromSeconds, firstDay.toSeconds)).toBe(3600);
    expect(overlapSeconds(start, end, secondDay.fromSeconds, secondDay.toSeconds)).toBe(3600);
  });

  it("週は月曜日開始である", () => {
    const bounds = getPeriodBounds("week", "2026-09-17");
    expect(bounds.fromDate).toBe("2026-09-14");
    expect(bounds.toDate).toBe("2026-09-20");
  });

  it("同じ日付の終了時刻が開始時刻より後でない場合は呼び出し側で拒否できる", () => {
    expect(parseJstDateTime("2026-09-17", "10:00")).toBeGreaterThan(parseJstDateTime("2026-09-17", "09:00"));
  });
});
