import { apiPost, apiGet } from "@/lib/api"
import { setSession } from "@/lib/auth-storage"
import type { TokenResponse, User } from "@/types/api"

export async function registerUser(input: { email: string; password: string; full_name?: string }) {
  return apiPost<User>("/api/auth/register", {
    email: input.email,
    password: input.password,
    full_name: input.full_name?.trim() || null,
  })
}

export async function loginUser(email: string, password: string) {
  const token = await apiPost<TokenResponse>("/api/auth/login", { email, password })
  setSession(token.access_token, token.expires_in)
  return getCurrentUser()
}

export function getCurrentUser() {
  return apiGet<User>("/api/auth/me")
}
