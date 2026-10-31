// `npm run demo:screenshots`: seed the demo user into a throwaway database and capture the walkthrough screens.
import { spawnSync } from "node:child_process"

const result = spawnSync("npx", ["playwright", "test", "e2e/demo-screenshots.spec.ts"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DEMO_SHOTS: "1" },
})
process.exit(result.status ?? 1)
