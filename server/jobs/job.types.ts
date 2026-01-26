// server/jobs/job.types.ts

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: "Internship" | "Full-time" | "Contract";
  experienceLevel: "Student" | "Fresher" | "Junior" | "Mid" | "Senior";
  salaryRange?: string;

  skills: string[];
  source: string; // adzuna, jooble, etc
  postedAt: string;

  applyUrl: string;

  // HirePulse-specific
  competitionLevel?: "Low" | "Medium" | "High";
  hiringTrend?: "Surge" | "Stable" | "Slowdown";

  // New Discovery Fields
  companyType?: "Startup" | "MNC" | "Agency" | "Product" | "Other";
  companySizeTag?: "Startup" | "Small" | "Mid-size" | "Large";
  companyTags?: string[];
  isInternship?: boolean;
  hiringPlatform?: "Greenhouse" | "Lever" | "Remotive" | "Indeed" | "Other";
  hiringPlatformUrl?: string; // URL to the board
  applicants?: number;
  daysSincePosted?: number;
}

export interface JobFilter {
  search?: string;
  type?: "job" | "internship";
  level?: string;
  companyType?: string;
  companySize?: string;
  workType?: "Remote" | "Onsite" | "Hybrid";
}

export interface CompanyDiscovery {
  id: string; // token or name
  name: string;
  type: string;
  sizeTag: string;
  tags: string[];
  openRoles: number;
  hasInternships: boolean;
  platform: "Greenhouse" | "Lever" | "Remotive" | "Other";
}

export interface CompanyHiringPatterns {
  // ... existing
  activityLevel: "High" | "Medium" | "Low";
  internshipPhase: "Open" | "Closed" | "Ending Soon";
  roleDemand: "Growing" | "Stable" | "Declining";
  hiringScore: number; // 0-10
  trendData: { month: string; roles: number }[];
}

export type DemandTrend = "rising" | "stable" | "falling";

export interface MarketStats {
  roleCategory: string;
  totalActiveJobs: number;
  averageApplicantsPerJob: number;
  demandTrend: DemandTrend;
  marketDemandScore: number; // 0-1
  competitionScore: number; // 0-1
  sampleCompanies: string[];
}

export interface CandidateComparison {
  peerCount: number;
  percentileRank: number; // Top X%
  skillStrength: "Above Average" | "Average" | "Below Average";
  projectDepth: "Strong" | "Average" | "Weak";
  skillMatch: { skill: string; match: number; peerAvg: number }[];
}
