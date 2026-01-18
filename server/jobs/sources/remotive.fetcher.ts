// server/jobs/sources/remotive.fetcher.ts

import { Job } from "../job.types";

export async function fetchRemotiveJobs(): Promise<Job[]> {
  const response = await fetch("https://remotive.com/api/remote-jobs");
  const data = await response.json();

  return data.jobs.map((job: any) => ({
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Remote",
    employmentType: "Full-time",
    experienceLevel: "Junior",
    skills: job.tags || [],
    source: "remotive",
    postedAt: job.publication_date,
    applyUrl: job.url,
  }));
}
