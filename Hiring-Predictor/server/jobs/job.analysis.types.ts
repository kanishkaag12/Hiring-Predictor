export interface JobAnalysis {
  shortlistProbability: number; // 0–100
  peerPercentile: number;       // 0–100
  timingSignal: "GOOD" | "SOON" | "WAIT";
  factors: {
    skillsMatch: number;
    competitionLevel: number;
    freshnessScore: number;
  };
}
    