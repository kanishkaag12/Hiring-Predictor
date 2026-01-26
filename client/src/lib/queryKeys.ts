/**
 * Centralized Query Key Factory
 * 
 * This ensures:
 * - Consistent query keys across the app
 * - Easy cache invalidation by scope
 * - Type-safe query management
 */

export const queryKeys = {
  // Auth queries
  auth: {
    all: () => ["auth"] as const,
    user: () => [...queryKeys.auth.all(), "user"] as const,
    status: () => [...queryKeys.auth.all(), "status"] as const,
  },

  // Dashboard queries
  dashboard: {
    all: () => ["dashboard"] as const,
    data: () => [...queryKeys.dashboard.all(), "data"] as const,
  },

  // Profile queries
  profile: {
    all: () => ["profile"] as const,
    completeness: () => [...queryKeys.profile.all(), "completeness"] as const,
    full: () => [...queryKeys.profile.all(), "full"] as const,
    skills: () => [...queryKeys.profile.all(), "skills"] as const,
    experiences: () => [...queryKeys.profile.all(), "experiences"] as const,
    projects: () => [...queryKeys.profile.all(), "projects"] as const,
    resume: () => [...queryKeys.profile.all(), "resume"] as const,
    resumeStatus: () => [...queryKeys.profile.all(), "resumeStatus"] as const,
  },

  // Analysis queries
  analysis: {
    all: () => ["analysis"] as const,
    status: () => [...queryKeys.analysis.all(), "status"] as const,
    results: () => [...queryKeys.analysis.all(), "results"] as const,
  },

  // Job queries
  jobs: {
    all: () => ["jobs"] as const,
    list: () => [...queryKeys.jobs.all(), "list"] as const,
    details: (id: string) => [...queryKeys.jobs.all(), "details", id] as const,
  },

  // ML queries
  ml: {
    all: () => ["ml"] as const,
    shortlist: () => [...queryKeys.ml.all(), "shortlist"] as const,
    predictions: () => [...queryKeys.ml.all(), "predictions"] as const,
  },
} as const;

/**
 * Query cache invalidation scope definitions
 * Used to invalidate groups of queries at once
 */
export type QueryScope = 
  | "auth"
  | "profile"
  | "dashboard"
  | "analysis"
  | "all";

export const getInvalidationScope = (scope: QueryScope) => {
  switch (scope) {
    case "auth":
      return queryKeys.auth.all();
    case "profile":
      return queryKeys.profile.all();
    case "dashboard":
      return queryKeys.dashboard.all();
    case "analysis":
      return queryKeys.analysis.all();
    case "all":
      return []; // Will match all queries
    default:
      return [];
  }
};
