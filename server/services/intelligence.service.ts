import { User, Skill, Project, Experience } from "@shared/schema";
import { RoleRequirementProfile, ROLE_REQUIREMENTS } from "@shared/roles";

export interface ReadinessResult {
    roleName: string;
    score: number;
    status: "Strong" | "Needs Projects" | "Skill Gap" | "Beginner";
    gaps: string[];
    strengths: string[];
}

export class IntelligenceService {
    static calculateReadiness(
        roleName: string,
        user: User,
        skills: Skill[],
        projects: Project[],
        experiences: Experience[]
    ): ReadinessResult {
        // Support for Unlimited Roles: Fallback to dynamic profile if not in hardcoded list
        const role = ROLE_REQUIREMENTS[roleName] || this.getDynamicRoleProfile(roleName);

        // Define weights based on UserType (Context-Aware Scoring)
        let weights = { skill: 0.35, project: 0.25, exp: 0.20, resume: 0.20 };

        if (user.userType === "Student" || user.userType === "Fresher") {
            weights = { skill: 0.45, project: 0.30, exp: 0.05, resume: 0.20 };
        } else if (user.userType === "Working Professional") {
            weights = { skill: 0.30, project: 0.10, exp: 0.40, resume: 0.20 };
        } else if (user.userType === "Career Switcher") {
            weights = { skill: 0.40, project: 0.40, exp: 0.10, resume: 0.10 };
        }

        // 1. Skill Match Score
        const skillScore = this.computeSkillScore(skills, role);

        // 2. Project Depth Score
        const projectScore = this.computeProjectScore(projects, role);

        // 3. Experience Score
        const experienceScore = this.computeExperienceScore(experiences, role);

        // 4. Resume Quality
        const resumeScore = (user.resumeScore || 0) / 100;

        // Combined Contextual Score
        let rawScore = (
            skillScore * weights.skill +
            projectScore * weights.project +
            experienceScore * weights.exp +
            resumeScore * weights.resume
        );

        // Apply Market Multiplier
        rawScore *= role.marketDemand;
        if (role.competitionLevel === "High") rawScore *= 0.95;
        if (role.competitionLevel === "Low") rawScore *= 1.05;

        const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

        // Gap Detection
        const gaps = this.detectGaps(user, skills, projects, experiences, role);
        const strengths = this.detectStrengths(skills, projects, experiences, role);

        // Status mapping
        let status: ReadinessResult["status"] = "Beginner";
        if (finalScore >= 75) status = "Strong";
        else if (gaps.some(g => g.includes("project"))) status = "Needs Projects";
        else if (gaps.some(g => g.includes("skill"))) status = "Skill Gap";

        return {
            roleName,
            score: finalScore,
            status,
            gaps,
            strengths
        };
    }

    private static getDynamicRoleProfile(roleName: string): RoleRequirementProfile {
        // Heuristics for non-hardcoded roles
        const isTechnical = /engineer|developer|data|tech|cloud|devops|architect|scientist/i.test(roleName);

        return {
            roleName,
            requiredSkills: isTechnical ? ["Core technical skills"] : ["Communication", "Planning", "Execution"],
            preferredSkills: [],
            minProjects: isTechnical ? 2 : 1,
            internshipPreference: true,
            competitionLevel: "Medium",
            marketDemand: 1.0
        };
    }

    private static computeSkillScore(skills: Skill[], role: RoleRequirementProfile): number {
        if (role.requiredSkills.length === 0) return 1;

        // Weight skills by proficiency level
        const skillLevelWeights: Record<string, number> = {
            "Advanced": 1.0,
            "Intermediate": 0.75,
            "Beginner": 0.5
        };

        let matchCount = 0;

        role.requiredSkills.forEach(req => {
            // Handle the "OR" logic (e.g., Java || Python)
            const options = req.toLowerCase().split("||").map(o => o.trim());
            const matchedSkill = skills.find(s => options.includes(s.name.toLowerCase()));
            
            if (matchedSkill) {
                // Weight by proficiency level
                const weight = skillLevelWeights[matchedSkill.level] || 0.5;
                matchCount += weight;
            }
        });

        const requiredMatch = matchCount / role.requiredSkills.length;

        // Bonus for preferred skills (also weighted by level)
        let preferredMatch = 0;
        role.preferredSkills.forEach(pref => {
            const matchedSkill = skills.find(s => s.name.toLowerCase() === pref.toLowerCase());
            if (matchedSkill) {
                const weight = skillLevelWeights[matchedSkill.level] || 0.5;
                preferredMatch += weight;
            }
        });
        const preferredBonus = role.preferredSkills.length > 0 ? (preferredMatch / role.preferredSkills.length) * 0.2 : 0;

        return Math.min(1, requiredMatch + preferredBonus);
    }

    private static computeProjectScore(projects: Project[], role: RoleRequirementProfile): number {
        if (role.minProjects === 0) return 1;
        const count = projects.length;
        const score = count >= role.minProjects ? 1 : (count / role.minProjects) * 0.8;

        // Bonus for high complexity projects
        const highComplexityBonus = projects.filter(p => p.complexity === "High").length * 0.1;

        return Math.min(1, score + highComplexityBonus);
    }

    private static computeExperienceScore(experiences: Experience[], role: RoleRequirementProfile): number {
        if (experiences.length === 0) return 0;

        // Calculate total duration in months
        let totalMonths = 0;
        const typeWeights: Record<string, number> = {
            "Job": 1.0,
            "Internship": 0.8,
            "Freelance": 0.6,
            "Project": 0.4
        };

        experiences.forEach(exp => {
            // Parse duration field (e.g., "6 months", "2 years", "1 year 6 months")
            let months = 0;
            
            if (exp.duration) {
                const durationStr = String(exp.duration).toLowerCase();
                
                // Extract years
                const yearMatch = durationStr.match(/(\d+)\s*(?:year|yr)/);
                if (yearMatch) months += parseInt(yearMatch[1]) * 12;
                
                // Extract months
                const monthMatch = durationStr.match(/(\d+)\s*(?:month|mo)/);
                if (monthMatch) months += parseInt(monthMatch[1]);
                
                // If no clear duration format, default to 1 month
                if (months === 0) months = 1;
            } else {
                months = 6; // Default to 6 months if no duration specified
            }

            const weight = typeWeights[exp.type] || 0.5;
            totalMonths += months * weight;
        });

        // Score formula:
        // 0 months = 0%, 6 months = 30%, 12 months = 60%, 36+ months = 100%
        const durationScore = Math.min(1, totalMonths / 36);
        
        // Bonus if has job experience (most valuable)
        const hasJob = experiences.some(e => e.type === "Job");
        const jobBonus = hasJob ? 0.1 : 0;

        return Math.min(1, durationScore + jobBonus);
    }

    private static detectGaps(user: User, skills: Skill[], projects: Project[], experiences: Experience[], role: RoleRequirementProfile): string[] {
        const gaps: string[] = [];
        const userSkillNames = skills.map(s => s.name.toLowerCase());

        role.requiredSkills.forEach(req => {
            const options = req.toLowerCase().split("||").map(o => o.trim());
            if (!options.some(opt => userSkillNames.includes(opt))) {
                gaps.push(`Missing core skill: ${req}`);
            }
        });

        if (projects.length < role.minProjects) {
            gaps.push(`Lack of projects: Add ${role.minProjects - projects.length} more`);
        }

        if (role.internshipPreference && !experiences.some(e => e.type === "Internship")) {
            gaps.push("No internship experience");
        }

        if (!user.resumeUrl) {
            gaps.push("Resume not uploaded");
        }

        return gaps;
    }

    private static detectStrengths(skills: Skill[], projects: Project[], experiences: Experience[], role: RoleRequirementProfile): string[] {
        const strengths: string[] = [];

        if (projects.some(p => p.complexity === "High")) {
            strengths.push("High technical depth in projects");
        }

        if (experiences.some(e => e.type === "Internship")) {
            strengths.push("Professional internship experience");
        }

        const advancedSkills = skills.filter(s => s.level === "Advanced").length;
        if (advancedSkills >= 2) {
            strengths.push(`Advanced proficiency in ${advancedSkills} core areas`);
        }

        return strengths;
    }

    static simulateImprovement(currentProfile: ReadinessResult, action: { type: string, value: any }, roleName: string, user: User, skills: Skill[], projects: Project[], experiences: Experience[]): number {
        // Mocked simulation by cloning and updating
        let simulatedProjects = [...projects];
        let simulatedSkills = [...skills];
        let simulatedExperiences = [...experiences];

        if (action.type === "ADD_PROJECT") {
            simulatedProjects.push({ id: "mock", userId: user.id, title: "Mock", techStack: [], description: "Mock", complexity: "Medium" } as any);
        } else if (action.type === "ADD_SKILL") {
            simulatedSkills.push({ id: "mock", userId: user.id, name: action.value, level: "Intermediate" } as any);
        }

        const newResult = this.calculateReadiness(roleName, user, simulatedSkills, simulatedProjects, simulatedExperiences);
        return Math.max(0, newResult.score - currentProfile.score);
    }
}
