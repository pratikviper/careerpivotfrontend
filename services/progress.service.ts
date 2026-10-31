import { apiGet, apiPost } from "@/lib/api"
import type { Assessment, ProgressOverview, RecalculateResult } from "@/types/api"

export function getProgress(includeAiInsights = false) {
  return apiGet<ProgressOverview>("/api/progress", {
    params: { include_ai_insights: includeAiInsights },
  })
}

export function listAssessments() {
  return apiGet<Assessment[]>("/api/progress/assessments")
}

export function createAssessment(body: { skill_name: string; proficiency: number; method?: "self" | "quiz" | "mentor"; notes?: string | null }) {
  return apiPost<Assessment>("/api/progress/assessments", {
    skill_name: body.skill_name,
    proficiency: body.proficiency,
    method: body.method ?? "self",
    notes: body.notes ?? null,
  })
}

export function recalculatePlan(body?: { reason?: string; weekly_hours?: number | null }) {
  return apiPost<RecalculateResult>("/api/progress/recalculate-plan", {
    reason: body?.reason ?? "Adjusting plan based on recent progress",
    weekly_hours: body?.weekly_hours ?? null,
  })
}
