import { apiDelete, apiGet, apiPost } from "@/lib/api"
import type { Job, JobCreate, JobSummary } from "@/types/api"

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
