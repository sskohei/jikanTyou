import { Timer } from "lucide-react";
import { useState } from "react";
import { authClient } from "../auth";
import { Button, Card } from "../components/ui";

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setLoading(true); setError("");
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (result.error) { setError("ログインできませんでした。もう一度お試しください。"); setLoading(false); }
  }
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,#e5e2ff,transparent_40%),#f7f8fc] px-4"><Card className="w-full max-w-md p-8 text-center sm:p-10"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20"><Timer size={29} /></div><h1 className="text-3xl font-black tracking-tight">じかん帳</h1><p className="mt-3 text-sm leading-7 text-muted">何に時間を使ったかを、あとで振り返れる。<br />あなたのためのシンプルな時間記録。</p><Button className="mt-8 w-full" onClick={login} disabled={loading}>{loading ? "Googleへ移動中…" : "Googleでログイン"}</Button>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<p className="mt-6 text-xs text-muted">ログインすると時間記録を始められます。</p></Card></div>;
}
