"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAuth } from "@/contexts/auth-context"

export function HomeRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(user ? "/dashboard" : "/login")
  }, [loading, user, router])

  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Opening Career Pivot…</div>
}
