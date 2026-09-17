import { Activity, Play, Square, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ActivityDto, ReportDto, TimerDto } from "../../shared/types";
import { ActivityPicker } from "../components/ActivityPicker";
import { Button, Card, Empty, PageTitle } from "../components/ui";
import { useApi } from "../hooks";
import { apiRequest, formatClock, formatSeconds, jsonBody } from "../lib/api";
import { dateInJapan, timeInJapan, todayInJapan } from "../lib/dates";

export function HomePage() {
  const activities = useApi<ActivityDto[]>("/api/activities");
  const timer = useApi<TimerDto | null>("/api/timer/current");
  const report = useApi<ReportDto>(`/api/reports/day?date=${todayInJapan()}`);
  const [selected, setSelected] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (activities.data?.length && !selected) setSelected(activities.data[0].id); }, [activities.data, selected]);
  const runningSeconds = timer.data ? Math.max(timer.data.elapsedSeconds, Math.floor(now / 1000) - timer.data.startedAt) : 0;
  async function start() { if (!selected) return; await apiRequest("/api/timer/start", jsonBody({ activityId: selected })); timer.reload(); report.reload(); }
  async function stop() { await apiRequest("/api/timer/stop", { method: "POST" }); timer.reload(); report.reload(); }
  return <><PageTitle eyebrow="今日の時間" title="今日は何をしますか？"><Link to="/records" className="text-sm font-bold text-brand">手動で記録する →</Link></PageTitle><div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><Card className={timer.data ? "border-brand/20 bg-[linear-gradient(135deg,#f0efff,#fff)]" : ""}><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold"><span className={`grid size-8 place-items-center rounded-xl ${timer.data ? "bg-brand text-white" : "bg-indigo-50 text-brand"}`}><TimerReset size={17} /></span>{timer.data ? "記録中" : "活動を選んで開始"}</div>{timer.data && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />進行中</span>}</div>{timer.data ? <div className="text-center"><p className="text-lg font-bold">{timer.data.activityName}</p><p className="my-4 font-mono text-5xl font-black tracking-tight text-brand sm:text-6xl">{formatClock(runningSeconds)}</p><Button variant="danger" className="mx-auto min-w-40" onClick={stop}><Square size={16} className="mr-2" />終了する</Button></div> : <><ActivityPicker activities={activities.data ?? []} value={selected} onChange={setSelected} />{activities.data?.length ? <Button className="mt-5 w-full" onClick={start} disabled={!selected}><Play size={17} className="mr-2 fill-current" />タイマーを始める</Button> : <Empty><Activity size={22} className="mx-auto mb-2 text-brand" /><p>まずは記録したい活動を作りましょう。</p><Link to="/activities" className="mt-3 inline-block font-bold text-brand">活動を作る →</Link></Empty>}</>}</Card><Card><div className="mb-4 flex items-center justify-between"><h2 className="font-black">今日の合計</h2><span className="text-xs text-muted">{todayInJapan()}</span></div><p className="text-4xl font-black tracking-tight text-brand">{formatSeconds(report.data?.totalSeconds)}</p><div className="mt-5 space-y-3">{report.data?.byActivity.slice(0, 5).map((item) => <div key={item.activityId} className="flex items-center justify-between text-sm"><span>{item.name}</span><span className="font-bold">{formatSeconds(item.seconds)}</span></div>)}{!report.data?.byActivity.length && <p className="text-sm text-muted">まだ今日の記録はありません。</p>}</div></Card></div><Card className="mt-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">今日の記録</h2><Link to="/records" className="text-sm font-bold text-brand">すべて見る</Link></div>{report.data?.entries.length ? <div className="divide-y divide-line">{report.data.entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-bold">{entry.activityName}</p><p className="mt-1 text-xs text-muted">{dateInJapan(entry.startedAt)}　{timeInJapan(entry.startedAt)} - {entry.endedAt ? timeInJapan(entry.endedAt) : "記録中"}</p></div><span className="shrink-0 text-sm font-bold">{formatSeconds(entry.durationSeconds)}</span></div>)}</div> : <Empty><p>今日の記録はここに表示されます。</p></Empty>}</Card></>;
}
