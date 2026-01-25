/**
 * SKILL-TO-ROLE MAPPING API ROUTES
 * 
 * This file provides ready-to-use API endpoints for the skill-to-role mapping service.
 * Add these to server/routes.ts or create as a separate route handler.
 * 
 * Endpoints:
 * - POST /api/analyze-skills - Analyze a set of skills
 * - GET /api/recommend-roles/:userId - Get role recommendations
 * - POST /api/skill-match - Get match for specific role
 * - GET /api/skill-gaps/:userId/:role - Get skill gaps analysis
 * - POST /api/rank-candidates - Rank candidates for a role
 */

import express, { Router, Request, Response } from "express";
import SkillRoleMappingService from "../services/skill-role-mapping.service";
import skillConfig from "../services/skill-role-mapping.config";

const log = (msg: any) => console.log(msg);

const router = Router();

// ============================================================================
// 1. ANALYZE SKILLS
// ============================================================================

/**
 * POST /api/analyze-skills
 * 
 * Analyze a set of skills across all roles
 * 
 * Request:
 * {
 *   skills: ["Python", "SQL", "Tableau", ...]
 * }
 * 
 * Response:
 * {
 *   analyzedSkills: [...],
 *   allRoleScores: {
 *     "Data Analyst": { score: 0.87, matchPercentage: 87 },
 *     ...
 *   },
 *   topMatches: [...],
 *   summary: "..."
 * }
 */
router.post("/api/analyze-skills", async (req: Request, res: Response) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: "Invalid request: skills must be a non-empty array"
      });
    }

    // Get all role matches
    const allScores = SkillRoleMappingService.calculateAllRoleMatches(skills);

    // Get top recommendations
    const topMatches = skillConfig.recommendTopRoles(skills, 5);

    // Generate summary
    const avgScore =
      Object.values(allScores).reduce((sum, s) => sum + s.score, 0) /
      Object.keys(allScores).length;

    const summary =
      avgScore >= 0.7
        ? "Strong overall skill profile with multiple role options"
        : avgScore >= 0.5
          ? "Solid skills, good fit for several roles"
          : "Emerging skill set, focus on specific role path";

    log(
      `Analyzed ${skills.length} skills | Top match: ${topMatches[0]?.roleName || "N/A"}`
    );

    res.json({
      analyzedSkills: skills,
      allRoleScores: allScores,
      topMatches: topMatches,
      summary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error analyzing skills: ${error}`);
    res.status(500).json({ error: "Failed to analyze skills" });
  }
});

// ============================================================================
// 2. RECOMMEND ROLES
// ============================================================================

/**
 * GET /api/recommend-roles/:userId
 * 
 * Get role recommendations for a user based on their skills
 * 
 * Response:
 * {
 *   userId: "...",
 *   recommendations: [
 *     {
 *       rank: 1,
 *       role: "Data Analyst",
 *       score: 0.87,
 *       matchPercentage: 87,
 *       fit: "Excellent Match",
 *       action: "Ready to apply"
 *     },
 *     ...
 *   ]
 * }
 */
router.get("/api/recommend-roles/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // TODO: Fetch user skills from database
    // const userSkills = await db.query(
    //   "SELECT name FROM skills WHERE userId = ?",
    //   [userId]
    // );
    // const skillNames = userSkills.map((s: any) => s.name);

    // For demo, using mock data
    const skillNames = ["Python", "SQL", "Tableau", "Pandas"];

    const recommendations = skillConfig.recommendTopRoles(skillNames, 5);

    const formattedRecommendations = recommendations.map((rec: any, idx: number) => ({
      rank: idx + 1,
      role: rec.roleName,
      score: rec.score,
      matchPercentage: rec.matchPercentage,
      fit: rec.label,
      action:
        rec.matchPercentage >= 80
          ? "Ready to apply"
          : rec.matchPercentage >= 60
            ? "Strong path - minor learning"
            : "Consider skill development first"
    }));

    log(`Recommended roles for user ${userId}`);

    res.json({
      userId,
      recommendations: formattedRecommendations
    });
  } catch (error) {
    log(`Error recommending roles: ${error}`);
    res.status(500).json({ error: "Failed to recommend roles" });
  }
});

// ============================================================================
// 3. SKILL MATCH FOR SPECIFIC ROLE
// ============================================================================

/**
 * POST /api/skill-match
 * 
 * Get detailed match score for specific role
 * 
 * Request:
 * {
 *   role: "Data Analyst",
 *   skills: ["Python", "SQL", ...]
 * }
 * 
 * Response:
 * {
 *   role: "Data Analyst",
 *   score: 0.87,
 *   matchPercentage: 87,
 *   components: [...],
 *   gaps: [...],
 *   strengths: [...],
 *   recommendations: [...]
 * }
 */
router.post("/api/skill-match", async (req: Request, res: Response) => {
  try {
    const { role, skills } = req.body;

    if (!role || !Array.isArray(skills)) {
      return res.status(400).json({
        error: "Invalid request: role and skills are required"
      });
    }

    const result = SkillRoleMappingService.calculateSkillMatchScore(role, skills);

    log(
      `Calculated match for ${role}: ${result.matchPercentage}%`
    );

    res.json({
      role: result.roleName,
      score: result.overallScore,
      matchPercentage: result.matchPercentage,
      components: result.components.map((comp) => ({
        category: comp.categoryName,
        score: comp.categoryScore,
        weight: comp.categoryWeight,
        matched: comp.matchedSkills,
        explanation: comp.explanation
      })),
      gaps: result.essentialGaps,
      strengths: result.strengths,
      recommendations: result.recommendations,
      explanation: result.explanation
    });
  } catch (error) {
    log(`Error calculating skill match: ${error}`);
    res.status(500).json({ error: "Failed to calculate skill match" });
  }
});

// ============================================================================
// 4. SKILL GAP ANALYSIS
// ============================================================================

/**
 * GET /api/skill-gaps/:userId/:role
 * 
 * Get skill gaps and learning path for reaching a role
 * 
 * Response:
 * {
 *   userId: "...",
 *   targetRole: "Data Analyst",
 *   currentSkills: [...],
 *   missingCritical: [...],
 *   missingPreferred: [...],
 *   learningPath: {
 *     immediate: [...],
 *     shortTerm: [...],
 *     longTerm: [...]
 *   },
 *   estimatedTimeToJobReady: "~3 months"
 * }
 */
router.get("/api/skill-gaps/:userId/:role", async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.params;

    // TODO: Fetch user skills from database
    // const userSkills = await db.query(
    //   "SELECT name FROM skills WHERE userId = ?",
    //   [userId]
    // );
    // const skillNames = userSkills.map((s: any) => s.name);

    // For demo
    const skillNames = ["Python", "SQL"];

    const gapAnalysis = skillConfig.analyzeSkillGaps(role, skillNames);

    log(`Generated learning path for ${userId} → ${role}`);

    res.json({
      userId,
      targetRole: role,
      currentSkills: gapAnalysis.currentSkills,
      missingCritical: gapAnalysis.missingCritical,
      missingPreferred: gapAnalysis.missingPreferred,
      learningPath: {
        immediate: gapAnalysis.learningPath.immediate,
        shortTerm: gapAnalysis.learningPath.shortTerm,
        longTerm: gapAnalysis.learningPath.longTerm
      },
      estimatedTimeToJobReady: gapAnalysis.estimatedTimeToJobReady,
      suggestions: [
        ...gapAnalysis.learningPath.immediate.map(
          (s: string) => `Learn ${s} (Immediate Priority)`
        ),
        ...gapAnalysis.learningPath.shortTerm.map((s: string) => `Develop ${s}`)
      ].slice(0, 5)
    });
  } catch (error) {
    log(`Error analyzing gaps: ${error}`);
    res.status(500).json({ error: "Failed to analyze skill gaps" });
  }
});

// ============================================================================
// 5. RANK CANDIDATES
// ============================================================================

/**
 * POST /api/rank-candidates
 * 
 * Rank multiple candidates for a specific role
 * 
 * Request:
 * {
 *   role: "Data Analyst",
 *   candidates: [
 *     { id: "A", skills: [...] },
 *     { id: "B", skills: [...] }
 *   ]
 * }
 * 
 * Response:
 * {
 *   role: "Data Analyst",
 *   ranked: [
 *     {
 *       rank: 1,
 *       candidateId: "A",
 *       score: 0.87,
 *       matchPercentage: 87,
 *       fit: "Excellent",
 *       gaps: [...]
 *     },
 *     ...
 *   ]
 * }
 */
router.post("/api/rank-candidates", async (req: Request, res: Response) => {
  try {
    const { role, candidates } = req.body;

    if (!role || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: "Invalid request: role and candidates are required"
      });
    }

    const ranked = skillConfig.rankCandidatesByRole(role, candidates);

    const formattedRanked = ranked.map((candidate: any, idx: number) => ({
      rank: idx + 1,
      candidateId: candidate.candidateId,
      score: candidate.score,
      matchPercentage: candidate.matchPercentage,
      fit: candidate.fit,
      gaps: candidate.gaps,
      recommendation:
        candidate.fit === "Excellent"
          ? "Strong candidate, prioritize interview"
          : candidate.fit === "Good"
            ? "Good fit, reasonable choice"
            : candidate.fit === "Moderate"
              ? "Consider with others in pool"
              : "Likely poor fit for this role"
    }));

    log(
      `Ranked ${candidates.length} candidates for ${role}`
    );

    res.json({
      role,
      totalCandidates: candidates.length,
      ranked: formattedRanked
    });
  } catch (error) {
    log(`Error ranking candidates: ${error}`);
    res.status(500).json({ error: "Failed to rank candidates" });
  }
});

// ============================================================================
// 6. FIND ROLES WITH ADDRESSABLE GAPS
// ============================================================================

/**
 * POST /api/alternative-roles
 * 
 * Find roles where candidate has addressable gaps (fixable with learning)
 * 
 * Request:
 * {
 *   skills: ["Python", "SQL", ...]
 * }
 * 
 * Response:
 * {
 *   currentMatch: { role: "...", score: ... },
 *   alternativeRoles: [
 *     {
 *       role: "...",
 *       score: 0.65,
 *       gaps: [...],
 *       recommendation: "..."
 *     }
 *   ]
 * }
 */
router.post("/api/alternative-roles", async (req: Request, res: Response) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        error: "Invalid request: skills must be an array"
      });
    }

    // Top role
    const topRecommendations = skillConfig.recommendTopRoles(skills, 1);
    const currentMatch = topRecommendations[0];

    // Alternative roles with gaps
    const alternatives = skillConfig.findRolesWithGaps(skills, 0.55);

    const formattedAlternatives = alternatives.map((alt: any) => ({
      role: alt.roleName,
      score: alt.score,
      matchPercentage: Math.round(alt.score * 100),
      gaps: alt.gaps,
      recommendation:
        alt.gaps.length <= 2
          ? `Only need to learn: ${alt.gaps.join(", ")}`
          : "Consider after strengthening current fit"
    }));

    log(`Found ${formattedAlternatives.length} alternative roles`);

    res.json({
      currentStrongFit: {
        role: currentMatch.roleName,
        matchPercentage: currentMatch.matchPercentage
      },
      alternativeRoles: formattedAlternatives.slice(0, 5)
    });
  } catch (error) {
    log(`Error finding alternatives: ${error}`);
    res.status(500).json({ error: "Failed to find alternative roles" });
  }
});

// ============================================================================
// 7. HEALTH CHECK
// ============================================================================

router.get("/api/skill-mapping-health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "Skill-to-Role Mapping",
    version: "1.0.0",
    endpoints: [
      "POST /api/analyze-skills",
      "GET /api/recommend-roles/:userId",
      "POST /api/skill-match",
      "GET /api/skill-gaps/:userId/:role",
      "POST /api/rank-candidates",
      "POST /api/alternative-roles"
    ]
  });
});

// ============================================================================
// EXPORT
// ============================================================================

export default router;

/*
INTEGRATION INTO main routes.ts:

import skillMappingRoutes from "@server/api/skill-mapping.routes";

app.use(skillMappingRoutes);
*/
