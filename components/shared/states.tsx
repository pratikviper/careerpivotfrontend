import { AlertCircle, Inbox } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-md bg-secondary" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-secondary" />
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-8">
      <Inbox className="size-5 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card px-5 py-6" role="alert">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-4" />
        <p className="font-medium">Could not load this section</p>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
