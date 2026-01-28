import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Skill, Project, Experience } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_HIREPULSE || "");

export interface SkillImpactData {
  skill: string;
  currentProbability: number;
  newProbability: number;
  percentageIncrease: number;
  timeToLearn: string;
  reasoning: string;
}

export interface JobSimulationResponse {
  whatYouSimulate: string;
  skillImpacts: SkillImpactData[];
  overallExplanation: string;
  roi: "High" | "Medium" | "Low";
  recommendedNextSteps: string[];
  jobFocusAreas: string[];
}

export class JobWhatIfSimulator {
  static async simulateForJob(
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string[],
    userQuery: string,
    user: User,
    skills: Skill[],
    projects: Project[],
    experiences: Experience[],
    interestRoles: string[],
    resumeText?: string
  ): Promise<JobSimulationResponse> {
    console.log("[JobWhatIfSimulator] Called with userQuery:", userQuery);
    console.log("[JobWhatIfSimulator] userQuery type:", typeof userQuery);
    console.log("[JobWhatIfSimulator] userQuery length:", userQuery ? userQuery.length : 0);
    
    if (!process.env.Gemini_API_HIREPULSE) {
      const result = this.getMockResponse(jobTitle, userQuery, skills);
      console.log("[JobWhatIfSimulator] Mock result whatYouSimulate:", result.whatYouSimulate);
      return result;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Build comprehensive system prompt for job-specific analysis
      const systemPrompt = `You are HirePulse's Job-Specific What-If Simulator AI.

Your role is to analyze a specific job posting and show users exactly which skills would improve their chances for THAT specific role.

You MUST:
1. Analyze the job description and requirements deeply
2. Identify skill gaps between the user's profile and job requirements
3. For each suggested skill, calculate:
   - How much the shortlist probability would increase (specific %)
   - How long it would take to learn (realistic estimate)
   - Why it matters for THIS specific job
4. Focus on practical, achievable recommendations

CRITICAL ANALYSIS GUIDELINES:
- Calculate SPECIFIC percentage increases based on job JD importance
- If a skill is heavily emphasized in JD (+20%), else lighter weight
- Consider user's current skills to estimate learning curve
- Be realistic about time-to-competency
- Explain HOW this skill helps for this specific role
- Prioritize by ROI (time-to-learn vs probability-increase)

RESPONSE FORMAT (MUST BE VALID JSON):
{
  "whatYouSimulate": "Clear statement of what improvement we're analyzing",
  "skillImpacts": [
    {
      "skill": "Skill Name",
      "currentProbability": <number>,
      "newProbability": <number>,
      "percentageIncrease": <number>,
      "timeToLearn": "Duration estimate",
      "reasoning": "Why this matters for THIS job"
    }
  ],
  "overallExplanation": "2-3 sentences on what the job prioritizes",
  "roi": "High|Medium|Low",
  "recommendedNextSteps": ["Step 1", "Step 2", "Step 3"],
  "jobFocusAreas": ["Area 1", "Area 2", "Area 3"]
}`;

      // Build job context
      const jobContext = `
SPECIFIC JOB DETAILS:
- Title: ${jobTitle}
- Description: ${jobDescription.substring(0, 1000)}
- Key Requirements: ${jobRequirements.slice(0, 5).join(", ")}
`;

      // Build user context
      const userContext = `
USER'S CURRENT PROFILE:
- Name: ${user.name || "N/A"}
- Career Status: ${user.userType || "Not specified"}
- College: ${user.college || "N/A"}
- Graduation Year: ${user.gradYear || "N/A"}

CURRENT SKILLS (${skills.length}):
${skills.length > 0 ? skills.map(s => `- ${s.name} (${s.level})`).join("\n") : "No skills yet"}

PROJECTS (${projects.length}):
${projects.length > 0 ? projects.map(p => `- ${p.title}: ${p.description || "N/A"}`).join("\n") : "No projects yet"}

EXPERIENCES (${experiences.length}):
${experiences.length > 0 ? experiences.map(e => `- ${e.role} at ${e.company} (${e.duration})`).join("\n") : "No experience yet"}
`;

      // Build the user query context
      const queryContext = userQuery && userQuery.trim() ? userQuery : "What skills should I focus on to improve my chances for this role?";

      const fullPrompt = `${systemPrompt}

${jobContext}

${userContext}

USER'S QUESTION: ${queryContext}

Provide a detailed job-specific what-if analysis. Focus on practical skills that directly align with this job's requirements. Return ONLY valid JSON.`;

      const response = await model.generateContent(fullPrompt);
      const text = response.response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not extract JSON from response:", text);
        return this.getMockResponse(jobTitle, queryContext, skills);
      }

      const parsed = JSON.parse(jsonMatch[0]) as JobSimulationResponse;
      return parsed;
    } catch (error) {
      console.error("Error in job-specific simulation:", error);
      return this.getMockResponse(jobTitle, userQuery, skills);
    }
  }

  private static getMockResponse(
    jobTitle: string,
    userQuery: string,
    skills: Skill[]
  ): JobSimulationResponse {
    const query = (userQuery || "").toLowerCase();
    const jobTitleLower = jobTitle.toLowerCase();
    const existingSkills = skills.map(s => s.name.toLowerCase());
    console.log(`[Mock What-If] jobTitle=${jobTitle} query=${userQuery}`);
    
    // VALIDATE QUERY - Make sure it's asking about skills or improvements
    const skillKeywords = ["learn", "skill", "improve", "increase", "help", "boost", "add", "gain", "how much", "what if", "would", "impact", "probability", "chances", "fastest", "focus"];
    const isValidSkillQuery = skillKeywords.some(kw => query.includes(kw));
    
    // If query is too short or doesn't mention improvement/skills, ask for clarification
    if (userQuery.length < 4 || (!isValidSkillQuery && !query.includes("which"))) {
      return {
        whatYouSimulate: userQuery || "Invalid query",
        skillImpacts: [],
        overallExplanation: `I'm here to analyze skills for this job role. Please ask questions like:\n- "What if I learn [skill]?"\n- "How much would [skill] help my chances?"\n- "Which skills should I focus on?"\n- "What's the fastest way to improve my shortlisting percentage?"\n\nFor example: "What if I learn System Design?" or "How much would Docker help?"`,
        roi: "Medium",
        recommendedNextSteps: [
          'Ask about a specific skill\'s impact on your chances',
          'Request the top skills for this role',
          'Ask for the fastest way to improve your profile'
        ],
        jobFocusAreas: []
      };
    }
    
      // SPECIFIC SKILL RESPONSES - Check first before anything else
      // If asking about System Design specifically
      if (query.includes("system design")) {
        console.log("[Mock What-If] Specific skill matched: System Design");
        return {
          whatYouSimulate: userQuery || "Learning System Design",
          skillImpacts: [
            {
              skill: "System Design",
              currentProbability: 45,
              newProbability: 61,
              percentageIncrease: 16,
              timeToLearn: "6-8 weeks",
              reasoning: "System Design is critical for architect and senior roles. Understanding distributed systems, scalability, and architecture patterns directly impacts hiring decisions for this role."
            }
          ],
          overallExplanation: `System Design is one of the highest-impact skills for the ${jobTitle} position. This role explicitly requires architects and senior engineers who can design scalable, distributed systems. The +16% probability increase reflects how essential this skill is for passing technical evaluations and demonstrating architecture-level thinking.`,
          roi: "High",
          recommendedNextSteps: [
            "Study distributed system fundamentals (databases, caching, APIs)",
            "Practice designing large-scale systems (design Twitter, YouTube, etc.)",
            "Build a project showcasing architectural decisions and trade-offs",
            "Discuss your system designs in interviews with confidence"
          ],
          jobFocusAreas: ["System Architecture", "Scalability Patterns", "Distributed Computing"]
        };
      }
    
      // If asking about Kubernetes
      if (query.includes("kubernetes")) {
        console.log("[Mock What-If] Specific skill matched: Kubernetes");
        return {
          whatYouSimulate: userQuery || "Learning Kubernetes",
          skillImpacts: [
            {
              skill: "Kubernetes",
              currentProbability: 45,
              newProbability: 59,
              percentageIncrease: 14,
              timeToLearn: "4-6 weeks",
              reasoning: "Kubernetes is essential for DevOps and cloud-native roles. Container orchestration is a core competency for modern infrastructure."
            }
          ],
          overallExplanation: `Kubernetes expertise would boost your probability by 14% for this role. Many modern backend and architect positions require understanding of container orchestration and Kubernetes deployment patterns.`,
          roi: "High",
          recommendedNextSteps: [
            "Learn Kubernetes basics: pods, services, deployments",
            "Set up local clusters using minikube or kind",
            "Deploy a multi-tier application to Kubernetes",
            "Understand scaling, load balancing, and resource management"
          ],
          jobFocusAreas: ["Container Orchestration", "Cloud Deployment", "DevOps"]
        };
      }
    
      // If asking about Cloud Architecture
      if (query.includes("cloud") && (query.includes("architect") || query.includes("aws") || query.includes("azure") || query.includes("gcp"))) {
        console.log("[Mock What-If] Specific domain matched: Cloud Architecture");
        return {
          whatYouSimulate: userQuery || "Learning Cloud Architecture",
          skillImpacts: [
            {
              skill: "Cloud Architecture (AWS/Azure/GCP)",
              currentProbability: 45,
              newProbability: 59,
              percentageIncrease: 14,
              timeToLearn: "5-7 weeks",
              reasoning: "Cloud-native architecture is crucial for modern roles. Multi-region, high-availability, and serverless patterns are core requirements."
            }
          ],
          overallExplanation: `Cloud Architecture expertise would increase your probability by 14% for this ${jobTitle} role. Cloud-native design patterns and multi-cloud capabilities are increasingly critical.`,
          roi: "High",
          recommendedNextSteps: [
            "Master AWS/Azure/GCP core services and best practices",
            "Design multi-region, high-availability systems",
            "Learn serverless architectures and microservices patterns",
            "Build cloud-native applications with proper monitoring"
          ],
          jobFocusAreas: ["Cloud Computing", "Infrastructure", "High Availability"]
        };
      }
    
    // Analyze query to determine what the user is asking about
    const isAskingAboutSpeed = query.includes("fastest") || query.includes("quick") || query.includes("soon");
    const isAskingAboutMultiple = query.includes("both") || query.includes("multiple") || query.includes("combined");
    const isAskingAboutSpecificSkill = query.includes("docker") || query.includes("kubernetes") || 
                                      query.includes("react") || query.includes("python") ||
                                      query.includes("sql") || query.includes("system design");
    const isAskingAboutImpact = query.includes("how much") || query.includes("impact") || query.includes("increase");
    const isAskingAboutGeneral = query.includes("which skills") || query.includes("should i focus") || query.includes("which");
    
    // Get base probability based on user's current skills
    const baseProb = Math.max(35, Math.min(55, 35 + (skills.length * 3)));
    
    // Define skill pools by job type
    const skillsByRole = {
      backend: [
        { name: "Docker & Containers", impact: 14, time: "3-4 weeks", desc: "Essential for modern containerized deployments. This backend role explicitly mentions DevOps practices." },
        { name: "System Design", impact: 13, time: "6-8 weeks", desc: "Critical for scalable backend architecture. Shows you can think beyond single services." },
        { name: "Kubernetes", impact: 10, time: "4-6 weeks", desc: "Advanced orchestration—valuable for roles handling microservices at scale." },
        { name: "Database Optimization", impact: 9, time: "3-4 weeks", desc: "Backend roles care deeply about query performance and data modeling." }
      ],
      frontend: [
        { name: "React Advanced Patterns", impact: 13, time: "4-6 weeks", desc: "Hooks, context, code-splitting—this role needs React expertise beyond basics." },
        { name: "TypeScript", impact: 10, time: "2-3 weeks", desc: "Type safety is standard. Reduces bugs the team will have to fix." },
        { name: "Performance Optimization", impact: 9, time: "3-4 weeks", desc: "Web performance is critical. Profiling and optimization skills are valued." },
        { name: "State Management", impact: 8, time: "2-3 weeks", desc: "Complex UIs need solid state handling. Redux/Zustand patterns matter." }
      ],
      data: [
        { name: "SQL & Database Design", impact: 15, time: "4-5 weeks", desc: "Core skill for data roles. Query optimization and modeling are non-negotiable." },
        { name: "Python for Data", impact: 12, time: "4-6 weeks", desc: "Pandas, NumPy, scikit-learn—essential for data processing and analysis." },
        { name: "Machine Learning Fundamentals", impact: 11, time: "8-12 weeks", desc: "Increasingly required for data roles. Modeling and evaluation skills set you apart." },
        { name: "Data Visualization", impact: 8, time: "2-3 weeks", desc: "Communicating insights visually is critical for stakeholder engagement." }
      ],
      devops: [
        { name: "Kubernetes", impact: 16, time: "4-6 weeks", desc: "Core DevOps skill. Cluster management and workload orchestration are central." },
        { name: "CI/CD Pipelines", impact: 13, time: "3-4 weeks", desc: "Automation is everything in DevOps. GitHub Actions / Jenkins expertise matters." },
        { name: "Terraform (IaC)", impact: 12, time: "3-4 weeks", desc: "Infrastructure as code is industry standard. Reproducible deployments are valued." },
        { name: "Cloud Security", impact: 10, time: "4-5 weeks", desc: "AWS/Azure/GCP security practices—IAM, least privilege, compliance." }
      ],
      architect: [
        { name: "System Design", impact: 16, time: "6-8 weeks", desc: "Critical for architect roles. Understanding scalable, distributed systems is core responsibility." },
        { name: "Cloud Architecture (AWS/Azure/GCP)", impact: 14, time: "5-7 weeks", desc: "Cloud-native design patterns, multi-region, high-availability architecture." },
        { name: "Microservices Architecture", impact: 13, time: "4-6 weeks", desc: "Service decomposition, API design, eventual consistency patterns." },
        { name: "Database Architecture", impact: 12, time: "4-5 weeks", desc: "Choosing right database, scaling strategies, data consistency models." },
        { name: "AI/ML Systems Design", impact: 15, time: "8-10 weeks", desc: "ML pipeline architecture, model serving, data engineering for AI workloads." }
      ]
    };
    
    // Determine job type and get relevant skills
    let relevantSkills: typeof skillsByRole.backend = [];
    if (jobTitleLower.includes("architect") || jobTitleLower.includes("principal") || jobTitleLower.includes("ai engineer")) {
      relevantSkills = skillsByRole.architect;
    } else if (jobTitleLower.includes("backend") || jobTitleLower.includes("api")) {
      relevantSkills = skillsByRole.backend;
    } else if (jobTitleLower.includes("frontend") || jobTitleLower.includes("react") || jobTitleLower.includes("ui")) {
      relevantSkills = skillsByRole.frontend;
    } else if (jobTitleLower.includes("data") || jobTitleLower.includes("analyst") || jobTitleLower.includes("ml")) {
      relevantSkills = skillsByRole.data;
    } else if (jobTitleLower.includes("devops") || jobTitleLower.includes("sre") || jobTitleLower.includes("infrastructure")) {
      relevantSkills = skillsByRole.devops;
    } else {
      // Mixed: combine top skills from all, prioritize architect skills
      relevantSkills = skillsByRole.architect;
    }
    
    let mockSkills: SkillImpactData[] = [];
    let explanation = "";
    let steps: string[] = [];
    let roi: "High" | "Medium" | "Low" = "High";

    // Build JD text for analysis
    const jdText = jobTitleLower;
    // Create simple synonyms map for matching
    const synonyms: Record<string, string[]> = {
      "Docker & Containers": ["docker", "container", "containers"],
      "System Design": ["system design", "architecture", "architect", "scalable", "distributed", "design"],
      "Kubernetes": ["kubernetes", "k8s"],
      "Database Optimization": ["database", "sql", "query", "optimization"],
      "React Advanced Patterns": ["react", "hooks", "context", "frontend", "ui"],
      "TypeScript": ["typescript", "ts"],
      "Performance Optimization": ["performance", "profiling", "optimize"],
      "State Management": ["redux", "zustand", "state"],
      "SQL & Database Design": ["sql", "database", "schema"],
      "Python for Data": ["python", "pandas", "numpy"],
      "Machine Learning Fundamentals": ["machine learning", "ml", "model"],
      "Data Visualization": ["chart", "plot", "visualization", "dashboard"],
      "CI/CD Pipelines": ["ci", "cd", "pipeline", "github actions", "jenkins"],
      "Terraform (IaC)": ["terraform", "iac", "infrastructure as code"],
      "Cloud Security": ["security", "iam", "privilege"],
      "Cloud Architecture (AWS/Azure/GCP)": ["cloud", "aws", "azure", "gcp", "architecture"],
      "Microservices Architecture": ["microservices", "service", "api"],
      "Database Architecture": ["database", "replication", "consistency"],
      "AI/ML Systems Design": ["ml", "ai", "pipeline", "serving"]
    };

    const textIncludesAny = (txt: string, terms: string[]) => terms.some(t => txt.includes(t));
    const hasSkillInJD = (skillName: string) => {
      const terms = synonyms[skillName] || [skillName.toLowerCase()];
      return textIncludesAny(jdText, terms);
    };
    const userHasSkill = (skillName: string) => existingSkills.includes(skillName.toLowerCase()) || textIncludesAny(existingSkills.join(" "), synonyms[skillName] || []);
    
    // Build response based on query type
    if (isAskingAboutSpeed) {
      // User wants fastest way to improve
      mockSkills = relevantSkills
        .sort((a, b) => (b.impact / parseInt(b.time)) - (a.impact / parseInt(a.time)))
        .slice(0, 2)
        .map((s, i) => ({
          skill: s.name,
          currentProbability: baseProb,
          newProbability: baseProb + s.impact,
          percentageIncrease: s.impact,
          timeToLearn: s.time,
          reasoning: `${s.desc} ROI is high: +${s.impact}% in ${s.time}.`
        }));
      explanation = `For the fastest improvement, focus on high-ROI skills that require less time investment. The ${jobTitle} role will see immediate value from ${mockSkills.map(s => s.skill).join(" and ")}.`;
      steps = [
        `Start immediately with ${mockSkills[0].skill} - highest ROI`,
        `Aim for proficiency in 2-3 weeks`,
        `Apply as soon as you've gained hands-on experience`
      ];
      roi = "High";
    } else if (isAskingAboutSpecificSkill) {
      // User asks about a specific skill - find and return details
      let targetSkill = null;
      
      // Try to find exact skill match
      for (const skill of relevantSkills) {
        if (query.includes(skill.name.toLowerCase()) || 
            skill.name.toLowerCase().includes(query.match(/\b[a-z]+(?:\s+[a-z]+)?\b/)?.[0] || "")) {
          targetSkill = skill;
          break;
        }
      }
      
      // Fallback: search all possible skill pools if not found
      if (!targetSkill) {
        const allSkills = [
          ...skillsByRole.architect,
          ...skillsByRole.backend,
          ...skillsByRole.frontend,
          ...skillsByRole.data,
          ...skillsByRole.devops
        ];
        
        for (const skill of allSkills) {
          if (query.includes(skill.name.toLowerCase())) {
            targetSkill = skill;
            break;
          }
        }
      }
      
      // If still not found, use first skill from relevant
      targetSkill = targetSkill || relevantSkills[0];
      
      mockSkills = [
        {
          skill: targetSkill.name,
          currentProbability: baseProb,
          newProbability: baseProb + targetSkill.impact,
          percentageIncrease: targetSkill.impact,
          timeToLearn: targetSkill.time,
          reasoning: targetSkill.desc
        }
      ];
      explanation = `${targetSkill.name} is a high-value skill for ${jobTitle} positions. This role strongly values expertise in this area. A +${targetSkill.impact}% probability boost is realistic given the job requirements. With ${targetSkill.time} of focused learning, you can significantly strengthen your candidacy.`;
      steps = [
        `Focus on ${targetSkill.name} as your primary learning goal`,
        `Build a real project demonstrating deep expertise in this skill`,
        `Reference specific accomplishments in your applications`
      ];
      roi = targetSkill.impact > 12 ? "High" : "Medium";
    } else if (isAskingAboutMultiple) {
      // User wants impact of multiple skills combined
      const selectedSkills = relevantSkills.slice(0, 2);
      const totalImpact = selectedSkills.reduce((sum, s) => sum + s.impact, 0);
      mockSkills = selectedSkills.map(s => ({
        skill: s.name,
        currentProbability: baseProb,
        newProbability: baseProb + (hasSkillInJD(s.name) ? Math.round(s.impact * 1.2) : s.impact),
        percentageIncrease: hasSkillInJD(s.name) ? Math.round(s.impact * 1.2) : s.impact,
        timeToLearn: s.time,
        reasoning: `${s.desc}`
      }));
      explanation = `Learning both ${selectedSkills.map(s => s.name).join(" and ")} would increase your probability by ${totalImpact}%. Combined, these skills create a strong foundation for the ${jobTitle} role.`;
      steps = [
        `Phase 1 (Weeks 1-${Math.floor(parseInt(selectedSkills[0].time.split("-")[1]) / 2)}): Master ${selectedSkills[0].name}`,
        `Phase 2 (Weeks ${Math.floor(parseInt(selectedSkills[0].time.split("-")[1]) / 2) + 1}-${parseInt(selectedSkills[0].time.split("-")[1])}): Learn ${selectedSkills[1].name}`,
        `Phase 3: Build a project showcasing both skills`
      ];
      roi = totalImpact > 20 ? "High" : "Medium";
    } else {
      // Default: general skills inquiry
      const ranked = relevantSkills
        .map(s => {
          // Adjust impact: boost if skill appears in JD; reduce if user already has it
          const baseImpact = s.impact;
          const adjustedImpact = userHasSkill(s.name) ? Math.max(2, Math.round(baseImpact * 0.4)) : (hasSkillInJD(s.name) ? Math.round(baseImpact * 1.2) : baseImpact);
          return { ...s, adjustedImpact };
        })
        .sort((a, b) => b.adjustedImpact - a.adjustedImpact);

      mockSkills = ranked.slice(0, 3).map(s => ({
        skill: s.name,
        currentProbability: baseProb,
        newProbability: baseProb + s.adjustedImpact,
        percentageIncrease: s.adjustedImpact,
        timeToLearn: s.time,
        reasoning: s.desc
      }));

      explanation = `For the ${jobTitle} role, these three skills are prioritized based on the job description and your current profile. Skills mentioned in the JD yield higher impact; skills you already have provide smaller incremental gains.`;
      steps = [
        `Prioritize the top skill—it has the highest impact`,
        `Build portfolio projects demonstrating each skill`,
        `Apply when you've gained hands-on proficiency`
      ];
      roi = "High";
    }
    
    return {
      whatYouSimulate: String(userQuery || "Adding recommended skills for this role"),
      skillImpacts: mockSkills,
      overallExplanation: explanation,
      roi,
      recommendedNextSteps: steps,
      jobFocusAreas: relevantSkills.slice(0, 3).map(s => s.name)
    };
  }
}
