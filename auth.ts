import { betterAuth } from "better-auth";

// The CLI uses this config only to discover Better Auth plugins/options when
// generating the official D1 schema. Runtime auth is created in
// src/server/auth/auth.ts with the request's Cloudflare D1 binding.
export const auth = betterAuth({
  socialProviders: {
    google: { clientId: "schema-generation", clientSecret: "schema-generation" },
  },
});
