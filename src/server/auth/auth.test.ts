import { describe, expect, it } from "vitest";
import { getAuthBaseUrl } from "./auth";

describe("Better Auth base URL", () => {
  it("ローカルでは同じポートのloopback hostを許可する", () => {
    expect(getAuthBaseUrl("http://localhost:5173")).toEqual({
      allowedHosts: ["localhost:5173", "127.0.0.1:5173", "[::1]:5173"],
      fallback: "http://localhost:5173",
      protocol: "http",
    });
  });

  it("本番では設定済みhostだけを許可する", () => {
    expect(getAuthBaseUrl("https://example.com")).toEqual({
      allowedHosts: ["example.com"],
      fallback: "https://example.com",
      protocol: "https",
    });
  });
});
