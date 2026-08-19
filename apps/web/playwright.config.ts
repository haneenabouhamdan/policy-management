import { defineConfig, devices } from "@playwright/test";

const root = "../..";
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT) || 5174;
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT) || 3001;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @policy-management/api start:dev",
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      cwd: root,
      timeout: 120_000,
      env: {
        ...process.env,
        API_PORT: String(apiPort),
        WEB_ORIGIN: `http://127.0.0.1:${webPort}`,
      },
    },
    {
      command: `pnpm --filter @policy-management/web exec vite --host 127.0.0.1 --port ${webPort} --strictPort`,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      cwd: root,
      timeout: 120_000,
      env: {
        ...process.env,
        API_ORIGIN: `http://127.0.0.1:${apiPort}`,
        WEB_PORT: String(webPort),
      },
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /policy-lifecycle|policy-list/,
    },
  ],
});
