"use client"

import { formResolver } from "@/lib/form-resolver"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { ChipInput } from "@/components/shared/chip-input"
import { ErrorState, PageHeader, PageSkeleton } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { ProgressBar } from "@/components/ui/progress"
import { errorMessage } from "@/lib/api"
import { formatDateTime } from "@/lib/format"
import { getProfile, updateProfile, uploadResume } from "@/services/profile.service"
import type { Certification, Education, ExperienceLevel, Profile, ResumeProject, WorkExperience } from "@/types/api"

const schema = z.object({
  current_role: z.string().max(200),
  target_role: z.string().max(200),
  experience_level: z.enum(["", "entry", "junior", "mid", "senior", "lead"]),
  years_experience: z.string(),
  weekly_hours: z.string(),
  summary: z.string().max(2000),
  experience_notes: z.string().max(5000),
})

type FormValues = z.infer<typeof schema>
type SkillDraft = { name: string; proficiency: string }

const EMPTY_WORK: WorkExperience = { title: "", company: "", start: "", end: "", highlights: [] }
const EMPTY_EDU: Education = { degree: "", institution: "", year: "" }
const EMPTY_PROJECT: ResumeProject = { name: "", description: "", technologies: [] }
const EMPTY_CERT: Certification = { name: "", issuer: "", year: "" }

function toForm(profile: Profile): FormValues {
  return {
    current_role: profile.current_role ?? "",
    target_role: profile.target_role ?? "",
    experience_level: (profile.experience_level as FormValues["experience_level"]) || "",
    years_experience: profile.years_experience == null ? "" : String(profile.years_experience),
    weekly_hours: String(profile.weekly_hours ?? 8),
    summary: profile.summary ?? "",
    experience_notes: profile.experience_notes ?? "",
  }
}

export function ProfileView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [parseStatus, setParseStatus] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [needsReview, setNeedsReview] = useState(false)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [phase, setPhase] = useState<"idle" | "uploading" | "extracting">("idle")
  const [progress, setProgress] = useState(0)
  const [skills, setSkills] = useState<SkillDraft[]>([])
  const [softSkills, setSoftSkills] = useState<string[]>([])
  const [work, setWork] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [projects, setProjects] = useState<ResumeProject[]>([])
  const [certs, setCerts] = useState<Certification[]>([])

  const form = useForm<FormValues>({
    resolver: formResolver(schema),
    defaultValues: toForm({
      current_role: "",
      target_role: "",
      experience_level: null,
      years_experience: null,
      weekly_hours: 8,
      summary: "",
      experience_notes: "",
      soft_skills: [],
      work_experience: [],
      education: [],
      projects: [],
      certifications: [],
      skills: [],
      active_resume: null,
      needs_review: false,
    }),
  })

  function applyProfile(profile: Profile) {
    form.reset(toForm(profile))
    setSkills(profile.skills.map((skill) => ({ name: skill.name, proficiency: skill.proficiency == null ? "" : String(skill.proficiency) })))
    setSoftSkills(profile.soft_skills ?? [])
    setWork(profile.work_experience ?? [])
    setEducation(profile.education ?? [])
    setProjects(profile.projects ?? [])
    setCerts(profile.certifications ?? [])
    setNeedsReview(profile.needs_review)
    setResumeName(profile.active_resume?.filename ?? null)
    setParseStatus(profile.active_resume?.parse_status ?? null)
    setWarnings(profile.active_resume?.validation_warnings ?? [])
    setUploadedAt(profile.active_resume?.created_at ?? null)
  }

  async function load() {
    setLoading(true)
    setError("")
    try {
      applyProfile(await getProfile())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onUpload(file: File | undefined) {
    if (!file) return
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      toast.error("Upload a PDF or Word (.docx) resume. Old .doc files are not supported.")
      return
    }
    setPhase("uploading")
    setProgress(0)
    try {
      const resume = await uploadResume(file, (percent) => {
        setProgress(percent)
        if (percent >= 100) setPhase("extracting")
      })
      setPhase("extracting")
      if (resume.parse_status !== "parsed") {
        toast.message("Resume received. Parsing is not finished yet.")
      }
      applyProfile(await getProfile())
      toast.success("Resume extracted. Review the fields, then save.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setPhase("idle")
      setProgress(0)
    }
  }

  async function onSubmit(values: FormValues) {
    const years = values.years_experience.trim()
    const hours = Number(values.weekly_hours)
    if (years && (Number.isNaN(Number(years)) || Number(years) < 0 || Number(years) > 60)) {
      form.setError("years_experience", { message: "Enter years between 0 and 60." })
      return
    }
    if (!Number.isInteger(hours) || hours < 1 || hours > 80) {
      form.setError("weekly_hours", { message: "Weekly hours must be a whole number from 1 to 80." })
      return
    }
    const cleanSkills = skills
      .map((skill) => ({ name: skill.name.trim(), proficiency: skill.proficiency ? Number(skill.proficiency) : null }))
      .filter((skill) => skill.name)
    if (cleanSkills.some((skill) => skill.proficiency != null && (skill.proficiency < 1 || skill.proficiency > 5))) {
      toast.error("Skill proficiency must be between 1 and 5.")
      return
    }
    try {
      const saved = await updateProfile({
        current_role: values.current_role.trim() || null,
        target_role: values.target_role.trim() || null,
        experience_level: (values.experience_level || null) as ExperienceLevel | null,
        years_experience: years ? Number(years) : null,
        weekly_hours: hours,
        summary: values.summary.trim() || null,
        experience_notes: values.experience_notes.trim() || null,
        soft_skills: softSkills,
        skills: cleanSkills,
        work_experience: work.filter((item) => item.title || item.company),
        education: education.filter((item) => item.degree || item.institution),
        projects: projects.filter((item) => item.name),
        certifications: certs.filter((item) => item.name),
      })
      applyProfile(saved)
      toast.success("Profile saved. Extracted skills are confirmed.")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <PageHeader
        eyebrow="Step 1 · Resume, then confirm"
        title="My profile"
        description="Upload a PDF or Word resume, correct anything the parser missed, and save. Saving confirms your skill list."
        actions={
          <Button type="submit" disabled={form.formState.isSubmitting || phase !== "idle"}>
            {form.formState.isSubmitting ? "Saving…" : "Save profile"}
          </Button>
        }
      />

      {needsReview ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Some skills were extracted from your resume and are not confirmed yet. Review them and save.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <p className="text-sm text-muted-foreground">PDF or Word (.docx), up to 5 MB. Parsing runs after the upload finishes.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Upload resume" htmlFor="resume">
            <Input
              id="resume"
              type="file"
              accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={phase !== "idle"}
              onChange={(event) => {
                const file = event.target.files?.[0]
                void onUpload(file)
                event.target.value = ""
              }}
            />
          </Field>
          {phase !== "idle" ? (
            <div className="space-y-2">
              <p className="text-sm">{phase === "uploading" ? `Uploading… ${progress}%` : "Extracting resume text and skills…"}</p>
              <ProgressBar value={phase === "extracting" ? 100 : progress} label="Resume upload" />
            </div>
          ) : null}
          {resumeName ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{resumeName}</span>
              <Badge variant={parseStatus === "parsed" ? "success" : "warning"}>{parseStatus ?? "unknown"}</Badge>
              {uploadedAt ? <span className="text-muted-foreground">{formatDateTime(uploadedAt)}</span> : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
          )}
          {warnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Current role" htmlFor="current_role" error={form.formState.errors.current_role?.message}>
            <Input id="current_role" {...form.register("current_role")} />
          </Field>
          <Field label="Target role" htmlFor="target_role" error={form.formState.errors.target_role?.message}>
            <Input id="target_role" {...form.register("target_role")} />
          </Field>
          <Field label="Experience level" htmlFor="experience_level">
            <Select id="experience_level" {...form.register("experience_level")}>
              <option value="">Not set</option>
              <option value="entry">Entry</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </Select>
          </Field>
          <Field label="Years of experience" htmlFor="years_experience" error={form.formState.errors.years_experience?.message}>
            <Input id="years_experience" inputMode="decimal" {...form.register("years_experience")} />
          </Field>
          <Field label="Weekly study hours" htmlFor="weekly_hours" error={form.formState.errors.weekly_hours?.message} hint="Used as the default when a learning plan is generated.">
            <Input id="weekly_hours" inputMode="numeric" {...form.register("weekly_hours")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Summary" htmlFor="summary">
              <Textarea id="summary" {...form.register("summary")} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Experience notes" htmlFor="experience_notes">
              <Textarea id="experience_notes" {...form.register("experience_notes")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical skills</CardTitle>
          <p className="text-sm text-muted-foreground">Proficiency is 1 (aware) through 5 (expert). Leave it blank if you are unsure.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.map((skill, index) => (
            <div key={`${skill.name}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
              <Input
                aria-label={`Skill ${index + 1}`}
                value={skill.name}
                onChange={(event) => setSkills(skills.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))}
              />
              <Select
                aria-label={`Proficiency for ${skill.name || "skill"}`}
                value={skill.proficiency}
                onChange={(event) => setSkills(skills.map((item, i) => (i === index ? { ...item, proficiency: event.target.value } : item)))}
              >
                <option value="">Not scored</option>
                <option value="1">1 · Aware</option>
                <option value="2">2 · Familiar</option>
                <option value="3">3 · Working</option>
                <option value="4">4 · Strong</option>
                <option value="5">5 · Expert</option>
              </Select>
              <Button type="button" variant="ghost" onClick={() => setSkills(skills.filter((_, i) => i !== index))}>
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setSkills([...skills, { name: "", proficiency: "" }])}>
            Add skill
          </Button>
          <Field label="Soft skills" htmlFor="soft-skills" hint="Press Enter to add each skill.">
            <ChipInput id="soft-skills" values={softSkills} onChange={setSoftSkills} placeholder="Communication" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extracted experience</CardTitle>
          <p className="text-sm text-muted-foreground">Edit anything the resume parser got wrong before you save.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Work experience</h3>
            {work.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-2">
                <Input aria-label="Job title" placeholder="Title" value={item.title} onChange={(event) => setWork(work.map((row, i) => (i === index ? { ...row, title: event.target.value } : row)))} />
                <Input aria-label="Company" placeholder="Company" value={item.company} onChange={(event) => setWork(work.map((row, i) => (i === index ? { ...row, company: event.target.value } : row)))} />
                <Input aria-label="Start" placeholder="Start" value={item.start ?? ""} onChange={(event) => setWork(work.map((row, i) => (i === index ? { ...row, start: event.target.value } : row)))} />
                <Input aria-label="End" placeholder="End" value={item.end ?? ""} onChange={(event) => setWork(work.map((row, i) => (i === index ? { ...row, end: event.target.value } : row)))} />
                <div className="md:col-span-2">
                  <Textarea aria-label="Highlights" placeholder="One highlight per line" value={item.highlights.join("\n")} onChange={(event) => setWork(work.map((row, i) => (i === index ? { ...row, highlights: event.target.value.split("\n").filter(Boolean) } : row)))} />
                </div>
                <Button type="button" variant="ghost" onClick={() => setWork(work.filter((_, i) => i !== index))}>Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setWork([...work, { ...EMPTY_WORK, highlights: [] }])}>Add role</Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Education</h3>
            {education.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-3">
                <Input aria-label="Degree" placeholder="Degree" value={item.degree} onChange={(event) => setEducation(education.map((row, i) => (i === index ? { ...row, degree: event.target.value } : row)))} />
                <Input aria-label="Institution" placeholder="Institution" value={item.institution} onChange={(event) => setEducation(education.map((row, i) => (i === index ? { ...row, institution: event.target.value } : row)))} />
                <Input aria-label="Year" placeholder="Year" value={item.year ?? ""} onChange={(event) => setEducation(education.map((row, i) => (i === index ? { ...row, year: event.target.value } : row)))} />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setEducation([...education, { ...EMPTY_EDU }])}>Add education</Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Projects on your resume</h3>
            {projects.map((item, index) => (
              <div key={index} className="grid gap-2">
                <Input aria-label="Project name" placeholder="Name" value={item.name} onChange={(event) => setProjects(projects.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))} />
                <Textarea aria-label="Project description" placeholder="Description" value={item.description} onChange={(event) => setProjects(projects.map((row, i) => (i === index ? { ...row, description: event.target.value } : row)))} />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setProjects([...projects, { ...EMPTY_PROJECT, technologies: [] }])}>Add project</Button>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Certifications</h3>
            {certs.map((item, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-3">
                <Input aria-label="Certification" placeholder="Name" value={item.name} onChange={(event) => setCerts(certs.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))} />
                <Input aria-label="Issuer" placeholder="Issuer" value={item.issuer ?? ""} onChange={(event) => setCerts(certs.map((row, i) => (i === index ? { ...row, issuer: event.target.value } : row)))} />
                <Input aria-label="Year" placeholder="Year" value={item.year ?? ""} onChange={(event) => setCerts(certs.map((row, i) => (i === index ? { ...row, year: event.target.value } : row)))} />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setCerts([...certs, { ...EMPTY_CERT }])}>Add certification</Button>
          </section>
        </CardContent>
      </Card>
    </form>
  )
}
