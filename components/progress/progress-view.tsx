"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { BarCompareChart, TrendChart } from "@/components/charts/charts"
import { ProposalReview } from "@/components/learning-plan/proposal-review"
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatCard } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { ProgressBar } from "@/components/ui/progress"
import { errorMessage } from "@/lib/api"
import { formatDate, formatPercent, proficiencyLabel } from "@/lib/format"
import { createAssessment, getProgress, recalculatePlan } from "@/services/progress.service"
import type { Plan, ProgressOverview } from "@/types/api"

export function ProgressView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<ProgressOverview | null>(null)
  const [proposal, setProposal] = useState<Plan | null>(null)
  const [proposalNote, setProposalNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [skill, setSkill] = useState("")
  const [level, setLevel] = useState("3")
  const [notes, setNotes] = useState("")

  async function load(insights = false) {
    setLoading(true)
    setError("")
    try {
      setProgress(await getProgress(insights))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(false)
  }, [])

  async function onAssess() {
    if (!skill.trim()) {
      toast.error("Name the skill you want to record.")
      return
    }
    setBusy(true)
    try {
      await createAssessment({ skill_name: skill.trim(), proficiency: Number(level), notes: notes.trim() || null })
      setSkill("")
      setNotes("")
      toast.success("Assessment saved.")
      setProgress(await getProgress(false))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onRecalculate() {
    setBusy(true)
    try {
      const result = await recalculatePlan()
      setProposal(result.proposed_plan)
      setProposalNote(result.note)
      toast.success("A plan adjustment is ready to review.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSkeleton />
  if (error || !progress) return <ErrorState message={error || "Progress is unavailable."} onRetry={() => void load(false)} />

  const trend = progress.interviews.trend
    .filter((point) => typeof point.score === "number")
    .map((point) => ({ label: point.date ? formatDate(point.date) : "Interview", score: point.score as number }))
  const skillChart = progress.skills.slice(0, 8).map((item) => ({
    skill: item.skill_name,
    First: item.first_level,
    Latest: item.latest_level,
  }))
  const projectChart = Object.entries(progress.projects).map(([name, count]) => ({ status: name.replace("_", " "), count }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="Consistency, tasks, skill assessments, interviews, and projects, taken from your account."
        actions={
          <>
            <Button variant="outline" disabled={busy} onClick={() => void load(true)}>Load coach insights</Button>
            <Button disabled={busy} onClick={() => void onRecalculate()}>{busy ? "Working…" : "Review plan adjustment"}</Button>
          </>
        }
      />

      {proposal ? (
        <ProposalReview
          plan={proposal}
          note={proposalNote}
          onResolved={() => {
            setProposal(null)
            void load(false)
          }}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Learning consistency" value={progress.consistency.consistency_rate == null ? "—" : formatPercent(progress.consistency.consistency_rate * 100)} hint={`${progress.consistency.active_weeks} of ${progress.consistency.weeks_elapsed} weeks active`} />
        <StatCard label="Tasks completed" value={`${progress.plan.completed}/${progress.plan.total_tasks}`} hint={progress.plan.plan_id ? formatPercent(progress.plan.percent_complete) : "No active plan"} />
        <StatCard label="Interview average" value={progress.interviews.average_score == null ? "—" : String(progress.interviews.average_score)} hint={`${progress.interviews.interviews_evaluated} evaluated`} />
        <StatCard label="Projects completed" value={String(progress.projects.completed ?? 0)} hint={`${progress.projects.in_progress ?? 0} in progress`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {progress.plan.plan_id ? (
            <>
              <ProgressBar value={progress.plan.percent_complete} label="Plan completion" />
              <p className="text-sm text-muted-foreground">
                {progress.plan.hours_completed}h completed of {progress.plan.hours_total}h · {progress.plan.in_progress} in progress · {progress.plan.pending} pending
                {progress.plan.overdue ? ` · ${progress.plan.overdue} overdue` : ""}
              </p>
            </>
          ) : (
            <EmptyState title="No active plan" description="Generate a learning plan to track weekly completion here." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Mock interview performance</CardTitle></CardHeader>
          <CardContent>
            {trend.length > 0 ? <TrendChart data={trend} /> : <EmptyState title="No interview scores" description="Completed, evaluated interviews will chart here." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Skills improved</CardTitle><p className="text-sm text-muted-foreground">From assessments you record. Levels are 1–5.</p></CardHeader>
          <CardContent>
            {skillChart.length > 0 ? (
              <BarCompareChart data={skillChart} xKey="skill" bars={[{ key: "First", name: "First", color: "var(--chart-4)" }, { key: "Latest", name: "Latest", color: "var(--chart-1)" }]} />
            ) : (
              <EmptyState title="No skill assessments" description="Record a proficiency below to start a history. Nothing is estimated for you." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Portfolio completion</CardTitle></CardHeader>
        <CardContent>
          {projectChart.some((item) => item.count > 0) ? (
            <BarCompareChart data={projectChart} xKey="status" bars={[{ key: "count", name: "Projects", color: "var(--chart-3)" }]} />
          ) : (
            <EmptyState title="No projects yet" description="Recommended portfolio projects will be counted here." />
          )}
        </CardContent>
      </Card>

      {progress.insights ? (
        <Card>
          <CardHeader>
            <CardTitle>Recommended adjustments</CardTitle>
            <p className="text-sm text-muted-foreground">{progress.insights.summary}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {progress.insights.recommended_adjustments.length === 0 ? <p className="text-muted-foreground">No adjustments were suggested.</p> : (
              <ul className="list-disc pl-5">{progress.insights.recommended_adjustments.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
            {progress.insights_generated_by ? <p className="text-xs text-muted-foreground">Source: {progress.insights_generated_by}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {progress.struggling_areas.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Areas that need attention</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {progress.struggling_areas.map((area) => (
              <div key={`${area.area}-${area.signal}`} className="rounded-lg border border-border px-3 py-3 text-sm">
                <p className="font-medium">{area.area}</p>
                <p className="text-muted-foreground">{area.evidence}</p>
                <p className="mt-1">{area.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Record a skill assessment</CardTitle>
          <p className="text-sm text-muted-foreground">Self-rating from 1 (aware) to 5 (expert). This is how skill improvement is measured.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
          <Field label="Skill" htmlFor="skill-name">
            <Input id="skill-name" value={skill} onChange={(event) => setSkill(event.target.value)} />
          </Field>
          <Field label="Proficiency" htmlFor="skill-level">
            <Select id="skill-level" value={level} onChange={(event) => setLevel(event.target.value)}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} · {proficiencyLabel(value)}</option>)}
            </Select>
          </Field>
          <Button className="md:mb-0" disabled={busy} onClick={() => void onAssess()}>Save assessment</Button>
          <div className="md:col-span-3">
            <Field label="Notes" htmlFor="assess-notes">
              <Textarea id="assess-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
