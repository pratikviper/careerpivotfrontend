"use client"

import { Badge } from "@/components/ui/badge"
import type { AnswerEvaluation, Rubric } from "@/types/api"

/** "How answers are scored": the five dimensions, the 1-5 levels and what each level means. */
export function RubricPanel({ rubric, defaultOpen = false }: { rubric: Rubric | null; defaultOpen?: boolean }) {
  if (!rubric) return null
  return (
    <details open={defaultOpen} className="rounded-xl border border-border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium">How your answers are scored</summary>
      <p className="mt-3 text-muted-foreground">{rubric.description}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Dimension</th>
              {rubric.levels.map((level) => (
                <th key={level.level} className="px-2 py-2 font-medium">
                  {level.level} · {level.label}
                  <span className="block font-normal">score {level.min}–{level.max}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((criterion) => (
              <tr key={criterion.id} className="border-t border-border align-top">
                <th className="py-2 pr-3 font-medium">
                  {criterion.name}
                  <span className="block font-normal text-muted-foreground">{criterion.question}</span>
                </th>
                {rubric.levels.map((level) => (
                  <td key={level.level} className="px-2 py-2 text-muted-foreground">{criterion.anchors[String(level.level)]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
        {rubric.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </details>
  )
}

/** Score, 1-5 level, what that level means and the quote from the answer behind it, for every dimension. */
export function EvaluationBreakdown({ evaluation, rubric }: { evaluation: AnswerEvaluation; rubric: Rubric | null }) {
  const criteria = rubric?.criteria ?? []
  if (criteria.length === 0) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(evaluation.scores).map(([key, value]) => (
          <p key={key}><span className="text-muted-foreground">{key.replace(/_/g, " ")}: </span>{value}/10</p>
        ))}
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {criteria.map((criterion) => {
        const score = evaluation.scores[criterion.id as keyof AnswerEvaluation["scores"]]
        const level = evaluation.levels?.[criterion.id]
        const label = rubric?.levels.find((item) => item.level === level)?.label
        const quote = evaluation.evidence?.[criterion.id]
        return (
          <li key={criterion.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{criterion.name}</span>
              <Badge variant="outline">{score ?? "—"}/10</Badge>
              {level ? <Badge>{`Level ${level}${label ? ` · ${label}` : ""}`}</Badge> : null}
            </div>
            {level ? <p className="mt-1 text-xs text-muted-foreground">{criterion.anchors[String(level)]}</p> : null}
            {quote ? (
              <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm italic">“{quote}”</blockquote>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No sentence in your answer clearly supports this score.</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
