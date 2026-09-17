import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { oneTap } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";
import * as authSchema from "../db/auth-schema";

export function getAuthBaseUrl(configuredValue: string) {
  const configuredUrl = new URL(configuredValue);
  const configuredHost = configuredUrl.host;
  const localHost = ["localhost", "127.0.0.1", "[::1]"].map((host) => `${host}${configuredUrl.port ? `:${configuredUrl.port}` : ""}`);
  const allowedHosts = configuredUrl.hostname === "localhost" || configuredUrl.hostname === "127.0.0.1" || configuredUrl.hostname === "::1"
    ? [...new Set([configuredHost, ...localHost])]
    : [configuredHost];

  return {
    allowedHosts,
    fallback: configuredValue,
    protocol: configuredUrl.protocol === "http:" ? "http" as const : "https" as const,
  };
}

export function createAuth(env: Env) {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: authSchema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: getAuthBaseUrl(env.BETTER_AUTH_URL),
    trustedOrigins: [env.BETTER_AUTH_URL],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [oneTap()],
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      database: { generateId: "uuid" },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
