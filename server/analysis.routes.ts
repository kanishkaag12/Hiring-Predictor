import { Router, Request, Response, NextFunction } from "express";
import { User, Skill, Project, Experience } from "@shared/schema";
import { storage } from "./storage";
import { RoleSpecificIntelligence } from "./services/role-specific-intelligence";
import { WhatIfSimulator, WhatIfAction } from "./services/what-if-simulator";

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

const router = Router();

/**
 * BACKGROUND ANALYSIS PIPELINE
 * Runs when profile becomes complete (dashboardUnlocked = true)
 * Uses role-specific intelligence to calculate different scores per role
 * Stores analysis in DB, dashboard displays stored results
 */

interface StoredAnalysis {
    userId: string;
    status: "pending" | "completed" | "failed";
    roleReadiness: Array<{
        roleName: string;
        score: number;
        components: {
            skillMatch: number;
            projectRelevance: number;
            experienceFit: number;
            resumeQuality: number;
        };
        gaps: string[];
        strengths: string[];
        explanation: string;
    }>;
    globalReadiness: number; // weighted average across roles
    whatIfActions?: Array<{
        action: WhatIfAction;
        explanation: string;
        delta: Record<string, number>;
    }>;
    analyzedAt: Date;
}

// In-memory analysis storage (in production, store in DB)
const analysisStore = new Map<string, StoredAnalysis>();

/**
 * Trigger analysis when profile is complete
 * POST /api/analysis/trigger
 */
router.post("/api/analysis/trigger", ensureAuthenticated, async (req, res) => {
    try {
        const userId = (req.user as User).id;
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if profile is complete
        const completeness = await checkProfileCompleteness(user);
        if (!completeness.isComplete) {
            return res.status(400).json({ error: "Profile not complete", completeness });
        }

        // Already being analyzed
        if (analysisStore.has(userId) && analysisStore.get(userId)?.status === "pending") {
            return res.json({ status: "pending", message: "Analysis already in progress" });
        }

        // Mark as pending
        analysisStore.set(userId, {
            userId,
            status: "pending",
            roleReadiness: [],
            skillGaps: [],
            recommendations: [],
            analyzedAt: new Date()
        });

        // Run analysis in background
        runAnalysisAsync(user).catch(error => {
            console.error("Analysis failed:", error);
            const record = analysisStore.get(userId);
            if (record) record.status = "failed";
        });

        res.json({ status: "pending", message: "Analysis started" });
    } catch (error) {
        console.error("Trigger error:", error);
        res.status(500).json({ error: "Failed to trigger analysis" });
    }
});

/**
 * Get analysis status
 * GET /api/analysis/status
 */
router.get("/api/analysis/status", ensureAuthenticated, (req, res) => {
    try {
        const userId = (req.user as User).id;
        const analysis = analysisStore.get(userId);

        if (!analysis) {
            return res.json({
                status: "not_started",
                message: "No analysis available"
            });
        }

        if (analysis.status === "pending") {
            return res.json({
                status: "pending",
                message: "Analysis in progress..."
            });
        }

        if (analysis.status === "failed") {
            return res.json({
                status: "failed",
                message: "Analysis failed"
            });
        }

        res.json({
            status: "completed",
            data: analysis
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analysis status" });
    }
});

/**
 * Get stored analysis results
 * GET /api/analysis/:userId
 */
router.get("/api/analysis/:userId", ensureAuthenticated, (req, res) => {
    try {
        const analysis = analysisStore.get(req.params.userId);

        if (!analysis) {
            return res.json({
                status: "not_started",
                message: "No analysis available"
            });
        }

        if (analysis.status === "pending") {
            return res.json({
                status: "pending",
                message: "Analysis in progress..."
            });
        }

        if (analysis.status === "failed") {
            return res.json({
                status: "failed",
                message: "Analysis failed"
            });
        }

        res.json({
            status: "completed",
            data: analysis
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

/**
 * Helper: Check profile completeness
 */
async function checkProfileCompleteness(user: User) {
    const skills = await storage.getSkills(user.id);
    const projects = await storage.getProjects(user.id);

    return {
        isComplete: !!(
            user.interestRoles?.length &&
            user.resumeUrl &&
            user.userType &&
            skills.length > 0
        ),
        details: {
            hasRoles: !!(user.interestRoles?.length),
            hasResume: !!user.resumeUrl,
            hasUserType: !!user.userType,
            hasSkills: skills.length > 0,
            hasProjects: projects.length > 0
        }
    };
}

/**
 * Background analysis function
 * Runs asynchronously using ROLE-SPECIFIC intelligence
 * Each role gets its own score calculation
 */
async function runAnalysisAsync(user: User) {
    const userId = user.id;
    const record = analysisStore.get(userId)!;

    try {
        const skills = await storage.getSkills(userId);
        const projects = await storage.getProjects(userId);
        const experiences = await storage.getExperiences(userId);
        const resumeText = user.resume || "";

        // Step 1: Calculate ROLE-SPECIFIC readiness (NOT one-size-fits-all)
        const roleReadiness = [];
        const scores: Record<string, number> = {};

        for (const roleName of user.interestRoles || []) {
            const readiness = await RoleSpecificIntelligence.calculateRoleReadiness(
                roleName,
                user,
                skills,
                projects,
                experiences,
                resumeText
            );

            roleReadiness.push(readiness);
            scores[roleName] = readiness.score;
        }

        // Step 2: Calculate global readiness (weighted average)
        const globalReadiness =
            roleReadiness.length > 0
                ? Math.round(
                    roleReadiness.reduce((sum, r) => sum + r.score, 0) / roleReadiness.length
                )
                : 0;

        // Step 3: Generate What-If scenarios
        const whatIfActions = [];
        const commonActions = WhatIfSimulator.getCommonWhatIfActions(user.userType || "Student");

        for (const action of commonActions.slice(0, 3)) {
            const result = await WhatIfSimulator.simulate(
                action,
                user,
                skills,
                projects,
                experiences,
                user.interestRoles || [],
                resumeText
            );

            whatIfActions.push({
                action: result.action,
                explanation: result.explanation,
                delta: result.delta
            });
        }

        // Update record
        record.status = "completed";
        record.roleReadiness = roleReadiness;
        record.globalReadiness = globalReadiness;
        record.whatIfActions = whatIfActions;
        record.analyzedAt = new Date();

        console.log(`✓ Role-specific analysis completed for user ${userId}:`, scores);
    } catch (error) {
        console.error(`✗ Analysis failed for user ${userId}:`, error);
        record.status = "failed";
    }
}

/**
 * Deterministic role readiness computation
 */
function computeRoleReadiness(
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[]
): Array<{ roleName: string; score: number; reasoning: string }> {
    const { ROLE_REQUIREMENTS } = require("@shared/roles");

    return (user.interestRoles || []).map((roleName: string) => {
        const role = ROLE_REQUIREMENTS[roleName] || { requiredSkills: [], minProjects: 1 };

        // Skill match
        const skillMatches = skills.filter(s =>
            role.requiredSkills.some(req => req.toLowerCase().includes(s.name.toLowerCase()))
        );
        const skillScore = (skillMatches.length / Math.max(1, role.requiredSkills.length)) * 40;

        // Project experience
        const projectScore = Math.min(projects.length / role.minProjects, 1) * 35;

        // Work experience
        let experienceScore = 0;
        experiences.forEach(exp => {
            const months = parseDuration(exp.duration);
            experienceScore += Math.min(months / 12, 1) * 20;
        });
        experienceScore = Math.min(experienceScore, 20);

        // Resume quality
        const resumeScore = (user.resumeScore || 0) / 100 * 5;

        const totalScore = Math.round(skillScore + projectScore + experienceScore + resumeScore);

        return {
            roleName,
            score: Math.min(100, Math.max(0, totalScore)),
            reasoning: generateReasoningText(skillScore, projectScore, experienceScore)
        };
    });
}

/**
 * Identify skill gaps
 */
function identifySkillGaps(
    skills: Skill[],
    roles: string[]
): Array<{ role: string; missingSkills: string[] }> {
    const { ROLE_REQUIREMENTS } = require("@shared/roles");
    const userSkillNames = skills.map(s => s.name.toLowerCase());

    return roles.map(roleName => {
        const role = ROLE_REQUIREMENTS[roleName] || { requiredSkills: [] };
        const missingSkills = role.requiredSkills.filter((req: string) => {
            const options = req.toLowerCase().split("||").map((o: string) => o.trim());
            return !options.some((opt: string) =>
                userSkillNames.some(userSkill => userSkill.includes(opt))
            );
        });

        return { role: roleName, missingSkills };
    });
}

/**
 * Use AI to generate recommendations
 */
async function generateRecommendationsWithAI(
    user: User,
    roleReadiness: Array<{ roleName: string; score: number }>,
    skillGaps: Array<{ role: string; missingSkills: string[] }>
): Promise<string[]> {
    try {
        const { AIService } = await import("./services/ai.service");

        const prompt = `
Based on this career profile:
- Selected roles: ${roleReadiness.map(r => r.roleName).join(", ")}
- Skill gaps: ${skillGaps.map(g => `${g.role}: ${g.missingSkills.join(", ")}`).join("; ")}
- User type: ${user.userType}

Generate 3-5 specific, actionable recommendations to improve readiness.
        `;

        const response = await AIService.analyzeProfile(user, [], [], []);
        return response.recommendations || [
            "Add missing skills identified in your profile",
            "Build projects that match your target roles",
            "Gain hands-on experience through internships or freelance work"
        ];
    } catch (error) {
        console.error("AI recommendation generation failed:", error);
        return [
            "Complete your profile with additional projects",
            "Add more skills to your profile",
            "Gain professional experience in your target roles"
        ];
    }
}

/**
 * Helper functions
 */
function parseDuration(duration: string | null): number {
    if (!duration) return 0;
    let months = 0;
    const durationStr = String(duration).toLowerCase();

    const yearMatch = durationStr.match(/(\d+)\s*(?:year|yr)/);
    if (yearMatch) months += parseInt(yearMatch[1]) * 12;

    const monthMatch = durationStr.match(/(\d+)\s*(?:month|mo)/);
    if (monthMatch) months += parseInt(monthMatch[1]);

    return months || 1;
}

function generateReasoningText(skillScore: number, projectScore: number, experienceScore: number): string {
    const parts: string[] = [];

    if (skillScore > 30) parts.push("strong skill match");
    else if (skillScore > 15) parts.push("moderate skill match");
    else parts.push("needs more skills");

    if (projectScore > 25) parts.push("good project experience");
    else if (projectScore > 10) parts.push("some project experience");
    else parts.push("needs more projects");

    if (experienceScore > 15) parts.push("solid work experience");
    else if (experienceScore > 5) parts.push("some work experience");
    else parts.push("limited work experience");

    return parts.join(", ");
}

export default router;
