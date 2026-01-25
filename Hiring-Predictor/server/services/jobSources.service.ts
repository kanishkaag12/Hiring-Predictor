// server/services/jobSources.service.ts

import { getEnabledJobSources } from "../../client/src/lib/jobSources";

export function fetchJobSources() {
  /**
   * READ-ONLY access
   * No network calls
   * No API keys
   */
  return getEnabledJobSources();
}
