import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import LibraryBooksRounded from "@mui/icons-material/LibraryBooksRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../auth";

const links = [
  { to: "/", label: "ホーム", icon: HomeRounded },
  { to: "/activities", label: "活動", icon: LibraryBooksRounded },
  { to: "/calendar", label: "カレンダー", icon: CalendarMonthRounded },
  { to: "/report", label: "振り返り", icon: AssessmentRounded },
  { to: "/goals", label: "目標", icon: FlagRounded },
];

export function Layout({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = links.find((link) => link.to === "/" ? location.pathname === "/" : location.pathname.startsWith(link.to))?.to ?? "/";
  async function logout() { await authClient.signOut(); navigate("/login"); }

  const navigation = <BottomNavigation showLabels value={activePath} onChange={(_, value: string) => navigate(value)} sx={{ height: 68, bgcolor: "transparent", gap: { sm: 1 } }}>
    {links.map(({ to, label, icon: Icon }) => <BottomNavigationAction key={to} value={to} label={label} icon={<Icon fontSize="small" />} />)}
  </BottomNavigation>;

  return <div className="min-h-screen">
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(254,247,255,.9)", backdropFilter: "blur(18px)", color: "text.primary" }}>
      <Toolbar sx={{ minHeight: "64px !important", width: "100%", maxWidth: 1152, mx: "auto", px: { xs: 2, sm: 3 } }}>
        <NavLink to="/" className="flex items-center gap-2.5 text-inherit no-underline">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white"><TimerRounded fontSize="small" /></span>
          <Typography variant="h6" sx={{ display: "inline", fontWeight: 800 }}>じかん帳</Typography>
        </NavLink>
        <div className="ml-auto flex items-center gap-2">
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, mr: 1 }}>{user.name ?? user.email}</Typography>
          <Avatar src={user.image ?? undefined} alt="" sx={{ width: 36, height: 36, bgcolor: "primary.light", color: "primary.dark" }}>{!user.image && <AccountCircleRounded fontSize="small" />}</Avatar>
          <Tooltip title="ログアウト"><IconButton onClick={() => void logout()} aria-label="ログアウト" color="inherit"><LogoutRounded fontSize="small" /></IconButton></Tooltip>
        </div>
      </Toolbar>
    </AppBar>

    <Paper component="nav" square elevation={0} sx={{ display: { xs: "none", sm: "block" }, position: "sticky", top: 64, zIndex: 9, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <div className="mx-auto max-w-3xl">{navigation}</div>
    </Paper>

    <main className="mx-auto max-w-6xl px-4 pb-28 pt-7 sm:px-6 sm:pb-12 sm:pt-9"><Outlet /></main>

    <Paper component="nav" elevation={8} sx={{ display: { xs: "block", sm: "none" }, position: "fixed", zIndex: 20, bottom: 0, left: 0, right: 0, borderRadius: "20px 20px 0 0", overflow: "hidden", bgcolor: "background.paper" }}>
      {navigation}
    </Paper>
  </div>;
}
