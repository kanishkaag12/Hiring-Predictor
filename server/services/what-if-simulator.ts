import { User, Skill, Project, Experience } from "@shared/schema";
import { RoleSpecificIntelligence, RoleSpecificReadiness } from "./role-specific-intelligence";

export interface WhatIfAction {
    type:
        | "add_skill"
        | "add_project"
        | "complete_internship"
        | "gain_experience"
        | "improve_resume";
    description: string;
    skillDetails?: { name: string; level: "Beginner" | "Intermediate" | "Advanced" };
    projectDetails?: {
        title: string;
        complexity: "Low" | "Medium" | "High";
        techStack: string[];
    };
    experienceDetails?: { type: string; duration: string };
}

export interface SimulationResult {
    action: WhatIfAction;
    currentScores: Record<string, number>; // roleName -> score
    projectedScores: Record<string, number>; // roleName -> score
    delta: Record<string, number>; // roleName -> delta (could be negative!)
    explanation: string;
}

/**
 * What-If Simulator
 * Shows REAL per-role % improvement, not same +X% for all
 */
export class WhatIfSimulator {
    /**
     * Simulate an action and return per-role deltas
     */
    static async simulate(
        action: WhatIfAction,
        user: User,
        currentSkills: Skill[],
        currentProjects: Project[],
        currentExperiences: Experience[],
        selectedRoles: string[],
        resumeText?: string
    ): Promise<SimulationResult> {
        // Get current scores for all selected roles
        const currentScores: Record<string, number> = {};

        for (const role of selectedRoles) {
            const readiness = await RoleSpecificIntelligence.calculateRoleReadiness(
                role,
                user,
                currentSkills,
                currentProjects,
                currentExperiences,
                resumeText
            );
            currentScores[role] = readiness.score;
        }

        // Apply action to create virtual profile
        const virtualSkills = [...currentSkills];
        const virtualProjects = [...currentProjects];
        const virtualExperiences = [...currentExperiences];

        if (action.type === "add_skill" && action.skillDetails) {
            virtualSkills.push({
                id: "virtual_" + Date.now(),
                userId: user.id,
                name: action.skillDetails.name,
                level: action.skillDetails.level,
                endorsed: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else if (action.type === "add_project" && action.projectDetails) {
            virtualProjects.push({
                id: "virtual_" + Date.now(),
                userId: user.id,
                title: action.projectDetails.title,
                description: "",
                techStack: action.projectDetails.techStack,
                complexity: action.projectDetails.complexity,
                githubLink: null,
                liveLink: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else if (action.type === "complete_internship" && action.experienceDetails) {
            virtualExperiences.push({
                id: "virtual_" + Date.now(),
                userId: user.id,
                type: "Internship",
                role: "Intern",
                company: "Simulated",
                duration: action.experienceDetails.duration
            });
        } else if (action.type === "gain_experience" && action.experienceDetails) {
            virtualExperiences.push({
                id: "virtual_" + Date.now(),
                userId: user.id,
                type: "Job",
                role: "Virtual Experience",
                company: "Simulated",
                duration: action.experienceDetails.duration
            });
        } else if (action.type === "improve_resume") {
            // Hypothetically improve resume score
            user.resumeScore = Math.min(100, (user.resumeScore || 50) + 10);
        }

        // Calculate projected scores for virtual profile
        const projectedScores: Record<string, number> = {};

        for (const role of selectedRoles) {
            const readiness = await RoleSpecificIntelligence.calculateRoleReadiness(
                role,
                user,
                virtualSkills,
                virtualProjects,
                virtualExperiences,
                resumeText
            );
            projectedScores[role] = readiness.score;
        }

        // Calculate per-role deltas
        const delta: Record<string, number> = {};
        selectedRoles.forEach(role => {
            delta[role] = (projectedScores[role] || 0) - (currentScores[role] || 0);
        });

        // Generate explanation
        const explanation = this.generateSimulationExplanation(action, delta, selectedRoles);

        return {
            action,
            currentScores,
            projectedScores,
            delta,
            explanation
        };
    }

    /**
     * Generate human-readable explanation of what-if results
     * E.g., "Adding a Backend project will boost Backend Dev (+8%) but help Fullstack too (+4%)"
     */
    private static generateSimulationExplanation(
        action: WhatIfAction,
        delta: Record<string, number>,
        selectedRoles: string[]
    ): string {
        // Find positive and negative impacts
        const impacts = selectedRoles
            .map(role => ({ role, delta: delta[role] || 0 }))
            .sort((a, b) => b.delta - a.delta);

        const positiveImpacts = impacts.filter(i => i.delta > 0);
        const zeroImpacts = impacts.filter(i => i.delta === 0);
        const negativeImpacts = impacts.filter(i => i.delta < 0);

        let explanation = `${action.description} would:\n`;

        if (positiveImpacts.length > 0) {
            const topRole = positiveImpacts[0];
            explanation += `Boost ${topRole.role} by ${topRole.delta.toFixed(0)}%`;

            if (positiveImpacts.length > 1) {
                const others = positiveImpacts
                    .slice(1)
                    .map(i => `${i.role} (+${i.delta.toFixed(0)}%)`)
                    .join(", ");
                explanation += ` (also help ${others})`;
            }
        }

        if (zeroImpacts.length > 0) {
            explanation += `${positiveImpacts.length > 0 ? "\n" : ""}No impact on ${zeroImpacts.map(i => i.role).join(", ")}`;
        }

        if (negativeImpacts.length > 0 && negativeImpacts[0].delta < -5) {
            explanation += `${positiveImpacts.length > 0 || zeroImpacts.length > 0 ? "\n" : ""}Slightly reduce ${negativeImpacts.map(i => i.role).join(", ")}`;
        }

        return explanation;
    }

    /**
     * Pre-computed what-if actions with real tech relevance
     */
    static getCommonWhatIfActions(userType: string): WhatIfAction[] {
        const actions: WhatIfAction[] = [
            {
                type: "add_skill",
                description: "Learn Docker",
                skillDetails: { name: "Docker", level: "Intermediate" }
            },
            {
                type: "add_skill",
                description: "Master TypeScript",
                skillDetails: { name: "TypeScript", level: "Advanced" }
            },
            {
                type: "add_project",
                description: "Build a Full-Stack App",
                projectDetails: {
                    title: "Full-Stack Application",
                    complexity: "High",
                    techStack: ["React", "Node.js", "PostgreSQL"]
                }
            },
            {
                type: "add_project",
                description: "Create a Backend API",
                projectDetails: {
                    title: "REST API",
                    complexity: "Medium",
                    techStack: ["Node.js", "Express", "MongoDB"]
                }
            },
            {
                type: "improve_resume",
                description: "Enhance resume with metrics & impact"
            }
        ];

        if (userType === "Student" || userType === "Fresher") {
            actions.push({
                type: "complete_internship",
                description: "Complete a tech internship",
                experienceDetails: { type: "Internship", duration: "3 months" }
            });
        } else {
            actions.push({
                type: "gain_experience",
                description: "Gain 1 year of relevant experience",
                experienceDetails: { type: "Job", duration: "1 year" }
            });
        }

        return actions;
    }
}
