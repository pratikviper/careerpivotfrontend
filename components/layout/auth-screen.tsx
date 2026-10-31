import { Compass } from "lucide-react"

import { Logo } from "@/components/layout/logo"

const POINTS = [
  "See the skills a target role actually asks for.",
  "Follow a weekly plan sized to the hours you have.",
  "Practice interviews and track every application.",
]

export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary px-12 py-10 text-primary-foreground lg:flex">
        <Logo className="text-primary-foreground [&_span:last-child]:text-primary-foreground/70" />
        <div className="max-w-md">
          <Compass className="mb-6 size-8" />
          <h1 className="text-4xl font-semibold tracking-tight">Change roles with a plan, not a guess.</h1>
          <p className="mt-4 text-base text-primary-foreground/80">
            Career Pivot Coach turns your resume and a target job into a skill gap, a learning plan, and interview practice.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/85">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-chart-2" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">Built for people mid-pivot.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
