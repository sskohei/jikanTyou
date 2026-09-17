import { Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { createGoogleAuthClient } from "../auth";
import { Card } from "../components/ui";
import { apiRequest } from "../lib/api";
import { oauthErrorMessage } from "../lib/oauth";

export function LoginPage() {
  const location = useLocation();
  const buttonContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const displayedError = error || oauthErrorMessage(location.search);
  useEffect(() => {
    let cancelled = false;
    async function renderGoogleButton() {
      try {
        const { googleClientId } = await apiRequest<{ googleClientId: string }>("/api/auth/config");
        if (cancelled || !buttonContainer.current) return;
        buttonContainer.current.replaceChildren();
        const googleAuthClient = createGoogleAuthClient(googleClientId);
        await googleAuthClient.oneTap({
          callbackURL: `${window.location.origin}/`,
          uxMode: "popup",
          button: {
            container: buttonContainer.current,
            config: {
              type: "standard",
              theme: "filled_blue",
              size: "large",
              text: "signin_with",
              shape: "pill",
              width: 320,
              locale: "ja",
            },
          },
        });
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError("認証サーバーに接続できませんでした。通信状況を確認してください。");
          setLoading(false);
        }
      }
    }
    void renderGoogleButton();
    return () => {
      cancelled = true;
      buttonContainer.current?.replaceChildren();
    };
  }, []);

  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,#e5e2ff,transparent_40%),#f7f8fc] px-4"><Card className="w-full max-w-md p-8 text-center sm:p-10"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20"><Timer size={29} /></div><h1 className="text-3xl font-black tracking-tight">じかん帳</h1><p className="mt-3 text-sm leading-7 text-muted">何に時間を使ったかを、あとで振り返れる。<br />あなたのためのシンプルな時間記録。</p><div className="mt-8 flex min-h-11 flex-col items-center justify-center">{loading && <span className="text-sm text-muted">Googleログインを読み込み中…</span>}<div ref={buttonContainer} /></div>{displayedError && <p className="mt-3 text-sm text-red-600" role="alert">{displayedError}</p>}<p className="mt-6 text-xs text-muted">ログインすると時間記録を始められます。</p></Card></div>;
}
