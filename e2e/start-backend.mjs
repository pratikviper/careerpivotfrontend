// Starts the FastAPI backend for the Playwright smoke test: fresh SQLite database, migrations, no AI provider.
import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const backend = path.resolve(here, "..", "..", "pivot-career-backend")
const port = process.env.E2E_API_PORT || "8100"

const candidates = [
  process.env.E2E_PYTHON,
  path.join(backend, ".venv", "Scripts", "python.exe"),
  path.join(backend, ".venv", "bin", "python"),
  "python",
  "python3",
].filter(Boolean)
const python = candidates.find((c) => !c.includes(path.sep) || existsSync(c))
if (!python) {
  console.error("No Python found. Create pivot-career-backend/.venv or set E2E_PYTHON.")
  process.exit(1)
}

const dbFile = path.join(tmpdir(), `pivot-e2e-${process.pid}.db`).replaceAll("\\", "/")
const env = {
  ...process.env,
  DATABASE_URL: `sqlite+aiosqlite:///${dbFile}`,
  LLM_PROVIDER: "none",
  RATE_LIMIT_ENABLED: "false",
  JWT_SECRET_KEY: "e2e-secret-key-that-is-long-enough-for-hs256-signing",
  JSEARCH_API_KEY: "",
  ADZUNA_APP_ID: "",
  ADZUNA_APP_KEY: "",
}

const migrate = spawnSync(python, ["-m", "alembic", "upgrade", "head"], { cwd: backend, env, stdio: "inherit" })
if (migrate.status !== 0) process.exit(migrate.status ?? 1)

// `npm run demo:screenshots` wants the seeded demo user (fictional data, throwaway database).
if (process.env.E2E_SEED_DEMO) {
  const seed = spawnSync(python, ["-m", "scripts.seed_demo", "--reset"], { cwd: backend, env, stdio: "inherit" })
  if (seed.status !== 0) process.exit(seed.status ?? 1)
}

const server = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", port], {
  cwd: backend,
  env,
  stdio: "inherit",
})
const stop = () => server.kill()
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
process.on("exit", stop)
server.on("exit", (code) => process.exit(code ?? 0))
