import { apiGet, apiPatch, apiPost } from "@/lib/api"
import type { Plan, PlanStatus, PlanSummary, TaskUpdate, WeeklyTask } from "@/types/api"

export function listPlans(status?: PlanStatus) {
  return apiGet<PlanSummary[]>("/api/plans", { params: status ? { status } : undefined })
}

export function getPlan(planId: number) {
  return apiGet<Plan>(`/api/plans/${planId}`)
}

export function generatePlan(body?: { analysis_id?: number | null; weekly_hours?: number | null; max_weeks?: number }) {
  return apiPost<Plan>("/api/plans/generate", {
    analysis_id: body?.analysis_id ?? null,
    weekly_hours: body?.weekly_hours ?? null,
    max_weeks: body?.max_weeks ?? 8,
  })
}

export function updateTask(planId: number, taskId: number, body: TaskUpdate) {
  return apiPatch<WeeklyTask>(`/api/plans/${planId}/tasks/${taskId}`, body)
}

export function adjustPlan(
  planId: number,
  body: { reason: string; weekly_hours?: number | null; max_weeks?: number | null; focus_skills?: string[]; struggling_skills?: string[] },
) {
  return apiPost<Plan>(`/api/plans/${planId}/adjust`, {
    reason: body.reason,
    weekly_hours: body.weekly_hours ?? null,
    max_weeks: body.max_weeks ?? null,
    focus_skills: body.focus_skills ?? [],
    struggling_skills: body.struggling_skills ?? [],
  })
}

export function acceptPlan(planId: number) {
  return apiPost<Plan>(`/api/plans/${planId}/accept`)
}

export function rejectPlan(planId: number) {
  return apiPost<Plan>(`/api/plans/${planId}/reject`)
}
