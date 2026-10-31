"use client"

import { formResolver } from "@/lib/form-resolver"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { BarCompareChart } from "@/components/charts/charts"
import { ChipInput } from "@/components/shared/chip-input"
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatCard } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { errorMessage } from "@/lib/api"
import { formatDate, formatRate, todayInputValue, titleCase } from "@/lib/format"
import { createApplication, deleteApplication, getApplicationAnalytics, listApplications, updateApplication } from "@/services/application.service"
import type { Application, ApplicationAnalytics, ApplicationStatus, ExperienceLevel } from "@/types/api"

const STATUSES: ApplicationStatus[] = ["applied", "interview", "rejected", "offer"]

const schema = z.object({
  company_name: z.string().trim().min(1, "Company is required").max(200),
  role_title: z.string().trim().min(1, "Job title is required").max(200),
  applied_date: z.string().min(1, "Application date is required"),
  status: z.enum(["applied", "interview", "rejected", "offer"]),
  job_url: z.string(),
  job_description_text: z.string().max(50000),
  experience_level: z.enum(["", "entry", "junior", "mid", "senior", "lead"]),
  notes: z.string().max(5000),
  interview_feedback: z.string().max(5000),
  outcome: z.string().max(2000),
})

type FormValues = z.infer<typeof schema>

function splitNotes(notes: string | null) {
  if (!notes) return { url: "", notes: "" }
  const match = notes.match(/^Posting:\s*(\S+)(?:\n\n([\s\S]*))?$/)
  if (!match) return { url: "", notes }
  return { url: match[1] ?? "", notes: match[2] ?? "" }
}

function joinNotes(url: string, notes: string) {
  const body = notes.trim()
  const posting = url.trim()
  if (!posting) return body || null
  return body ? `Posting: ${posting}\n\n${body}` : `Posting: ${posting}`
}

const emptyForm = (): FormValues => ({
  company_name: "",
  role_title: "",
  applied_date: todayInputValue(),
  status: "applied",
  job_url: "",
  job_description_text: "",
  experience_level: "",
  notes: "",
  interview_feedback: "",
  outcome: "",
})

export function ApplicationsView() {
  const params = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [apps, setApps] = useState<Application[]>([])
  const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(null)
  const [analyticsError, setAnalyticsError] = useState("")
  const [view, setView] = useState<"table" | "board">("table")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null)
  const [detail, setDetail] = useState<Application | null>(null)
  const form = useForm<FormValues>({ resolver: formResolver(schema), defaultValues: emptyForm() })

  async function load() {
    setLoading(true)
    setError("")
    try {
      const rows = await listApplications()
      setApps(rows)
      try {
        setAnalytics(await getApplicationAnalytics(false))
        setAnalyticsError("")
      } catch (err) {
        setAnalytics(null)
        setAnalyticsError(errorMessage(err))
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null)
      setSkills([])
      form.reset(emptyForm())
      setOpen(true)
    }
  }, [params, form])

  function beginEdit(app: Application) {
    const notes = splitNotes(app.notes)
    setEditing(app)
    setSkills(app.skills_highlighted)
    form.reset({
      company_name: app.company_name,
      role_title: app.role_title,
      applied_date: app.applied_date,
      status: app.status as FormValues["status"],
      job_url: notes.url,
      job_description_text: app.job_description_text ?? "",
      experience_level: (app.experience_level as FormValues["experience_level"]) || "",
      notes: notes.notes,
      interview_feedback: app.interview_feedback ?? "",
      outcome: app.outcome ?? "",
    })
    setOpen(true)
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      company_name: values.company_name.trim(),
      role_title: values.role_title.trim(),
      applied_date: values.applied_date,
      status: values.status,
      job_description_text: values.job_description_text.trim() || null,
      experience_level: (values.experience_level || null) as ExperienceLevel | null,
      skills_highlighted: skills,
      notes: joinNotes(values.job_url, values.notes),
      interview_feedback: values.interview_feedback.trim() || null,
      outcome: values.outcome.trim() || null,
    }
    try {
      if (editing) {
        const updated = await updateApplication(editing.id, payload)
        setApps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        toast.success("Application updated.")
      } else {
        const created = await createApplication(payload)
        setApps((current) => [created, ...current])
        toast.success("Application added.")
      }
      setOpen(false)
      setAnalytics(await getApplicationAnalytics(false))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function move(app: Application, status: ApplicationStatus) {
    if (app.status === status) return
    try {
      const updated = await updateApplication(app.id, { status })
      setApps((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  const byStatus = analytics?.stats.by_status ?? {}
  const interviews = (byStatus.interview ?? 0) + apps.filter((app) => app.status !== "interview" && app.reached_interview).length
  const statusChart = STATUSES.map((status) => ({ status: titleCase(status), count: byStatus[status] ?? apps.filter((app) => app.status === status).length }))
  const sufficient = analytics?.stats.data_sufficiency.sufficient ?? false
  const interviewRate = analytics?.stats.conversion.application_to_interview
  const offerRate = analytics?.stats.conversion.application_to_offer

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application tracker"
        description="Record where you applied and how each one moved. Analytics describe your own applications."
        actions={
          <>
            <Button variant="outline" onClick={() => setView(view === "table" ? "board" : "table")}>{view === "table" ? "Board view" : "Table view"}</Button>
            <Button onClick={() => { setEditing(null); setSkills([]); form.reset(emptyForm()); setOpen(true) }}>Add application</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={String(analytics?.stats.total_applications ?? apps.length)} />
        <StatCard label="Interviews" value={String(byStatus.interview ?? apps.filter((app) => app.status === "interview").length)} hint={`${interviews} reached an interview at some point`} />
        <StatCard label="Rejections" value={String(byStatus.rejected ?? 0)} />
        <StatCard label="Offers" value={String(byStatus.offer ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          {analytics ? <p className="text-sm text-muted-foreground">{analytics.stats.data_sufficiency.message}</p> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {analyticsError ? <ErrorState message={analyticsError} onRetry={() => void getApplicationAnalytics(false).then(setAnalytics).catch((err) => setAnalyticsError(errorMessage(err)))} /> : null}
          {!analytics && !analyticsError ? <p className="text-sm text-muted-foreground">Analytics are unavailable.</p> : null}
          {analytics && !sufficient ? (
            <EmptyState title="Not enough history for patterns" description={analytics.stats.data_sufficiency.message} />
          ) : null}
{analytics && apps.length > 0 ? (
              <>
                {sufficient ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatCard label="Response rate" value={formatRate(interviewRate?.response_rate)} hint={interviewRate ? `${interviewRate.responses ?? 0} of ${interviewRate.n} reached an interview` : undefined} />
                    <StatCard label="Offer conversion" value={formatRate(offerRate?.rate)} hint={offerRate ? `${offerRate.offers} offers from ${offerRate.n} applications` : undefined} />
                  </div>
                ) : null}
                <BarCompareChart data={statusChart} xKey="status" bars={[{ key: "count", name: "Applications", color: "var(--chart-1)" }]} />
                <p className="text-xs text-muted-foreground">
                  {sufficient ? analytics.stats.disclaimer : "The chart is a count of your applications. Rates stay hidden until there is enough history."}
                </p>
                {sufficient && analytics.narrative.observations.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm">{analytics.narrative.observations.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : null}
              </>
            ) : null}
        </CardContent>
      </Card>

      {apps.length === 0 ? (
        <EmptyState title="No applications yet" description="Add the roles you have applied to. Status, notes, and a posting link are saved with each one." action={<Button onClick={() => setOpen(true)}>Add application</Button>} />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-t border-border bg-card">
                  <td className="px-4 py-3">{app.company_name}</td>
                  <td className="px-4 py-3">{app.role_title}</td>
                  <td className="px-4 py-3">{formatDate(app.applied_date)}</td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Status for ${app.company_name}`} className="h-8 w-32" value={app.status} onChange={(event) => void move(app, event.target.value as ApplicationStatus)}>
                      {STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(app)}>View</Button>
                      <Button size="sm" variant="ghost" onClick={() => beginEdit(app)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingDelete(app)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-xl border border-border bg-muted/40 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = Number(event.dataTransfer.getData("text/plain"))
                const app = apps.find((item) => item.id === id)
                if (app) void move(app, status)
              }}
            >
              <p className="mb-2 text-sm font-medium">{titleCase(status)}</p>
              <div className="space-y-2">
                {apps.filter((app) => app.status === status).map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", String(app.id))}
                    onClick={() => setDetail(app)}
                    className="block w-full rounded-lg border border-border bg-card px-3 py-3 text-left"
                  >
                    <p className="font-medium">{app.company_name}</p>
                    <p className="text-xs text-muted-foreground">{app.role_title}</p>
                    <Badge className="mt-2" variant="outline">{formatDate(app.applied_date)}</Badge>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onOpenChange={setOpen} title={editing ? "Edit application" : "Add application"} description="The posting URL is stored with your notes. The API does not have a separate URL field.">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" error={form.formState.errors.company_name?.message}>
              <Input id="company" {...form.register("company_name")} />
            </Field>
            <Field label="Job title" htmlFor="role" error={form.formState.errors.role_title?.message}>
              <Input id="role" {...form.register("role_title")} />
            </Field>
            <Field label="Application date" htmlFor="date" error={form.formState.errors.applied_date?.message}>
              <Input id="date" type="date" {...form.register("applied_date")} />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" {...form.register("status")}>
                {STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </Select>
            </Field>
            <Field label="Job posting URL" htmlFor="url">
              <Input id="url" placeholder="https://" {...form.register("job_url")} />
            </Field>
            <Field label="Seniority asked for" htmlFor="level">
              <Select id="level" {...form.register("experience_level")}>
                <option value="">Not set</option>
                <option value="entry">Entry</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </Select>
            </Field>
          </div>
          <Field label="Job description" htmlFor="jd">
            <Textarea id="jd" {...form.register("job_description_text")} />
          </Field>
          <Field label="Skills you highlighted" htmlFor="skills" hint="Press Enter after each skill.">
            <ChipInput id="skills" values={skills} onChange={setSkills} />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" {...form.register("notes")} />
          </Field>
          {editing ? (
            <>
              <Field label="Interview feedback" htmlFor="feedback">
                <Textarea id="feedback" {...form.register("interview_feedback")} />
              </Field>
              <Field label="Outcome" htmlFor="outcome">
                <Input id="outcome" {...form.register("outcome")} />
              </Field>
            </>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save application"}</Button>
        </form>
      </Modal>

      <Modal open={detail != null} onOpenChange={(openState) => !openState && setDetail(null)} title={detail ? `${detail.role_title} · ${detail.company_name}` : "Application"}>
        {detail ? (
          <div className="space-y-3 text-sm">
            <Badge>{titleCase(detail.status)}</Badge>
            <p>Applied {formatDate(detail.applied_date)}{detail.reached_interview ? " · reached an interview" : ""}</p>
            {splitNotes(detail.notes).url ? <p><a className="underline" href={splitNotes(detail.notes).url} target="_blank" rel="noreferrer">Job posting</a></p> : null}
            {detail.job_description_text ? <p className="whitespace-pre-wrap text-muted-foreground">{detail.job_description_text}</p> : null}
            {detail.skills_highlighted.length > 0 ? <p>Skills highlighted: {detail.skills_highlighted.join(", ")}</p> : null}
            {splitNotes(detail.notes).notes ? <p>{splitNotes(detail.notes).notes}</p> : null}
            {detail.interview_feedback ? <p>Feedback: {detail.interview_feedback}</p> : null}
            {detail.outcome ? <p>Outcome: {detail.outcome}</p> : null}
            <Button variant="outline" onClick={() => { setDetail(null); beginEdit(detail) }}>Edit</Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={pendingDelete != null} onOpenChange={(openState) => !openState && setPendingDelete(null)} title="Delete this application?" description="This removes it from your tracker.">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              if (!pendingDelete) return
              void deleteApplication(pendingDelete.id)
                .then(async () => {
                  setApps((current) => current.filter((item) => item.id !== pendingDelete.id))
                  setPendingDelete(null)
                  toast.success("Application deleted.")
                  setAnalytics(await getApplicationAnalytics(false))
                })
                .catch((err) => toast.error(errorMessage(err)))
            }}
          >
            Delete
          </Button>
          <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
