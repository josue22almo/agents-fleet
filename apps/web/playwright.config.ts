import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
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
      command: isCI
        ? "pnpm run build --filter=api && node scripts/patch-exports-for-node.js && NODE_ENV=e2e node apps/api/dist/main.js"
        : "NODE_ENV=e2e pnpm --filter api run dev",
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
