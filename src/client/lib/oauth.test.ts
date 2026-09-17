import { describe, expect, it } from "vitest";
import { hasOAuthError, oauthErrorMessage } from "./oauth";

describe("OAuthエラー表示", () => {
  it("state cookieを失った場合に再試行方法を表示する", () => {
    expect(oauthErrorMessage("?error=state_not_found")).toContain("ホスト名を変えずに");
  });

  it("未知のエラーコードには安全な共通メッセージを表示する", () => {
    expect(oauthErrorMessage("?error=unexpected&error_description=secret")).toBe(
      "Googleログインを完了できませんでした。もう一度お試しください。",
    );
  });

  it("OAuthエラーの有無を判定する", () => {
    expect(hasOAuthError("?error=access_denied")).toBe(true);
    expect(hasOAuthError("?date=2026-09-18")).toBe(false);
  });
});
