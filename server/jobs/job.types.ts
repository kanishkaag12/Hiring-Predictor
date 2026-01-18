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
}
