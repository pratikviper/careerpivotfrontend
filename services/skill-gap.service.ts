import { apiGet, apiPost } from "@/lib/api"
import type { SkillGapReport, SkillGapSummary } from "@/types/api"

export function listAnalyses() {
  return apiGet<SkillGapSummary[]>("/api/skill-gap")
}

export function getAnalysis(analysisId: number) {
  return apiGet<SkillGapReport>(`/api/skill-gap/${analysisId}`)
}

export function analyzeSkillGap(body: { job_description_ids?: number[]; target_role?: string | null }) {
  return apiPost<SkillGapReport>("/api/skill-gap/analyze", {
    job_description_ids: body.job_description_ids?.length ? body.job_description_ids : null,
    target_role: body.target_role?.trim() || null,
  })
}
