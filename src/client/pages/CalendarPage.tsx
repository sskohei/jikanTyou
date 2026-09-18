import { ChevronLeft, ChevronRight, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { ActivityDto, TimeEntryDto } from "../../shared/types";
import { Button, Card, Input, PageTitle, Select } from "../components/ui";
import { useApi } from "../hooks";
import { apiRequest, jsonBody } from "../lib/api";
import {
  activityColor,
  addCalendarDays,
  calendarDateRange,
  durationLabel,
  minutesToTime,
  positionOverlappingSegments,
  splitEntryIntoDays,
  startOfCalendarWeek,
  type CalendarSegment,
} from "../lib/calendar";
import { JAPAN_TIME_ZONE, timeInJapan, todayInJapan } from "../lib/dates";

const HOUR_HEIGHT = 64;
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const initialForm = { activityId: "", date: todayInJapan(), startTime: "09:00", endDate: todayInJapan(), endTime: "10:00" };
type EntryForm = typeof initialForm;

function dateLabel(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "UTC", ...options }).format(new Date(`${date}T00:00:00Z`));
}

function entryDate(seconds: number): string {
  return formatInTimeZone(new Date(seconds * 1000), JAPAN_TIME_ZONE, "yyyy-MM-dd");
}

function totalForDay(segments: CalendarSegment[], date: string): number {
  return segments.filter((segment) => segment.date === date).reduce((sum, segment) => sum + (segment.endMinute - segment.startMinute) * 60, 0);
}

export function CalendarPage() {
  const today = todayInJapan();
  const [weekStart, setWeekStart] = useState(() => startOfCalendarWeek(today));
  const dates = useMemo(() => calendarDateRange(weekStart), [weekStart]);
  const rangeEnd = addCalendarDays(weekStart, 7);
  const activities = useApi<ActivityDto[]>("/api/activities");
  const entries = useApi<TimeEntryDto[]>(`/api/time-entries?from=${weekStart}&to=${rangeEnd}`);
  const [selectedDate, setSelectedDate] = useState(today);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [form, setForm] = useState<EntryForm>(initialForm);
  const [editing, setEditing] = useState<TimeEntryDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dates.includes(selectedDate)) setSelectedDate(dates.includes(today) ? today : dates[0]);
  }, [dates, selectedDate, today]);

  const segments = useMemo(
    () => (entries.data ?? []).flatMap((entry) => splitEntryIntoDays(entry, dates, nowSeconds)),
    [dates, entries.data, nowSeconds],
  );
  const visibleHours = useMemo(() => {
    if (!segments.length) return { start: 6, end: 22 };
    const first = Math.floor(Math.min(...segments.map((segment) => segment.startMinute)) / 60);
    const last = Math.ceil(Math.max(...segments.map((segment) => segment.endMinute)) / 60);
    return { start: Math.max(0, Math.min(6, first)), end: Math.min(24, Math.max(22, last)) };
  }, [segments]);
  const hours = Array.from({ length: visibleHours.end - visibleHours.start }, (_, index) => visibleHours.start + index);
  const gridHeight = hours.length * HOUR_HEIGHT;
  const weekSeconds = segments.reduce((sum, segment) => sum + (segment.endMinute - segment.startMinute) * 60, 0);

  function setField<K extends keyof EntryForm>(key: K, value: EntryForm[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function openCreate(date = selectedDate, startMinute = 9 * 60) {
    const safeStart = Math.max(0, Math.min(23 * 60, Math.round(startMinute / 15) * 15));
    const safeEnd = Math.min(23 * 60 + 59, safeStart + 60);
    setEditing(null);
    setError("");
    setForm({
      activityId: activities.data?.[0]?.id ?? "",
      date,
      startTime: minutesToTime(safeStart),
      endDate: date,
      endTime: minutesToTime(safeEnd),
    });
    setDialogOpen(true);
  }

  function openEdit(entry: TimeEntryDto) {
    setEditing(entry);
    setError("");
    setForm({
      activityId: entry.activityId,
      date: entryDate(entry.startedAt),
      startTime: timeInJapan(entry.startedAt),
      endDate: entry.endedAt ? entryDate(entry.endedAt) : entryDate(entry.startedAt),
      endTime: entry.endedAt ? timeInJapan(entry.endedAt) : timeInJapan(entry.startedAt),
    });
    setDialogOpen(true);
  }

  function handleGridClick(event: MouseEvent<HTMLDivElement>, date: string) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const minutes = visibleHours.start * 60 + ((event.clientY - bounds.top) / HOUR_HEIGHT) * 60;
    openCreate(date, minutes);
  }

  async function save() {
    setError("");
    if (!form.activityId) {
      setError("活動を選択してください。");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(editing ? `/api/time-entries/${editing.id}` : "/api/time-entries", {
        ...jsonBody(form),
        method: editing ? "PATCH" : "POST",
      });
      setDialogOpen(false);
      setEditing(null);
      entries.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm("この記録を削除しますか？")) return;
    setSaving(true);
    try {
      await apiRequest(`/api/time-entries/${editing.id}`, { method: "DELETE" });
      setDialogOpen(false);
      setEditing(null);
      entries.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "削除できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  function changeWeek(amount: number) {
    setWeekStart((current) => addCalendarDays(current, amount * 7));
  }

  function goToToday() {
    setWeekStart(startOfCalendarWeek(today));
    setSelectedDate(today);
  }

  return <>
    <PageTitle title="カレンダー" eyebrow="時間を見渡す">
      <Button onClick={() => openCreate()}><Plus size={17} className="mr-2" />記録を追加</Button>
    </PageTitle>

    <Card className="mb-4 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="size-10 px-0" onClick={() => changeWeek(-1)} aria-label="前の週"><ChevronLeft size={18} /></Button>
          <Button variant="secondary" onClick={goToToday}>今週</Button>
          <Button variant="secondary" className="size-10 px-0" onClick={() => changeWeek(1)} aria-label="次の週"><ChevronRight size={18} /></Button>
        </div>
        <div className="sm:text-center">
          <p className="text-base font-black sm:text-lg">{dateLabel(weekStart, { month: "long", day: "numeric" })} - {dateLabel(dates[6], { month: "long", day: "numeric" })}</p>
          <p className="mt-0.5 text-xs text-muted">月曜日から日曜日</p>
        </div>
        <div className="rounded-2xl bg-[#eaddff] px-4 py-2.5 sm:text-right">
          <p className="text-[11px] font-bold text-muted">今週の記録</p>
          <p className="font-black text-brand">{durationLabel(weekSeconds)}</p>
        </div>
      </div>
    </Card>

    {entries.error && <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">記録を読み込めませんでした。時間をおいて再度お試しください。</div>}

    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
      {activities.data?.map((activity) => <span key={activity.id} className="flex items-center gap-1.5 text-xs font-bold text-muted"><span className={`size-2.5 rounded-full ${activityColor(activity.id).dot}`} />{activity.name}</span>)}
    </div>

    <Card className="hidden overflow-x-auto p-0 md:block">
      <div className="grid grid-cols-[64px_repeat(7,minmax(110px,1fr))] border-b border-line bg-[#f7f2fa]">
        <div className="flex items-end justify-center border-r border-line p-3"><Clock3 size={16} className="text-muted" /></div>
        {dates.map((date, index) => {
          const isToday = date === today;
          return <button key={date} onClick={() => { setSelectedDate(date); openCreate(date); }} className={`border-r border-line px-2 py-3 text-center last:border-r-0 ${isToday ? "bg-[#eaddff]" : "hover:bg-[#f3edf7]"}`}>
            <span className={`mx-auto grid size-8 place-items-center rounded-full text-sm font-black ${isToday ? "bg-brand text-white" : ""}`}>{dateLabel(date, { day: "numeric" })}</span>
            <span className="mt-1 block text-[11px] font-bold text-muted">{WEEKDAYS[index]} ・ {durationLabel(totalForDay(segments, date))}</span>
          </button>;
        })}
      </div>
      <div className="relative grid grid-cols-[64px_repeat(7,minmax(110px,1fr))]" style={{ height: gridHeight }}>
        <div className="relative border-r border-line bg-[#f7f2fa]">
          {hours.map((hour, index) => <span key={hour} className="absolute right-3 -translate-y-1/2 text-[10px] font-medium text-muted" style={{ top: index * HOUR_HEIGHT }}>{String(hour).padStart(2, "0")}:00</span>)}
        </div>
        {dates.map((date) => <CalendarDayColumn key={date} date={date} segments={segments.filter((segment) => segment.date === date)} hours={hours} gridHeight={gridHeight} visibleStartHour={visibleHours.start} today={today} nowSeconds={nowSeconds} onGridClick={handleGridClick} onEntryClick={openEdit} />)}
        {entries.loading && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-muted">読み込み中…</div>}
        {!entries.loading && !segments.length && <div className="pointer-events-none absolute left-16 right-0 top-20 mx-auto max-w-sm rounded-2xl border border-dashed border-line bg-white/90 p-5 text-center text-sm text-muted shadow-sm">空いている時間をクリックして、最初の記録を追加できます。</div>}
      </div>
    </Card>

    <div className="md:hidden">
      <div className="mb-3 grid grid-cols-7 gap-1">
        {dates.map((date, index) => <button key={date} onClick={() => setSelectedDate(date)} className={`rounded-xl px-1 py-2 text-center ${selectedDate === date ? "bg-brand text-white shadow-sm" : "bg-white text-muted ring-1 ring-line"}`}><span className="block text-[10px] font-bold">{WEEKDAYS[index]}</span><span className="mt-0.5 block text-sm font-black">{dateLabel(date, { day: "numeric" })}</span></button>)}
      </div>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line bg-[#f7f2fa] px-4 py-3">
          <div><p className="text-sm font-black">{dateLabel(selectedDate, { month: "long", day: "numeric", weekday: "long" })}</p><p className="text-xs text-muted">合計 {durationLabel(totalForDay(segments, selectedDate))}</p></div>
          <Button variant="secondary" className="h-9 min-h-0 px-3" onClick={() => openCreate(selectedDate)}><Plus size={15} className="mr-1" />追加</Button>
        </div>
        <div className="relative grid grid-cols-[54px_1fr]" style={{ height: gridHeight }}>
          <div className="relative border-r border-line bg-[#f7f2fa]">
            {hours.map((hour, index) => <span key={hour} className="absolute right-2 -translate-y-1/2 text-[10px] text-muted" style={{ top: index * HOUR_HEIGHT }}>{String(hour).padStart(2, "0")}:00</span>)}
          </div>
          <CalendarDayColumn date={selectedDate} segments={segments.filter((segment) => segment.date === selectedDate)} hours={hours} gridHeight={gridHeight} visibleStartHour={visibleHours.start} today={today} nowSeconds={nowSeconds} onGridClick={handleGridClick} onEntryClick={openEdit} isLast />
          {entries.loading && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-muted">読み込み中…</div>}
        </div>
      </Card>
    </div>

    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle id="entry-dialog-title" sx={{ pr: 7, pb: 1 }}>
        <Typography variant="overline" color="primary" sx={{ display: "block", lineHeight: 1.4 }}>TIME ENTRY</Typography>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{editing ? "記録を編集" : "記録を追加"}</Typography>
        <IconButton onClick={() => setDialogOpen(false)} aria-label="閉じる" sx={{ position: "absolute", right: 16, top: 16 }}><X size={19} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {editing?.endedAt === null ? <Alert severity="warning">この記録はタイマーで計測中です。ホーム画面でタイマーを停止してから編集できます。</Alert> : <form id="time-entry-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label className="block text-xs font-bold text-muted">活動<Select value={form.activityId} onChange={(event) => setField("activityId", event.target.value)} className="mt-1"><option value="">選択してください</option>{activities.data?.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}</Select></label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-muted">開始日<Input type="date" value={form.date} onChange={(event) => { setField("date", event.target.value); if (form.endDate === form.date) setField("endDate", event.target.value); }} className="mt-1" /></label>
            <label className="text-xs font-bold text-muted">開始時刻<Input type="time" step="900" value={form.startTime} onChange={(event) => setField("startTime", event.target.value)} className="mt-1" /></label>
            <label className="text-xs font-bold text-muted">終了日<Input type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} className="mt-1" /></label>
            <label className="text-xs font-bold text-muted">終了時刻<Input type="time" step="900" value={form.endTime} onChange={(event) => setField("endTime", event.target.value)} className="mt-1" /></label>
          </div>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </form>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {editing?.endedAt === null ? <Button variant="secondary" onClick={() => setDialogOpen(false)}>閉じる</Button> : <>
          {editing && <Button type="button" variant="danger" disabled={saving} onClick={() => void remove()}><Trash2 size={16} className="mr-1.5" />削除</Button>}
          <span className="flex-1" />
          <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button type="submit" form="time-entry-form" disabled={saving}><Pencil size={16} className="mr-1.5" />{saving ? "保存中…" : editing ? "変更を保存" : "記録を保存"}</Button>
        </>}
      </DialogActions>
    </Dialog>
  </>;
}

function CalendarDayColumn({ date, segments, hours, gridHeight, visibleStartHour, today, nowSeconds, onGridClick, onEntryClick, isLast = false }: {
  date: string;
  segments: CalendarSegment[];
  hours: number[];
  gridHeight: number;
  visibleStartHour: number;
  today: string;
  nowSeconds: number;
  onGridClick: (event: MouseEvent<HTMLDivElement>, date: string) => void;
  onEntryClick: (entry: TimeEntryDto) => void;
  isLast?: boolean;
}) {
  const nowMinute = Number(formatInTimeZone(new Date(nowSeconds * 1000), JAPAN_TIME_ZONE, "H")) * 60 + Number(formatInTimeZone(new Date(nowSeconds * 1000), JAPAN_TIME_ZONE, "m"));
  const currentTop = ((nowMinute - visibleStartHour * 60) / 60) * HOUR_HEIGHT;
  return <div className={`relative cursor-crosshair ${isLast ? "" : "border-r border-line last:border-r-0"}`} style={{ height: gridHeight }} onClick={(event) => onGridClick(event, date)}>
    {hours.map((hour, index) => <div key={hour} className="absolute inset-x-0 border-t border-line/80" style={{ top: index * HOUR_HEIGHT }} />)}
    {positionOverlappingSegments(segments).map((segment) => {
      const top = ((segment.startMinute - visibleStartHour * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(24, ((segment.endMinute - segment.startMinute) / 60) * HOUR_HEIGHT - 2);
      const color = activityColor(segment.entry.activityId);
      const left = segment.column / segment.columnCount * 100;
      const width = 100 / segment.columnCount;
      return <button data-entry key={`${segment.entry.id}-${segment.date}`} onClick={(event) => { event.stopPropagation(); onEntryClick(segment.entry); }} className={`absolute z-[2] overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-sm transition ${color.block}`} style={{ top: top + 1, height, left: `calc(${left}% + 4px)`, width: `calc(${width}% - 6px)` }} title={`${segment.entry.activityName} ${minutesToTime(segment.startMinute)} - ${minutesToTime(Math.min(1439, segment.endMinute))}`}>
        <span className="block truncate text-[11px] font-black">{segment.entry.activityName}</span>
        {height >= 40 && <span className="block truncate text-[10px] font-medium opacity-75">{minutesToTime(segment.startMinute)} - {segment.entry.endedAt ? minutesToTime(Math.min(1439, segment.endMinute)) : "記録中"}</span>}
      </button>;
    })}
    {date === today && currentTop >= 0 && currentTop <= gridHeight && <div className="pointer-events-none absolute inset-x-0 z-[3] border-t-2 border-brand" style={{ top: currentTop }}><span className="absolute -left-1 -top-1.5 size-3 rounded-full bg-brand" /></div>}
  </div>;
}
