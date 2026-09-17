const oauthErrorMessages: Record<string, string> = {
  access_denied: "Googleログインがキャンセルされました。",
  state_not_found: "ログイン状態を確認できませんでした。URLのホスト名を変えずに、もう一度お試しください。",
  invalid_code: "Googleログインの有効期限が切れました。もう一度お試しください。",
  unable_to_get_user_info: "Googleアカウントの情報を取得できませんでした。もう一度お試しください。",
  email_not_found: "Googleアカウントのメールアドレスを取得できませんでした。",
};

export function oauthErrorMessage(search: string) {
  const code = new URLSearchParams(search).get("error");
  if (!code) return "";
  return oauthErrorMessages[code] ?? "Googleログインを完了できませんでした。もう一度お試しください。";
}

export function hasOAuthError(search: string) {
  return new URLSearchParams(search).has("error");
}
