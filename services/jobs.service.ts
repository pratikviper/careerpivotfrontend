import { apiDelete, apiGet, apiPost } from "@/lib/api"
import type { Job, JobCreate, JobSummary, MarketImportResult } from "@/types/api"

export function listJobs() {
  return apiGet<JobSummary[]>("/api/jobs")
}

export function getJob(jobId: number) {
  return apiGet<Job>(`/api/jobs/${jobId}`)
}

export function createJob(body: JobCreate) {
  return apiPost<Job>("/api/jobs", body)
}

export function deleteJob(jobId: number) {
  return apiDelete(`/api/jobs/${jobId}`)
}

/** Import postings for the target role: live job board -> cache -> built-in sample postings. */
export function importMarketJobs(body?: { target_role?: string | null; limit?: number; refresh?: boolean; source?: "auto" | "seed" }) {
  return apiPost<MarketImportResult>("/api/jobs/import-market", {
    target_role: body?.target_role || null,
    limit: body?.limit ?? 20,
    refresh: body?.refresh ?? false,
    source: body?.source ?? "auto",
  })
}
