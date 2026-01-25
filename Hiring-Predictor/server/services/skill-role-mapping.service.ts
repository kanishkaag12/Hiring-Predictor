/**
 * Skill-to-Role Mapping Service
 * 
 * Purpose: Maps extracted resume skills to job roles with deterministic skill match scores.
 * This enables conversion of resume data → role-specific feature vectors for ML prediction.
 * 
 * Design: Each role has weighted skill categories that determine match affinity.
 * Scoring is explainable: reasons are provided for each score component.
 */

// ============================================================================
// SKILL CATEGORIES & TAXONOMY
// ============================================================================

export enum SkillCategory {
  PROGRAMMING_LANGUAGE = "Programming Language",
  FRONTEND_FRAMEWORK = "Frontend Framework",
  BACKEND_FRAMEWORK = "Backend Framework",
  DATABASE = "Database",
  DATA_SCIENCE = "Data Science",
  TOOLS_DEVOPS = "Tools & DevOps",
  ANALYTICS_BI = "Analytics & BI",
  ML_AI = "ML/AI",
  SOFT_SKILLS = "Soft Skills",
  CLOUD_PLATFORMS = "Cloud Platforms",
  OTHER = "Other"
}

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

export interface SkillDefinition {
  name: string;
  category: SkillCategory;
  aliases: string[]; // Alternative names for the skill
}

export const SKILL_TAXONOMY: Record<string, SkillDefinition> = {
  // Programming Languages
  "python": {
    name: "Python",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["py", "python3", "python 3"]
  },
  "java": {
    name: "Java",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["java"]
  },
  "javascript": {
    name: "JavaScript",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["js", "javascript", "es6", "es5"]
  },
  "typescript": {
    name: "TypeScript",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["ts", "typescript"]
  },
  "sql": {
    name: "SQL",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["sql", "tsql", "plsql"]
  },
  "cpp": {
    name: "C++",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["c++", "cpp"]
  },
  "csharp": {
    name: "C#",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["c#", "csharp", "dotnet"]
  },
  "go": {
    name: "Go",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["go", "golang"]
  },
  "rust": {
    name: "Rust",
    category: SkillCategory.PROGRAMMING_LANGUAGE,
    aliases: ["rust"]
  },
  
  // Frontend Frameworks
  "react": {
    name: "React",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["react", "reactjs", "react.js"]
  },
  "vue": {
    name: "Vue",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["vue", "vuejs", "vue.js"]
  },
  "angular": {
    name: "Angular",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["angular", "angularjs"]
  },
  "html": {
    name: "HTML",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["html", "html5"]
  },
  "css": {
    name: "CSS",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["css", "css3", "scss", "sass"]
  },
  "tailwindcss": {
    name: "Tailwind CSS",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["tailwind", "tailwindcss", "tailwind css"]
  },
  "redux": {
    name: "Redux",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["redux"]
  },
  "figma": {
    name: "Figma",
    category: SkillCategory.FRONTEND_FRAMEWORK,
    aliases: ["figma"]
  },

  // Backend Frameworks
  "nodejs": {
    name: "Node.js",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["node.js", "nodejs", "node"]
  },
  "express": {
    name: "Express",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["express", "expressjs"]
  },
  "django": {
    name: "Django",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["django"]
  },
  "flask": {
    name: "Flask",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["flask"]
  },
  "springboot": {
    name: "Spring Boot",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["spring", "springboot", "spring boot"]
  },
  "asp.net": {
    name: "ASP.NET",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["asp.net", "aspnet"]
  },
  "fastapi": {
    name: "FastAPI",
    category: SkillCategory.BACKEND_FRAMEWORK,
    aliases: ["fastapi", "fast api"]
  },

  // Databases
  "postgresql": {
    name: "PostgreSQL",
    category: SkillCategory.DATABASE,
    aliases: ["postgresql", "postgres"]
  },
  "mysql": {
    name: "MySQL",
    category: SkillCategory.DATABASE,
    aliases: ["mysql"]
  },
  "mongodb": {
    name: "MongoDB",
    category: SkillCategory.DATABASE,
    aliases: ["mongodb", "mongo"]
  },
  "redis": {
    name: "Redis",
    category: SkillCategory.DATABASE,
    aliases: ["redis"]
  },
  "elasticsearch": {
    name: "Elasticsearch",
    category: SkillCategory.DATABASE,
    aliases: ["elasticsearch", "elastic"]
  },

  // Data Science
  "pandas": {
    name: "Pandas",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["pandas"]
  },
  "numpy": {
    name: "NumPy",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["numpy"]
  },
  "scikit-learn": {
    name: "Scikit-learn",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["scikit-learn", "sklearn"]
  },
  "matplotlib": {
    name: "Matplotlib",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["matplotlib"]
  },
  "plotly": {
    name: "Plotly",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["plotly"]
  },
  "seaborn": {
    name: "Seaborn",
    category: SkillCategory.DATA_SCIENCE,
    aliases: ["seaborn"]
  },

  // Analytics & BI
  "tableau": {
    name: "Tableau",
    category: SkillCategory.ANALYTICS_BI,
    aliases: ["tableau"]
  },
  "powerbi": {
    name: "Power BI",
    category: SkillCategory.ANALYTICS_BI,
    aliases: ["power bi", "powerbi"]
  },
  "looker": {
    name: "Looker",
    category: SkillCategory.ANALYTICS_BI,
    aliases: ["looker"]
  },
  "excel": {
    name: "Excel",
    category: SkillCategory.ANALYTICS_BI,
    aliases: ["excel", "ms excel"]
  },

  // ML/AI
  "tensorflow": {
    name: "TensorFlow",
    category: SkillCategory.ML_AI,
    aliases: ["tensorflow"]
  },
  "pytorch": {
    name: "PyTorch",
    category: SkillCategory.ML_AI,
    aliases: ["pytorch"]
  },
  "machinelearning": {
    name: "Machine Learning",
    category: SkillCategory.ML_AI,
    aliases: ["machine learning", "ml"]
  },
  "deeplearning": {
    name: "Deep Learning",
    category: SkillCategory.ML_AI,
    aliases: ["deep learning", "dl"]
  },
  "nlp": {
    name: "NLP",
    category: SkillCategory.ML_AI,
    aliases: ["nlp", "natural language processing"]
  },
  "computervision": {
    name: "Computer Vision",
    category: SkillCategory.ML_AI,
    aliases: ["computer vision", "cv"]
  },

  // Tools & DevOps
  "git": {
    name: "Git",
    category: SkillCategory.TOOLS_DEVOPS,
    aliases: ["git", "github", "gitlab"]
  },
  "docker": {
    name: "Docker",
    category: SkillCategory.TOOLS_DEVOPS,
    aliases: ["docker"]
  },
  "kubernetes": {
    name: "Kubernetes",
    category: SkillCategory.TOOLS_DEVOPS,
    aliases: ["kubernetes", "k8s"]
  },
  "jenkins": {
    name: "Jenkins",
    category: SkillCategory.TOOLS_DEVOPS,
    aliases: ["jenkins"]
  },
  "cicd": {
    name: "CI/CD",
    category: SkillCategory.TOOLS_DEVOPS,
    aliases: ["ci/cd", "cicd"]
  },

  // Cloud Platforms
  "aws": {
    name: "AWS",
    category: SkillCategory.CLOUD_PLATFORMS,
    aliases: ["aws", "amazon web services"]
  },
  "gcp": {
    name: "GCP",
    category: SkillCategory.CLOUD_PLATFORMS,
    aliases: ["gcp", "google cloud"]
  },
  "azure": {
    name: "Azure",
    category: SkillCategory.CLOUD_PLATFORMS,
    aliases: ["azure", "microsoft azure"]
  },

  // Soft Skills
  "communication": {
    name: "Communication",
    category: SkillCategory.SOFT_SKILLS,
    aliases: ["communication"]
  },
  "leadership": {
    name: "Leadership",
    category: SkillCategory.SOFT_SKILLS,
    aliases: ["leadership"]
  },
  "teamwork": {
    name: "Teamwork",
    category: SkillCategory.SOFT_SKILLS,
    aliases: ["teamwork", "team", "collaboration"]
  },
  "problemsolving": {
    name: "Problem Solving",
    category: SkillCategory.SOFT_SKILLS,
    aliases: ["problem solving", "analytical thinking"]
  }
};

// ============================================================================
// ROLE SKILL REQUIREMENTS
// ============================================================================

export interface RoleSkillProfile {
  roleName: string;
  requiredSkillCategories: Array<{
    category: SkillCategory;
    weight: number; // 0 to 1, sum should equal 1.0
  }>;
  essentialSkills: string[]; // Must have at least one
  strongSkills: string[]; // Strongly preferred
  bonusSkills: string[]; // Nice to have
}

export const ROLE_SKILL_PROFILES: Record<string, RoleSkillProfile> = {
  "Data Analyst": {
    roleName: "Data Analyst",
    requiredSkillCategories: [
      { category: SkillCategory.DATA_SCIENCE, weight: 0.30 },
      { category: SkillCategory.ANALYTICS_BI, weight: 0.30 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.20 },
      { category: SkillCategory.DATABASE, weight: 0.15 },
      { category: SkillCategory.SOFT_SKILLS, weight: 0.05 }
    ],
    essentialSkills: ["SQL", "Python", "Excel"],
    strongSkills: ["Pandas", "Statistics", "Tableau", "Power BI"],
    bonusSkills: ["R", "Apache Spark", "Looker", "NumPy"]
  },

  "Business Analyst": {
    roleName: "Business Analyst",
    requiredSkillCategories: [
      { category: SkillCategory.SOFT_SKILLS, weight: 0.35 },
      { category: SkillCategory.ANALYTICS_BI, weight: 0.25 },
      { category: SkillCategory.DATABASE, weight: 0.15 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.15 },
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.10 }
    ],
    essentialSkills: ["Communication", "SQL", "Excel"],
    strongSkills: ["Tableau", "Power BI", "Problem Solving"],
    bonusSkills: ["Looker", "Python", "Leadership"]
  },

  "ML Engineer": {
    roleName: "ML Engineer",
    requiredSkillCategories: [
      { category: SkillCategory.ML_AI, weight: 0.30 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.25 },
      { category: SkillCategory.DATA_SCIENCE, weight: 0.20 },
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.15 },
      { category: SkillCategory.CLOUD_PLATFORMS, weight: 0.10 }
    ],
    essentialSkills: ["Python", "Machine Learning", "TensorFlow", "PyTorch"],
    strongSkills: ["Pandas", "NumPy", "Docker", "Git", "SQL"],
    bonusSkills: ["Kubernetes", "AWS", "Deep Learning", "NLP"]
  },

  "Web Developer": {
    roleName: "Web Developer",
    requiredSkillCategories: [
      { category: SkillCategory.FRONTEND_FRAMEWORK, weight: 0.30 },
      { category: SkillCategory.BACKEND_FRAMEWORK, weight: 0.25 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.20 },
      { category: SkillCategory.DATABASE, weight: 0.15 },
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.10 }
    ],
    essentialSkills: ["HTML", "CSS", "JavaScript", "React"],
    strongSkills: ["Node.js", "SQL", "TypeScript", "Git", "REST APIs"],
    bonusSkills: ["Docker", "MongoDB", "Redux", "Tailwind CSS"]
  },

  "Frontend Developer": {
    roleName: "Frontend Developer",
    requiredSkillCategories: [
      { category: SkillCategory.FRONTEND_FRAMEWORK, weight: 0.40 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.25 },
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.15 },
      { category: SkillCategory.DATABASE, weight: 0.10 },
      { category: SkillCategory.SOFT_SKILLS, weight: 0.10 }
    ],
    essentialSkills: ["HTML", "CSS", "JavaScript", "React"],
    strongSkills: ["TypeScript", "Redux", "Git", "Tailwind CSS"],
    bonusSkills: ["Vue", "Angular", "Figma", "REST APIs"]
  },

  "Backend Developer": {
    roleName: "Backend Developer",
    requiredSkillCategories: [
      { category: SkillCategory.BACKEND_FRAMEWORK, weight: 0.30 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.25 },
      { category: SkillCategory.DATABASE, weight: 0.20 },
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.15 },
      { category: SkillCategory.CLOUD_PLATFORMS, weight: 0.10 }
    ],
    essentialSkills: ["Python", "Node.js", "SQL", "Database Design"],
    strongSkills: ["Docker", "Git", "REST APIs", "MongoDB"],
    bonusSkills: ["Kubernetes", "AWS", "Redis", "Microservices"]
  },

  "DevOps Engineer": {
    roleName: "DevOps Engineer",
    requiredSkillCategories: [
      { category: SkillCategory.TOOLS_DEVOPS, weight: 0.35 },
      { category: SkillCategory.CLOUD_PLATFORMS, weight: 0.25 },
      { category: SkillCategory.PROGRAMMING_LANGUAGE, weight: 0.20 },
      { category: SkillCategory.DATABASE, weight: 0.10 },
      { category: SkillCategory.SOFT_SKILLS, weight: 0.10 }
    ],
    essentialSkills: ["Docker", "Kubernetes", "AWS", "Git"],
    strongSkills: ["CI/CD", "Linux", "Python", "Jenkins"],
    bonusSkills: ["Terraform", "GCP", "Azure", "Monitoring Tools"]
  }
};

// ============================================================================
// SCORE EXPLANATION & TRANSPARENCY
// ============================================================================

export interface SkillScoreComponent {
  categoryName: string;
  categoryWeight: number;
  matchedSkills: string[];
  categoryScore: number; // 0-1
  explanation: string;
}

export interface SkillMatchResult {
  roleName: string;
  overallScore: number; // 0-1
  matchPercentage: number; // 0-100
  components: SkillScoreComponent[];
  essentialGaps: string[]; // Essential skills missing
  strengths: string[]; // Strong matched categories
  recommendations: string[];
  explanation: string;
}

// ============================================================================
// SKILL-TO-ROLE MATCHING SERVICE
// ============================================================================

export class SkillRoleMappingService {
  /**
   * Normalize a skill name: lowercase, trim, handle aliases
   */
  private static normalizeSkill(skill: string): string {
    return skill.trim().toLowerCase();
  }

  /**
   * Find the canonical skill from taxonomy by name or alias
   */
  private static resolveSkill(skill: string): SkillDefinition | null {
    const normalized = this.normalizeSkill(skill);

    // Direct lookup
    if (SKILL_TAXONOMY[normalized]) {
      return SKILL_TAXONOMY[normalized];
    }

    // Alias lookup
    for (const [, skillDef] of Object.entries(SKILL_TAXONOMY)) {
      if (
        skillDef.aliases.some(
          (alias) => this.normalizeSkill(alias) === normalized
        )
      ) {
        return skillDef;
      }
    }

    return null;
  }

  /**
   * Calculate skill match score for a specific role
   * 
   * @param roleName - Target role (e.g., "Data Analyst")
   * @param resumeSkills - Array of skills extracted from resume
   * @returns SkillMatchResult with detailed breakdown and explainability
   */
  static calculateSkillMatchScore(
    roleName: string,
    resumeSkills: string[]
  ): SkillMatchResult {
    const roleProfile = ROLE_SKILL_PROFILES[roleName];
    if (!roleProfile) {
      throw new Error(`Role "${roleName}" not found in skill profiles`);
    }

    // Normalize and resolve all resume skills
    const resolvedSkills = resumeSkills
      .map((skill) => this.resolveSkill(skill))
      .filter((skill): skill is SkillDefinition => skill !== null);

    // Group resolved skills by category
    const skillsByCategory: Record<SkillCategory, string[]> = {
      [SkillCategory.PROGRAMMING_LANGUAGE]: [],
      [SkillCategory.FRONTEND_FRAMEWORK]: [],
      [SkillCategory.BACKEND_FRAMEWORK]: [],
      [SkillCategory.DATABASE]: [],
      [SkillCategory.DATA_SCIENCE]: [],
      [SkillCategory.TOOLS_DEVOPS]: [],
      [SkillCategory.ANALYTICS_BI]: [],
      [SkillCategory.ML_AI]: [],
      [SkillCategory.SOFT_SKILLS]: [],
      [SkillCategory.CLOUD_PLATFORMS]: [],
      [SkillCategory.OTHER]: []
    };

    for (const skill of resolvedSkills) {
      skillsByCategory[skill.category].push(skill.name);
    }

    // Calculate component scores
    const components: SkillScoreComponent[] = [];
    let totalWeightedScore = 0;

    for (const categoryReq of roleProfile.requiredSkillCategories) {
      const matchedSkills = skillsByCategory[categoryReq.category];
      const categoryScore = this.calculateCategoryScore(
        categoryReq.category,
        matchedSkills,
        roleProfile
      );

      components.push({
        categoryName: categoryReq.category,
        categoryWeight: categoryReq.weight,
        matchedSkills,
        categoryScore,
        explanation: this.generateCategoryExplanation(
          categoryReq.category,
          matchedSkills,
          categoryScore
        )
      });

      totalWeightedScore += categoryScore * categoryReq.weight;
    }

    // Detect gaps and strengths
    const essentialGaps = this.findEssentialGaps(
      roleProfile,
      resolvedSkills
    );
    const strengths = this.findStrengths(
      roleProfile,
      resolvedSkills,
      components
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      roleProfile,
      essentialGaps,
      resolvedSkills
    );

    const overallScore = Math.min(1, Math.max(0, totalWeightedScore));

    return {
      roleName,
      overallScore,
      matchPercentage: Math.round(overallScore * 100),
      components,
      essentialGaps,
      strengths,
      recommendations,
      explanation: this.generateOverallExplanation(
        roleName,
        overallScore,
        essentialGaps,
        strengths
      )
    };
  }

  /**
   * Calculate score for a single skill category (0-1)
   */
  private static calculateCategoryScore(
    category: SkillCategory,
    matchedSkills: string[],
    roleProfile: RoleSkillProfile
  ): number {
    if (matchedSkills.length === 0) {
      return 0;
    }

    let categoryScore = 0;

    // Essential skills: each matched essential skill contributes 0.5
    const essentialMatches = roleProfile.essentialSkills.filter((skill) =>
      matchedSkills.some(
        (matched) =>
          this.normalizeSkill(matched) === this.normalizeSkill(skill)
      )
    );
    categoryScore += Math.min(0.5, essentialMatches.length * 0.25);

    // Strong skills: each matched strong skill contributes 0.3
    const strongMatches = roleProfile.strongSkills.filter((skill) =>
      matchedSkills.some(
        (matched) =>
          this.normalizeSkill(matched) === this.normalizeSkill(skill)
      )
    );
    categoryScore += Math.min(0.3, strongMatches.length * 0.15);

    // Bonus skills: each matched bonus skill contributes 0.1
    const bonusMatches = roleProfile.bonusSkills.filter((skill) =>
      matchedSkills.some(
        (matched) =>
          this.normalizeSkill(matched) === this.normalizeSkill(skill)
      )
    );
    categoryScore += Math.min(0.2, bonusMatches.length * 0.05);

    return Math.min(1, categoryScore);
  }

  /**
   * Find missing essential skills
   */
  private static findEssentialGaps(
    roleProfile: RoleSkillProfile,
    resolvedSkills: SkillDefinition[]
  ): string[] {
    const skillNames = resolvedSkills.map((s) => s.name.toLowerCase());
    return roleProfile.essentialSkills.filter(
      (essential) => !skillNames.includes(essential.toLowerCase())
    );
  }

  /**
   * Find strong matched categories and skills
   */
  private static findStrengths(
    roleProfile: RoleSkillProfile,
    resolvedSkills: SkillDefinition[],
    components: SkillScoreComponent[]
  ): string[] {
    const strengths: string[] = [];
    const skillNames = resolvedSkills.map((s) => s.name);

    // Add high-scoring categories
    for (const comp of components) {
      if (comp.categoryScore >= 0.7) {
        strengths.push(
          `Strong ${comp.categoryName} skills (${comp.categoryScore.toFixed(1)}/1.0)`
        );
      }
    }

    // Add matched strong skills
    const matchedStrong = roleProfile.strongSkills.filter((skill) =>
      skillNames.some(
        (name) => this.normalizeSkill(name) === this.normalizeSkill(skill)
      )
    );
    if (matchedStrong.length > 0) {
      strengths.push(`Strong match: ${matchedStrong.join(", ")}`);
    }

    return strengths;
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    roleProfile: RoleSkillProfile,
    essentialGaps: string[],
    resolvedSkills: SkillDefinition[]
  ): string[] {
    const recommendations: string[] = [];

    if (essentialGaps.length > 0) {
      recommendations.push(
        `Learn essential skills: ${essentialGaps.slice(0, 3).join(", ")}`
      );
    }

    // Check for missing strong skills
    const skillNames = resolvedSkills.map((s) => s.name.toLowerCase());
    const missingStrong = roleProfile.strongSkills
      .filter(
        (skill) => !skillNames.includes(skill.toLowerCase())
      )
      .slice(0, 2);

    if (missingStrong.length > 0) {
      recommendations.push(
        `Develop strong skills: ${missingStrong.join(", ")}`
      );
    }

    // Suggest bonus skills if core skills covered
    if (essentialGaps.length === 0 && missingStrong.length === 0) {
      const missingBonus = roleProfile.bonusSkills
        .filter(
          (skill) => !skillNames.includes(skill.toLowerCase())
        )
        .slice(0, 2);
      if (missingBonus.length > 0) {
        recommendations.push(
          `Consider bonus skills: ${missingBonus.join(", ")}`
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate explanation for a category score
   */
  private static generateCategoryExplanation(
    category: SkillCategory,
    matchedSkills: string[],
    score: number
  ): string {
    if (matchedSkills.length === 0) {
      return `No ${category} skills found.`;
    }

    const scoreLabel =
      score >= 0.8 ? "Excellent" : score >= 0.6 ? "Good" : "Fair";
    return `${scoreLabel} ${category} coverage (${matchedSkills.join(", ")})`;
  }

  /**
   * Generate overall explanation
   */
  private static generateOverallExplanation(
    roleName: string,
    score: number,
    gaps: string[],
    strengths: string[]
  ): string {
    const scoreLabel =
      score >= 0.8
        ? "Excellent"
        : score >= 0.6
          ? "Good"
          : score >= 0.4
            ? "Moderate"
            : "Limited";

    let explanation = `${scoreLabel} skill match for ${roleName} (${Math.round(score * 100)}%).`;

    if (strengths.length > 0) {
      explanation += ` Strengths: ${strengths[0]}.`;
    }

    if (gaps.length > 0) {
      explanation += ` Gaps: ${gaps.slice(0, 2).join(", ")}.`;
    }

    return explanation;
  }

  /**
   * Batch calculate skill match for all roles
   * Returns scores for every role for a given skill set
   */
  static calculateAllRoleMatches(resumeSkills: string[]): Record<
    string,
    {
      score: number;
      matchPercentage: number;
    }
  > {
    const results: Record<string, { score: number; matchPercentage: number }> =
      {};

    for (const roleName of Object.keys(ROLE_SKILL_PROFILES)) {
      const result = this.calculateSkillMatchScore(roleName, resumeSkills);
      results[roleName] = {
        score: result.overallScore,
        matchPercentage: result.matchPercentage
      };
    }

    return results;
  }
}

// ============================================================================
// EXPORT FOR USE
// ============================================================================

export default SkillRoleMappingService;
