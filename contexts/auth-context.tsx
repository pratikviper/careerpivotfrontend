"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { clearSession, getToken } from "@/lib/auth-storage"
import { getCurrentUser, loginUser, registerUser } from "@/services/auth.service"
import type { User } from "@/types/api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { email: string; password: string; full_name?: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const next = await getCurrentUser()
    setUser(next)
  }, [])

  useEffect(() => {
    function onUnauthorized() {
      setUser(null)
      const path = window.location.pathname
      if (path !== "/login" && path !== "/register") {
        router.replace("/login?expired=1")
      }
    }
    window.addEventListener("cpc:unauthorized", onUnauthorized)
    return () => window.removeEventListener("cpc:unauthorized", onUnauthorized)
  }, [router])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (!getToken()) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const next = await getCurrentUser()
        if (!cancelled) setUser(next)
      } catch {
        clearSession()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const next = await loginUser(email, password)
    setUser(next)
  }, [])

  const register = useCallback(async (input: { email: string; password: string; full_name?: string }) => {
    await registerUser(input)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
