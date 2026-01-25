// client/src/lib/jobSources.ts

/**
 * This file defines LEGAL & SAFE job data sources.
 * No scraping. No HTML parsing. Only APIs, feeds, or licensed datasets.
 */

export type JobSourceType = "api" | "rss" | "dataset";

export interface JobSource {
  id: string;
  name: string;
  type: JobSourceType;
  description: string;
  regions: string[];
  roles: string[];
  requiresAuth: boolean;
  enabled: boolean;
}

/**
 * IMPORTANT:
 * - enabled = false → source is defined but not active yet
 * - We will turn them on ONE BY ONE later
 */

export const JOB_SOURCES: JobSource[] = [
  {
    id: "adzuna",
    name: "Adzuna Jobs API",
    type: "api",
    description:
      "Global job search API providing real-time job listings and salary data.",
    regions: ["Global", "India"],
    roles: ["Internship", "Full-time", "Entry-level"],
    requiresAuth: true,
    enabled: false,
  },
  {
    id: "jooble",
    name: "Jooble Job Search API",
    type: "api",
    description:
      "Aggregated job listings from thousands of job boards worldwide.",
    regions: ["Global", "India"],
    roles: ["Internship", "Full-time"],
    requiresAuth: true,
    enabled: false,
  },
  {
    id: "remotive",
    name: "Remotive Remote Jobs API",
    type: "api",
    description:
      "Public API for verified remote job listings (developer-friendly).",
    regions: ["Remote"],
    roles: ["Internship", "Full-time"],
    requiresAuth: false,
    enabled: false,
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow Jobs API",
    type: "api",
    description:
      "Free public job API with tech and fresher-friendly roles.",
    regions: ["Global"],
    roles: ["Internship", "Junior", "Full-time"],
    requiresAuth: false,
    enabled: false,
  },
];

/**
 * Helper function
 * Later used by backend/services layer
 */
export function getEnabledJobSources(): JobSource[] {
  return JOB_SOURCES.filter((source) => source.enabled);
}
