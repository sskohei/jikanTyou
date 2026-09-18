import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { authClient } from "./auth";
import { Layout } from "./components/Layout";
import { hasOAuthError } from "./lib/oauth";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { RecordsPage } from "./pages/RecordsPage";
import { ReportPage } from "./pages/ReportPage";
import { GoalsPage } from "./pages/GoalsPage";
import { DeveloperPreviewPage } from "./pages/DeveloperPreviewPage";
import { CalendarPage } from "./pages/CalendarPage";

export function App() {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();
  const user = session?.user ?? null;
  const loginPath = hasOAuthError(location.search) ? `/login${location.search}` : "/login";
  if (isPending) return <div className="grid min-h-screen place-items-center text-sm text-muted">読み込み中…</div>;
  return <Routes><Route path="/preview" element={<DeveloperPreviewPage />} /><Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} /><Route element={user ? <Layout user={user} /> : <Navigate to={loginPath} replace />}><Route path="/" element={<HomePage />} /><Route path="/activities" element={<ActivitiesPage />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/records" element={<RecordsPage />} /><Route path="/report" element={<ReportPage />} /><Route path="/goals" element={<GoalsPage />} /></Route><Route path="*" element={<Navigate to={user ? "/" : loginPath} replace />} /></Routes>;
}
