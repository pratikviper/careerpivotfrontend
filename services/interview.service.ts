import { apiGet, apiPost } from "@/lib/api"
import type { Interview, InterviewSummary, InterviewType, Rubric } from "@/types/api"

export function listInterviews() {
  return apiGet<InterviewSummary[]>("/api/interviews")
}

export function getInterview(interviewId: number) {
  return apiGet<Interview>(`/api/interviews/${interviewId}`)
}

export function createInterview(body: {
  target_role?: string | null
  interview_type: InterviewType
  num_questions: number
  focus_skills?: string[]
}) {
  return apiPost<Interview>("/api/interviews", {
    target_role: body.target_role?.trim() || null,
    interview_type: body.interview_type,
    num_questions: body.num_questions,
    focus_skills: body.focus_skills ?? [],
  })
}

export function submitAnswer(interviewId: number, questionId: number, answerText: string) {
  return apiPost<Interview>(`/api/interviews/${interviewId}/answer`, {
    question_id: questionId,
    answer_text: answerText,
  })
}

export function evaluateInterview(interviewId: number, questionIds?: number[]) {
  return apiPost<Interview>(`/api/interviews/${interviewId}/evaluate`, {
    question_ids: questionIds ?? null,
  })
}

export function getRubric() {
  return apiGet<Rubric>("/api/interviews/rubric")
}
