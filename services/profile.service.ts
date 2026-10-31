import { api, apiGet, apiPut } from "@/lib/api"
import type { Profile, ProfileUpdate, Resume } from "@/types/api"

export function getProfile() {
  return apiGet<Profile>("/api/profile")
}

export function updateProfile(body: ProfileUpdate) {
  return apiPut<Profile>("/api/profile", body)
}

export async function uploadResume(file: File, onProgress?: (percent: number) => void) {
  const body = new FormData()
  body.append("file", file)
  const response = await api.post<Resume>("/api/profile/resume", body, {
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    },
  })
  return response.data
}

export function getResume(resumeId: number) {
  return apiGet<Resume>(`/api/profile/resumes/${resumeId}`)
}
