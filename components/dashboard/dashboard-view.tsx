"use client"

import { Briefcase, FileSearch, MessagesSquare, Route } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { BarCompareChart, TrendChart } from "@/components/charts/charts"
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatCard } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { displayName, formatDate, formatPercent, greeting } from "@/lib/format"
import { loadDashboard, type DashboardData } from "@/services/dashboard.service"
import type { WeeklyTask } from "@/types/api"

function upcomingTasks(plan: DashboardData["activePlan"]) {
  if (!plan) return []
  const tasks: WeeklyTask[] = []
  for (const week of plan.weeks) {
    for (const task of week.tasks) {
      if (task.status === "pending" || task.status === "in_progress") tasks.push(task)
    }
  }
  return tasks.slice(0, 5)
}

export function DashboardView() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fatal, setFatal] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setFatal("")
    try {
      setData(await loadDashboard())
    } catch (error) {
      setFatal(error instanceof Error ? error.message : "Could not load the dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <PageSkeleton />
  if (fatal || !data || !user) return <ErrorState message={fatal || "Dashboard is unavailable."} onRetry={() => void load()} />

  const name = displayName(user.full_name, user.email)
  const target = data.profile?.target_role
  const identified = data.profile?.skills.length
  const covered = data.analysis?.items.filter((item) => item.gap_level === "none").length
  const progress = data.progress
  const interviewsReached = data.applications.filter((app) => app.reached_interview || app.status === "interview" || app.status === "offer").length
  const weekChart =
    data.activePlan?.weeks.map((week) => ({
      week: `W${week.week_number}`,
      Completed: week.tasks.filter((task) => task.status === "completed").length,
      Remaining: week.tasks.filter((task) => task.status !== "completed" && task.status !== "skipped").length,
    })) ?? []
  const interviewTrend = (progress?.interviews.trend ?? [])
    .filter((point) => typeof point.score === "number")
    .map((point) => ({ label: point.date ? formatDate(point.date) : "Interview", score: point.score as number }))
  const tasks = upcomingTasks(data.activePlan)
  const activities = [
    ...data.applications.slice(0, 4).map((app) => ({
      id: `app-${app.id}`,
      when: app.updated_at,
      text: `${app.status === "applied" ? "Applied" : "Updated"} ${app.role_title} at ${app.company_name}`,
    })),
    ...data.interviews.slice(0, 3).map((interview) => ({
      id: `int-${interview.id}`,
      when: interview.created_at,
      text: `${interview.status === "completed" ? "Finished" : "Started"} a ${interview.interview_type} interview for ${interview.target_role}`,
    })),
    ...(data.activePlan ? [{ id: `plan-${data.activePlan.id}`, when: data.activePlan.created_at, text: `Learning plan “${data.activePlan.title}” is ${data.activePlan.status}` }] : []),
    ...(data.profile?.active_resume ? [{ id: "resume", when: data.profile.active_resume.created_at, text: `Uploaded ${data.profile.active_resume.filename}` }] : []),
  ]
    .sort((a, b) => +new Date(b.when) - +new Date(a.when))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={target ? `Target role · ${target}` : "Set a target role to unlock the rest of the coach"}
        title={greeting(name)}
        description={data.profile?.summary || "Upload a resume, choose a role, and the coach will build the path between them."}
      />

      {!target ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-accent px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Your profile still needs a target role before skill-gap analysis and plans can run.</p>
          <Button asChild size="sm">
            <Link href="/profile">Complete profile</Link>
          </Button>
        </div>
      ) : null}

      {data.errors.length > 0 ? (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          Some sections could not be loaded: {data.errors.join(" · ")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Learning progress" value={formatPercent(progress?.plan.percent_complete ?? data.activePlan?.progress.percent_complete)} hint={progress ? `${progress.plan.completed} of ${progress.plan.total_tasks} tasks` : "No active plan yet"} />
        <StatCard label="Skills identified" value={identified == null ? "—" : String(identified)} hint={covered == null ? "Run a skill-gap analysis" : `${covered} already covered in the latest analysis`} />
        <StatCard label="Interview average" value={progress?.interviews.average_score == null ? "—" : String(progress.interviews.average_score)} hint={progress?.interviews.interviews_evaluated ? `${progress.interviews.interviews_evaluated} evaluated` : "No scored interviews yet"} />
        <StatCard label="Applications" value={String(data.applications.length)} hint={`${interviewsReached} reached an interview`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start px-4 py-3">
          <Link href="/profile"><FileSearch /> Analyze my resume</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start px-4 py-3">
          <Link href="/learning-plan"><Route /> Generate learning plan</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start px-4 py-3">
          <Link href="/interviews"><MessagesSquare /> Start mock interview</Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start px-4 py-3">
          <Link href="/applications?new=1"><Briefcase /> Add job application</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly learning progress</CardTitle>
            <p className="text-sm text-muted-foreground">Completed and remaining tasks from your active plan.</p>
          </CardHeader>
          <CardContent>
            {weekChart.length > 0 ? (
              <BarCompareChart
                data={weekChart}
                xKey="week"
                bars={[
                  { key: "Completed", name: "Completed", color: "var(--chart-1)" },
                  { key: "Remaining", name: "Remaining", color: "var(--chart-2)" },
                ]}
              />
            ) : (
              <EmptyState title="No weekly plan yet" description="Generate a learning plan after a skill-gap analysis to see week-by-week progress here." />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Interview scores</CardTitle>
            <p className="text-sm text-muted-foreground">Only interviews the coach has evaluated.</p>
          </CardHeader>
          <CardContent>
            {interviewTrend.length > 0 ? <TrendChart data={interviewTrend} /> : <EmptyState title="No scores yet" description="Finish a mock interview to see your score history." />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming learning tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <EmptyState title="Nothing queued" description="When a plan is active, the next pending tasks show up here." />
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-border px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge variant={task.status === "in_progress" ? "warning" : "secondary"}>{task.status === "in_progress" ? "In progress" : "Pending"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Week {task.week_number} · {task.skill_name} · {task.estimated_hours}h</p>
                </div>
              ))
            )}
            {data.activePlan ? <ProgressBar value={data.activePlan.progress.percent_complete} label="Plan completion" /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Uploading a resume, starting an interview, or adding an application will appear here." />
            ) : (
              activities.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">{item.text}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{formatDate(item.when)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
