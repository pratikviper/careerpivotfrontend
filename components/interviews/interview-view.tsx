"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { ScoreBars } from "@/components/charts/charts"
import { ChipInput } from "@/components/shared/chip-input"
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components/shared/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input, Select, Textarea } from "@/components/ui/input"
import { Field } from "@/components/ui/label"
import { ProgressBar } from "@/components/ui/progress"
import { errorMessage } from "@/lib/api"
import { formatDateTime, titleCase } from "@/lib/format"
import { EvaluationBreakdown, RubricPanel } from "@/components/interviews/rubric"
import { createInterview, evaluateInterview, getInterview, getRubric, listInterviews, submitAnswer } from "@/services/interview.service"
import { getProfile } from "@/services/profile.service"
import type { Interview, InterviewSummary, InterviewType, Rubric } from "@/types/api"

const CRITERIA = [
  ["technical_correctness", "Technical correctness"],
  ["conceptual_understanding", "Conceptual understanding"],
  ["problem_solving", "Problem solving"],
  ["communication", "Communication"],
  ["relevance", "Relevance"],
] as const

type Phase = "list" | "session" | "report"

export function InterviewView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [history, setHistory] = useState<InterviewSummary[]>([])
  const [role, setRole] = useState("")
  const [type, setType] = useState<InterviewType>("mixed")
  const [count, setCount] = useState("5")
  const [focus, setFocus] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>("list")
  const [interview, setInterview] = useState<Interview | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [working, setWorking] = useState<"idle" | "submit" | "evaluate" | "start">("idle")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [rows, profile] = await Promise.all([listInterviews(), getProfile()])
      setHistory(rows)
      setRole(profile.target_role ?? "")
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const question = interview?.questions[index]
  const progress = interview ? Math.round((interview.questions.filter((item) => item.evaluation).length / interview.questions.length) * 100) : 0

  const reportScores = useMemo(() => {
    const averages = interview?.summary.criteria_averages
    if (!averages) return []
    return CRITERIA.flatMap(([key, name]) => (typeof averages[key] === "number" ? [{ name, score: averages[key] as number }] : []))
  }, [interview])

  function ordered(next: Interview): Interview {
    return { ...next, questions: [...next.questions].sort((a, b) => a.order_index - b.order_index) }
  }

  async function start() {
    const num = Number(count)
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      toast.error("Choose between 1 and 10 questions.")
      return
    }
    setWorking("start")
    try {
      const created = await createInterview({
        target_role: role,
        interview_type: type,
        num_questions: num,
        focus_skills: focus,
      })
      setInterview(ordered(created))
      setIndex(0)
      setAnswer("")
      setPhase("session")
      setHistory(await listInterviews())
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking("idle")
    }
  }

  async function openExisting(id: number) {
    setWorking("start")
    try {
      const next = ordered(await getInterview(id))
      setInterview(next)
      if (next.status === "completed" || next.questions.every((item) => item.evaluation)) {
        setPhase("report")
      } else {
        const unanswered = next.questions.findIndex((item) => !item.answer_text)
        setIndex(unanswered === -1 ? 0 : unanswered)
        setAnswer("")
        setPhase("session")
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking("idle")
    }
  }

  async function onSubmit() {
    if (!interview || !question) return
    if (!answer.trim()) {
      toast.error("Write an answer before submitting.")
      return
    }
    setWorking("submit")
    try {
      await submitAnswer(interview.id, question.id, answer.trim())
      setWorking("evaluate")
      const evaluated = ordered(await evaluateInterview(interview.id, [question.id]))
      setInterview(evaluated)
      if (evaluated.adaptation?.proposal_plan_id) {
        toast.info(evaluated.adaptation.message, { description: evaluated.adaptation.reasons.join(" · "), duration: 10000 })
      }
      setHistory(await listInterviews())
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setWorking("idle")
    }
  }

  function goNext() {
    if (!interview) return
    if (index >= interview.questions.length - 1) {
      setPhase("report")
      return
    }
    const nextIndex = index + 1
    setIndex(nextIndex)
    setAnswer(interview.questions[nextIndex]?.answer_text ?? "")
  }

  useEffect(() => {
    void getRubric().then(setRubric).catch(() => setRubric(null))
  }, [])

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  if (phase === "session" && interview && question) {
    const feedback = question.evaluation
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <PageHeader
          eyebrow={`${titleCase(interview.interview_type)} · ${interview.target_role}`}
          title={`Question ${index + 1} of ${interview.questions.length}`}
          description="Submit an answer. The coach scores it before you move on. Scores appear only after evaluation."
          actions={<Button variant="ghost" onClick={() => setPhase("list")}>Exit</Button>}
        />
        <ProgressBar value={progress} label="Interview progress" />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline">{titleCase(question.category)}</Badge>
            <Badge variant="outline">{titleCase(question.difficulty)}</Badge>
            {question.skill_name ? <Badge>{question.skill_name}</Badge> : null}
          </div>
          <p className="text-lg leading-relaxed">{question.question_text}</p>
        </div>
        <Field label="Your answer" htmlFor="answer">
          <Textarea id="answer" className="min-h-48" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={working !== "idle" || Boolean(feedback)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void onSubmit()} disabled={working !== "idle" || Boolean(feedback)}>
            {working === "submit" ? "Submitting…" : working === "evaluate" ? "Evaluating…" : "Submit answer"}
          </Button>
          {feedback ? (
            <Button variant="outline" onClick={goNext}>{index >= interview.questions.length - 1 ? "View report" : "Next question"}</Button>
          ) : null}
        </div>
        {working === "evaluate" ? <p className="text-sm text-muted-foreground">Evaluating your answer…</p> : null}
        {!feedback ? <RubricPanel rubric={rubric} /> : null}
        {feedback ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
            <p className="text-base font-medium">This answer · {feedback.overall_score}/10</p>
            <EvaluationBreakdown evaluation={feedback} rubric={rubric} />
            {feedback.strengths.length > 0 ? <p><span className="font-medium">Strengths: </span>{feedback.strengths.join(" ")}</p> : null}
            {feedback.improvements.length > 0 ? <p><span className="font-medium">Improvements: </span>{feedback.improvements.join(" ")}</p> : null}
            {feedback.suggested_answer_improvements ? <p>{feedback.suggested_answer_improvements}</p> : null}
            {feedback.topics_to_revise.length > 0 ? <p><span className="font-medium">Revise: </span>{feedback.topics_to_revise.join(", ")}</p> : null}
            <p className="text-xs text-muted-foreground">Evaluator: {feedback.evaluator}</p>
          </div>
        ) : null}
      </div>
    )
  }

  if (phase === "report" && interview) {
    const summary = interview.summary
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={interview.target_role}
          title="Interview report"
          description={interview.overall_score == null ? "This interview does not have an overall score yet." : `Overall score ${interview.overall_score} / 10 from ${summary.evaluated_questions ?? interview.evaluated_count} evaluated answers.`}
          actions={<Button variant="outline" onClick={() => setPhase("list")}>Back to interviews</Button>}
        />
        {reportScores.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <ScoreBars data={reportScores} />
          </div>
        ) : (
          <EmptyState title="No criterion scores" description="Evaluate at least one answer to see the report chart." />
        )}
        <div className="space-y-3">
          <h2 className="font-medium">Answer by answer</h2>
          {interview.questions.filter((item) => item.evaluation).map((item) => (
            <details key={item.id} className="rounded-xl border border-border bg-card p-4 text-sm">
              <summary className="cursor-pointer font-medium">Q{item.order_index}. {item.question_text} · {item.evaluation?.overall_score}/10</summary>
              <div className="mt-3 space-y-3">
                {item.answer_text ? <p className="whitespace-pre-wrap text-muted-foreground">{item.answer_text}</p> : null}
                {item.evaluation ? <EvaluationBreakdown evaluation={item.evaluation} rubric={rubric} /> : null}
              </div>
            </details>
          ))}
        </div>
        <RubricPanel rubric={rubric} />
        <div className="grid gap-4 md:grid-cols-2">
          <ReportList title="Strengths" items={summary.top_strengths ?? []} empty="No strengths were recorded." />
          <ReportList title="Weakest skills" items={summary.weakest_skills ?? []} empty="No weak skills were flagged." />
          <ReportList title="Topics to revise" items={summary.recommended_topics_to_revise ?? []} empty="No revision topics were returned." />
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium">Suggested improvements</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {interview.questions.filter((item) => item.evaluation?.improvements.length).map((item) => (
                <li key={item.id}>
                  <span className="font-medium">Q{item.order_index}. </span>
                  {item.evaluation?.improvements.join(" ")}
                </li>
              ))}
              {interview.questions.every((item) => !item.evaluation?.improvements.length) ? <li className="text-muted-foreground">No improvement notes yet.</li> : null}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock interview"
        description="Choose a role and interview type. Each question is scored after you submit it. Question difficulty is assigned per question by the coach."
      />
      <RubricPanel rubric={rubric} defaultOpen />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <Field label="Target role" htmlFor="role" hint="Leave blank to use the role on your profile.">
            <Input id="role" value={role} onChange={(event) => setRole(event.target.value)} />
          </Field>
          <Field label="Interview type" htmlFor="type">
            <Select id="type" value={type} onChange={(event) => setType(event.target.value as InterviewType)}>
              <option value="mixed">Mixed</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
            </Select>
          </Field>
          <Field label="Number of questions" htmlFor="count">
            <Select id="count" value={count} onChange={(event) => setCount(event.target.value)}>
              {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </Select>
          </Field>
          <Field label="Focus skills" htmlFor="focus" hint="Optional. Press Enter after each skill. Blank uses your priority gaps.">
            <ChipInput id="focus" values={focus} onChange={setFocus} />
          </Field>
          <Button onClick={() => void start()} disabled={working !== "idle"}>{working === "start" ? "Starting…" : "Start interview"}</Button>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Past interviews</h2>
          {history.length === 0 ? (
            <EmptyState title="No interviews yet" description="Start one to practice. Scores stay empty until answers are evaluated." />
          ) : (
            history.map((item) => (
              <button key={item.id} type="button" onClick={() => void openExisting(item.id)} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-left hover:bg-accent/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.target_role}</p>
                  <Badge variant="outline">{item.overall_score == null ? "Not scored" : `${item.overall_score}/10`}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {titleCase(item.interview_type)} · {item.answered_count}/{item.question_count} answered · {formatDateTime(item.created_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ReportList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-medium">{title}</h2>
      {items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{empty}</p> : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul>
      )}
    </div>
  )
}
