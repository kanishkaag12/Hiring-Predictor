import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Skill, Project, Experience } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_HIREPULSE || "");

export interface AIInsights {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export class AIService {
  static async analyzeProfile(
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[]
  ): Promise<AIInsights> {
    const hasData = skills.length > 0 || projects.length > 0 || experiences.length > 0 || !!user.resumeUrl;

    if (!hasData) {
      return {
        summary: "I don't have enough information yet to generate professional insights.",
        strengths: ["Insufficient data"],
        improvements: ["Add more details to your profile"],
        recommendations: ["Update your skills, projects, and resume to unlock AI intelligence."]
      };
    }

    if (!process.env.Gemini_API_HIREPULSE) {
      return this.getMockInsights(user, skills, projects, experiences);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are a professional career coach and hiring expert. 
        Analyze the following user profile and provide structured insights.
        
        User: ${user.name} (${user.role || "Not specified"})
        Status: ${user.userType || "Not specified"}
        Bio: ${user.college || "N/A"}, Grad Year: ${user.gradYear || "N/A"}, Location: ${user.location || "N/A"}
        
        Skills: ${skills.map(s => `${s.name} (${s.level})`).join(", ")}
        
        Projects: ${projects.map(p => `${p.title}: ${p.description} (Tech: ${p.techStack.join(", ")})`).join("; ")}
        
        Experiences: ${experiences.map(e => `${e.role} at ${e.company} (${e.duration}, ${e.type})`).join("; ")}
        
        Please return the response in the following JSON format:
        {
          "summary": "Short 2-3 sentence professional summary",
          "strengths": ["List of 3 key strengths"],
          "improvements": ["List of 3 areas for growth"],
          "recommendations": ["List of 3 specific actionable carrier steps"]
        }
        
        Rules:
        - Be professional but encouraging.
        - Focus on technical depth and market readiness.
        - Ensure the output strictly follows the JSON structure above.
        - If data is sparse, prioritize recommending profile completion.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Basic JSON cleanup - AI sometimes wraps in code blocks
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return this.getMockInsights(user, skills, projects, experiences);
    }
  }

  static async explainRoleReadiness(
    roleResult: any,
    user: User,
    marketDemand: number,
    competitionLevel: string,
    peerInsights: string
  ): Promise<string> {
    if (!process.env.Gemini_API_HIREPULSE) {
      if (roleResult.score === 0) return "I don't have enough information yet.";
      return `For ${roleResult.roleName} roles, recruiters prioritize hands-on experience and skill depth. Your current readiness is ${roleResult.score}%. Focus on addressing the identified gaps to improve your standing.`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an AI Career Expert for HirePulse. 
        Explain the following role-based readiness assessment to the user in a professional, encouraging, and actionable way.
        
        Assessment Data:
        - Role: ${roleResult.roleName}
        - User Status: ${user.userType || "Not specified"}
        - Readiness Score: ${roleResult.score}%
        - Status: ${roleResult.status}
        - Strengths: ${roleResult.strengths.join(", ")}
        - Gaps: ${roleResult.gaps.join(", ")}
        - Market Demand Multiplier: ${marketDemand}
        - Competition Level: ${competitionLevel}
        - Peer Insights: ${peerInsights}
        
        Requirements:
        - CRITICAL: If readiness score is 0 or significant data (like skills/resume) is missing, say: "I don't have enough information yet."
        - Explain WHY this role suits or doesn't suit the user based on their profile.
        - Highlight what matters most for THIS specific role (e.g., projects for SDE, tools for Data).
        - Recommend the action that gives the highest ROI.
        - DO NOT generate or change the numeric score.
        - DO NOT make promises about job offers.
        - DO NOT guess roles or suggest roles automatically.
        - Keep the tone professional but human-like.
        - Max 4-5 sentences.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini AI Error in explanation:", error);
      return "Unable to generate personalized AI explanation at this moment.";
    }
  }

  private static getMockInsights(
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[]
  ): AIInsights {
    const hasData = skills.length > 0 || projects.length > 0 || experiences.length > 0;

    return {
      summary: hasData
        ? `Based on existing data, ${user.name} shows potential in ${skills[0]?.name || "technical areas"}.`
        : "I don't have enough information yet.",
      strengths: hasData
        ? ["Early interest in technology", "Clear educational background"]
        : ["Insufficient information"],
      improvements: hasData
        ? ["Add more technical projects"]
        : ["Start by adding skills and projects"],
      recommendations: [
        "Update your profile to receive specific career recommendations"
      ]
    };
  }
}
