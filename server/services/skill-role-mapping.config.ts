/**
 * Skill-to-Role Mapping Configuration
 * 
 * Central configuration for skill taxonomy and role profiles.
 * Can be extended with:
 * - Custom roles
 * - Industry-specific skill categorization
 * - Skill synergy weights
 * - Skill deprecation tracking
 */

import SkillRoleMappingService, {
  RoleSkillProfile,
  SkillCategory,
  ROLE_SKILL_PROFILES
} from "./skill-role-mapping.service";

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Minimum skill match score threshold for:
 * - "Qualified" candidates
 * - "Good fit" role recommendations
 */
export const SKILL_SCORE_THRESHOLDS = {
  EXCELLENT: 0.85,  // 85%+ match
  GOOD: 0.65,       // 65-85% match
  MODERATE: 0.45,   // 45-65% match
  POOR: 0.0         // Below 45%
};

/**
 * Score interpretation labels
 */
export const SCORE_LABELS = {
  [SKILL_SCORE_THRESHOLDS.EXCELLENT]: "Excellent Match",
  [SKILL_SCORE_THRESHOLDS.GOOD]: "Good Match",
  [SKILL_SCORE_THRESHOLDS.MODERATE]: "Moderate Match",
  [SKILL_SCORE_THRESHOLDS.POOR]: "Poor Match"
};

/**
 * Get score label based on numeric score
 */
export function getScoreLabel(score: number): string {
  if (score >= SKILL_SCORE_THRESHOLDS.EXCELLENT) return "Excellent Match";
  if (score >= SKILL_SCORE_THRESHOLDS.GOOD) return "Good Match";
  if (score >= SKILL_SCORE_THRESHOLDS.MODERATE) return "Moderate Match";
  return "Poor Match";
}

// ============================================================================
// ROLE RECOMMENDATION ENGINE
// ============================================================================

/**
 * Recommend top N roles based on skill match
 */
export function recommendTopRoles(
  resumeSkills: string[],
  topN: number = 3
): Array<{
  roleName: string;
  score: number;
  matchPercentage: number;
  label: string;
}> {
  const allScores = SkillRoleMappingService.calculateAllRoleMatches(
    resumeSkills
  );

  const recommendations = Object.entries(allScores)
    .map(([roleName, data]) => ({
      roleName,
      score: data.score,
      matchPercentage: data.matchPercentage,
      label: getScoreLabel(data.score)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return recommendations;
}

/**
 * Find roles where candidate has skill gaps
 */
export function findRolesWithGaps(
  resumeSkills: string[],
  minScore: number = SKILL_SCORE_THRESHOLDS.GOOD
): Array<{
  roleName: string;
  score: number;
  gaps: string[];
  recommendations: string[];
}> {
  const allScores = SkillRoleMappingService.calculateAllRoleMatches(
    resumeSkills
  );

  const rolesWithPotential = [];

  for (const [roleName, data] of Object.entries(allScores)) {
    if (data.score < minScore && data.score >= SKILL_SCORE_THRESHOLDS.MODERATE) {
      const detail = SkillRoleMappingService.calculateSkillMatchScore(
        roleName,
        resumeSkills
      );
      rolesWithPotential.push({
        roleName,
        score: data.score,
        gaps: detail.essentialGaps,
        recommendations: detail.recommendations
      });
    }
  }

  return rolesWithPotential.sort((a, b) => b.score - a.score);
}

// ============================================================================
// SKILL GAP ANALYSIS
// ============================================================================

export interface SkillGapAnalysis {
  currentSkills: string[];
  missingCritical: string[];
  missingPreferred: string[];
  learningPath: {
    immediate: string[]; // 1-2 months
    shortTerm: string[]; // 3-6 months
    longTerm: string[]; // 6+ months
  };
  estimatedTimeToJobReady: string;
}

/**
 * Generate skill gap analysis for a target role
 */
export function analyzeSkillGaps(
  roleName: string,
  resumeSkills: string[]
): SkillGapAnalysis {
  const result = SkillRoleMappingService.calculateSkillMatchScore(
    roleName,
    resumeSkills
  );

  const profileName = Object.keys(ROLE_SKILL_PROFILES).find(
    (key) => key === roleName
  );

  if (!profileName) {
    throw new Error(`Role "${roleName}" not found`);
  }

  const profile = ROLE_SKILL_PROFILES[profileName];
  const currentSkillNames = resumeSkills.map((s) => s.toLowerCase());

  // Categorize missing skills
  const missingCritical = profile.essentialSkills.filter(
    (skill) => !currentSkillNames.includes(skill.toLowerCase())
  );

  const missingPreferred = profile.strongSkills.filter(
    (skill) => !currentSkillNames.includes(skill.toLowerCase())
  );

  // Create learning path
  const learningPath = {
    immediate: missingCritical.slice(0, 2),
    shortTerm: [
      ...missingCritical.slice(2, 4),
      ...missingPreferred.slice(0, 2)
    ],
    longTerm: missingPreferred.slice(2)
  };

  // Estimate time to job readiness
  let estimatedWeeks = 0;
  estimatedWeeks += missingCritical.length * 3; // ~3 weeks per critical skill
  estimatedWeeks += missingPreferred.length * 2; // ~2 weeks per preferred skill

  const months = Math.ceil(estimatedWeeks / 4);
  const estimatedTime =
    months < 1 ? "< 1 month" : months === 1 ? "~1 month" : `~${months} months`;

  return {
    currentSkills: resumeSkills,
    missingCritical,
    missingPreferred,
    learningPath,
    estimatedTimeToJobReady: estimatedTime
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Analyze multiple candidates against a specific role
 */
export function rankCandidatesByRole(
  roleName: string,
  candidates: Array<{ id: string; skills: string[] }>
): Array<{
  candidateId: string;
  score: number;
  matchPercentage: number;
  gaps: string[];
  fit: "Excellent" | "Good" | "Moderate" | "Poor";
}> {
  return candidates
    .map((candidate) => {
      const result = SkillRoleMappingService.calculateSkillMatchScore(
        roleName,
        candidate.skills
      );
      let fit: "Excellent" | "Good" | "Moderate" | "Poor";
      if (result.overallScore >= SKILL_SCORE_THRESHOLDS.EXCELLENT) {
        fit = "Excellent";
      } else if (result.overallScore >= SKILL_SCORE_THRESHOLDS.GOOD) {
        fit = "Good";
      } else if (result.overallScore >= SKILL_SCORE_THRESHOLDS.MODERATE) {
        fit = "Moderate";
      } else {
        fit = "Poor";
      }
      return {
        candidateId: candidate.id,
        score: result.overallScore,
        matchPercentage: result.matchPercentage,
        gaps: result.essentialGaps,
        fit
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Find best-fit roles for multiple candidates
 */
export function findBestFitRoles(
  candidates: Array<{ id: string; skills: string[] }>
): Array<{
  candidateId: string;
  topRole: string;
  score: number;
  matchPercentage: number;
  alternatives: string[];
}> {
  return candidates.map((candidate) => {
    const recommendations = recommendTopRoles(candidate.skills, 5);
    return {
      candidateId: candidate.id,
      topRole: recommendations[0].roleName,
      score: recommendations[0].score,
      matchPercentage: recommendations[0].matchPercentage,
      alternatives: recommendations
        .slice(1, 4)
        .map((rec) => rec.roleName)
    };
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  SKILL_SCORE_THRESHOLDS,
  getScoreLabel,
  recommendTopRoles,
  findRolesWithGaps,
  analyzeSkillGaps,
  rankCandidatesByRole,
  findBestFitRoles
};
