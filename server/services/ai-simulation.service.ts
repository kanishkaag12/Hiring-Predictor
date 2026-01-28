import { User, Skill, Project, Experience } from "@shared/schema";
import { getGeminiModel, isAIEnabled } from "../config/ai-config";

export interface AISimulationResponse {
  simulation: string;
  impactByRole: Array<{
    role: string;
    impact: string; // e.g. "+7%"
    reason: string;
  }>;
  explanation: string;
  roi: "High" | "Medium" | "Low";
  alternatives: string[];
}

export interface JobSimulationResponse {
  whatYouSimulate: string;
  skillImpacts: Array<{
    skill: string;
    currentProbability: number;
    newProbability: number;
    percentageIncrease: number;
    timeToLearn: string;
    reasoning: string;
  }>;
  overallExplanation: string;
  roi: "High" | "Medium" | "Low";
  recommendedNextSteps: string[];
  jobFocusAreas: string[];
}

export class AISimulationService {
  static async simulate(
    userQuery: string,
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[],
    interestRoles: string[],
    resumeText?: string
  ): Promise<AISimulationResponse> {
    const cleanQuery = (userQuery || "").trim();

    if (!interestRoles || interestRoles.length === 0) {
      throw new Error("User must have at least one target role selected");
    }

    // Basic abuse/meaningless detection
    const lower = cleanQuery.toLowerCase();
    const abusive = /(shut up|stupid|idiot|dumb|fuck|shit|kill|suicide)/i.test(lower);
    const tooShort = cleanQuery.length < 4;
    const noLetters = !/[a-zA-Z]/.test(cleanQuery);

    if (abusive || tooShort || noLetters) {
      return {
        simulation: "Need clarification",
        impactByRole: interestRoles.map(role => ({
          role,
          impact: "+0%",
          reason: "No simulation run because the question was unclear or inappropriate."
        })),
        explanation: "I couldn’t understand that. Try asking about a skill, project, or experience you’re considering adding.",
        roi: "Low",
        alternatives: ["Ask about adding a specific skill (e.g., Docker, React)", "Ask about doing a project or internship"]
      };
    }

    // Guard against meaningless input and ask for clarification instead of hallucinating
    if (!cleanQuery || cleanQuery.length < 4) {
      return {
        simulation: "Need clarification",
        impactByRole: interestRoles.map(role => ({
          role,
          impact: "+0%",
          reason: "Cannot estimate impact until you specify the hypothetical action."
        })),
        explanation: "Please clarify the change you are considering (e.g., add a backend project, learn React, complete an internship).",
        roi: "Low",
        alternatives: ["Describe the specific skill or project you want to add"]
      };
    }

    if (!isAIEnabled()) {
      return this.mockResponse(userQuery, interestRoles, skills, projects);
    }

    const model = getGeminiModel();

    const profileBlock = this.buildProfileBlock(user, skills, projects, experiences, interestRoles, resumeText);

    const systemPrompt = `You are HirePulse AI, a senior career intelligence advisor and job simulation assistant.

CRITICAL VALIDATION RULES (HIGHEST PRIORITY):
- If the input is nonsensical, random characters, or not related to jobs, skills, careers, or hiring, you MUST respond with EXACTLY this JSON:
  {
    "simulation": "Invalid input. Please provide a meaningful job-related scenario.",
    "impactByRole": [],
    "explanation": "Invalid input. Please provide a meaningful job-related scenario.",
    "roi": "Low",
    "alternatives": ["Describe a specific skill you want to learn", "Mention a project or certification you're considering", "Ask about a career move or job change"]
  }
- Do NOT guess, infer, or fabricate meaning from unclear inputs.
- Do NOT answer vague, random, or unclear inputs.
- If intent is unclear, ask the user to clarify instead of simulating.
- Only respond with detailed analysis when the input clearly describes a job role, skill, career scenario, or hiring situation.
- This validation rule is HIGHER PRIORITY than being helpful.

For VALID job-related queries:

You must reason deeply and uniquely for every user query. Generic explanations are forbidden.

Inputs you receive:
1) User's profile (skills, projects, experience, target roles, resume snippet)
2) A hypothetical action the user is considering

Your task:
- Interpret the intent behind the action
- Provide explanation BEFORE any numbers
- Estimate role-specific impact (0–15%, as +X%, approximate, differing by role)
- Avoid fake precision; impacts must be justified in text
- Reject vague or meaningless queries (ask for clarification)
- Vary phrasing; do NOT reuse templates
- Tie each impact to skills, hiring signals, projects, or role expectations
- If impact is weak, explain WHY clearly and suggest better alternatives

STRICT RULES:
- If the query is unclear/abusive, respond with a clarification request instead of simulating.
- Do NOT reuse phrasing like "Impacts differ per role due to alignment".
- Always explain first, then mention any numeric impact.
- Each role must have different reasoning and typically different impact.

Return structured JSON ONLY:
{
  "simulation": "string",
  "impactByRole": [
    {
      "role": "string",
      "impact": "+X%",
      "reason": "specific reasoning tied to skills and hiring expectations"
    }
  ],
  "explanation": "natural-language reasoning (explain before numbers)",
  "roi": "High | Medium | Low",
  "alternatives": ["specific, actionable suggestions"]
}`;

    const userPrompt = `${systemPrompt}

  User query: "${cleanQuery}"

  ${profileBlock}

  Return ONLY the JSON object, no markdown, no code fences.`;

    try {
      const result = await model.generateContent(userPrompt);
      const text = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      return this.normalize(parsed, interestRoles);
    } catch (err) {
      console.error("AI simulation error, falling back to mock:", err);
      return this.mockResponse(cleanQuery, interestRoles, skills, projects);
    }
  }

  static async simulateForJob(
    query: string,
    jobTitle: string,
    jobDescription: string,
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[],
    resumeText?: string
  ): Promise<JobSimulationResponse> {
    const cleanQuery = (query || "").trim();

    // Basic abuse/meaningless detection
    const lower = cleanQuery.toLowerCase();
    const abusive = /(shut up|stupid|idiot|dumb|fuck|shit|kill|suicide)/i.test(lower);
    const tooShort = cleanQuery.length < 3;
    const noLetters = !/[a-zA-Z]/.test(cleanQuery);

    if (abusive || tooShort || noLetters) {
      return {
        whatYouSimulate: "Clarification Needed",
        skillImpacts: [],
        overallExplanation: "I couldn't quite understand that. To provide a helpful career simulation, please describe a specific action you're considering, like 'What if I learn React?' or 'If I add a backend project'.",
        roi: "Low",
        recommendedNextSteps: ["Describe a specific skill or project you want to add"],
        jobFocusAreas: ["Input Clarification"]
      };
    }

    if (!isAIEnabled()) {
      return this.mockJobResponse(cleanQuery, jobTitle);
    }

    const model = getGeminiModel();

    const systemPrompt = `You are HirePulse AI, a career growth coach and job simulation assistant.

    CRITICAL VALIDATION RULES (HIGHEST PRIORITY):
    - If the input is nonsensical, random characters, or not related to jobs, skills, careers, or hiring, you MUST respond with EXACTLY this JSON:
      {
        "whatYouSimulate": "Invalid input. Please provide a meaningful job-related scenario.",
        "skillImpacts": [],
        "overallExplanation": "Invalid input. Please provide a meaningful job-related scenario.",
        "roi": "Low",
        "recommendedNextSteps": ["Describe a specific skill you want to learn", "Mention a project or certification you're considering"],
        "jobFocusAreas": ["Input Validation"]
      }
    - Do NOT guess, infer, or fabricate meaning from unclear inputs.
    - Do NOT answer vague, random, or unclear inputs.
    - If intent is unclear, ask the user to clarify instead of simulating.
    - Only respond with detailed analysis when the input clearly describes a job role, skill, career scenario, or hiring situation.
    - This validation rule is HIGHER PRIORITY than being helpful.

    For VALID job-related queries:
    You will analyze a user's profile against a SPECIFIC job description and simulate the impact of a hypothetical action (e.g. learning a skill).

    STRICT RULES:
    1. Return structured JSON ONLY.
    2. Be specific to the job description provided.
    3. ROI must be "High", "Medium", or "Low".

    JSON Format:
    {
      "whatYouSimulate": "string",
      "skillImpacts": [
        {
          "skill": "string",
          "currentProbability": number (0-100),
          "newProbability": number (0-100),
          "percentageIncrease": number (positive integer),
          "timeToLearn": "string",
          "reasoning": "string"
        }
      ],
      "overallExplanation": "string",
      "roi": "High | Medium | Low",
      "recommendedNextSteps": ["string"],
      "jobFocusAreas": ["string"]
    }`;

    const profileBlock = this.buildProfileBlock(user, skills, projects, experiences, user.interestRoles || [], resumeText);

    const userPrompt = `
      JOB CONTEXT:
      Title: ${jobTitle}
      Description: ${jobDescription}

      USER HYPOTHETICAL ACTION:
      "${cleanQuery}"

      ${profileBlock}

      ${systemPrompt}
      Return ONLY the JSON object, no markdown.`;

    try {
      const result = await model.generateContent(userPrompt);
      const text = result.response.text().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("AI job simulation error:", err);
      return this.mockJobResponse(cleanQuery, jobTitle);
    }
  }

  private static mockJobResponse(query: string, jobTitle: string): JobSimulationResponse {
    return {
      whatYouSimulate: `Adding skills/experience related to "${query}" for the ${jobTitle} role`,
      skillImpacts: [
        {
          skill: query.length > 3 ? query : "Relevant Skill",
          currentProbability: 45,
          newProbability: 58,
          percentageIncrease: 13,
          timeToLearn: "4-6 weeks",
          reasoning: `Learning this would directly address key requirements for the ${jobTitle} position.`
        }
      ],
      overallExplanation: "This simulation estimates how your profile strength would improve if you carried out the proposed action. Role-specific requirements drive the probability increases.",
      roi: "High",
      recommendedNextSteps: [
        `Identify specific sub-topics within ${query}`,
        "Build a small project to demonstrate the new skill",
        "Update your resume once the skill is acquired"
      ],
      jobFocusAreas: ["Technical Proficiency", "Role Alignment"]
    };
  }

  private static buildProfileBlock(
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[],
    interestRoles: string[],
    resumeText?: string
  ) {
    const skillsStr = skills.length ? skills.map(s => `${s.name} (${s.level})`).join("; ") : "None";
    const projectsStr = projects.length
      ? projects.map(p => `${p.title} [${p.techStack.join(", ")} | ${p.complexity || ""}]`).join("; ")
      : "None";
    const expStr = experiences.length
      ? experiences.map(e => `${e.role} @ ${e.company} (${e.duration}, ${e.type})`).join("; ")
      : "None";
    const resumeStr = resumeText ? resumeText.substring(0, 600) : "Not uploaded";

    return `PROFILE CONTEXT
- Career Status: ${user.userType || "Unknown"}
- Target Roles: ${interestRoles.join(", ")}
- Skills: ${skillsStr}
- Projects: ${projectsStr}
- Experience: ${expStr}
- Resume snippet: ${resumeStr}`;
  }

  private static normalize(data: any, roles: string[]): AISimulationResponse {
    const impactByRole = Array.isArray(data.impactByRole)
      ? data.impactByRole
        .map((r: any, idx: number) => {
          const role = r.role || roles[idx] || `Role-${idx + 1}`;
          const rawImpact = typeof r.impact === "string" ? r.impact : `+${Math.round(Number(r.impact) || 0)}%`;
          const normalizedImpact = this.clampImpact(rawImpact);
          return {
            role,
            impact: normalizedImpact,
            reason: r.reason || "Specific relevance to this role"
          };
        })
        .slice(0, Math.max(roles.length, 1))
      : roles.map((role, idx) => ({ role, impact: `+${Math.min(15, 5 + idx * 2)}%`, reason: "Relevant to this role" }));

    // Ensure diversity of impacts
    const diversified = impactByRole.map((item: { role: string; impact: string; reason: string; }, idx: number) => {
      const base = parseInt(item.impact.replace(/[^0-9-]/g, "")) || 0;
      const jitter = (idx * 3 + roles.length) % 4; // simple spread
      const val = Math.max(0, Math.min(15, base + jitter));
      return { ...item, impact: `+${val}%` };
    });

    const roi = ["High", "Medium", "Low"].includes(data.roi) ? data.roi : this.deriveROI(diversified);

    const alternatives = Array.isArray(data.alternatives) && data.alternatives.length
      ? data.alternatives.slice(0, 3)
      : this.defaultAlternatives(diversified);

    return {
      simulation: data.simulation || "Simulating the user's hypothetical action",
      impactByRole: diversified,
      explanation: data.explanation || "Role impacts differ based on required skills and your current profile.",
      roi: roi as "High" | "Medium" | "Low",
      alternatives
    };
  }

  private static clampImpact(raw: string): string {
    const num = parseInt(raw.replace(/[^0-9-]/g, "")) || 0;
    const clamped = Math.max(0, Math.min(15, num));
    return `+${clamped}%`;
  }

  private static deriveROI(impacts: { impact: string }[]): "High" | "Medium" | "Low" {
    const nums = impacts.map(i => parseInt(i.impact.replace(/[^0-9-]/g, "")) || 0);
    const maxImpact = Math.max(...nums, 0);
    if (maxImpact >= 12) return "High";
    if (maxImpact >= 6) return "Medium";
    return "Low";
  }

  private static defaultAlternatives(impacts: { role: string }[]): string[] {
    return impacts.slice(0, 2).map(i => `Add a targeted project for ${i.role}`);
  }

  private static mockResponse(
    userQuery: string,
    roles: string[],
    skills: Skill[],
    projects: Project[]
  ): AISimulationResponse {
    // Pseudo-random but deterministic-ish based on query and role names
    const seed = userQuery.length + skills.length * 3 + projects.length * 2;
    const impacts = roles.map((role, idx) => {
      const base = (seed + idx * 7 + role.length * 2) % 13 + 2; // 2..15
      const impactVal = Math.max(0, Math.min(15, base));
      return {
        role,
        impact: `+${impactVal}%`,
        reason: `This action touches ${role} requirements given your current profile.`
      };
    });

    const roi = this.deriveROI(impacts);

    return {
      simulation: `Simulating: ${userQuery}`,
      impactByRole: impacts,
      explanation: "Impacts differ per role due to alignment with required skills and your current strengths.",
      roi,
      alternatives: ["Add a quantified project that matches your top target role", "Close one core skill gap with a hands-on build"]
    };
  }
}
