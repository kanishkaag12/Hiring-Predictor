/**
 * Pillar-based Probability Engine
 * - Uses 5 pillars with fixed weights
 * - Returns probabilistic, advisory outputs (never guarantees)
 */

import { User, Skill, Project, Experience } from "@shared/schema";
import { Job } from "../jobs/job.types";

export interface PillarScores {
  profileMatch: number;
  skillFit: number;
  marketContext: number;
  companySignals: number;
  userBehavior: number;
}

export interface ProbabilityResult {
  probability: number; // 0-100
  confidenceBand: "Low" | "Medium" | "High";
  pillars: PillarScores;
  strengths: string[];
  neutrals: string[];
  weaknesses: string[];
  actions: string[];
  explanation: string; // short summary aligned with probability
}

export interface ProbabilityContext {
  // Market & competition
  applicantsTotal?: number;
  applicantsGrowthRate?: number; // 0-1 growth rate
  activeJobsForRole?: number;
  hiringTrend?: "rising" | "stable" | "falling";
  avgApplicantsPerJob?: number;
  jobLocationType?: "remote" | "hybrid" | "onsite";
  userLocationEligible?: boolean;

  // Company signals
  hiringStatus?: "active" | "freeze";
  recentJobPostings?: number;
  hiringVelocity?: number; // roles filled or postings per month
  roleUrgency?: "immediate" | "normal" | "backfill";
  internshipPhase?: "open" | "ending-soon" | "closed";
  historicalHiringSeason?: boolean;
  conversionRate?: number; // applicant -> interview (0-1)
}

export class ProbabilityEngine {
  // Pillar weights (sum = 1)
  private static readonly WEIGHTS = {
    profileMatch: 0.30,
    skillFit: 0.35,
    marketContext: 0.15,
    companySignals: 0.10,
    userBehavior: 0.10,
  } as const;

  static calculateProbability(
    user: User,
    userSkills: Skill[],
    userProjects: Project[],
    userExperiences: Experience[],
    job: Job,
    ctx: ProbabilityContext = {}
  ): ProbabilityResult {
    const profileMatch = this.computeProfileMatch(user, userSkills, job);
    const skillFit = this.computeSkillFit(userSkills, userProjects, userExperiences, job);
    const marketContext = this.computeMarketContext(job, ctx);
    const companySignals = this.computeCompanySignals(ctx);
    const userBehavior = this.computeUserBehavior(user, userProjects, job);

    const pillars: PillarScores = {
      profileMatch,
      skillFit,
      marketContext,
      companySignals,
      userBehavior,
    };

    const score = this.aggregate(pillars);
    const probability = Math.round(score * 100);
    const confidenceBand = this.band(score);

    const { strengths, neutrals, weaknesses } = this.buildSignals(pillars, job, ctx);
    const actions = this.buildActions(pillars, job);
    const explanation = this.buildExplanation(probability, strengths, weaknesses);

    return {
      probability,
      confidenceBand,
      pillars,
      strengths,
      neutrals,
      weaknesses,
      actions,
      explanation,
    };
  }

  // ---------------------------------------------------------------------------
  // Pillars
  // ---------------------------------------------------------------------------

  private static computeProfileMatch(user: User, userSkills: Skill[], job: Job): number {
    const ladder = ["Intern", "Junior", "Mid", "Senior", "Lead"];
    const jobLevel = ladder.indexOf((job.experienceLevel as string) || "Junior");
    const userLevel = ladder.indexOf((user.userType as string) || "Junior");

    // Seniority fit
    let seniorityScore = 0.6;
    const diff = userLevel - jobLevel;
    if (diff === 0) seniorityScore = 1.0;
    else if (diff === -1) seniorityScore = 0.75;
    else if (diff <= -2) seniorityScore = 0.35;
    else if (diff === 1) seniorityScore = 0.8;
    else seniorityScore = 0.6;

    // Role/title alignment (simple keyword overlap)
    const title = (job.title || "").toLowerCase();
    const preferred = (user.interestRoles || []).map(r => r.toLowerCase());
    const hasDirect = preferred.some(p => title.includes(p));
    const roleScore = hasDirect ? 0.9 : title.includes("engineer") ? 0.7 : 0.5;

    // Years alignment
    const reqYears = (job as any).requiredYears || 0;
    const userYears = (user.resumeExperienceMonths || 0) / 12;
    let yearsScore = 0.7;
    const expDiff = userYears - reqYears;
    if (reqYears <= 0) yearsScore = 0.7;
    else if (expDiff >= 0 && expDiff <= 2) yearsScore = 1.0;
    else if (expDiff < 0 && expDiff >= -2) yearsScore = 0.65;
    else if (expDiff < -2) yearsScore = 0.35;
    else if (expDiff > 2 && expDiff <= 7) yearsScore = 0.8;
    else yearsScore = 0.65;

    // Industry hint from companyType
    const industryScore = job.companyType ? 0.7 : 0.55;

    return this.clamp01(0.35 * seniorityScore + 0.35 * roleScore + 0.20 * yearsScore + 0.10 * industryScore);
  }

  private static computeSkillFit(
    userSkills: Skill[],
    userProjects: Project[],
    userExperiences: Experience[],
    job: Job
  ): number {
    const jobSkills = job.skills || [];
    const userSkillMap = new Map<string, string>();
    userSkills.forEach(s => userSkillMap.set(s.name.toLowerCase(), s.level));

    // Core coverage (treat all listed as core for now)
    const lowerJobSkills = jobSkills.map(s => s.toLowerCase());
    const matched = lowerJobSkills.filter(js => userSkillMap.has(js));
    const coverage = lowerJobSkills.length > 0 ? matched.length / lowerJobSkills.length : 0.5;

    // Proficiency average
    const proficiency = matched.reduce((sum, js) => {
      const level = userSkillMap.get(js) || "Beginner";
      const val = level === "Advanced" ? 1.0 : level === "Intermediate" ? 0.65 : 0.35;
      return sum + val;
    }, 0) / Math.max(1, matched.length);

    const coreScore = this.clamp01(0.7 * coverage + 0.3 * proficiency);

    // Projects evidence
    const projectScore = (() => {
      if (!userProjects.length) return 0.3;
      const techMatches = userProjects.map(p => {
        const stack = (p.techStack || []).map(t => t.toLowerCase());
        const overlap = stack.filter(t => lowerJobSkills.some(js => js.includes(t) || t.includes(js))).length;
        return stack.length ? overlap / stack.length : 0.3;
      });
      const base = techMatches.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(3, techMatches.length));
      const prodBoost = userProjects.some(p => p.complexity === "High") ? 0.1 : 0;
      return this.clamp01(base + prodBoost);
    })();

    // Experience evidence
    const internshipCount = userExperiences.filter(e => e.type === "Internship").length;
    const hasProd = userExperiences.some(e => e.type === "Job");
    const expScore = hasProd ? 0.9 : internshipCount > 0 ? 0.7 : 0.4;

    return this.clamp01(0.55 * coreScore + 0.20 * projectScore + 0.25 * expScore);
  }

  private static computeMarketContext(job: Job, ctx: ProbabilityContext): number {
    const applicants = ctx.applicantsTotal ?? (job as any).applicants ?? 0;
    const avgApplicants = ctx.avgApplicantsPerJob ?? Math.max(1, applicants || 50);
    const hiringTrend = ctx.hiringTrend || (job as any).hiringTrend || "stable";
    const activeJobs = ctx.activeJobsForRole ?? 20;
    const growth = ctx.applicantsGrowthRate ?? 0;

    const demandBase = this.clamp01(activeJobs / 50);
    const trendBonus = hiringTrend === "rising" ? 0.1 : hiringTrend === "falling" ? -0.1 : 0;
    const growthBonus = this.clamp(growth * 0.5, -0.1, 0.1);
    const demand = this.clamp01(demandBase + trendBonus + growthBonus);

    const pressure = this.sigmoid(applicants / 300);
    const density = this.sigmoid(avgApplicants / 200);
    let competition = this.clamp01(0.6 * pressure + 0.4 * density);

    // Location/eligibility
    const locType = ctx.jobLocationType || "onsite";
    const eligible = ctx.userLocationEligible ?? true;
    let locAdj = 0;
    if (eligible) {
      locAdj = locType === "remote" ? 0.08 : locType === "hybrid" ? 0.04 : 0.02;
    } else {
      locAdj = -0.15;
    }
    const adjustedDemand = this.clamp01(demand + locAdj);
    competition = this.clamp01(competition - locAdj * 0.5);

    // Combine (more demand, less competition => higher)
    const combined = this.clamp01(0.6 * adjustedDemand + 0.4 * (1 - competition));
    return combined;
  }

  private static computeCompanySignals(ctx: ProbabilityContext): number {
    const status = ctx.hiringStatus || "active";
    const statusScore = status === "active" ? 1.0 : 0.2;

    const postings = ctx.recentJobPostings ?? 3;
    const velocity = ctx.hiringVelocity ?? 3;
    const velocityScore = this.clamp01(0.6 * this.sigmoid(postings / 5) + 0.4 * this.sigmoid(velocity / 5));

    const urgency = ctx.roleUrgency || "normal";
    const urgencyScore = urgency === "immediate" ? 1.0 : urgency === "normal" ? 0.7 : 0.5;

    const internshipPhase = ctx.internshipPhase || "open";
    const internshipScore = internshipPhase === "open" ? 0.9 : internshipPhase === "ending-soon" ? 0.6 : 0.2;

    const seasonalityScore = ctx.historicalHiringSeason ? 0.9 : 0.6;

    const conv = ctx.conversionRate;
    const conversionScore = conv == null ? 0.6 : conv >= 0.3 ? 1.0 : conv >= 0.15 ? 0.7 : 0.4;

    return this.clamp01(
      0.25 * statusScore +
      0.25 * velocityScore +
      0.15 * urgencyScore +
      0.10 * internshipScore +
      0.15 * seasonalityScore +
      0.10 * conversionScore
    );
  }

  private static computeUserBehavior(user: User, userProjects: Project[], job: Job): number {
    const atsScore = user.resumeScore ? this.clamp01(user.resumeScore / 100) : 0.6;
    const keywordScore = (user.resumeParsedSkills?.length || 0) > 0 ? 0.75 : 0.55;
    const resumeCompleteness = user.resumeCompletenessScore ? 0.7 : 0.55;
    const profileCompleteness = user.linkedinUrl || user.githubUrl ? 0.7 : 0.5;

    const timingScore = (() => {
      const days = (job as any).daysSincePosted ?? 7;
      if (days <= 3) return 1.0;
      if (days <= 10) return 0.75;
      return 0.45;
    })();

    const linksScore = user.githubUrl && user.linkedinUrl ? 1.0 : (user.githubUrl || user.linkedinUrl) ? 0.7 : 0.3;
    const projectsScore = userProjects.length === 0 ? 0.3 : Math.min(1, 0.8 + (userProjects.some(p => p.complexity === "High") ? 0.1 : 0));

    return this.clamp01(
      0.20 * atsScore +
      0.20 * keywordScore +
      0.15 * resumeCompleteness +
      0.15 * profileCompleteness +
      0.10 * timingScore +
      0.10 * linksScore +
      0.10 * projectsScore
    );
  }

  // ---------------------------------------------------------------------------
  // Aggregation & bands
  // ---------------------------------------------------------------------------

  private static aggregate(p: PillarScores): number {
    const s =
      this.WEIGHTS.profileMatch * p.profileMatch +
      this.WEIGHTS.skillFit * p.skillFit +
      this.WEIGHTS.marketContext * p.marketContext +
      this.WEIGHTS.companySignals * p.companySignals +
      this.WEIGHTS.userBehavior * p.userBehavior;
    return this.clamp01(s);
  }

  private static band(score: number): "Low" | "Medium" | "High" {
    if (score >= 0.70) return "High";
    if (score >= 0.45) return "Medium";
    return "Low";
  }

  // ---------------------------------------------------------------------------
  // Explanations
  // ---------------------------------------------------------------------------

  private static buildSignals(p: PillarScores, job: Job, ctx: ProbabilityContext) {
    const strengths: string[] = [];
    const neutrals: string[] = [];
    const weaknesses: string[] = [];

    const push = (score: number, strong: string, neutral: string, weak: string) => {
      if (score >= 0.7) strengths.push(strong);
      else if (score >= 0.45) neutrals.push(neutral);
      else weaknesses.push(weak);
    };

    push(p.profileMatch, "Profile aligns with the role", "Profile partially matches", "Profile is misaligned");
    push(p.skillFit, "Strong skill match", "Partial skill match", "Missing key skills");
    push(p.marketContext, "Favorable market demand", "Market is neutral", "Competition is high");
    push(p.companySignals, "Company actively hiring", "Hiring signals are mixed", "Company signals are weak");
    push(p.userBehavior, "Application quality is strong", "Application quality is average", "Application quality needs work");

    // Specific contextual bullet examples
    if ((job as any).applicants && p.marketContext < 0.45) weaknesses.push("High competition for this role");
    if (ctx.hiringStatus === "active" && p.companySignals >= 0.7) strengths.push("Company is actively hiring this month");
    if ((job as any).daysSincePosted && (job as any).daysSincePosted <= 3 && p.userBehavior >= 0.7) strengths.push("Applied early in the cycle");

    return { strengths, neutrals, weaknesses };
  }

  private static buildActions(p: PillarScores, job: Job): string[] {
    const actions: string[] = [];
    if (p.userBehavior < 0.6) actions.push("Link GitHub/LinkedIn and add projects to boost completeness");
    if (p.profileMatch < 0.6) actions.push("Target roles closer to your current level or adjust seniority");
    return actions.slice(0, 5);
  }

  private static buildExplanation(probability: number, strengths: string[], weaknesses: string[]): string {
    const base = probability >= 70
      ? `High chance (${probability}%)`
      : probability >= 45
        ? `Moderate chance (${probability}%)`
        : `Low chance (${probability}%)`;
    const topReason = strengths[0] || weaknesses[0] || "Profile evaluated";
    return `${base}. ${topReason}. Advisory only; your likelihood changes as your profile and market conditions change.`;
  }

  // ---------------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------------

  private static clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private static clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}
