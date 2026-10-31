import { Compass } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Compass className="size-4" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Career Pivot</span>
          <span className="block text-xs text-muted-foreground">Coach</span>
        </span>
      )}
    </Link>
  )
}
