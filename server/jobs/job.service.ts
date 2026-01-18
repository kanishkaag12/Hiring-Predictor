// server/jobs/job.service.ts

import { Job } from "./job.types";
import { getEnabledBackendSources } from "./job.sources";
import { fetchRemotiveJobs } from "./sources/remotive.fetcher";
import { analyzeJob } from "./job.analysis";

function getDaysSincePosted(postedAt: string): number {
  const postedDate = new Date(postedAt);
  const today = new Date();
  const diffTime = today.getTime() - postedDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function inferRoleLevel(
  title: string
): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();

  if (t.includes("intern")) return "Intern";
  if (t.includes("junior") || t.includes("entry")) return "Junior";
  if (
    t.includes("senior") ||
    t.includes("lead") ||
    t.includes("principal")
  )
    return "Senior";

  return "Mid";
}

/**
 * Temporary heuristic for applicants
 * (later replaced by real data / ML)
 */
function inferApplicants(daysSincePosted: number): number {
  if (daysSincePosted <= 2) return 40;
  if (daysSincePosted <= 5) return 120;
  if (daysSincePosted <= 10) return 300;
  return 600;
}

export async function fetchJobs(): Promise<Job[]> {
  const enabledSources = getEnabledBackendSources();
  let jobs: Job[] = [];

  for (const source of enabledSources) {
    if (source.id === "remotive") {
      const remotiveJobs = await fetchRemotiveJobs();

      const enrichedJobs: Job[] = remotiveJobs.map((job) => {
        const daysSincePosted = getDaysSincePosted(job.postedAt);
        const applicants = inferApplicants(daysSincePosted);

        // 🔥 ANALYSIS LAYER (CORE LOGIC)
        const analysis = analyzeJob({
          daysSincePosted,
          applicants,
          roleLevel: inferRoleLevel(job.title),
        });

        return {
          ...job,
          daysSincePosted,
          applicants,
          analysis, // ✅ nested analysis object
        };
      });

      jobs = jobs.concat(enrichedJobs);
    }
  }

  return jobs;
}

export async function fetchJobById(jobId: string): Promise<Job | null> {
  const jobs = await fetchJobs();
  return jobs.find((job) => job.id === jobId) ?? null;
}
