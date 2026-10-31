import axios, { AxiosError, type AxiosRequestConfig } from "axios"

import { clearSession, getToken } from "@/lib/auth-storage"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  status: number
  code: string
  details: unknown

  constructor(message: string, status: number, code = "error", details: unknown = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 90000,
  headers: { Accept: "application/json" },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function messageFrom(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return { message: fallback, code: "error", details: null as unknown }
  }
  const body = data as Record<string, unknown>
  if (body.error && typeof body.error === "object") {
    const err = body.error as Record<string, unknown>
    return {
      message: typeof err.message === "string" ? err.message : fallback,
      code: typeof err.code === "string" ? err.code : "error",
      details: err.details ?? null,
    }
  }
  if (Array.isArray(body.detail)) {
    const parts = body.detail.map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        const record = item as { msg: unknown; loc?: unknown }
        const loc = Array.isArray(record.loc) ? record.loc.filter((part) => part !== "body").join(".") : ""
        const msg = String(record.msg)
        return loc ? `${loc}: ${msg}` : msg
      }
      return String(item)
    })
    return { message: parts.filter(Boolean).join(" ") || fallback, code: "validation_error", details: body.detail }
  }
  if (typeof body.detail === "string") {
    return { message: body.detail, code: "error", details: null }
  }
  return { message: fallback, code: "error", details: null }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    const status = error.response?.status ?? 0
    const parsed = messageFrom(error.response?.data, status === 0 ? "Cannot reach the API. Is the backend running?" : "Request failed.")
    const url = error.config?.url ?? ""
    const isAuthAttempt = url.includes("/api/auth/login") || url.includes("/api/auth/register")
    if (status === 401 && !isAuthAttempt && typeof window !== "undefined") {
      clearSession()
      window.dispatchEvent(new CustomEvent("cpc:unauthorized"))
    }
    return Promise.reject(new ApiError(parsed.message, status, parsed.code, parsed.details))
  },
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const response = await api.get<T>(url, config)
  return response.data
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const response = await api.post<T>(url, body, config)
  return response.data
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const response = await api.put<T>(url, body, config)
  return response.data
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  const response = await api.patch<T>(url, body, config)
  return response.data
}

export async function apiDelete(url: string) {
  await api.delete(url)
}
