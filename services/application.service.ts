import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import type { Application, ApplicationAnalytics, ApplicationInput, ApplicationStatus, Recommendations } from "@/types/api"

export function listApplications(status?: ApplicationStatus) {
  return apiGet<Application[]>("/api/applications", { params: status ? { status } : undefined })
}

export function getApplication(applicationId: number) {
  return apiGet<Application>(`/api/applications/${applicationId}`)
}

export function createApplication(body: ApplicationInput) {
  return apiPost<Application>("/api/applications", body)
}

export function updateApplication(applicationId: number, body: Partial<ApplicationInput> & {
  reached_interview?: boolean
  interview_feedback?: string | null
  outcome?: string | null
  outcome_date?: string | null
}) {
  return apiPatch<Application>(`/api/applications/${applicationId}`, body)
}

export function deleteApplication(applicationId: number) {
  return apiDelete(`/api/applications/${applicationId}`)
}

export function getApplicationAnalytics(includeAiSummary = false) {
  return apiGet<ApplicationAnalytics>("/api/applications/analytics", {
    params: { include_ai_summary: includeAiSummary },
  })
}

/** 3-5 plain-English insights on which kinds of roles respond, each labelled reliable or early signal. */
export function getRecommendations() {
  return apiGet<Recommendations>("/api/applications/recommendations")
}
