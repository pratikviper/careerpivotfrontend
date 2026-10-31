import path from "node:path"

import { expect, test } from "@playwright/test"

/**
 * Captures the demo's key screens into ../docs/demo-screenshots (the offline fallback in DEMO.md).
 * Runs only through `npm run demo:screenshots`, which seeds the demo user first.
 */
test.skip(!process.env.DEMO_SHOTS, "run with: npm run demo:screenshots")

const OUT = path.resolve(__dirname, "..", "..", "docs", "demo-screenshots")
const shot = (page: import("@playwright/test").Page, name: string) =>
  page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })

test("capture the demo walkthrough", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 860 })
  await page.goto("/login")
  await page.getByLabel("Email").fill("demo@careercoach.example")
  await page.getByLabel("Password", { exact: true }).fill("DemoPass123")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText("What your applications are telling you")).toBeVisible()
  await shot(page, "01-dashboard-start")

  await page.goto("/skill-gap")
  await expect(page.getByText(/Based on 20 job postings/)).toBeVisible()
  await shot(page, "02-skill-gap-map")

  await page.goto("/learning-plan")
  await expect(page.getByText("Week 1").first()).toBeVisible()
  await shot(page, "03-learning-plan")

  await page.goto("/interviews")
  await expect(page.getByText("How your answers are scored")).toBeVisible()
  await shot(page, "04-interview-rubric")
  await page.getByLabel("Interview type").selectOption("technical")
  await page.getByLabel("Number of questions").selectOption("1")
  await page.getByRole("button", { name: "Start interview" }).click()
  await page.getByLabel("Your answer").fill("I am not sure. I would probably search for it and try things until it works.")
  await page.getByRole("button", { name: "Submit answer" }).click()
  await expect(page.getByText(/This answer ·/)).toBeVisible()
  await shot(page, "05-interview-scored-with-evidence")

  await page.goto("/dashboard")
  await expect(page.getByText(/pending automatic adjustment/i)).toBeVisible()
  await shot(page, "06-dashboard-plan-adjusts")

  await page.goto("/learning-plan")
  await expect(page.getByText("Why this was proposed")).toBeVisible()
  await shot(page, "07-plan-proposal-with-reasons")

  await page.goto("/applications")
  await expect(page.getByText("What your applications are telling you")).toBeVisible()
  await shot(page, "08-tracker-insights")
})
