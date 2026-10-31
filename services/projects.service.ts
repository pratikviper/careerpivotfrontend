import { apiGet, apiPatch, apiPost } from "@/lib/api"
import type { Project, ProjectStatus } from "@/types/api"

export function listProjects(status?: ProjectStatus) {
  return apiGet<Project[]>("/api/projects", { params: status ? { status } : undefined })
}

export function getProject(projectId: number) {
  return apiGet<Project>(`/api/projects/${projectId}`)
}

export function recommendProjects(body?: { analysis_id?: number | null; count?: number }) {
  return apiPost<Project[]>("/api/projects/recommend", {
    analysis_id: body?.analysis_id ?? null,
    count: body?.count ?? 3,
  })
}

export function updateProject(projectId: number, body: { status?: ProjectStatus; notes?: string | null; repo_url?: string | null }) {
  return apiPatch<Project>(`/api/projects/${projectId}`, body)
}
