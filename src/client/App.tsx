import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { authClient } from "./auth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { RecordsPage } from "./pages/RecordsPage";
import { ReportPage } from "./pages/ReportPage";
import { GoalsPage } from "./pages/GoalsPage";
import { DeveloperPreviewPage } from "./pages/DeveloperPreviewPage";

type User = { id: string; name?: string | null; email?: string | null; image?: string | null };

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authClient.getSession().then(({ data }) => setUser(data?.user ?? null)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">読み込み中…</div>;
  return <Routes><Route path="/preview" element={<DeveloperPreviewPage />} /><Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} /><Route element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}><Route path="/" element={<HomePage />} /><Route path="/activities" element={<ActivitiesPage />} /><Route path="/records" element={<RecordsPage />} /><Route path="/report" element={<ReportPage />} /><Route path="/goals" element={<GoalsPage />} /></Route><Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} /></Routes>;
}
