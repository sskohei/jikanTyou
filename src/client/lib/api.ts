export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    credentials: "include",
  });
  const body = (await response.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string } };
  if (!response.ok || !body.data && body.error) {
    throw new ApiError(response.status, body.error?.code ?? "REQUEST_FAILED", body.error?.message ?? "通信に失敗しました。");
  }
  return body.data as T;
}

export function jsonBody(value: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(value) };
}

export function formatSeconds(value: number | null | undefined): string {
  const seconds = Math.max(0, Math.floor(value ?? 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours) return `${hours}時間${String(minutes).padStart(2, "0")}分`;
  if (minutes) return `${minutes}分${rest ? `${String(rest).padStart(2, "0")}秒` : ""}`;
  return `${rest}秒`;
}

export function formatClock(value: number | null | undefined): string {
  const seconds = Math.max(0, Math.floor(value ?? 0));
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((part) => String(part).padStart(2, "0")).join(":");
}
