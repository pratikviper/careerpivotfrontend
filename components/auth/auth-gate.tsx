"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { AuthScreen } from "@/components/layout/auth-screen"
import { useAuth } from "@/contexts/auth-context"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [loading, user, router])

  if (loading || user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  return <AuthScreen>{children}</AuthScreen>
}
