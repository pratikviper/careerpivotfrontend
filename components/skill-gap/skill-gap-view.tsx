"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { BarCompareChart } from "@/components/charts/charts"
import { ChipInput } from "@/components/shared/chip-input"
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import { LevelMeter } from "@/components/ui/progress"
import { errorMessage } from "@/lib/api"
import { formatDateTime, proficiencyLabel, titleCase } from "@/lib/format"
import { createJob, deleteJob, listJobs } from "@/services/jobs.service"
import { getProfile } from "@/services/profile.service"
import { analyzeSkillGap, getAnalysis, listAnalyses } from "@/services/skill-gap.service"
import type { JobSummary, SkillGapItem, SkillGapReport, SkillGapSummary } from "@/types/api"

const GAP_VARIANT = {
  none: "success",
  partial: "warning",
  missing: "danger",
} as const

export function SkillGapView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [history, setHistory] = useState<SkillGapSummary[]>([])
  const [report, setReport] = useState<SkillGapReport | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [targetRole, setTargetRole] = useState("")
  const [filter, setFilter] = useState("all")
  const [detail, setDetail] = useState<SkillGapItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [showJob, setShowJob] = useState(false)
  const [jobMode, setJobMode] = useState<"text" | "url" | "manual">("text")
  const [jobTitle, setJobTitle] = useState("")
  const [jobCompany, setJobCompany] = useState("")
  const [jobText, setJobText] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [preferredSkills, setPreferredSkills] = useState<string[]>([])

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [jobList, analyses, profile] = await Promise.all([listJobs(), listAnalyses(), getProfile()])
      setJobs(jobList)
      setHistory(analyses)
      setTargetRole(profile.target_role ?? "")
      setSelectedJobs(jobList.map((job) => job.id))
      if (analyses[0]) setReport(await getAnalysis(analyses[0].id))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const items = useMemo(() => {
    const all = report?.items ?? []
    if (filter === "priority") return all.filter((item) => item.is_priority)
    if (filter === "all") return all
    return all.filter((item) => item.gap_level === filter)
  }, [report, filter])

  const chartData = (report?.items ?? [])
    .filter((item) => item.current_proficiency != null || item.required_proficiency != null)
    .slice(0, 8)
    .map((item) => ({
      skill: item.skill_name,
      Current: item.current_proficiency,
      Required: item.required_proficiency,
    }))

  async function onAnalyze() {
    setBusy(true)
    try {
      const next = await analyzeSkillGap({
        job_description_ids: selectedJobs,
        target_role: targetRole,
      })
      setReport(next)
      setHistory(await listAnalyses())
      toast.success("Skill gap analysis is ready.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onCreateJob() {
    if (jobTitle.trim().length < 2) {
      toast.error("Add a job title.")
      return
    }
    if (jobMode === "text" && jobText.trim().length < 50) {
      toast.error("Paste at least 50 characters of the job description.")
      return
    }
    if (jobMode === "url" && !jobUrl.trim()) {
      toast.error("Add a job posting URL.")
      return
    }
    if (jobMode === "manual" && requiredSkills.length === 0) {
      toast.error("Add at least one required skill.")
      return
    }
    setBusy(true)
    try {
      const created = await createJob({
        title: jobTitle.trim(),
        company: jobCompany.trim() || null,
        text: jobMode === "text" ? jobText.trim() : null,
        source_url: jobMode === "url" ? jobUrl.trim() : null,
        required_skills: jobMode === "manual" ? requiredSkills : [],
        preferred_skills: jobMode === "manual" ? preferredSkills : [],
      })
      setJobs(await listJobs())
      setSelectedJobs((current) => [...current, created.id])
      setShowJob(false)
      setJobTitle("")
      setJobCompany("")
      setJobText("")
      setJobUrl("")
      setRequiredSkills([])
      setPreferredSkills([])
      toast.success("Job description saved.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  const existing = report?.items.filter((item) => item.gap_level === "none").length ?? 0
  const partial = report?.items.filter((item) => item.gap_level === "partial").length ?? 0
  const missing = report?.items.filter((item) => item.gap_level === "missing").length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill gap analysis"
        description="Compare your confirmed skills with the requirements in saved job descriptions. Scores come only from that analysis."
        actions={
          <>
            <Button variant="outline" onClick={() => setShowJob(true)}>Add job description</Button>
            <Button onClick={() => void onAnalyze()} disabled={busy || jobs.length === 0}>
              {busy ? "Working…" : "Run analysis"}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Target role" htmlFor="target-role" hint="Leave blank to use the role on your profile.">
            <Input id="target-role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} />
          </Field>
          {jobs.length === 0 ? (
            <EmptyState title="No job descriptions yet" description="Add at least one posting with extractable skills. The analysis uses those requirements, not general market statistics." action={<Button onClick={() => setShowJob(true)}>Add job description</Button>} />
          ) : (
            <ul className="space-y-2">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <label className="flex min-w-0 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={(event) =>
                        setSelectedJobs((current) => (event.target.checked ? [...current, job.id] : current.filter((id) => id !== job.id)))
                      }
                    />
                    <span className="truncate">
                      <span className="font-medium">{job.title}</span>
                      {job.company ? <span className="text-muted-foreground"> · {job.company}</span> : null}
                      <span className="block text-xs text-muted-foreground">{job.required_count} required · {job.preferred_count} preferred</span>
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`Remove “${job.title}”?`)) return
                      void deleteJob(job.id)
                        .then(async () => {
                          setJobs(await listJobs())
                          setSelectedJobs((current) => current.filter((id) => id !== job.id))
                        })
                        .catch((err) => toast.error(errorMessage(err)))
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent><p className="text-sm text-muted-foreground">Match score</p><p className="mt-2 text-2xl font-semibold">{report.match_score}%</p></CardContent></Card>
            <Card><CardContent><p className="text-sm text-muted-foreground">Existing</p><p className="mt-2 text-2xl font-semibold">{existing}</p></CardContent></Card>
            <Card><CardContent><p className="text-sm text-muted-foreground">Partial</p><p className="mt-2 text-2xl font-semibold">{partial}</p></CardContent></Card>
            <Card><CardContent><p className="text-sm text-muted-foreground">Missing</p><p className="mt-2 text-2xl font-semibold">{missing}</p></CardContent></Card>
          </div>
          {report.summary ? <p className="text-sm text-muted-foreground">{report.summary}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Select className="max-w-48" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter skills">
              <option value="all">All skills</option>
              <option value="priority">High priority</option>
              <option value="missing">Missing</option>
              <option value="partial">Partial</option>
              <option value="none">Existing</option>
            </Select>
            {history.length > 1 ? (
              <Select
                className="max-w-xs"
                value={String(report.id)}
                aria-label="Previous analyses"
                onChange={(event) => {
                  void getAnalysis(Number(event.target.value)).then(setReport).catch((err) => toast.error(errorMessage(err)))
                }}
              >
                {history.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.target_role || "Analysis"} · {item.match_score}% · {formatDateTime(item.created_at)}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>

          {chartData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Current and required proficiency</CardTitle>
                <p className="text-sm text-muted-foreground">Only skills where the analysis recorded a level. Scale is 1–5. A missing bar means that side was not scored.</p>
              </CardHeader>
              <CardContent>
                <BarCompareChart
                  data={chartData}
                  xKey="skill"
                  bars={[
                    { key: "Current", name: "Current", color: "var(--chart-1)" },
                    { key: "Required", name: "Required", color: "var(--chart-2)" },
                  ]}
                />
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <button key={item.skill_id} type="button" onClick={() => setDetail(item)} className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.skill_name}</p>
                    <p className="text-xs text-muted-foreground">{titleCase(item.category)} · rank {item.priority_rank}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={GAP_VARIANT[item.gap_level as keyof typeof GAP_VARIANT] ?? "outline"}>{titleCase(item.gap_level)}</Badge>
                    {item.is_priority ? <Badge>Priority</Badge> : <Badge variant="outline">{titleCase(item.importance_label)}</Badge>}
                  </div>
                </div>
                <div className="mt-3">
                  <LevelMeter current={item.current_proficiency} required={item.required_proficiency} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    You: {proficiencyLabel(item.current_proficiency)} · Required: {item.required_proficiency == null ? "Not stated" : proficiencyLabel(item.required_proficiency)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No analysis yet" description="Save a job description, then run an analysis. Results will list existing, partial, and missing skills from those postings." />
      )}

      <Modal open={showJob} onOpenChange={setShowJob} title="Add a job description" description="Paste a posting, fetch a URL, or enter skills yourself.">
        <div className="space-y-4">
          <Field label="Job title" htmlFor="job-title">
            <Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
          </Field>
          <Field label="Company" htmlFor="job-company">
            <Input id="job-company" value={jobCompany} onChange={(event) => setJobCompany(event.target.value)} />
          </Field>
          <div className="flex gap-2">
            {(["text", "url", "manual"] as const).map((mode) => (
              <Button key={mode} type="button" size="sm" variant={jobMode === mode ? "default" : "outline"} onClick={() => setJobMode(mode)}>
                {mode === "text" ? "Paste" : mode === "url" ? "URL" : "Manual skills"}
              </Button>
            ))}
          </div>
          {jobMode === "text" ? (
            <Field label="Job description" htmlFor="job-text" hint="At least 50 characters.">
              <Textarea id="job-text" value={jobText} onChange={(event) => setJobText(event.target.value)} />
            </Field>
          ) : null}
          {jobMode === "url" ? (
            <Field label="Job posting URL" htmlFor="job-url">
              <Input id="job-url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://" />
            </Field>
          ) : null}
          {jobMode === "manual" ? (
            <>
              <Field label="Required skills" htmlFor="required-skills" hint="Press Enter after each skill.">
                <ChipInput id="required-skills" values={requiredSkills} onChange={setRequiredSkills} />
              </Field>
              <Field label="Preferred skills" htmlFor="preferred-skills">
                <ChipInput id="preferred-skills" values={preferredSkills} onChange={setPreferredSkills} />
              </Field>
            </>
          ) : null}
          <Button type="button" onClick={() => void onCreateJob()} disabled={busy}>{busy ? "Saving…" : "Save job"}</Button>
        </div>
      </Modal>

      <Modal open={detail != null} onOpenChange={(open) => !open && setDetail(null)} title={detail?.skill_name ?? "Skill"}>
        {detail ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={GAP_VARIANT[detail.gap_level as keyof typeof GAP_VARIANT] ?? "outline"}>{titleCase(detail.gap_level)}</Badge>
              <Badge variant="outline">{titleCase(detail.importance_label)} importance</Badge>
              {detail.is_priority ? <Badge>High priority</Badge> : null}
            </div>
            <p>{detail.explanation || "The analysis did not include an explanation."}</p>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-muted-foreground">Current proficiency</dt><dd>{proficiencyLabel(detail.current_proficiency)}</dd></div>
              <div><dt className="text-muted-foreground">Required proficiency</dt><dd>{detail.required_proficiency == null ? "Not stated in the job descriptions" : proficiencyLabel(detail.required_proficiency)}</dd></div>
              <div><dt className="text-muted-foreground">Mentions</dt><dd>{detail.frequency} job description{detail.frequency === 1 ? "" : "s"}</dd></div>
              <div><dt className="text-muted-foreground">Required / preferred</dt><dd>{detail.required_count} / {detail.preferred_count}</dd></div>
            </dl>
            <div>
              <p className="font-medium">Where it appears</p>
              {detail.job_references.length === 0 ? <p className="text-muted-foreground">No job references were returned.</p> : (
                <ul className="mt-2 space-y-2">
                  {detail.job_references.map((ref, index) => (
                    <li key={`${ref.job_id}-${index}`} className="rounded-lg border border-border px-3 py-2">
                      <p className="font-medium">{ref.title || "Job description"}{ref.company ? ` · ${ref.company}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{titleCase(ref.requirement_type || "mentioned")}</p>
                      {ref.evidence ? <p className="mt-1">{ref.evidence}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
