import { defineConfig } from "vitest/config";

// Unit tests use a standalone Vite config so the Cloudflare dev server
// inspector is not started during tests. Worker integration tests can use
// @cloudflare/vitest-pool-workers when they are added.
export default defineConfig({
  test: {
    environment: "node",
  },
});
