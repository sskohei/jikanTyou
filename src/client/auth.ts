import { createAuthClient } from "better-auth/react";
import { oneTapClient } from "better-auth/client/plugins";

const authClientOptions = {
  baseURL: `${window.location.origin}/api/auth`,
  fetchOptions: { credentials: "include" },
} as const;

export const authClient = createAuthClient(authClientOptions);

export function createGoogleAuthClient(clientId: string) {
  return createAuthClient({
    ...authClientOptions,
    plugins: [oneTapClient({ clientId, promptOptions: { fedCM: false } })],
  });
}
