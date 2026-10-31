"use client"

import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { errorMessage } from "@/lib/api"
import { acceptPlan, rejectPlan } from "@/services/learning.service"
import type { Plan } from "@/types/api"

export function ProposalReview({
  plan,
  note,
  onResolved,
}: {
  plan: Plan
  note?: string | null
  onResolved: (next: Plan | null) => void
}) {
  const change = plan.change_summary ?? {}
  const added = change.added_skills ?? []
  const removed = change.removed_skills ?? []
  const hours = change.hours_changes ?? {}

  async function accept() {
    try {
      const next = await acceptPlan(plan.id)
      toast.success("Proposed plan is now active.")
      onResolved(next)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function reject() {
    try {
      await rejectPlan(plan.id)
      toast.success("Kept your current plan.")
      onResolved(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Card className="border-chart-2/60">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{plan.title}</CardTitle>
          <Badge variant="warning">Proposed · not applied</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{note || plan.adjustment_reason || plan.summary || "Review these changes before replacing your active plan."}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Weeks</dt>
            <dd>{change.weeks_before ?? "—"} → {change.weeks_after ?? plan.total_weeks}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed tasks carried over</dt>
            <dd>{change.completed_tasks_carried_over ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Weekly hours</dt>
            <dd>{plan.weekly_hours}</dd>
          </div>
        </dl>
        {added.length > 0 ? <p className="text-sm"><span className="font-medium">Added skills: </span>{added.join(", ")}</p> : null}
        {removed.length > 0 ? <p className="text-sm"><span className="font-medium">Removed skills: </span>{removed.join(", ")}</p> : null}
        {Object.keys(hours).length > 0 ? (
          <ul className="text-sm text-muted-foreground">
            {Object.entries(hours).map(([skill, value]) => (
              <li key={skill}>{skill}: {value.before}h → {value.after}h</li>
            ))}
          </ul>
        ) : null}
        <div className="space-y-2">
          {plan.weeks.map((week) => (
            <p key={week.week_number} className="text-sm">
              <span className="font-medium">Week {week.week_number}: </span>
              {week.skills.join(", ") || "No skills listed"} · {week.total_hours}h
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void accept()}>Apply this plan</Button>
          <Button type="button" variant="outline" onClick={() => void reject()}>Keep current plan</Button>
        </div>
      </CardContent>
    </Card>
  )
}
