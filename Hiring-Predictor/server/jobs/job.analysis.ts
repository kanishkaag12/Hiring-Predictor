import { CompanyHiringPatterns, CandidateComparison } from "./job.types";
import { PredictionModel } from "../ml/prediction-model";
import { UserProfile } from "../ml/feature-engineering";

export type ApplySignal = "GOOD" | "SOON" | "WAIT";

export interface JobAnalysisResult {
  probability: number;
  applySignal: ApplySignal;
  reasoning: string;
  factors?: Record<string, string>;
  hiringPatterns?: CompanyHiringPatterns;
  candidateComparison?: CandidateComparison;
}

// Mock User Profile for ML Model
const MOCK_USER_PROFILE: UserProfile = {
  skills: ["React", "TypeScript", "Node.js", "JavaScript", "Tailwind", "PostgreSQL"],
  experienceLevel: "Mid",
  projects: []
};

interface AnalyzeJobInput {
  id: string;
  title: string;
  company: string;
  daysSincePosted: number;
  applicants?: number;
  roleLevel?: "Intern" | "Junior" | "Mid" | "Senior";
  postedAt?: string;
  skills?: string[];
}

export function analyzeJob(input: AnalyzeJobInput): JobAnalysisResult {
  // 1. Prepare Data for ML
  const jobForML = {
    postedAt: input.postedAt || new Date().toISOString(), // Fallback if missing
    skills: input.skills || [],
    experienceLevel: input.roleLevel,
    applicants: input.applicants
  };

  // 2. Run Prediction with ML Model
  const prediction = PredictionModel.predict(jobForML, MOCK_USER_PROFILE);

  return {
    probability: prediction.probability,
    applySignal: prediction.applySignal,
    reasoning: prediction.reasoning,
    factors: prediction.factors, // Pass factors to UI
    hiringPatterns: getCompanyHiringPatterns(input.company, input.title),
    candidateComparison: getCandidateComparison(input.id, input.roleLevel || "Mid", input.skills || []),
  };
}



/**
 * Simple string hash function for seeded randomness
 */
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate Mocked Hiring Patterns based on Company Name + Role
 * This ensures "Google - SDE" has different data than "Google - PM"
 * but consistent results for the same job.
 */
function getCompanyHiringPatterns(company: string, title: string): CompanyHiringPatterns {
  const seed = getHash(company + title);

  // Activity Level logic
  const activityLevels: ("High" | "Medium" | "Low")[] = ["High", "High", "Medium", "Medium", "Low"];
  const activityLevel = activityLevels[seed % activityLevels.length];

  // Internship Phase logic
  const phases: ("Open" | "Closed" | "Ending Soon")[] = ["Open", "Open", "Ending Soon", "Closed"];
  const internshipPhase = phases[seed % phases.length];

  // Role Demand logic
  const demands: ("Growing" | "Stable" | "Declining")[] = ["Growing", "Growing", "Stable", "Declining"];
  const roleDemand = demands[seed % demands.length];

  // Hiring Score (6.0 to 9.8)
  const hiringScore = 60 + (seed % 39); // 60-98

  // Trend Data Generation (Pseudorandom curve)
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const trendData = months.map((month, index) => {
    // Create a curve peaked at different times based on seed
    const baseValue = 5 + (seed % 10);
    const variability = (seed * (index + 1)) % 15;
    return { month, roles: baseValue + variability };
  });

  return {
    activityLevel,
    internshipPhase,
    roleDemand,
    hiringScore: hiringScore / 10,
    trendData,
  };
}

/**
 * Generate Candidate Comparison based on Job ID
 */
function getCandidateComparison(jobId: string, jobLevel: string, jobSkills: string[]): CandidateComparison {
  const seed = getHash(jobId);
  const userLevel = MOCK_USER_PROFILE.experienceLevel;

  // 1. Calculate Experience Gap Score
  const levels = ["Student", "Intern", "Fresher", "Junior", "Mid", "Senior"];
  const userIdx = levels.indexOf(userLevel) > -1 ? levels.indexOf(userLevel) : 2; // Default Mid
  const jobIdx = levels.findIndex(l => jobLevel.toLowerCase().includes(l.toLowerCase()));
  const actualJobIdx = jobIdx > -1 ? jobIdx : 2; // Default Mid

  // +ve means User is Overqualified, -ve means Underqualified
  const levelDiff = userIdx - actualJobIdx;

  // 2. Calculate Skill Overlap Score (Simple Set Match)
  const userSkillsSet = new Set(MOCK_USER_PROFILE.skills.map(s => s.toLowerCase()));
  let matchCount = 0;
  jobSkills.forEach(s => {
    if (userSkillsSet.has(s.toLowerCase())) matchCount++;
  });
  const skillRatio = jobSkills.length > 0 ? matchCount / jobSkills.length : 0.5;

  // 3. Determine Percentile Rank (Inverted: #1 is top, #100 is bottom)
  // Start at average (50th percentile)
  let predictedRank = 50;

  // Adjust by Level
  if (levelDiff > 0) predictedRank -= 20; // Better rank
  if (levelDiff < 0) predictedRank += 30; // Worse rank

  // Adjust by Skills
  if (skillRatio > 0.6) predictedRank -= 15;
  if (skillRatio < 0.3) predictedRank += 15;

  // Clamp
  predictedRank = Math.max(1, Math.min(99, predictedRank));
  // Add slight jitter so it doesn't look robotic
  predictedRank = Math.max(1, predictedRank + (seed % 10) - 5);


  // 4. Generate Graph Data (Skill Match Breakdown)
  // We show 4 skills: 2 matches, 2 gaps, or random if job has few skills
  const displaySkills = jobSkills.slice(0, 4);
  const fillers = ["Communication", "Teamwork", "Problem Solving", "English"];
  let fillerIdx = 0;
  while (displaySkills.length < 4) {
    displaySkills.push(fillers[fillerIdx++] || "General");
  }

  const skillMatchData = displaySkills.map(skill => {
    // Does user have it?
    const hasSkill = userSkillsSet.has(skill.toLowerCase());
    const userVal = hasSkill ? 85 + (seed % 15) : 30 + (seed % 20);
    const peerVal = 50 + (seed % 30); // Random peer avg
    return {
      skill,
      match: userVal,
      peerAvg: peerVal
    };
  });

  return {
    peerCount: 150 + (seed % 800),
    percentileRank: Math.round(predictedRank), // Top X%
    skillStrength: skillRatio > 0.5 ? "Above Average" : "Average",
    projectDepth: levelDiff >= 0 ? "Strong" : "Average", // Senior = Strong projects
    skillMatch: skillMatchData,
  };
}

