import { defineConfig, devices } from "@playwright/test"

// The smoke test starts its OWN backend and frontend on spare ports with a throwaway database, so it never touches
// a dev server or dev data you may have running on :8000 / :3000.
const API_PORT = 8100
const WEB_PORT = 3100

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    // "localhost", not 127.0.0.1: the Next dev server only serves its dev assets to its own origin.
    baseURL: `http://localhost:${WEB_PORT}`,
    actionTimeout: 30_000, // the first visit to each page compiles it in dev mode
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/start-backend.mjs",
      url: `http://127.0.0.1:${API_PORT}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { E2E_API_PORT: String(API_PORT), E2E_SEED_DEMO: process.env.DEMO_SHOTS ? "1" : "" },
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
      // A separate build directory lets this run next to your own `npm run dev` (Next allows one dev server per directory).
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`, NEXT_DIST_DIR: ".next-e2e" },
    },
  ],
})
