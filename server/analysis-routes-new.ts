import { Router, Request, Response, NextFunction } from "express";
import { User, Skill, Project, Experience } from "@shared/schema";
import { storage } from "./storage";
import { RoleSpecificIntelligence, RoleSpecificReadiness } from "./services/role-specific-intelligence";
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
 * Uses ROLE-SPECIFIC intelligence to calculate different scores per role
 * Stores analysis in DB, dashboard displays stored results
 */

interface StoredAnalysis {
    userId: string;
    status: "pending" | "completed" | "failed";
    roleReadiness: RoleSpecificReadiness[];
    globalReadiness: number;
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
            globalReadiness: 0,
            whatIfActions: [],
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

        res.json({ status: analysis.status });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch status" });
    }
});

/**
 * Get stored analysis results
 * GET /api/analysis/:userId
 */
router.get("/api/analysis/:userId", ensureAuthenticated, (req, res) => {
    try {
        const requestingUserId = (req.user as User).id;
        const targetUserId = req.params.userId;

        // Users can only view their own analysis
        if (requestingUserId !== targetUserId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const analysis = analysisStore.get(targetUserId);

        if (!analysis) {
            return res.json({
                status: "not_started",
                message: "No analysis available"
            });
        }

        if (analysis.status === "pending") {
            return res.json({
                status: "pending",
                message: "Analysis in progress"
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
 * Each role gets its own score calculation (NOT one-size-fits-all)
 */
async function runAnalysisAsync(user: User) {
    const userId = user.id;
    const record = analysisStore.get(userId)!;

    try {
        const skills = await storage.getSkills(userId);
        const projects = await storage.getProjects(userId);
        const experiences = await storage.getExperiences(userId);
        const resumeText = user.resume || "";

        // Step 1: Calculate ROLE-SPECIFIC readiness
        // Each role has a different score based on semantic skill matching, project relevance, etc.
        const roleReadiness: RoleSpecificReadiness[] = [];
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

        // Step 2: Calculate global readiness (weighted average across all roles)
        const globalReadiness =
            roleReadiness.length > 0
                ? Math.round(
                      roleReadiness.reduce((sum, r) => sum + r.score, 0) / roleReadiness.length
                  )
                : 0;

        // Step 3: Generate What-If scenarios
        // Shows per-role % improvement for each action
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

        // Update record with completed analysis
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

export default router;
