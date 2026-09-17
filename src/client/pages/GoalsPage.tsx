import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ActivityDto, GoalDto } from "../../shared/types";
import { Button, Card, Empty, Input, PageTitle, Progress, Select } from "../components/ui";
import { useApi } from "../hooks";
import { apiRequest, formatSeconds, jsonBody } from "../lib/api";

export function GoalsPage() {
  const activities = useApi<ActivityDto[]>("/api/activities"); const goals = useApi<GoalDto[]>("/api/goals");
  const [activityId, setActivityId] = useState(""); const [targetMinutes, setTargetMinutes] = useState("60");
  async function add() { if (!activityId) return; await apiRequest("/api/goals", jsonBody({ activityId, targetMinutes: Number(targetMinutes) })); setActivityId(""); goals.reload(); }
  async function edit(goal: GoalDto) { const value = window.prompt("1週間の目標（分）", String(goal.targetMinutes)); if (value && Number(value) > 0) { await apiRequest(`/api/goals/${goal.id}`, { ...jsonBody({ targetMinutes: Number(value) }), method: "PATCH" }); goals.reload(); } }
  async function remove(id: string) { if (window.confirm("この目標を削除しますか？")) { await apiRequest(`/api/goals/${id}`, { method: "DELETE" }); goals.reload(); } }
  return <><PageTitle title="週間目標" eyebrow="今週の目安"><span className="text-sm text-muted">月曜日から日曜日まで</span></PageTitle><Card className="mb-5"><h2 className="mb-4 font-black">目標を追加</h2><div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Select value={activityId} onChange={(e) => setActivityId(e.target.value)}><option value="">活動を選択</option>{activities.data?.filter((activity) => !goals.data?.some((goal) => goal.activityId === activity.id)).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}</Select><Input type="number" min="1" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} placeholder="目標（分）" /><Button onClick={() => void add()} disabled={!activityId}><Plus size={17} className="mr-2" />追加</Button></div></Card><div className="grid gap-4 sm:grid-cols-2">{goals.data?.map((goal) => <Card key={goal.id}><div className="flex items-start justify-between"><div><h2 className="font-black">{goal.activityName}</h2><p className="mt-1 text-sm text-muted">{formatSeconds(goal.actualSeconds)} / {formatSeconds(goal.targetMinutes * 60)}</p></div><div className="flex gap-1"><Button variant="ghost" className="size-8 min-h-0 p-0" onClick={() => void edit(goal)}><Pencil size={15} /></Button><Button variant="ghost" className="size-8 min-h-0 p-0 text-red-500 hover:bg-red-50" onClick={() => void remove(goal.id)}><Trash2 size={15} /></Button></div></div><Progress value={goal.progressPercent} /><p className="mt-2 text-right text-xs font-bold text-brand">{goal.progressPercent}%</p></Card>)}{goals.data && !goals.data.length && <div className="sm:col-span-2"><Empty>まだ週間目標がありません。上から追加してみましょう。</Empty></div>}</div></>;
}
