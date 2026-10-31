"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { errorMessage } from "@/lib/api"
import { titleCase } from "@/lib/format"
import { listProjects, recommendProjects, updateProject } from "@/services/projects.service"
import type { Project, ProjectStatus } from "@/types/api"

const STATUS_LABEL: Record<string, string> = {
  recommended: "Saved",
  in_progress: "Started",
  completed: "Completed",
  dismissed: "Dismissed",
}

export function ProjectsView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [busy, setBusy] = useState(false)
  const [difficulty, setDifficulty] = useState("all")
  const [skill, setSkill] = useState("all")
  const [status, setStatus] = useState("all")
  const [selected, setSelected] = useState<Project | null>(null)

  async function load() {
    setLoading(true)
    setError("")
    try {
      setProjects(await listProjects())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const skills = useMemo(() => Array.from(new Set(projects.flatMap((project) => project.skills_covered))).sort(), [projects])
  const visible = projects.filter((project) => {
    if (difficulty !== "all" && project.difficulty !== difficulty) return false
    if (status !== "all" && project.status !== status) return false
    if (skill !== "all" && !project.skills_covered.includes(skill)) return false
    return true
  })

  async function recommend() {
    setBusy(true)
    try {
      const created = await recommendProjects({ count: 3 })
      setProjects((current) => {
        const ids = new Set(created.map((project) => project.id))
        return [...created, ...current.filter((project) => !ids.has(project.id))]
      })
      toast.success(created.length ? "Project recommendations are ready." : "No projects were returned.")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function setProjectStatus(project: Project, next: ProjectStatus) {
    try {
      const updated = await updateProject(project.id, { status: next })
      setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSelected((current) => (current?.id === updated.id ? updated : current))
      toast.success(next === "recommended" ? "Project saved." : `Marked as ${STATUS_LABEL[next].toLowerCase()}.`)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio projects"
        description="Recommendations are based on your latest skill-gap analysis. Saving, starting, and completing a project updates its status."
        actions={<Button onClick={() => void recommend()} disabled={busy}>{busy ? "Finding projects…" : "Recommend projects"}</Button>}
      />

      <div className="flex flex-wrap gap-2">
        <Select aria-label="Difficulty" className="w-40" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="all">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
        <Select aria-label="Skill" className="w-48" value={skill} onChange={(event) => setSkill(event.target.value)}>
          <option value="all">All skills</option>
          {skills.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <Select aria-label="Status" className="w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="recommended">Saved</option>
          <option value="in_progress">Started</option>
          <option value="completed">Completed</option>
          <option value="dismissed">Dismissed</option>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No projects to show" description="Recommend projects after a skill-gap analysis, or clear the filters." action={<Button onClick={() => void recommend()} disabled={busy}>Recommend projects</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((project) => (
            <article key={project.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold tracking-tight">{project.title}</h2>
                <Badge variant={project.status === "completed" ? "success" : project.status === "in_progress" ? "warning" : "secondary"}>{STATUS_LABEL[project.status] ?? project.status}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.skills_covered.slice(0, 4).map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{titleCase(project.difficulty)}{project.estimated_hours ? ` · about ${project.estimated_hours}h` : ""} · {project.tech_stack.slice(0, 3).join(", ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(project)}>Details</Button>
                <Button size="sm" variant="outline" disabled={project.status === "recommended"} onClick={() => void setProjectStatus(project, "recommended")}>Save</Button>
                <Button size="sm" variant="outline" disabled={project.status === "in_progress"} onClick={() => void setProjectStatus(project, "in_progress")}>Start</Button>
                <Button size="sm" disabled={project.status === "completed"} onClick={() => void setProjectStatus(project, "completed")}>Complete</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={selected != null} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title ?? "Project"}>
        {selected ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">{selected.problem_statement}</p>
            <p>{selected.description}</p>
            <div>
              <p className="font-medium">Skills</p>
              <p>{selected.skills_covered.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium">Stack</p>
              <p>{selected.tech_stack.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium">Core features</p>
              <ul className="list-disc pl-5">{selected.core_features.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium">Deliverables</p>
              <ul className="list-disc pl-5">{selected.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <p className="text-muted-foreground">{titleCase(selected.difficulty)}{selected.estimated_hours ? ` · ${selected.estimated_hours} hours` : ""}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void setProjectStatus(selected, "recommended")}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => void setProjectStatus(selected, "in_progress")}>Mark started</Button>
              <Button size="sm" onClick={() => void setProjectStatus(selected, "completed")}>Mark completed</Button>
              <Button size="sm" variant="ghost" onClick={() => void setProjectStatus(selected, "dismissed")}>Dismiss</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
