/**
 * FEATURE ENGINEERING SERVICE
 * 
 * Transforms parsed resume data and skill match scores into normalized
 * ML-ready feature vectors for role alignment prediction.
 * 
 * All features are normalized to [0, 1] range using deterministic,
 * explainable transformations.
 */

import type { ParsedResumeData } from "../resume-parser.service";

/**
 * Feature vector structure for a single (user, role) pair.
 * All values normalized to [0, 1].
 */
export interface FeatureVector {
  // Core resume features
  skill_match_score: number;          // 0-1: How well user skills match role
  experience_score: number;            // 0-1: Normalized experience in months
  projects_score: number;              // 0-1: Normalized project count
  resume_completeness_score: number;   // 0-1: Resume completeness
  education_level_score: number;       // 0-1: Mapped education level
  
  // Placeholder features (to be filled by future implementations)
  behavioral_intent_score: number;     // 0-1: User interest/intent (default 0.0)
  market_demand_score: number;         // 0-1: Market demand for role (default 0.5)
  competition_score: number;           // 0-1: Competition level (default 0.5)
  
  // Metadata for interpretability
  _feature_names: string[];
  _normalization_info?: {
    experience_max_months: number;
    projects_max_count: number;
  };
}

/**
 * Education level to score mapping.
 * Maps degree types to normalized scores [0, 1].
 */
const EDUCATION_LEVEL_MAPPING: Record<string, number> = {
  // Specialized credentials
  "phd": 1.0,
  "doctoral": 1.0,
  "postdoctoral": 1.0,
  
  // Advanced degrees
  "master": 0.85,
  "masters": 0.85,
  "mba": 0.85,
  "mtech": 0.85,
  "msc": 0.85,
  
  // Bachelor degrees
  "bachelor": 0.70,
  "bachelors": 0.70,
  "btech": 0.70,
  "bsc": 0.70,
  "bca": 0.70,
  "b.tech": 0.70,
  "b.s": 0.70,
  "b.a": 0.70,
  
  // Associate/Diplomas
  "associate": 0.50,
  "diploma": 0.45,
  
  // Certifications/Short courses
  "certification": 0.30,
  "certified": 0.30,
  "bootcamp": 0.35,
  "course": 0.25,
  
  // High school
  "high school": 0.15,
  "12th": 0.15,
  "10+2": 0.15,
};

/**
 * Extract education level score from education data.
 * Uses fuzzy matching on degree name.
 * Returns highest degree found.
 * 
 * @param education - Array of education objects with degree info
 * @returns Normalized education level score (0-1)
 */
function extractEducationScore(education: Array<{ degree?: string }>): number {
  if (!education || education.length === 0) {
    return 0.0;
  }
  
  let maxScore = 0.0;
  
  for (const edu of education) {
    if (!edu.degree) continue;
    
    const degreeStr = edu.degree.toLowerCase().trim();
    
    // Try exact match first
    if (EDUCATION_LEVEL_MAPPING[degreeStr]) {
      maxScore = Math.max(maxScore, EDUCATION_LEVEL_MAPPING[degreeStr]);
      continue;
    }
    
    // Try substring matching
    for (const [key, score] of Object.entries(EDUCATION_LEVEL_MAPPING)) {
      if (degreeStr.includes(key) || key.includes(degreeStr)) {
        maxScore = Math.max(maxScore, score);
        break;
      }
    }
  }
  
  return Math.min(1.0, maxScore);
}

/**
 * Normalize experience months to [0, 1] score.
 * Uses exponential growth curve that plateaus at 10 years (120 months).
 * 
 * Transformation: 1 - e^(-0.02 * months)
 * - 0 months = 0.0
 * - 6 months = 0.11
 * - 12 months (1 year) = 0.22
 * - 24 months (2 years) = 0.39
 * - 60 months (5 years) = 0.70
 * - 120+ months (10+ years) ≈ 1.0
 * 
 * Rationale: Recent experience is valued, but diminishing returns after 5+ years.
 * 
 * @param experienceMonths - Raw experience in months
 * @returns Normalized experience score (0-1)
 */
function normalizeExperience(experienceMonths: number): number {
  if (experienceMonths <= 0) return 0.0;
  
  const maxMonths = 120; // 10 years as plateau point
  
  if (experienceMonths < maxMonths) {
    // Exponential saturation curve
    return Math.min(1.0, 1 - Math.exp(-0.02 * experienceMonths));
  }
  
  return 1.0;
}

/**
 * Normalize project count to [0, 1] score.
 * Uses logarithmic scale with saturation at 20 projects.
 * 
 * Transformation: log(1 + projects) / log(1 + maxProjects)
 * - 0 projects = 0.0
 * - 1 project = 0.20
 * - 3 projects = 0.39
 * - 7 projects = 0.56
 * - 15 projects = 0.80
 * - 20+ projects ≈ 1.0
 * 
 * Rationale: Multiple meaningful projects are valuable, but quality over quantity.
 * Log scale prevents extreme counts from dominating.
 * 
 * @param projectsCount - Number of projects completed
 * @returns Normalized projects score (0-1)
 */
function normalizeProjects(projectsCount: number): number {
  if (projectsCount <= 0) return 0.0;
  
  const maxProjects = 20;
  
  if (projectsCount < maxProjects) {
    return Math.min(1.0, Math.log(1 + projectsCount) / Math.log(1 + maxProjects));
  }
  
  return 1.0;
}

/**
 * Normalize resume completeness score to [0, 1].
 * Handles both 0-100 and 0-1 ranges.
 * 
 * @param completenessScore - Resume completeness (0-100 or 0-1)
 * @returns Normalized completeness score (0-1)
 */
function normalizeCompleteness(completenessScore: number | string): number {
  let score = 0;
  
  if (typeof completenessScore === "string") {
    score = parseFloat(completenessScore) || 0;
  } else {
    score = completenessScore || 0;
  }
  
  // If score is in 0-100 range, convert to 0-1
  if (score > 1) {
    score = Math.min(100, Math.max(0, score)) / 100;
  }
  
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Generate ML-ready feature vector for a single role.
 * 
 * Uses deterministic transformations - no randomness, reproducible results.
 * All outputs clamped to [0, 1].
 * 
 * @param roleName - Target role name (for logging/debugging)
 * @param parsedResume - Parsed resume data
 * @param skillMatchScore - Role-skill match score (0-1)
 * @param behavioralIntentScore - Optional: User intent score (0-1), defaults to 0.0
 * @param marketDemandScore - Optional: Market demand score (0-1), defaults to 0.5
 * @param competitionScore - Optional: Competition score (0-1), defaults to 0.5
 * @returns Normalized feature vector for the role
 */
export function generateFeatureVector(
  roleName: string,
  parsedResume: ParsedResumeData,
  skillMatchScore: number,
  behavioralIntentScore?: number,
  marketDemandScore?: number,
  competitionScore?: number
): FeatureVector {
  // Validate and clamp skill match score to [0, 1]
  const validSkillMatch = Math.min(1.0, Math.max(0.0, skillMatchScore || 0));
  
  // Extract and normalize individual features
  const experienceScore = normalizeExperience(parsedResume.experience_months || 0);
  const projectsScore = normalizeProjects(parsedResume.projects_count || 0);
  const completenessScore = normalizeCompleteness(parsedResume.resume_completeness_score);
  const educationScore = extractEducationScore(parsedResume.education || []);
  
  // Default placeholder scores
  // behavioral_intent: will be filled when user interest data available (for now: 0.0)
  // market_demand: will be filled from job market analysis (for now: 0.5)
  // competition: will be filled from hiring difficulty estimates (for now: 0.5)
  const behavioralScore = Math.min(1.0, Math.max(0.0, behavioralIntentScore ?? 0.0));
  const marketScore = Math.min(1.0, Math.max(0.0, marketDemandScore ?? 0.5));
  const competScore = Math.min(1.0, Math.max(0.0, competitionScore ?? 0.5));
  
  // Feature ordering (must be consistent across all vectors for ML model)
  const featureNames = [
    "skill_match_score",
    "experience_score",
    "projects_score",
    "resume_completeness_score",
    "education_level_score",
    "behavioral_intent_score",
    "market_demand_score",
    "competition_score",
  ];
  
  const featureVector: FeatureVector = {
    skill_match_score: validSkillMatch,
    experience_score: experienceScore,
    projects_score: projectsScore,
    resume_completeness_score: completenessScore,
    education_level_score: educationScore,
    behavioral_intent_score: behavioralScore,
    market_demand_score: marketScore,
    competition_score: competScore,
    _feature_names: featureNames,
    _normalization_info: {
      experience_max_months: 120,
      projects_max_count: 20,
    },
  };
  
  return featureVector;
}

/**
 * Generate feature vectors for multiple roles.
 * 
 * @param roleSkillMatches - Map of role_name → skill_match_score (0-1)
 * @param parsedResume - Parsed resume data
 * @param behavioralIntentScore - Optional: User intent score (applied to all roles)
 * @param marketDemandScores - Optional: Map of role_name → market_demand_score
 * @param competitionScores - Optional: Map of role_name → competition_score
 * @returns Map of role_name → FeatureVector
 */
export function generateFeatureVectors(
  roleSkillMatches: Record<string, number>,
  parsedResume: ParsedResumeData,
  behavioralIntentScore?: number,
  marketDemandScores?: Record<string, number>,
  competitionScores?: Record<string, number>
): Record<string, FeatureVector> {
  const featureVectors: Record<string, FeatureVector> = {};
  
  for (const [roleName, skillMatchScore] of Object.entries(roleSkillMatches)) {
    featureVectors[roleName] = generateFeatureVector(
      roleName,
      parsedResume,
      skillMatchScore,
      behavioralIntentScore,
      marketDemandScores?.[roleName],
      competitionScores?.[roleName]
    );
  }
  
  return featureVectors;
}

/**
 * Extract feature values as ordered array for ML model input.
 * Ensures consistent ordering and dimensionality across all vectors.
 * 
 * Order: [skill_match, experience, projects, completeness, education, 
 *         behavioral, market_demand, competition]
 * 
 * @param featureVector - Feature vector object
 * @returns Ordered array of feature values, all in [0, 1]
 */
export function featureVectorToArray(featureVector: FeatureVector): number[] {
  return [
    featureVector.skill_match_score,
    featureVector.experience_score,
    featureVector.projects_score,
    featureVector.resume_completeness_score,
    featureVector.education_level_score,
    featureVector.behavioral_intent_score,
    featureVector.market_demand_score,
    featureVector.competition_score,
  ];
}

/**
 * Extract feature arrays for all roles.
 * 
 * @param featureVectors - Map of role_name → FeatureVector
 * @returns Map of role_name → feature array
 */
export function featureVectorsToArrays(
  featureVectors: Record<string, FeatureVector>
): Record<string, number[]> {
  const arrays: Record<string, number[]> = {};
  
  for (const [roleName, vector] of Object.entries(featureVectors)) {
    arrays[roleName] = featureVectorToArray(vector);
  }
  
  return arrays;
}

export default {
  generateFeatureVector,
  generateFeatureVectors,
  featureVectorToArray,
  featureVectorsToArrays,
};
