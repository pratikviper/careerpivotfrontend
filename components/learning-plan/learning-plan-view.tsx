"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ProposalReview } from "@/components/learning-plan/proposal-review"
import { ChipInput } from "@/components/shared/chip-input"
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { ProgressBar } from "@/components/ui/progress"
import { errorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { adjustPlan, generatePlan, getPlan, listPlans, updateTask } from "@/services/learning.service"
import type { Plan, TaskStatus, WeeklyTask } from "@/types/api"

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
}

function weekPercent(tasks: WeeklyTask[]) {
  if (tasks.length === 0) return 0
  return Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100)
}

export function LearningPlanView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [active, setActive] = useState<Plan | null>(null)
  const [proposed, setProposed] = useState<Plan[]>([])
  const [busy, setBusy] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [hours, setHours] = useState("")
  const [focus, setFocus] = useState<string[]>([])
  const [struggling, setStruggling] = useState<string[]>([])
  const [selected, setSelected] = useState<WeeklyTask | null>(null)
  const [notes, setNotes] = useState("")
  const [rating, setRating] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const summaries = await listPlans()
      const activeSummary = summaries.find((plan) => plan.status === "active")
      const proposedSummaries = summaries.filter((plan) => plan.status === "proposed")
      const [activePlan, proposedPlans] = await Promise.all([
        activeSummary ? getPlan(activeSummary.id) : Promise.resolve(null),
        Promise.all(proposedSummaries.map((plan) => getPlan(plan.id))),
      ])
      setActive(activePlan)
      setProposed(proposedPlans)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function replaceTask(task: WeeklyTask) {
    setActive((current) => {
      if (!current) return current
      return {
        ...current,
        weeks: current.weeks.map((week) => ({
          ...week,
          tasks: week.tasks.map((item) => (item.id === task.id ? task : item)),
        })),
      }
    })
  }

  async function setStatus(task: WeeklyTask, status: TaskStatus) {
    if (!active) return
    try {
      const next = await updateTask(active.id, task.id, { status })
      replaceTask(next)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function onGenerate() {
    setBusy(true)
    try {
      const plan = await generatePlan()
      if (plan.status === "proposed") {
        setProposed((current) => [plan, ...current.filter((item) => item.id !== plan.id)])
        toast.success("A new plan is proposed. Review it before applying.")
      } else {
        setActive(plan)
        toast.success("Learning plan created.")
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onAdjust() {
    if (!active) return
    if (reason.trim().length < 3) {
      toast.error("Describe the change in at least 3 characters.")
      return
    }
    const weekly = hours.trim() ? Number(hours) : null
    if (weekly != null && (!Number.isInteger(weekly) || weekly < 1 || weekly > 60)) {
      toast.error("Weekly hours must be a whole number from 1 to 60.")
      return
    }
    setBusy(true)
    try {
      const plan = await adjustPlan(active.id, {
        reason: reason.trim(),
        weekly_hours: weekly,
        focus_skills: focus,
        struggling_skills: struggling,
      })
      setProposed((current) => [plan, ...current.filter((item) => item.id !== plan.id)])
      setAdjustOpen(false)
      setReason("")
      toast.success("Review the proposed changes. Your current plan is unchanged.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning plan"
        description="Plans are grouped by week. An adjustment creates a proposal you can accept or reject. The active plan stays in place until you apply it."
        actions={
          <>
            <Button variant="outline" disabled={!active || busy} onClick={() => setAdjustOpen(true)}>Request adjustment</Button>
            <Button disabled={busy} onClick={() => void onGenerate()}>{busy ? "Working…" : active ? "Generate another plan" : "Generate learning plan"}</Button>
          </>
        }
      />

      {proposed.map((plan) => (
        <ProposalReview
          key={plan.id}
          plan={plan}
          onResolved={(next) => {
            setProposed((current) => current.filter((item) => item.id !== plan.id))
            if (next) setActive(next)
          }}
        />
      ))}

      {!active ? (
        <EmptyState
          title="No active plan"
          description="Run a skill-gap analysis first, then generate a plan. The coach uses your latest analysis and weekly hours."
          action={<Button onClick={() => void onGenerate()} disabled={busy}>Generate learning plan</Button>}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              {(() => {
                const tasks = active.weeks.flatMap((week) => week.tasks)
                const completed = tasks.filter((task) => task.status === "completed").length
                const percent = tasks.length ? Math.round((completed / tasks.length) * 1000) / 10 : 0
                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{active.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {active.target_role || "Target role from your profile"} · {active.weekly_hours}h / week · starts {formatDate(active.start_date)}
                        </p>
                      </div>
                      <Badge variant="success">Active · {percent}%</Badge>
                    </div>
                    {active.summary ? <p className="text-sm text-muted-foreground">{active.summary}</p> : null}
                    <ProgressBar value={percent} label="Overall plan progress" />
                    <p className="text-xs text-muted-foreground">{completed} of {tasks.length} tasks completed</p>
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {active.weeks.map((week) => {
            const percent = weekPercent(week.tasks)
            return (
              <Card key={week.week_number}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Week {week.week_number}</CardTitle>
                    <span className="text-sm text-muted-foreground">{formatDate(week.start_date)} · {week.total_hours}h · {percent}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Skills: {week.skills.join(", ") || "—"}</p>
                  <ProgressBar value={percent} label={`Week ${week.week_number} completion`} />
                </CardHeader>
                <CardContent className="space-y-3">
                  {week.tasks.map((task) => (
                    <div key={task.id} className={`rounded-lg border px-3 py-3 ${task.status === "completed" ? "border-border bg-accent/40" : task.status === "in_progress" ? "border-chart-2/50 bg-card" : "border-border bg-card"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className={`font-medium ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.skill_name} · {task.estimated_hours}h · {STATUS_LABEL[task.status] ?? task.status}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Select
                            className="h-8 w-36 text-xs"
                            aria-label={`Status for ${task.title}`}
                            value={task.status}
                            onChange={(event) => void setStatus(task, event.target.value as TaskStatus)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                            <option value="skipped">Skipped</option>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelected(task)
                              setNotes(task.notes ?? "")
                              setRating(task.difficulty_rating ? String(task.difficulty_rating) : "")
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={adjustOpen} onOpenChange={setAdjustOpen} title="Request a plan adjustment" description="This creates a proposal. Nothing changes until you apply it.">
        <div className="space-y-4">
          <Field label="What should change?" htmlFor="reason">
            <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Field label="Weekly hours" htmlFor="hours" hint="Optional. Leave blank to keep the current pace.">
            <Input id="hours" inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} />
          </Field>
          <Field label="Focus skills" htmlFor="focus" hint="Press Enter after each skill.">
            <ChipInput id="focus" values={focus} onChange={setFocus} />
          </Field>
          <Field label="Skills you are struggling with" htmlFor="struggling">
            <ChipInput id="struggling" values={struggling} onChange={setStruggling} />
          </Field>
          <Button type="button" disabled={busy} onClick={() => void onAdjust()}>{busy ? "Preparing…" : "Show proposed changes"}</Button>
        </div>
      </Modal>

      <Modal open={selected != null} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title ?? "Task"}>
        {selected ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">{selected.skill_name} · Week {selected.week_number}</p>
            <div>
              <p className="font-medium">Topics</p>
              <ul className="mt-1 list-disc pl-5">{selected.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium">Activities</p>
              <ul className="mt-1 list-disc pl-5">{selected.activities.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium">Exercises</p>
              <ul className="mt-1 list-disc pl-5">{selected.exercises.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <p><span className="font-medium">Expected outcome: </span>{selected.expected_outcome}</p>
            <Field label="How hard was this?" htmlFor="rating">
              <Select id="rating" value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="">Not rated</option>
                <option value="1">1 · Easy</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 · Very hard</option>
              </Select>
            </Field>
            <Field label="Notes" htmlFor="task-notes">
              <Textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Button
              type="button"
              onClick={() => {
                if (!active) return
                void updateTask(active.id, selected.id, {
                  notes,
                  difficulty_rating: rating ? Number(rating) : null,
                })
                  .then((task) => {
                    replaceTask(task)
                    setSelected(null)
                    toast.success("Task updated.")
                  })
                  .catch((err) => toast.error(errorMessage(err)))
              }}
            >
              Save task notes
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
