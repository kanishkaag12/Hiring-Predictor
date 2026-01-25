import { User, Skill, Project, Experience } from "@shared/schema";
import { RoleRequirementProfile, ROLE_REQUIREMENTS } from "@shared/roles";

export interface StoredAnalysis {
    userId: string;
    status: "pending" | "completed" | "failed";
    resumeSummary: string;
    extractedSkills: string[];
    roleReadiness: RoleReadinessAnalysis[];
    skillGaps: SkillGap[];
    recommendations: string[];
    analyzedAt: Date;
}

export interface RoleReadinessAnalysis {
    roleName: string;
    score: number; // 0-100
    reasoning: string; // AI-generated explanation
    requiredSkills: string[];
    matchedSkills: string[];
}

export interface SkillGap {
    role: string;
    missingSkills: string[];
    explanation: string; // AI-generated explanation
}

/**
 * Analysis Engine - Runs ONCE when profile is complete
 * Combines LLM analysis with deterministic scoring
 */
export class AnalysisEngine {
    /**
     * Step 1: Use LLM to analyze resume and extract data
     */
    static async analyzeResumeWithLLM(
        resumeText: string,
        user: User
    ): Promise<{
        summary: string;
        extractedSkills: string[];
        experience: string;
    }> {
        try {
            const { AIService } = await import("./ai.service");

            const prompt = `
Analyze this resume and extract key information:

Resume:
${resumeText}

Provide in JSON format:
{
  "summary": "2-3 sentence professional summary",
  "extractedSkills": ["skill1", "skill2", ...],
  "experience": "Brief experience summary"
}

Extract ONLY skills explicitly mentioned, not implied.
            `;

            const response = await AIService.analyzeProfile(user, [], [], []);
            
            // Parse LLM response
            return {
                summary: response.summary,
                extractedSkills: this.parseSkillsFromResponse(response.summary),
                experience: response.summary
            };
        } catch (error) {
            console.error("Resume analysis failed:", error);
            throw new Error("Failed to analyze resume with LLM");
        }
    }

    /**
     * Step 2: Deterministic role readiness scoring
     * NO AI, PURE LOGIC
     */
    static computeRoleReadiness(
        skills: Skill[],
        projects: Project[],
        experiences: Experience[],
        role: RoleRequirementProfile
    ): { score: number; matchedSkills: string[] } {
        let score = 0;
        const matchedSkills: string[] = [];

        // 1. Skill match (40%)
        const skillWeights: Record<string, number> = {
            "Advanced": 1.0,
            "Intermediate": 0.75,
            "Beginner": 0.5
        };

        let skillMatch = 0;
        role.requiredSkills.forEach(req => {
            const userSkill = skills.find(s => s.name.toLowerCase().includes(req.toLowerCase()));
            if (userSkill) {
                skillMatch += skillWeights[userSkill.level] || 0.5;
                matchedSkills.push(userSkill.name);
            }
        });
        const skillScore = role.requiredSkills.length > 0 
            ? (skillMatch / role.requiredSkills.length) * 40
            : 40;

        // 2. Project experience (35%)
        const projectScore = Math.min(projects.length / role.minProjects, 1) * 35;

        // 3. Work experience (20%)
        let experienceScore = 0;
        experiences.forEach(exp => {
            const months = this.parseDuration(exp.duration);
            experienceScore += Math.min(months / 12, 1) * 20; // Max 20 points for experience
        });
        experienceScore = Math.min(experienceScore, 20);

        // 4. Resume quality (5%)
        const resumeScore = 5; // Placeholder

        score = Math.round(skillScore + projectScore + experienceScore + resumeScore);
        return {
            score: Math.min(100, Math.max(0, score)),
            matchedSkills
        };
    }

    /**
     * Step 3: Identify skill gaps (deterministic)
     */
    static detectSkillGaps(
        skills: Skill[],
        role: RoleRequirementProfile
    ): string[] {
        const userSkillNames = skills.map(s => s.name.toLowerCase());
        const gaps: string[] = [];

        role.requiredSkills.forEach(req => {
            const options = req.toLowerCase().split("||").map(o => o.trim());
            const hasSkill = options.some(opt => 
                userSkillNames.some(userSkill => userSkill.includes(opt))
            );
            if (!hasSkill) {
                gaps.push(req);
            }
        });

        return gaps;
    }

    /**
     * Step 4: Use LLM to generate explanations and recommendations
     */
    static async generateExplanations(
        roleReadiness: RoleReadinessAnalysis[],
        gaps: SkillGap[],
        user: User
    ): Promise<{
        readinessExplanations: string[];
        gapExplanations: string[];
        recommendations: string[];
    }> {
        try {
            const { AIService } = await import("./ai.service");

            const prompt = `
Given this readiness analysis, generate explanations and recommendations:

User Profile: ${user.userType} - ${user.role}
Selected Roles: ${roleReadiness.map(r => r.roleName).join(", ")}
Skill Gaps: ${gaps.map(g => `${g.role}: ${g.missingSkills.join(", ")}`).join("; ")}

Provide JSON:
{
  "readinessExplanations": ["explanation for each role"],
  "gapExplanations": ["why each gap matters"],
  "recommendations": ["top 3 actionable steps"]
}
            `;

            // Get AI explanations
            const insights = await AIService.analyzeProfile(user, [], [], []);

            return {
                readinessExplanations: insights.strengths || [],
                gapExplanations: insights.improvements || [],
                recommendations: insights.recommendations || []
            };
        } catch (error) {
            console.error("Explanation generation failed:", error);
            return {
                readinessExplanations: [],
                gapExplanations: [],
                recommendations: []
            };
        }
    }

    /**
     * Helper: Parse duration string like "6 months", "2 years"
     */
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

    /**
     * Helper: Extract skills from text
     */
    private static parseSkillsFromResponse(text: string): string[] {
        // Simple extraction - can be improved with NLP
        const commonSkills = [
            "javascript", "typescript", "react", "vue", "angular",
            "node", "express", "python", "java", "golang",
            "sql", "mongodb", "postgres", "docker", "kubernetes",
            "aws", "gcp", "azure", "devops", "ci/cd"
        ];

        const found: string[] = [];
        commonSkills.forEach(skill => {
            if (text.toLowerCase().includes(skill)) {
                found.push(skill);
            }
        });

        return found;
    }
}
