import type { ActivityDto } from "../../shared/types";

export function ActivityPicker({ activities, value, onChange }: { activities: ActivityDto[]; value: string; onChange: (id: string) => void }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{activities.map((activity) => <button key={activity.id} onClick={() => onChange(activity.id)} className={`min-h-16 rounded-2xl border px-3 text-left text-sm font-bold transition ${value === activity.id ? "border-brand bg-indigo-50 text-brand ring-2 ring-brand/15" : "border-line bg-white hover:border-indigo-200"}`}>{activity.name}</button>)}</div>;
}
