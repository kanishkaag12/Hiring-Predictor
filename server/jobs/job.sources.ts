// server/jobs/job.sources.ts

export interface BackendJobSource {
  id: string;
  enabled: boolean;
}

export const BACKEND_JOB_SOURCES: BackendJobSource[] = [
  { id: "adzuna", enabled: false },
  { id: "jooble", enabled: false },
  { id: "remotive", enabled: true },
  { id: "arbeitnow", enabled: false },
];

export function getEnabledBackendSources() {
  return BACKEND_JOB_SOURCES.filter((s) => s.enabled);
}
