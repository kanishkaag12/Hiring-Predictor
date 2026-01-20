// server/jobs/job.sources.ts

export interface BackendJobSource {
  id: string;
  enabled: boolean;
}

export const BACKEND_JOB_SOURCES: BackendJobSource[] = [
  { id: "remotive", enabled: true },
  { id: "greenhouse", enabled: true },
  { id: "lever", enabled: true },
];

export function getEnabledBackendSources() {
  return BACKEND_JOB_SOURCES.filter((s) => s.enabled);
}
