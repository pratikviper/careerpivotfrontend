import { errorMessage } from "@/lib/api"
import { getRecommendations, listApplications } from "@/services/application.service"
import { listInterviews } from "@/services/interview.service"
import { listJobs } from "@/services/jobs.service"
import { getPlan, listPlans } from "@/services/learning.service"
import { getProfile } from "@/services/profile.service"
import { getProgress } from "@/services/progress.service"
import { getAnalysis, listAnalyses } from "@/services/skill-gap.service"
import type { Application, Recommendations, InterviewSummary, JobSummary, Plan, Profile, ProgressOverview, SkillGapReport } from "@/types/api"

export interface DashboardData {
  profile: Profile | null
  activePlan: Plan | null
  proposedPlans: Plan[]
  analysis: SkillGapReport | null
  interviews: InterviewSummary[]
  applications: Application[]
  recommendations: Recommendations | null
  progress: ProgressOverview | null
  jobs: JobSummary[]
  errors: string[]
}

async function settle<T>(label: string, promise: Promise<T>, errors: string[]): Promise<T | null> {
  try {
    return await promise
  } catch (error) {
    errors.push(`${label}: ${errorMessage(error)}`)
    return null
  }
}

export async function loadDashboard(): Promise<DashboardData> {
  const errors: string[] = []
  const [profile, planSummaries, analyses, interviews, applications, progress, jobs] = await Promise.all([
    settle("Profile", getProfile(), errors),
    settle("Learning plans", listPlans(), errors),
    settle("Skill gap", listAnalyses(), errors),
    settle("Interviews", listInterviews(), errors),
    settle("Applications", listApplications(), errors),
    settle("Progress", getProgress(false), errors),
    settle("Jobs", listJobs(), errors),
  ])

  const recommendations = await settle("Application insights", getRecommendations(), errors)
  const activeSummary = planSummaries?.find((plan) => plan.status === "active") ?? null
  const proposedSummaries = planSummaries?.filter((plan) => plan.status === "proposed") ?? []
  const proposedPlans = (
    await Promise.all(proposedSummaries.slice(0, 1).map((plan) => settle("Proposed plan", getPlan(plan.id), errors)))
  ).filter((plan): plan is Plan => plan !== null)
  const activePlan = activeSummary ? await settle("Active plan", getPlan(activeSummary.id), errors) : null
  const latest = analyses?.[0]
  const analysis = latest ? await settle("Skill gap report", getAnalysis(latest.id), errors) : null

  return {
    profile,
    activePlan,
    proposedPlans,
    analysis,
    interviews: interviews ?? [],
    applications: applications ?? [],
    recommendations,
    progress,
    jobs: jobs ?? [],
    errors,
  }
}
