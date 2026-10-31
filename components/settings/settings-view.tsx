"use client"

import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { PageHeader } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { API_URL } from "@/lib/api"
import { formatDate } from "@/lib/format"

export function SettingsView() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account, appearance, and the API this app is talking to." />
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name: </span>{user?.full_name || "Not set"}</p>
          <p><span className="text-muted-foreground">Email: </span>{user?.email}</p>
          <p><span className="text-muted-foreground">Member since: </span>{formatDate(user?.created_at)}</p>
          <Button
            variant="outline"
            onClick={() => {
              logout()
              router.replace("/login")
            }}
          >
            Log out
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(["light", "dark", "system"] as const).map((value) => (
            <Button key={value} variant={mounted && theme === value ? "default" : "outline"} onClick={() => setTheme(value)}>
              {value === "light" ? "Light" : value === "dark" ? "Dark" : "System"}
            </Button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>API</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Base URL: </span>{API_URL}</p>
          <p className="text-muted-foreground">Set NEXT_PUBLIC_API_URL if the backend is not on this address. Career details are edited on My Profile.</p>
          <Button variant="outline" onClick={() => router.push("/profile")}>Edit profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
