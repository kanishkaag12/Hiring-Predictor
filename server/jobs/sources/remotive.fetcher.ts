import { Job } from "../job.types";

export async function fetchRemotiveJobs(): Promise<Job[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://remotive.com/api/remote-jobs", {
      signal: controller.signal
    });
    const data = await response.json();
    clearTimeout(timeoutId);

    // Limit to latest 150 jobs for performance
    const latestJobs = (data.jobs || []).slice(0, 150);

    return latestJobs.map((job: any) => ({
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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error("Remotive fetch timed out");
    } else {
      console.error("Remotive fetch failed:", err.message);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
