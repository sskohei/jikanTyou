import { BookOpen, ChartNoAxesCombined, Clock3, LogOut, Target, Timer, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authClient } from "../auth";

const links = [
  { to: "/", label: "ホーム", icon: Clock3 },
  { to: "/activities", label: "活動", icon: BookOpen },
  { to: "/records", label: "記録", icon: Timer },
  { to: "/report", label: "振り返り", icon: ChartNoAxesCombined },
  { to: "/goals", label: "目標", icon: Target },
];

export function Layout({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const navigate = useNavigate();
  async function logout() { await authClient.signOut(); navigate("/login"); }
  return <div className="min-h-screen"><header className="sticky top-0 z-10 border-b border-line/80 bg-canvas/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><NavLink to="/" className="flex items-center gap-2 font-black tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Timer size={20} /></span><span>じかん帳</span></NavLink><div className="flex items-center gap-2"><span className="hidden text-sm text-muted sm:block">{user.name ?? user.email}</span>{user.image ? <img src={user.image} className="size-8 rounded-full" alt="" /> : <span className="grid size-8 place-items-center rounded-full bg-indigo-50 text-brand"><UserRound size={16} /></span>}<button onClick={logout} className="ml-1 rounded-lg p-2 text-muted hover:bg-slate-100" title="ログアウト"><LogOut size={17} /></button></div></div></header><main className="mx-auto max-w-6xl px-4 pb-28 pt-7 sm:px-6"><Outlet /></main><nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-line bg-white/95 px-2 py-2 backdrop-blur sm:bottom-auto sm:top-16 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:rounded-b-2xl sm:border-t-0 sm:shadow-sm"><div className="flex justify-around gap-1 sm:justify-center">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold sm:flex-row sm:text-xs ${isActive ? "bg-indigo-50 text-brand" : "text-muted hover:bg-slate-50"}`}><Icon size={18} />{label}</NavLink>)}</div></nav></div>;
}
