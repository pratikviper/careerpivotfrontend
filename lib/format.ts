export function greeting(name: string) {
  const hour = new Date().getHours()
  const part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  return `${part}, ${name}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
  return letters || "?"
}

export function displayName(fullName: string | null | undefined, email: string) {
  const trimmed = fullName?.trim()
  if (trimmed) return trimmed
  return email.split("@")[0] || "there"
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatPercent(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value.toFixed(digits)}%`
}

/** API rates are fractions (0.25 = 25%). */
export function formatRate(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${Math.round(value * 100)}%`
}

export function todayInputValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export const PROFICIENCY_LABELS: Record<number, string> = {
  1: "Aware",
  2: "Familiar",
  3: "Working",
  4: "Strong",
  5: "Expert",
}

export function proficiencyLabel(level: number | null | undefined) {
  if (level == null) return "Not scored"
  return PROFICIENCY_LABELS[level] ?? String(level)
}
