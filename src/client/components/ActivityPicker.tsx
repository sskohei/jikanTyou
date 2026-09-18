import type { ActivityDto } from "../../shared/types";
import ButtonBase from "@mui/material/ButtonBase";
import { Check } from "lucide-react";

export function ActivityPicker({ activities, value, onChange }: { activities: ActivityDto[]; value: string; onChange: (id: string) => void }) {
  return <div role="group" aria-label="活動を選択" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{activities.map((activity) => {
    const selected = value === activity.id;
    return <ButtonBase key={activity.id} aria-pressed={selected} onClick={() => onChange(activity.id)} className={`min-h-16 justify-between rounded-2xl border px-4 text-left text-sm font-bold transition ${selected ? "border-brand bg-brand text-white shadow-md shadow-brand/20" : "border-line bg-white hover:border-brand/40 hover:bg-[#f7f2fa]"}`}>
      <span>{activity.name}</span>
      {selected && <span className="ml-2 grid size-6 shrink-0 place-items-center rounded-full bg-white text-brand" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>}
    </ButtonBase>;
  })}</div>;
}
