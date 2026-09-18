import type { TimeEntryDto } from "../../shared/types";

export const MINUTES_PER_DAY = 24 * 60;

export interface CalendarSegment {
  entry: TimeEntryDto;
  date: string;
  startMinute: number;
  endMinute: number;
}

export interface PositionedCalendarSegment extends CalendarSegment {
  column: number;
  columnCount: number;
}

export function addCalendarDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function startOfCalendarWeek(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addCalendarDays(date, -(day === 0 ? 6 : day - 1));
}

export function calendarDateRange(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index));
}

export function jstDateTimeSeconds(date: string, minute = 0): number {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return Math.floor(new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+09:00`).getTime() / 1000);
}

export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(minutes)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function splitEntryIntoDays(entry: TimeEntryDto, dates: string[], nowSeconds = Math.floor(Date.now() / 1000)): CalendarSegment[] {
  const entryEnd = entry.endedAt ?? nowSeconds;
  if (entryEnd <= entry.startedAt) return [];
  return dates.flatMap((date) => {
    const dayStart = jstDateTimeSeconds(date);
    const dayEnd = dayStart + 86400;
    const start = Math.max(entry.startedAt, dayStart);
    const end = Math.min(entryEnd, dayEnd);
    if (end <= start) return [];
    return [{
      entry,
      date,
      startMinute: (start - dayStart) / 60,
      endMinute: (end - dayStart) / 60,
    }];
  });
}

export function positionOverlappingSegments(segments: CalendarSegment[]): PositionedCalendarSegment[] {
  const sorted = [...segments].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const result: PositionedCalendarSegment[] = [];
  let cursor = 0;
  while (cursor < sorted.length) {
    const group: CalendarSegment[] = [sorted[cursor]];
    let groupEnd = sorted[cursor].endMinute;
    let next = cursor + 1;
    while (next < sorted.length && sorted[next].startMinute < groupEnd) {
      group.push(sorted[next]);
      groupEnd = Math.max(groupEnd, sorted[next].endMinute);
      next += 1;
    }
    const laneEnds: number[] = [];
    const assigned = group.map((segment) => {
      let column = laneEnds.findIndex((end) => end <= segment.startMinute);
      if (column === -1) column = laneEnds.length;
      laneEnds[column] = segment.endMinute;
      return { segment, column };
    });
    result.push(...assigned.map(({ segment, column }) => ({ ...segment, column, columnCount: laneEnds.length })));
    cursor = next;
  }
  return result;
}

export function durationLabel(seconds: number): string {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}分`;
  return minutes ? `${hours}時間${minutes}分` : `${hours}時間`;
}

export function activityColor(value: string): { block: string; dot: string } {
  const palettes = [
    { block: "border-[#6750a4] bg-[#eaddff] text-[#21005d] hover:bg-[#d0bcff]", dot: "bg-[#6750a4]" },
    { block: "border-[#006a6a] bg-[#9cf1f0] text-[#002020] hover:bg-[#80d5d4]", dot: "bg-[#006a6a]" },
    { block: "border-[#7d5700] bg-[#ffdea5] text-[#271900] hover:bg-[#f2c96f]", dot: "bg-[#7d5700]" },
    { block: "border-[#9c4146] bg-[#ffdad9] text-[#410006] hover:bg-[#ffb3b5]", dot: "bg-[#9c4146]" },
    { block: "border-[#00639b] bg-[#cee5ff] text-[#001d32] hover:bg-[#afd0f5]", dot: "bg-[#00639b]" },
    { block: "border-[#6f528f] bg-[#eedbff] text-[#2a0e46] hover:bg-[#d8baf5]", dot: "bg-[#6f528f]" },
  ];
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}
