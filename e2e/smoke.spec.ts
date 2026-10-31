import path from "node:path"

import { expect, test } from "@playwright/test"

/**
 * Smoke test for the main flow, against a real backend (no AI key, so every AI step uses its rule-based fallback):
 * register -> resume -> gap map from 20 postings -> learning plan -> bad interview answer -> the plan adapts by itself
 * -> the dashboard shows the proposal -> application tracker.
 */
test("career pivot journey: intake, gap map, plan, interview, adaptive plan, tracker", async ({ page }) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  const email = `e2e-${Date.now()}@example.com`
  const password = "Passw0rd!x"

  // --- account ---
  await page.goto("/register")
  await page.getByLabel("Full name").fill("Maya E2E")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByLabel("Confirm password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByText("Account created. Sign in to continue.")).toBeVisible()
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // --- 1. resume and target role ---
  await page.goto("/profile")
  await page.getByLabel("Upload resume").setInputFiles(path.join(__dirname, "fixtures", "maya-resume.pdf"))
  await expect(page.getByText("Resume extracted")).toBeVisible()
  await page.getByLabel("Target role").fill("Data Analyst")
  await page.getByLabel("Experience level").selectOption("junior")
  await page.getByLabel("Weekly study hours").fill("8")
  await page.getByRole("button", { name: "Save profile" }).click()
  await expect(page.getByText("Profile saved")).toBeVisible()

  // --- 2. skill-gap map from many postings ---
  await page.goto("/skill-gap")
  await page.getByRole("button", { name: "Import postings for my role" }).first().click()
  await expect(page.getByText(/Imported 20 postings/)).toBeVisible()
  await page.getByRole("button", { name: "Run analysis" }).click()
  await expect(page.getByText(/Based on 20 job postings/)).toBeVisible()
  await expect(page.getByText(/Match score/)).toBeVisible()

  // --- 3. week-by-week plan with curated resources ---
  await page.goto("/learning-plan")
  await page.getByRole("button", { name: "Generate learning plan" }).first().click()
  await expect(page.getByText("Week 1").first()).toBeVisible()

  // --- 4. portfolio projects matched to the gaps ---
  await page.goto("/projects")
  await page.getByRole("button", { name: "Recommend projects" }).first().click()
  await expect(page.getByText(/Closes \d+ of your gaps/).first()).toBeVisible()

  // --- 5. mock interview: a weak answer is scored against the visible rubric ---
  await page.goto("/interviews")
  await expect(page.getByText("How your answers are scored")).toBeVisible()
  await page.getByLabel("Interview type").selectOption("technical")
  await page.getByLabel("Number of questions").selectOption("1")
  await page.getByRole("button", { name: "Start interview" }).click()
  await page.getByLabel("Your answer").fill("I am not sure, I think you just try things until it works.")
  await page.getByRole("button", { name: "Submit answer" }).click()
  await expect(page.getByText(/This answer ·/)).toBeVisible()
  await expect(page.getByText(/Level \d/).first()).toBeVisible()

  // --- 6. the plan adapted without being asked: dashboard shows the proposal and why ---
  await page.goto("/dashboard")
  await expect(page.getByText(/pending automatic adjustment/i)).toBeVisible()
  await expect(page.getByText(/mock-interview score/).first()).toBeVisible()
  await page.goto("/learning-plan")
  await expect(page.getByText("Why this was proposed")).toBeVisible()
  await expect(page.getByRole("button", { name: "Apply this plan" })).toBeVisible()

  // --- 7. application tracker with the role attributes it learns from ---
  await page.goto("/applications")
  await page.getByRole("button", { name: "Add application" }).first().click()
  await page.getByLabel("Company", { exact: true }).fill("Smoke Test Co")
  await page.getByLabel("Job title", { exact: true }).fill("Data Analyst")
  await page.getByLabel("How did you apply?").selectOption("referral")
  await page.getByRole("button", { name: "Save application" }).click()
  await expect(page.getByText("Application added")).toBeVisible()
  await expect(page.getByRole("cell", { name: "Smoke Test Co" })).toBeVisible()

  expect(pageErrors, `uncaught page errors: ${pageErrors.join(" | ")}`).toEqual([])
})
