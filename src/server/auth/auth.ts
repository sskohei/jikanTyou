import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";
import * as authSchema from "../db/auth-schema";

export function createAuth(env: Env) {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: authSchema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
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
