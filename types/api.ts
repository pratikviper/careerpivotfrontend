export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead"
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped"
export type ProjectStatus = "recommended" | "in_progress" | "completed" | "dismissed"
export type ApplicationStatus = "applied" | "interview" | "rejected" | "offer"
export type GapLevel = "none" | "partial" | "missing"
export type InterviewType = "technical" | "behavioral" | "mixed"
export type PlanStatus = "active" | "proposed" | "archived" | "rejected" | "superseded"

export interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserSkill {
  skill_id: number
  name: string
  category: string
  proficiency: number | null
  source: string
  confirmed: boolean
  evidence: string | null
}

export interface WorkExperience {
  title: string
  company: string
  start: string | null
  end: string | null
  highlights: string[]
}

export interface Education {
  degree: string
  institution: string
  year: string | null
}

export interface ResumeProject {
  name: string
  description: string
  technologies: string[]
}

export interface Certification {
  name: string
  issuer: string | null
  year: string | null
}

export interface ResumeExtraction {
  current_role?: string | null
  years_experience?: number | null
  summary?: string | null
  technical_skills?: Array<{ name: string; evidence?: string; proficiency_hint?: number | null }>
  soft_skills?: string[]
  work_experience?: WorkExperience[]
  education?: Education[]
  projects?: ResumeProject[]
  certifications?: Certification[]
}

export interface Resume {
  id: number
  filename: string
  size_bytes: number
  page_count: number
  parse_status: string
  generated_by: string | null
  parsed_data: ResumeExtraction
  validation_warnings: string[]
  is_active: boolean
  created_at: string
}

export interface Profile {
  current_role: string | null
  target_role: string | null
  experience_level: string | null
  years_experience: number | null
  weekly_hours: number
  summary: string | null
  experience_notes: string | null
  soft_skills: string[]
  work_experience: WorkExperience[]
  education: Education[]
  projects: ResumeProject[]
  certifications: Certification[]
  skills: UserSkill[]
  active_resume: Resume | null
  needs_review: boolean
}

export interface ProfileUpdate {
  current_role?: string | null
  target_role?: string | null
  experience_level?: ExperienceLevel | null
  years_experience?: number | null
  weekly_hours?: number | null
  summary?: string | null
  experience_notes?: string | null
  soft_skills?: string[] | null
  work_experience?: WorkExperience[] | null
  education?: Education[] | null
  projects?: ResumeProject[] | null
  certifications?: Certification[] | null
  skills?: Array<{ name: string; proficiency: number | null }> | null
}

export interface JobRequirement {
  skill_id: number
  skill_name: string
  category: string
  requirement_type: "required" | "preferred"
  kind: string
  required_proficiency: number | null
  evidence: string | null
}

export interface JobSummary {
  id: number
  title: string
  company: string | null
  source_type: string
  source_provider?: string | null
  role_family?: string | null
  source_url: string | null
  generated_by: string | null
  required_count: number
  preferred_count: number
  created_at: string
}

export interface Job {
  id: number
  title: string
  company: string | null
  source_type: string
  source_url: string | null
  raw_text: string
  structured_data: Record<string, unknown>
  extracted_at: string | null
  generated_by: string | null
  extraction_warnings: string[]
  requirements: JobRequirement[]
  created_at: string
}

export interface JobCreate {
  title: string
  company?: string | null
  text?: string | null
  source_url?: string | null
  required_skills?: string[]
  preferred_skills?: string[]
}

export interface JobReference {
  job_id?: number
  title?: string
  company?: string | null
  requirement_type?: string
  evidence?: string | null
}

export interface SkillGapItem {
  skill_id: number
  skill_name: string
  category: string
  current_proficiency: number | null
  required_proficiency: number | null
  gap_level: GapLevel | string
  importance: number
  importance_label: string
  frequency: number
  required_count: number
  preferred_count: number
  priority_rank: number
  is_priority: boolean
  explanation: string
  job_references: JobReference[]
}

export interface SkillGapReport {
  id: number
  target_role: string | null
  job_description_ids: number[]
  /** How many postings the report is based on. */
  job_count: number
  job_sources: Record<string, number>
  role_family: string | null
  /** e.g. "Based on 20 job postings (20 seed)" */
  based_on: string
  match_score: number
  summary: string | null
  generated_by: string | null
  created_at: string
  items: SkillGapItem[]
}

export interface MarketImportResult {
  source: "seed" | "jsearch" | "adzuna"
  requested_role: string
  role_family: string | null
  imported: number
  skipped_duplicates: number
  job_ids: number[]
  cached: boolean
  fallback_reason: string | null
  notes: string[]
}

export interface SkillGapSummary {
  id: number
  target_role: string | null
  job_description_ids: number[]
  match_score: number
  created_at: string
}

/** A link from the curated list, or a labelled search link when a skill has no curated list. */
export interface Resource {
  id: string
  title: string
  url: string
  type: "docs" | "course" | "interactive" | "book" | "video" | "article" | "search" | string
  hours: number | null
  provider: string | null
}

export interface WeeklyTask {
  id: number
  week_number: number
  skill_name: string
  title: string
  topics: string[]
  activities: string[]
  exercises: string[]
  resources?: Resource[]
  estimated_hours: number
  expected_outcome: string
  status: TaskStatus | string
  completed_at: string | null
  difficulty_rating: number | null
  notes: string | null
}

export interface PlanWeek {
  week_number: number
  start_date: string
  total_hours: number
  skills: string[]
  tasks: WeeklyTask[]
}

export interface PlanProgress {
  total_tasks: number
  completed_tasks: number
  percent_complete: number
}

export interface PlanChangeSummary {
  compared_to_plan_id?: number
  added_skills?: string[]
  removed_skills?: string[]
  kept_skills?: string[]
  weeks_before?: number
  weeks_after?: number
  completed_tasks_carried_over?: number
  hours_changes?: Record<string, { before: number; after: number }>
  struggling_skills?: string[]
  focus_skills?: string[]
  deferred?: string[]
  /** Human-readable "why" lines, e.g. "Docker: mock-interview score 0.2/10 -> +6h (12h to 18h), starts week 1". */
  reasons?: string[]
  dropped_skills?: string[]
  triggered_by?: string
}

export interface ProficiencyUpdate {
  skill_name: string
  before: number
  after: number
  evidence: string
}

/** What the closed loop did after new evidence (interview, assessment, task update) arrived. */
export interface Adaptation {
  trigger: string
  proficiency_updates: ProficiencyUpdate[]
  gaps_recomputed: boolean
  proposal_plan_id: number | null
  reasons: string[]
  message: string
}

export interface PlanSummary {
  id: number
  version: number
  status: PlanStatus | string
  title: string
  target_role: string | null
  weekly_hours: number
  total_weeks: number
  start_date: string
  parent_plan_id: number | null
  generated_by: string | null
  progress: PlanProgress
  created_at: string
}

export interface Plan extends PlanSummary {
  analysis_id: number | null
  summary: string | null
  adjustment_reason: string | null
  change_summary: PlanChangeSummary
  weeks: PlanWeek[]
}

export interface TaskUpdate {
  status?: TaskStatus
  notes?: string | null
  difficulty_rating?: number | null
  title?: string
  estimated_hours?: number
}

export interface Project {
  id: number
  analysis_id: number | null
  title: string
  problem_statement: string
  description: string
  skills_covered: string[]
  tech_stack: string[]
  core_features: string[]
  difficulty: string
  deliverables: string[]
  estimated_hours: number | null
  /** Which curated template this came from (null for the generic fallback). */
  template_id?: string | null
  /** Which of your gaps it closes, in priority order. */
  gaps_covered?: string[]
  status: ProjectStatus | string
  repo_url: string | null
  notes: string | null
  generated_by: string | null
  completed_at: string | null
  created_at: string
}

export interface EvaluationScores {
  technical_correctness?: number
  conceptual_understanding?: number
  problem_solving?: number
  communication?: number
  relevance?: number
}

export interface RubricLevel {
  level: number
  label: string
  min: number
  max: number
}

export interface RubricCriterion {
  id: string
  name: string
  question: string
  /** keys "1".."5" */
  anchors: Record<string, string>
}

export interface Rubric {
  version: string
  title: string
  description: string
  scale: { min: number; max: number }
  levels: RubricLevel[]
  rules: string[]
  notes: string[]
  criteria: RubricCriterion[]
}

export interface AnswerEvaluation {
  rubric_version: string
  scores: EvaluationScores
  /** 1-5 level of each score, per the rubric bands */
  levels?: Record<string, number>
  /** criterion -> quote from the candidate's answer that supports the score (verified server-side) */
  evidence?: Record<string, string>
  overall_score: number
  strengths: string[]
  improvements: string[]
  suggested_answer_improvements: string
  topics_to_revise: string[]
  evaluator: string
}

export interface InterviewQuestion {
  id: number
  order_index: number
  question_text: string
  skill_name: string | null
  category: string
  difficulty: string
  key_points: string[] | null
  answer_text: string | null
  answered_at: string | null
  evaluation: AnswerEvaluation | null
}

export interface InterviewSummaryStats {
  evaluated_questions?: number
  criteria_averages?: EvaluationScores
  score_by_skill?: Record<string, number>
  weakest_skills?: string[]
  top_strengths?: string[]
  recommended_topics_to_revise?: string[]
  evaluators_used?: string[]
}

export interface InterviewSummary {
  id: number
  target_role: string
  interview_type: string
  status: string
  overall_score: number | null
  question_count: number
  answered_count: number
  evaluated_count: number
  generated_by: string | null
  created_at: string
}

export interface Interview extends InterviewSummary {
  summary: InterviewSummaryStats
  questions: InterviewQuestion[]
  adaptation?: Adaptation | null
}

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1001+"
export type ApplicationChannel = "referral" | "direct" | "job_board" | "recruiter" | "other"
export type WorkMode = "remote" | "hybrid" | "onsite"

export interface Application {
  id: number
  company_name: string
  role_title: string
  job_description_id: number | null
  job_description_text: string | null
  applied_date: string
  status: ApplicationStatus | string
  reached_interview: boolean
  experience_level: string | null
  skills_highlighted: string[]
  posting_url: string | null
  role_family: string | null
  industry: string | null
  company_size: CompanySize | null
  channel: ApplicationChannel | null
  resume_version: string | null
  work_mode: WorkMode | null
  location: string | null
  notes: string | null
  interview_feedback: string | null
  outcome: string | null
  outcome_date: string | null
  status_changed_at: string | null
  created_at: string
  updated_at: string
}

export interface RateStat {
  n: number
  responses?: number
  response_rate: number | null
  ci95: [number, number] | null
  sufficient_data?: boolean
}

export interface OfferRate {
  n: number
  offers: number
  rate: number | null
  ci95: [number, number] | null
}

export interface ApplicationStats {
  total_applications: number
  by_status: Record<string, number>
  conversion: {
    application_to_interview: RateStat
    application_to_offer: OfferRate
    interview_to_offer: OfferRate
  }
  by_role: Record<string, RateStat>
  by_experience_level: Record<string, RateStat>
  by_role_family?: Record<string, RateStat>
  by_industry?: Record<string, RateStat>
  by_company_size?: Record<string, RateStat>
  by_channel?: Record<string, RateStat>
  by_resume_version?: Record<string, RateStat>
  by_work_mode?: Record<string, RateStat>
  skills_vs_response: Array<{ skill: string; with: RateStat; without: RateStat; difference: number }>
  skill_combinations: Array<RateStat & { skills: string[] }>
  data_sufficiency: {
    sufficient: boolean
    minimum_total: number
    minimum_group: number
    message: string
  }
  disclaimer: string
}

export interface ApplicationAnalytics {
  stats: ApplicationStats
  narrative: { summary: string; observations: string[] }
  generated_by: string
}

export interface ApplicationInput {
  company_name: string
  role_title: string
  applied_date: string
  status: ApplicationStatus
  job_description_id?: number | null
  job_description_text?: string | null
  experience_level?: ExperienceLevel | null
  skills_highlighted?: string[]
  posting_url?: string | null
  industry?: string | null
  company_size?: CompanySize | null
  channel?: ApplicationChannel | null
  resume_version?: string | null
  work_mode?: WorkMode | null
  location?: string | null
  notes?: string | null
}

export interface Insight {
  dimension: string
  dimension_label: string
  group: string
  label: string
  direction: "higher" | "lower"
  /** "reliable": the 95% intervals of the group and all other applications do not overlap. */
  confidence: "reliable" | "early_signal"
  n: number
  responses: number
  response_rate: number
  ci95: [number, number]
  rest_n: number
  rest_response_rate: number
  rest_ci95: [number, number]
  difference: number
  text: string
  suggestion: string
}

export interface Recommendations {
  n_applications: number
  n_counted: number
  excluded_recent_pending: number
  baseline_response_rate: number | null
  baseline_ci95: [number, number] | null
  sufficient_data: boolean
  message: string
  insights: Insight[]
  disclaimer: string
}

export interface Assessment {
  id: number
  skill_name: string | null
  proficiency: number | null
  previous_proficiency: number | null
  assessment_method: string | null
  notes: string | null
  created_at: string
  adaptation?: Adaptation | null
}

export interface Struggle {
  area: string
  signal: string
  evidence: string
  recommendation: string
  skill_name: string | null
}

export interface ProgressOverview {
  plan: {
    plan_id: number | null
    total_tasks: number
    completed: number
    pending: number
    in_progress: number
    skipped: number
    overdue: number
    percent_complete: number
    hours_completed: number
    hours_total: number
  }
  consistency: {
    weeks_elapsed: number
    active_weeks: number
    consistency_rate: number | null
    current_streak_weeks: number
    last_activity_at: string | null
  }
  skills: Array<{
    skill_name: string
    first_level: number
    latest_level: number
    change: number
    assessments: number
  }>
  interviews: {
    interviews_evaluated: number
    average_score: number | null
    trend: Array<{ interview_id?: number; date?: string; score?: number }>
    score_by_skill: Record<string, number>
  }
  projects: Record<string, number>
  struggling_areas: Struggle[]
  insights: {
    summary: string
    struggling_areas: Array<{ area: string; evidence: string; recommendation: string }>
    recommended_adjustments: string[]
  } | null
  insights_generated_by: string | null
}

export interface RecalculateResult {
  struggling_areas: Struggle[]
  proposed_plan: Plan
  note: string
}
