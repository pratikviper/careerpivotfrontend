# Career Pivot Coach

Frontend for the Career Pivot Coach hackathon product. It is a Next.js app that talks to the FastAPI backend in `../pivot-career-backend`.

A signed-in user can register, upload a resume, set a target role, analyze skill gaps against saved job descriptions, generate and adjust a learning plan, practice a text mock interview, track applications, and review progress.

## Setup

1. Start the backend on port 8000.
2. Install dependencies and start the app:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

The browser calls this app’s `/api` routes. Next.js forwards them to `API_PROXY_TARGET`, which defaults to `http://127.0.0.1:8000`. Set `NEXT_PUBLIC_API_URL` only when the browser should call the API host directly; that host must list this site in `CORS_ORIGINS`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright smoke test of the main flow (see below)

For the whole demo from a fresh clone (backend, seed data, this app) run `../demo.sh` or `..\demo.ps1`; the script is in `../DEMO.md`.

## Product flow

1. Create an account. Registration returns a user, then the sign-in page issues the bearer token.
2. Upload a PDF or Word (.docx) resume on **My Profile**, correct the extracted fields, and save. Saving confirms the skill list.
3. On **Skill Gap Analysis**, import postings for your target role (or paste your own) and run an analysis. The report says how many postings it is based on.
4. Generate a learning plan; each task lists curated free resources. Later generations and adjustments are proposals. The active plan changes only after you apply one.
5. Start a mock interview. Each answer is submitted, then evaluated, before the next question. Scores come with the rubric level, what that level means, and the quote from your answer behind it.
6. The plan adapts on its own: a weak answer, a self-assessment, or a skipped / hard task can create a proposal with the reasons written out. It appears on the dashboard and on **Learning Plan**, and nothing changes until you apply it.
7. Track applications in a table or board, with the channel, company size, industry and resume version. The tracker shows insights labelled "Reliable" or "Early signal" once there is enough history (10 counted applications).
8. Review consistency, assessments, and a proposed plan adjustment on **Progress**.

## API notes

The client matches the backend schemas in `pivot-career-backend`. A few product details follow that API rather than a generic example:

- Login returns `{ access_token, token_type, expires_in }`. The token is stored in `localStorage` and sent as `Authorization: Bearer`.
- A 401 on a protected call clears the session and returns you to sign-in.
- Resume upload is `multipart/form-data` with the field name `file`. The UI shows upload progress, then waits while the backend extracts the text.
- Skill-gap analysis requires at least one saved job description with skills. When every saved posting is selected the page sends no ids, so the API uses the postings that match the target role.
- `POST /api/jobs/import-market` fills in postings for the target role: a live job board if the backend has a key, otherwise 20 built-in synthetic samples (the UI says so).
- Learning-plan adjustments use `POST /api/plans/{id}/adjust`, then `accept` or `reject`. The original plan is kept until you apply the proposal.
- Interviews do not take a single difficulty. You choose technical, behavioral, or mixed. Each question has its own difficulty.
- Application posting URLs have their own field (`posting_url`). Older applications that stored the link in the notes are migrated by the backend.
- Scores, match percentages, and rates are rendered only when the API sends them. Empty sections say so.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Radix primitives styled as the shared UI kit, Lucide, Recharts, React Hook Form, Zod, and Axios.

## Browser smoke test

`npm run test:e2e` runs one Playwright test (Chromium) through the real stack: register, resume upload, import 20 postings and run the
skill-gap analysis, generate a plan, recommend projects, answer an interview question badly, see the plan-adjustment proposal on the
dashboard with its reasons, and add an application. It starts its own backend (`:8100`, a throwaway SQLite database, no AI key) and its
own Next dev server (`:3100`, build folder `.next-e2e`), so it can run next to your normal `npm run dev`. First time only:
`npx playwright install chromium`. It needs `../pivot-career-backend/.venv` (or set `E2E_PYTHON`).
