import { describe, expect, it } from "vitest";
import { formatClock, formatSeconds } from "./api";

describe("時間表示", () => {
  it("秒を日本語の時間表記へ変換する", () => {
    expect(formatSeconds(0)).toBe("0秒");
    expect(formatSeconds(3665)).toBe("1時間01分");
    expect(formatClock(3665)).toBe("01:01:05");
  });
});
