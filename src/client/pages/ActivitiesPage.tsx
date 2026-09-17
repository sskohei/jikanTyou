import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ActivityDto } from "../../shared/types";
import { Button, Card, Empty, Input, PageTitle } from "../components/ui";
import { useApi } from "../hooks";
import { apiRequest, jsonBody } from "../lib/api";

export function ActivitiesPage() {
  const query = useApi<ActivityDto[]>("/api/activities");
  const [name, setName] = useState(""); const [editing, setEditing] = useState<string | null>(null); const [message, setMessage] = useState("");
  async function save() { if (!name.trim()) return; await apiRequest(editing ? `/api/activities/${editing}` : "/api/activities", { ...jsonBody({ name }), method: editing ? "PATCH" : "POST" }); setName(""); setEditing(null); query.reload(); }
  async function remove(id: string) { if (window.confirm("この活動と、この活動の記録を削除しますか？")) { await apiRequest(`/api/activities/${id}`, { method: "DELETE" }); query.reload(); } }
  return <><PageTitle title="活動" eyebrow="記録する内容"><span className="text-sm text-muted">{query.data?.length ?? 0}個</span></PageTitle><div className="grid gap-5 lg:grid-cols-[.65fr_1.35fr]"><Card><h2 className="mb-4 font-black">{editing ? "活動名を変更" : "新しい活動"}</h2><div className="flex gap-2"><Input placeholder="例：英語、読書、個人開発" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); }} /><Button onClick={save} disabled={!name.trim()}>{editing ? "保存" : <Plus size={18} />}</Button></div>{editing && <Button variant="ghost" className="mt-2" onClick={() => { setEditing(null); setName(""); }}>キャンセル</Button>}<p className="mt-4 text-xs leading-6 text-muted">活動は「何に時間を使ったか」を表す名前です。あとから変更できます。</p></Card><Card><h2 className="mb-4 font-black">あなたの活動</h2>{query.data?.length ? <div className="space-y-2">{query.data.map((activity) => <div key={activity.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="font-bold">{activity.name}</span><div className="flex gap-1"><Button variant="ghost" className="size-9 min-h-0 p-0" title="編集" onClick={() => { setEditing(activity.id); setName(activity.name); }}><Pencil size={16} /></Button><Button variant="ghost" className="size-9 min-h-0 p-0 text-red-500 hover:bg-red-50" title="削除" onClick={() => void remove(activity.id)}><Trash2 size={16} /></Button></div></div>)}</div> : <Empty>まだ活動がありません。左のフォームから作成できます。</Empty>}{message && <p className="mt-3 text-sm text-red-600">{message}</p>}</Card></div></>;
}
