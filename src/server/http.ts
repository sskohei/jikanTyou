import type { Context } from "hono";

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ data }, status);
}

export function fail(c: Context, status: 400 | 401 | 403 | 404 | 409 | 500, code: string, message: string) {
  return c.json({ error: { code, message } }, status);
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
