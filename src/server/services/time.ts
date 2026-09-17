import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const TIME_ZONE = "Asia/Tokyo";

export interface PeriodBounds {
  fromSeconds: number;
  toSeconds: number;
  fromDate: string;
  toDate: string;
}

export function parseJstDateTime(date: string, time: string): number {
  const parsed = fromZonedTime(`${date}T${time}:00`, TIME_ZONE);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_DATETIME");
  return Math.floor(parsed.getTime() / 1000);
}

export function jstDateFromSeconds(seconds: number): string {
  return formatInTimeZone(new Date(seconds * 1000), TIME_ZONE, "yyyy-MM-dd");
}

export function getPeriodBounds(period: "day" | "week" | "month", dateValue?: string): PeriodBounds {
  const date = dateValue ? parseISO(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE");
  const start = period === "day" ? date : period === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date);
  const end = period === "day" ? date : period === "week" ? endOfWeek(date, { weekStartsOn: 1 }) : endOfMonth(date);
  const fromDate = format(start, "yyyy-MM-dd");
  const toDate = format(end, "yyyy-MM-dd");
  const fromSeconds = parseJstDateTime(fromDate, "00:00");
  const toSeconds = parseJstDateTime(format(new Date(end.getTime() + 86400000), "yyyy-MM-dd"), "00:00");
  return { fromSeconds, toSeconds, fromDate, toDate };
}

export function overlapSeconds(startedAt: number, endedAt: number, fromSeconds: number, toSeconds: number): number {
  return Math.max(0, Math.min(endedAt, toSeconds) - Math.max(startedAt, fromSeconds));
}
