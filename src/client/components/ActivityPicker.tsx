import type { ActivityDto } from "../../shared/types";
import ButtonBase from "@mui/material/ButtonBase";

export function ActivityPicker({ activities, value, onChange }: { activities: ActivityDto[]; value: string; onChange: (id: string) => void }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{activities.map((activity) => <ButtonBase key={activity.id} onClick={() => onChange(activity.id)} className={`min-h-16 justify-start rounded-2xl border px-4 text-left text-sm font-bold transition ${value === activity.id ? "border-brand bg-[#eaddff] text-brand ring-2 ring-brand/15" : "border-line bg-white hover:bg-[#f7f2fa]"}`}>{activity.name}</ButtonBase>)}</div>;
}
