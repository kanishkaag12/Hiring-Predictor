// server/jobs/job.service.ts

import { Job } from "./job.types";
import { getEnabledBackendSources } from "./job.sources";
import { fetchRemotiveJobs } from "./sources/remotive.fetcher";

function getDaysSincePosted(postedAt: string): number {
  const postedDate = new Date(postedAt);
  const today = new Date();

  const diffTime = today.getTime() - postedDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getApplySignal(daysSincePosted: number): "GOOD" | "SOON" | "WAIT" {
  if (daysSincePosted <= 7) {
    return "GOOD";
  }
  if (daysSincePosted <= 21) {
    return "SOON";
  }
  return "WAIT";
}

export async function fetchJobs(): Promise<Job[]> {
  const enabledSources = getEnabledBackendSources();
  let jobs: Job[] = [];

  for (const source of enabledSources) {
    if (source.id === "remotive") {
      const remotiveJobs = (await fetchRemotiveJobs()).map(job => {
        const daysSincePosted = getDaysSincePosted(job.postedAt);

            return {
                ...job,
                daysSincePosted,
                applySignal: getApplySignal(daysSincePosted),
            };
        });


      jobs = jobs.concat(remotiveJobs);
    }
  }

  return jobs;
}
