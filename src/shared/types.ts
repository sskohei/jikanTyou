export interface ActivityDto {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntryDto {
  id: string;
  activityId: string;
  activityName: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TimerDto extends TimeEntryDto {
  elapsedSeconds: number;
}

export interface ReportDto {
  period: "day" | "week" | "month";
  from: string;
  to: string;
  totalSeconds: number;
  byActivity: Array<{ activityId: string; name: string; seconds: number; percentage: number }>;
  byDay: Array<{ date: string; seconds: number }>;
  entries: TimeEntryDto[];
}

export interface GoalDto {
  id: string;
  activityId: string;
  activityName: string;
  targetMinutes: number;
  actualSeconds: number;
  progressPercent: number;
}
