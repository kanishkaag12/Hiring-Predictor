import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Skill, Project, Experience } from "@shared/schema";
import { RoleSpecificIntelligence } from "./role-specific-intelligence";

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_HIREPULSE || "");

export interface WhatIfSimulationResponse {
  whatYouSimulate: string;
  impactByRole: Array<{
    roleName: string;
    improvement: number;
    reason: string;
  }>;
  aiExplanation: string;
  roiLevel: "Low" | "Medium" | "High";
  betterAlternatives?: Array<{
    action: string;
    impact: string;
  }>;
}

export class WhatIfSimulatorPrompt {
  static async simulateCareerAction(
    userInput: string,
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[],
    interestRoles: string[],
    resumeText?: string
  ): Promise<WhatIfSimulationResponse> {
    if (!interestRoles || interestRoles.length === 0) {
      throw new Error("User must have at least one selected interest role");
    }

    if (!process.env.Gemini_API_HIREPULSE) {
      return this.getMockResponse(userInput, interestRoles);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Build comprehensive system prompt
      const systemPrompt = `You are HirePulse's What-If Career Simulator AI.

Your role is to simulate the impact of hypothetical profile improvements on a user's job readiness WITHOUT modifying their actual profile.

You MUST:
1. Analyze the user's current profile (skills, projects, resume, career status, and selected interest roles)
2. Interpret the user's hypothetical action (e.g., "If I add communication skills", "If I learn system design")
3. Estimate how that change would affect:
   - Role-specific readiness scores
   - Skill gap reduction
   - Shortlisting probability (qualitative, not guaranteed)

CRITICAL RULES:
- NEVER assume information the user hasn't provided
- NEVER reuse the same impact percentage for all roles
- ALWAYS calculate DIFFERENT impact values for DIFFERENT roles
- Explain WHY impact differs between roles
- Be honest about limitations - avoid fake certainty
- All outputs are SIMULATED PREDICTIONS, not promises

RESPONSE FORMAT (MUST BE VALID JSON):
{
  "whatYouSimulate": "Clear restatement of the hypothetical action",
  "impactByRole": [
    {
      "roleName": "Role Name",
      "improvement": <number 0-20>,
      "reason": "Why this role has this specific impact"
    }
  ],
  "aiExplanation": "2-3 sentence human explanation of why impacts differ",
  "roiLevel": "Low|Medium|High",
  "betterAlternatives": [
    {
      "action": "Alternative action description",
      "impact": "+X-Y% for [role names]"
    }
  ]
}`;

      // Build user context
      const userContext = `
USER PROFILE DATA:
- Name: ${user.name || "N/A"}
- Career Status: ${user.userType || "Not specified"}
- College: ${user.college || "N/A"}
- Graduation Year: ${user.gradYear || "N/A"}
- Location: ${user.location || "N/A"}

CURRENT SKILLS (${skills.length}):
${skills.length > 0 ? skills.map(s => `- ${s.name} (${s.level})`).join("\n") : "No skills added yet"}

PROJECTS (${projects.length}):
${projects.length > 0 ? projects.map(p => `- ${p.title}: ${p.description || "No description"} (Tech: ${p.techStack.join(", ")})`).join("\n") : "No projects yet"}

EXPERIENCES (${experiences.length}):
${experiences.length > 0 ? experiences.map(e => `- ${e.role} at ${e.company} (${e.duration}, Type: ${e.type})`).join("\n") : "No experiences yet"}

RESUME:
${resumeText ? resumeText.substring(0, 500) : "Not uploaded"}

SELECTED INTEREST ROLES:
${interestRoles.join(", ")}

USER'S HYPOTHETICAL ACTION:
"${userInput}"
`;

      const fullPrompt = `${systemPrompt}

${userContext}

Based on the user profile and hypothetical action above, generate a simulation response in the exact JSON format specified.

Remember:
- Different roles should have DIFFERENT impact percentages
- Provide clear reasons for each role's impact
- Explain the ROI level
- Suggest better alternatives if this action has low ROI`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      return this.validateAndNormalizeResponse(parsed);
    } catch (error) {
      console.error("WhatIf Simulation Error:", error);
      return this.getMockResponse(userInput, interestRoles);
    }
  }

  private static validateAndNormalizeResponse(data: any): WhatIfSimulationResponse {
    // Ensure all required fields exist
    const impactByRole = (data.impactByRole || []).map((item: any) => ({
      roleName: item.roleName || "Unknown",
      improvement: Math.min(20, Math.max(0, Number(item.improvement) || 0)),
      reason: item.reason || "Impact on this role"
    }));

    const roiLevel = ["Low", "Medium", "High"].includes(data.roiLevel)
      ? data.roiLevel
      : "Medium";

    return {
      whatYouSimulate: data.whatYouSimulate || "User's hypothetical action",
      impactByRole,
      aiExplanation:
        data.aiExplanation ||
        "This action impacts your selected roles based on their skill requirements.",
      roiLevel: roiLevel as "Low" | "Medium" | "High",
      betterAlternatives: (data.betterAlternatives || []).slice(0, 3)
    };
  }

  private static getMockResponse(
    userInput: string,
    roles: string[]
  ): WhatIfSimulationResponse {
    // Simple mock response for when API is unavailable
    const impacts = roles.map((role, idx) => ({
      roleName: role,
      improvement: Math.max(3, Math.floor(Math.random() * 12) + (idx % 2 === 0 ? 3 : 0)),
      reason: `This action has targeted relevance to ${role} roles.`
    }));

    return {
      whatYouSimulate: `Simulating: ${userInput}`,
      impactByRole: impacts,
      aiExplanation: `Based on your selected roles and the action you described, we've estimated how this would impact your readiness.`,
      roiLevel: "Medium",
      betterAlternatives: [
        {
          action: "Focus on core technical skills",
          impact: "+15-20%"
        }
      ]
    };
  }
}
