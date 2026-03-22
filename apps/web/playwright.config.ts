import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command:
        "pnpm run build --filter=api && NODE_ENV=e2e node apps/api/dist/main.js",
      port: 4000,
      reuseExistingServer: true,
      cwd: "../..",
    },
    {
      command: "pnpm --filter web run dev",
      port: 3000,
      reuseExistingServer: true,
      cwd: "../..",
    },
  ],
});
