import { cn } from "@/lib/utils"

function ProgressBar({ value, label }: { value: number | null | undefined; label?: string }) {
  const safe = value == null || Number.isNaN(value) ? null : Math.max(0, Math.min(100, value))
  return (
    <div>
      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe ?? undefined}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safe ?? 0}%` }} />
      </div>
    </div>
  )
}

function LevelMeter({ current, required }: { current: number | null; required: number | null }) {
  return (
    <div className="flex items-center gap-1" aria-label="Proficiency compared with the requirement">
      {Array.from({ length: 5 }, (_, index) => {
        const level = index + 1
        const filled = current != null && level <= current
        const needed = required != null && level <= required
        return (
          <span
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              filled ? "bg-primary" : needed ? "bg-chart-2/80" : "bg-secondary",
            )}
          />
        )
      })}
    </div>
  )
}

export { LevelMeter, ProgressBar }
