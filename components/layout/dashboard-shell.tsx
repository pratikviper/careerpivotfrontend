"use client"

import {
  BookOpen,
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  TrendingUp,
  UserRound,
  Waypoints,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { displayName, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserRound },
  { href: "/skill-gap", label: "Skill Gap Analysis", icon: Waypoints },
  { href: "/learning-plan", label: "Learning Plan", icon: BookOpen },
  { href: "/projects", label: "Portfolio Projects", icon: FolderKanban },
  { href: "/interviews", label: "Mock Interview", icon: MessagesSquare },
  { href: "/applications", label: "Application Tracker", icon: Briefcase },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserBlock() {
  const { user, logout } = useAuth()
  const router = useRouter()
  if (!user) return null
  const name = displayName(user.full_name, user.email)
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Log out"
          onClick={() => {
            logout()
            router.replace("/login")
          }}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your workspace…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
        <div className="px-4 py-5">
          <Logo />
        </div>
        <NavLinks />
        <UserBlock />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X />
              </Button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserBlock />
          </aside>
        </div>
      ) : null}

      <div className="md:pl-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu />
          </Button>
          <Logo />
        </div>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
