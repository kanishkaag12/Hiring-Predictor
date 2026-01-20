export interface UserProfile {
    skills: string[];
    experienceLevel: "Student" | "Fresher" | "Junior" | "Mid" | "Senior";
    projects: any[]; // Placeholder
}

interface FeatureVector {
    days_since_posted: number;       // 0-1 (Normalized)
    skill_overlap_score: number;     // 0-1 (Jaccard/Set overlap)
    experience_match: number;        // 0 or 1
    role_competition_score: number;  // 0-1 (Derived from applicants)
    is_remote_match: number;         // 0 or 1
}

export class FeatureEngineer {

    static extract(job: any, user: UserProfile): FeatureVector {
        return {
            days_since_posted: this.normalizeFreshness(job.postedAt),
            skill_overlap_score: this.calculateSkillOverlap(job.skills || [], user.skills || []),
            experience_match: this.checkExperienceMatch(job.experienceLevel, user.experienceLevel),
            role_competition_score: this.normalizeCompetition(job.applicants || 0),
            is_remote_match: 1, // Defaulting to 1 as we are a remote-first platform (remotive)
        };
    }

    // Normalize days: < 3 days = 1.0, > 30 days = 0.0
    private static normalizeFreshness(postedAt: string): number {
        const days = (new Date().getTime() - new Date(postedAt).getTime()) / (1000 * 3600 * 24);
        if (days <= 3) return 1.0;
        if (days >= 30) return 0.0;
        return 1 - (days / 30); // Linear decay
    }

    // Jaccard Index for skill overlap
    private static calculateSkillOverlap(jobSkills: string[], userSkills: string[]): number {
        const jobSet = new Set(jobSkills.map(s => s.toLowerCase()));
        const userSet = new Set(userSkills.map(s => s.toLowerCase()));

        // If job has no skills listed, assume loose match (0.5)
        if (jobSet.size === 0) return 0.5;

        let matchCount = 0;
        jobSet.forEach(skill => {
            if (userSet.has(skill)) matchCount++;
        });

        return matchCount / jobSet.size;
    }

    private static checkExperienceMatch(jobLevel: string, userLevel: string): number {
        // Simple direct match for now. Could be ordinal (Student < Junior < Mid...)
        if (!jobLevel || !userLevel) return 0.5;
        return jobLevel.toLowerCase() === userLevel.toLowerCase() ? 1.0 : 0.0;
    }

    // Normalize competition: < 50 applicants = 1.0 (Low comp), > 500 = 0.0 (High comp)
    private static normalizeCompetition(applicants: number): number {
        if (applicants <= 50) return 1.0;
        if (applicants >= 500) return 0.0;
        return 1 - ((applicants - 50) / 450);
    }
}
