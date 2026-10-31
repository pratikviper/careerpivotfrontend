# Career Pivot Coach

Frontend for the Career Pivot Coach hackathon product. It is a Next.js app that talks to the FastAPI backend in `../pivot-career-backend`.

A signed-in user can register, upload a resume, set a target role, analyze skill gaps against saved job descriptions, generate and adjust a learning plan, practice a text mock interview, track applications, and review progress.

## Setup

1. Start the backend on port 8000. CORS already allows `http://localhost:3000`.
2. Copy the environment file and install dependencies:

```bash
cp .env.example .env.local
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Product flow

1. Create an account. Registration returns a user, then the sign-in page issues the bearer token.
2. Upload a PDF resume on **My Profile**, correct the extracted fields, and save. Saving confirms the skill list.
3. Add a job description on **Skill Gap Analysis** and run an analysis.
4. Generate a learning plan. Later generations and adjustments are proposals. The active plan changes only after you apply one.
5. Start a mock interview. Each answer is submitted, then evaluated, before the next question. The report uses the scores the API returns.
6. Track applications in a table or board. Response-rate analytics stay hidden until the API says there is enough history (10 applications).
7. Review consistency, assessments, and a proposed plan adjustment on **Progress**.

## API notes

The client matches the backend schemas in `pivot-career-backend`. A few product details follow that API rather than a generic example:

- Login returns `{ access_token, token_type, expires_in }`. The token is stored in `localStorage` and sent as `Authorization: Bearer`.
- A 401 on a protected call clears the session and returns you to sign-in.
- Resume upload is `multipart/form-data` with the field name `file`. The UI shows upload progress, then waits while the backend extracts the PDF.
- Skill-gap analysis requires at least one saved job description with skills.
- Learning-plan adjustments use `POST /api/plans/{id}/adjust`, then `accept` or `reject`. The original plan is kept until you apply the proposal.
- Interviews do not take a single difficulty. You choose technical, behavioral, or mixed. Each question has its own difficulty.
- Application posting URLs are stored in notes as `Posting: <url>` because the applications API has no URL field.
- Scores, match percentages, and rates are rendered only when the API sends them. Empty sections say so.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Radix primitives styled as the shared UI kit, Lucide, Recharts, React Hook Form, Zod, and Axios.
