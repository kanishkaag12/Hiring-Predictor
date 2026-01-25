export interface HiringPulse {
  score: number;
  trend: number;
  status: "Strong" | "Improving" | "Needs Work";
}

export interface MarketSnapshot {
  topRoles: string[];
  activeCompanies: number;
  highCompetitionRoles: string[];
  trendingSkills: string[];
  marketStats?: MarketStat[];
}

export type DemandTrend = "rising" | "stable" | "falling";

export interface MarketStat {
  roleCategory: string;
  totalActiveJobs: number;
  averageApplicantsPerJob: number;
  demandTrend: DemandTrend;
  marketDemandScore: number; // 0-1
  competitionScore: number; // 0-1
  sampleCompanies: string[];
  isUserInterestRole?: boolean;
  isUnavailable?: boolean;
}

export interface RoleChance {
  role: string;
  chance: number;
  competition: "Low" | "Medium" | "High";
}

export interface PeerComparison {
  peerCount: number;
  rankPercentile: number;
  skills: "Above Average" | "Average" | "Below Average";
  projects: "Above Average" | "Average" | "Below Average";
  internships: "Above Average" | "Average" | "Below Average";
}

export interface ActionStep {
  type: "improve" | "warning" | "skill";
  text: string;
  impact?: string;
}

export interface RecentActivity {
  type: "analysis" | "skill" | "application";
  label: string;
  timestamp: string;
}

export const MOCK_DASHBOARD_DATA = {
  hiringPulse: {
    score: 82,
    trend: 12,
    status: "Strong" as const,
  },
  marketSnapshot: {
    topRoles: ["Backend", "Data", "QA"],
    activeCompanies: 120,
    highCompetitionRoles: ["Frontend"],
    trendingSkills: ["React", "SQL", "Node.js"],
    marketStats: [
      {
        roleCategory: "Frontend Engineer",
        totalActiveJobs: 42,
        averageApplicantsPerJob: 180,
        demandTrend: "rising" as const,
        marketDemandScore: 0.78,
        competitionScore: 0.66,
        sampleCompanies: ["Meta", "Stripe", "Atlassian"],
        isUserInterestRole: true,
      },
      {
        roleCategory: "Backend Engineer",
        totalActiveJobs: 38,
        averageApplicantsPerJob: 210,
        demandTrend: "stable" as const,
        marketDemandScore: 0.72,
        competitionScore: 0.71,
        sampleCompanies: ["Netflix", "Datadog", "Shopify"],
        isUserInterestRole: false,
      },
    ],
  },
  yourChances: [
    { role: "SDE Intern", chance: 68, competition: "High" as const },
    { role: "Frontend Intern", chance: 54, competition: "Medium" as const },
    { role: "Data Analyst Intern", chance: 41, competition: "High" as const },
  ],
  peerComparison: {
    peerCount: 1200,
    rankPercentile: 28,
    skills: "Above Average" as const,
    projects: "Average" as const,
    internships: "Below Average" as const,
  },
  actionSteps: [
    { type: "improve" as const, text: "Add 1 backend project", impact: "+12%" },
    { type: "warning" as const, text: "Low internship experience detected" },
    { type: "skill" as const, text: "Improve SQL to match top candidates" },
  ],
  recentActivity: [
    { type: "analysis" as const, label: "Analyzed 'SDE Intern' path", timestamp: "2 hours ago" },
    { type: "skill" as const, label: "Updated 'Python' skill", timestamp: "1 day ago" },
    { type: "application" as const, label: "Applied to TechCorp", timestamp: "3 days ago" },
  ],
};
