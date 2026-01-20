import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Skill, Project, Experience } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    if (!process.env.GEMINI_API_KEY) {
      return this.getMockInsights(user, skills, projects, experiences);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are a professional career coach and hiring expert. 
        Analyze the following user profile and provide structured insights.
        
        User: ${user.name} (${user.role || "Not specified"})
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

  private static getMockInsights(
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[]
  ): AIInsights {
    const hasData = skills.length > 0 || projects.length > 0 || experiences.length > 0;
    
    return {
      summary: hasData 
        ? `${user.name} shows a promising start in their career. With a focus on ${skills[0]?.name || "technical development"}, there is a clear path toward growth.`
        : "Your profile is just getting started! Complete your profile to unlock deeper AI insights.",
      strengths: hasData 
        ? ["Early interest in technology", "Clear educational background", "Growing skill set"]
        : ["Willingness to learn", "Potential for growth", "Professional presence"],
      improvements: [
        "Add more technical projects to showcase problem-solving",
        "Deepen expertise in a core language or framework",
        "Quantify achievements in your experience roles"
      ],
      recommendations: [
        "Learn and master one major framework (like React or Django)",
        "Build a full-stack project and host it on GitHub",
        "Connect with professionals in your desired role on LinkedIn"
      ]
    };
  }
}
