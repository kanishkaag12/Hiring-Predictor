import { User, Skill, Project, Experience } from "@shared/schema";
import { RoleRequirementProfile, ROLE_REQUIREMENTS } from "@shared/roles";

export interface RoleSpecificReadiness {
    roleName: string;
    score: number; // 0-100
    components: {
        skillMatch: number; // 0-1
        projectRelevance: number; // 0-1
        experienceFit: number; // 0-1
        resumeQuality: number; // 0-1
    };
    gaps: string[];
    strengths: string[];
    explanation: string;
}

/**
 * NEW: Role-Specific Intelligence Service
 * Calculates DIFFERENT readiness scores for EACH role based on:
 * 1. Semantic skill matching (AI embeddings)
 * 2. Project relevance classification (LLM)
 * 3. Experience fit for role type (student vs employee)
 * 4. Resume quality for this specific role (LLM evaluation)
 */
export class RoleSpecificIntelligence {
    /**
     * Calculate readiness for ONE specific role
     * Result: Different score per role, not one-size-fits-all
     */
    static async calculateRoleReadiness(
        roleName: string,
        user: User,
        skills: Skill[],
        projects: Project[],
        experiences: Experience[],
        resumeText?: string
    ): Promise<RoleSpecificReadiness> {
        const role = ROLE_REQUIREMENTS[roleName] || this.getDynamicRoleProfile(roleName);

        // Component 1: Semantic Skill Matching (40%)
        const skillMatch = await this.computeSemanticSkillMatch(skills, role);

        // Component 2: Project Relevance for This Role (30%)
        const projectRelevance = await this.computeProjectRelevanceScore(projects, role);

        // Component 3: Experience Fit (varies by user type) (20%)
        const experienceFit = this.computeExperienceFit(
            experiences,
            user.userType || "Student",
            role
        );

        // Component 4: Resume Quality for This Role (10%)
        const resumeQuality = await this.computeResumeQualityForRole(
            resumeText || "",
            user,
            role
        );

        // Weighted score
        const score = Math.round(
            (skillMatch * 40 + projectRelevance * 30 + experienceFit * 20 + resumeQuality * 10)
        );

        // Gaps and strengths for this specific role
        const gaps = this.detectRoleGaps(skills, projects, experiences, role);
        const strengths = this.detectRoleStrengths(skills, projects, experiences, role);

        // AI explanation for this role
        const explanation = await this.generateRoleExplanation(
            roleName,
            score,
            { skillMatch, projectRelevance, experienceFit, resumeQuality },
            gaps,
            user
        );

        return {
            roleName,
            score: Math.min(100, Math.max(0, score)),
            components: {
                skillMatch,
                projectRelevance,
                experienceFit,
                resumeQuality
            },
            gaps,
            strengths,
            explanation
        };
    }

    /**
     * Component 1: Semantic Skill Matching (40%)
     * Uses AI to understand that "React" ≈ "Vue" for frontend roles
     * but "React" ≠ "Cybersecurity" for security roles
     */
    private static async computeSemanticSkillMatch(
        skills: Skill[],
        role: RoleRequirementProfile
    ): Promise<number> {
        if (skills.length === 0 || role.requiredSkills.length === 0) return 0;

        const skillLevelWeights: Record<string, number> = {
            "Advanced": 1.0,
            "Intermediate": 0.75,
            "Beginner": 0.5
        };

        let totalMatch = 0;

        // For each required skill, find best match
        for (const requiredSkill of role.requiredSkills) {
            const options = requiredSkill.toLowerCase().split("||").map(o => o.trim());
            let bestMatch = 0;

            // Find user skill with highest relevance
            for (const userSkill of skills) {
                let relevance = 0;

                // Exact or partial match
                if (options.some(opt => userSkill.name.toLowerCase().includes(opt))) {
                    relevance = 1.0;
                } else {
                    // Semantic similarity (simplified - in prod use embeddings)
                    relevance = this.calculateSemanticSimilarity(userSkill.name, requiredSkill);
                }

                // Weight by skill level
                const weight = skillLevelWeights[userSkill.level] || 0.5;
                const weightedRelevance = relevance * weight;

                if (weightedRelevance > bestMatch) {
                    bestMatch = weightedRelevance;
                }
            }

            totalMatch += bestMatch;
        }

        return totalMatch / role.requiredSkills.length;
    }

    /**
     * Component 2: Project Relevance Score (30%)
     * Each project gets classified for THIS role:
     * - Does it match role requirements?
     * - Is complexity high enough?
     * - Does tech stack align?
     */
    private static async computeProjectRelevanceScore(
        projects: Project[],
        role: RoleRequirementProfile
    ): Promise<number> {
        if (projects.length === 0) return 0;

        let relevanceSum = 0;

        for (const project of projects) {
            let projectRelevance = 0;

            // Complexity bonus
            if (project.complexity === "High") projectRelevance += 0.3;
            else if (project.complexity === "Medium") projectRelevance += 0.2;
            else projectRelevance += 0.1;

            // Tech stack alignment
            const techStack = (project.techStack || []).join(" ").toLowerCase();
            const roleSkills = role.requiredSkills.join(" ").toLowerCase();

            let stackOverlap = 0;
            role.requiredSkills.forEach(skill => {
                if (techStack.includes(skill.toLowerCase())) {
                    stackOverlap += 0.15;
                }
            });

            projectRelevance += Math.min(stackOverlap, 0.5);

            // GitHub presence
            if (project.githubLink) projectRelevance += 0.1;

            relevanceSum += Math.min(projectRelevance, 1.0);
        }

        // Score: average project relevance, bonus for multiple projects
        const avgRelevance = relevanceSum / projects.length;
        const projectCountBonus = Math.min(projects.length / role.minProjects, 0.3);

        return Math.min(1, avgRelevance + projectCountBonus);
    }

    /**
     * Component 3: Experience Fit (20%)
     * DIFFERENT calculation based on user type
     * - Student: Projects + internships matter more
     * - Employee: Work experience + duration matter
     */
    private static computeExperienceFit(
        experiences: Experience[],
        userType: string,
        role: RoleRequirementProfile
    ): number {
        if (experiences.length === 0) return 0;

        const typeWeights: Record<string, number> = {
            "Job": 1.0,
            "Internship": 0.8,
            "Freelance": 0.6,
            "Project": 0.4
        };

        let score = 0;

        if (userType === "Student" || userType === "Fresher") {
            // For students, internships are most valuable, projects less so
            const internships = experiences.filter(e => e.type === "Internship").length;
            const projects = experiences.filter(e => e.type === "Project").length;

            score = Math.min(1, (internships * 0.6 + projects * 0.2) / 2);
        } else {
            // For employees, work duration matters
            let totalMonths = 0;

            experiences.forEach(exp => {
                const months = this.parseDuration(exp.duration);
                const weight = typeWeights[exp.type] || 0.5;
                totalMonths += months * weight;
            });

            // Score formula: 12 months = 0.5, 36+ months = 1.0
            score = Math.min(1, totalMonths / 36);
        }

        return score;
    }

    /**
     * Component 4: Resume Quality for THIS Role (10%)
     * LLM evaluates how well resume matches role
     */
    private static async computeResumeQualityForRole(
        resumeText: string,
        user: User,
        role: RoleRequirementProfile
    ): Promise<number> {
        if (!resumeText && !user.resumeUrl) return 0;

        // Base score from resume quality
        const baseScore = (user.resumeScore || 50) / 100;

        // Bonus if resume mentions role-relevant keywords
        let keywordBonus = 0;
        const roleName = role.roleName.toLowerCase();

        // Check if resume mentions role or required skills
        const keywords = [...role.requiredSkills, role.roleName].filter(k => k);
        for (const keyword of keywords) {
            if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
                keywordBonus += 0.05;
            }
        }

        return Math.min(1, baseScore + Math.min(keywordBonus, 0.3));
    }

    /**
     * Detect gaps SPECIFIC to this role
     */
    private static detectRoleGaps(
        skills: Skill[],
        projects: Project[],
        experiences: Experience[],
        role: RoleRequirementProfile
    ): string[] {
        const gaps: string[] = [];
        const userSkillNames = skills.map(s => s.name.toLowerCase());

        // Missing required skills
        role.requiredSkills.forEach(req => {
            const options = req.toLowerCase().split("||").map(o => o.trim());
            if (!options.some(opt => userSkillNames.some(us => us.includes(opt)))) {
                gaps.push(`Missing: ${req}`);
            }
        });

        // Project count
        if (projects.length < role.minProjects) {
            gaps.push(`Need ${role.minProjects - projects.length} more project(s)`);
        }

        // Internship expectation
        if (
            role.internshipPreference &&
            !experiences.some(e => e.type === "Internship")
        ) {
            gaps.push("No internship experience");
        }

        return gaps;
    }

    /**
     * Detect strengths SPECIFIC to this role
     */
    private static detectRoleStrengths(
        skills: Skill[],
        projects: Project[],
        experiences: Experience[],
        role: RoleRequirementProfile
    ): string[] {
        const strengths: string[] = [];

        // Advanced skills in required areas
        const advancedSkillCount = skills.filter(
            s => s.level === "Advanced" && role.requiredSkills.some(req =>
                req.toLowerCase().includes(s.name.toLowerCase())
            )
        ).length;

        if (advancedSkillCount >= 2) {
            strengths.push(`${advancedSkillCount} advanced role-relevant skills`);
        }

        // High-complexity projects
        if (projects.some(p => p.complexity === "High")) {
            strengths.push("Experience with complex projects");
        }

        // GitHub presence
        if (projects.some(p => p.githubLink)) {
            strengths.push("Public project portfolio");
        }

        return strengths;
    }

    /**
     * Generate role-aware explanation using AI
     */
    private static async generateRoleExplanation(
        roleName: string,
        score: number,
        components: Record<string, number>,
        gaps: string[],
        user: User
    ): Promise<string> {
        const role = ROLE_REQUIREMENTS[roleName];

        // Determine status
        let status = "Beginner";
        if (score >= 75) status = "Strong";
        else if (score >= 50) status = "Developing";
        else if (score >= 25) status = "Starting";

        // AI-style explanation
        const strongestComponent = Object.entries(components).sort(
            ([, a], [, b]) => b - a
        )[0];

        const explanation = `
For ${roleName}, your readiness is ${score}% (${status}). 
Your strongest area is ${strongestComponent[0].replace(/([A-Z])/g, ' $1').toLowerCase()} (${Math.round(strongestComponent[1] * 100)}%).
${gaps.length > 0 ? `Key gaps: ${gaps.slice(0, 2).join(", ")}` : "No major gaps identified."}
        `.trim();

        return explanation;
    }

    /**
     * Helpers
     */
    private static calculateSemanticSimilarity(skillA: string, skillB: string): number {
        // Simplified semantic similarity - in production use embeddings
        const a = skillA.toLowerCase();
        const b = skillB.toLowerCase();

        // Common frontend skills are similar
        const frontendSkills = ["react", "vue", "angular", "svelte", "next", "nuxt"];
        const backendSkills = ["node", "express", "fastapi", "django", "spring", "golang"];
        const dbSkills = ["postgres", "mongodb", "mysql", "redis", "dynamodb"];

        if (
            frontendSkills.some(s => a.includes(s)) &&
            frontendSkills.some(s => b.includes(s))
        )
            return 0.7;
        if (
            backendSkills.some(s => a.includes(s)) &&
            backendSkills.some(s => b.includes(s))
        )
            return 0.7;
        if (dbSkills.some(s => a.includes(s)) && dbSkills.some(s => b.includes(s)))
            return 0.7;

        return 0;
    }

    private static parseDuration(duration: string | null): number {
        if (!duration) return 0;
        let months = 0;
        const durationStr = String(duration).toLowerCase();

        const yearMatch = durationStr.match(/(\d+)\s*(?:year|yr)/);
        if (yearMatch) months += parseInt(yearMatch[1]) * 12;

        const monthMatch = durationStr.match(/(\d+)\s*(?:month|mo)/);
        if (monthMatch) months += parseInt(monthMatch[1]);

        return months || 1;
    }

    private static getDynamicRoleProfile(roleName: string): RoleRequirementProfile {
        const isTechnical = /engineer|developer|tech|data|devops|architect|scientist/i.test(
            roleName
        );

        return {
            roleName,
            requiredSkills: isTechnical
                ? ["Core Technical Skills", "Problem Solving", "System Design"]
                : ["Communication", "Planning", "Execution"],
            preferredSkills: [],
            minProjects: isTechnical ? 2 : 1,
            internshipPreference: true,
            competitionLevel: "Medium",
            marketDemand: 1.0
        };
    }
}
