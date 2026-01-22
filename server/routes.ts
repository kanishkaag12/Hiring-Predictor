// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobs } from "./jobs/job.service";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { ROLE_REQUIREMENTS } from "@shared/roles";
import { IntelligenceService } from "./services/intelligence.service";
import { AIService } from "./services/ai.service";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for PDF uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/**
 * Evaluate resume quality using AI-based heuristics
 * Analyzes file size, content, and key resume elements
 */
async function evaluateResumeQuality(buffer: Buffer, filename: string, userType?: string): Promise<number> {
  try {
    // Heuristic 1: File size (too small = incomplete, too large = bloated)
    const fileSizeKB = buffer.length / 1024;
    let sizeScore = 100;
    if (fileSizeKB < 50) sizeScore = 60;      // Too small
    else if (fileSizeKB > 1000) sizeScore = 70; // Too large
    else if (fileSizeKB < 100) sizeScore = 80;
    else if (fileSizeKB < 300) sizeScore = 95;
    
    // Heuristic 2: Convert to text and check for key resume elements
    // Try to extract text from buffer
    let textContent = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000)).toLowerCase();
    
    // Remove non-ASCII and special chars for analysis
    textContent = textContent.replace(/[^a-z0-9\s]/gi, ' ');
    
    let contentScore = 50;
    const keywordScores: Record<string, number> = {
      // Experience indicators
      'experience': 15,
      'work': 10,
      'employed': 10,
      'project': 10,
      'developed': 8,
      'managed': 8,
      'led': 8,
      
      // Education indicators
      'education': 15,
      'degree': 10,
      'university': 8,
      'bachelor': 8,
      'master': 10,
      'gpa': 5,
      
      // Technical skills
      'skills': 15,
      'programming': 10,
      'python': 5,
      'javascript': 5,
      'java': 5,
      'react': 5,
      'nodejs': 5,
      
      // Achievement indicators
      'achievement': 10,
      'award': 10,
      'certification': 8,
      'contributed': 8,
      'leadership': 8,
      'impact': 8,
      
      // Format quality
      'contact': 10,
      'email': 8,
      'phone': 8,
      'linkedin': 5,
      'github': 5,
    };
    
    let keywordScore = 0;
    let foundKeywords = 0;
    
    for (const [keyword, score] of Object.entries(keywordScores)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = (textContent.match(regex) || []).length;
      if (matches > 0) {
        keywordScore += score;
        foundKeywords++;
      }
    }
    
    // Normalize keyword score to 0-50 range
    const maxPossibleScore = Object.values(keywordScores).reduce((a, b) => a + b, 0);
    contentScore = Math.round((keywordScore / maxPossibleScore) * 50);
    
    // Heuristic 3: Bonus for user type (students should have projects/education, professionals should have experience)
    let typeBonus = 0;
    if (userType === "Student" || userType === "Fresher") {
      if (textContent.includes('project') || textContent.includes('education')) typeBonus = 10;
    } else if (userType === "Working Professional") {
      if (textContent.includes('experience') || textContent.includes('employed')) typeBonus = 10;
    }
    
    // Final score: Average of components
    const finalScore = Math.round((sizeScore * 0.25 + contentScore * 0.65 + (typeBonus * 0.1)));
    
    // Clamp between 60-95 (all resumes get at least some credit)
    return Math.max(60, Math.min(95, finalScore));
    
  } catch (error) {
    console.error("Resume evaluation error:", error);
    // On any error, use safe default score
    return 75;
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


import { log } from "./utils/logger";

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  log("Inside registerRoutes", "system");

  app.get("/api/job-sources", (_req, res) => {
    const sources = fetchJobSources();
    res.json(sources);
  });

  // ✅ ALL JOBS
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as any,
        search: req.query.search as string,
        level: req.query.level as string,
        companyType: req.query.companyType as string,
        companySize: req.query.companySize as string,
        workType: req.query.workType as any
      };
      const jobs = await fetchJobs(filters);
      res.json(jobs);
    } catch (error) {
      console.error("Error finding jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // ✅ SINGLE JOB
  app.get("/api/jobs/:id", async (req, res) => {
    const { id } = req.params;
    const jobs = await fetchJobs();
    const job = jobs.find(j => j.id === id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  });

  // ⭐ FAVOURITES
  app.get("/api/favourites", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const favs = await storage.getFavourites(userId);
    res.json(favs);
  });

  app.post("/api/favourites/add", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const { jobId, jobType } = req.body;
    const existing = await storage.getFavourites(userId);
    if (existing.some(f => f.jobId === jobId)) {
      return res.status(400).json({ message: "Already in favourites" });
    }
    const fav = await storage.addFavourite({ userId, jobId, jobType });
    res.json(fav);
  });

  app.delete("/api/favourites/remove/:jobId", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    await storage.removeFavourite(userId, req.params.jobId);
    res.status(204).end();
  });

  // 👤 PROFILE
  app.get("/api/profile", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);
    const skills = await storage.getSkills(userId);
    const projects = await storage.getProjects(userId);
    const experiences = await storage.getExperiences(userId);
    res.json({ ...user, skills, projects, experiences });
  });

  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const updated = await storage.updateUser(userId, req.body);
    res.json(updated);
  });

  app.post("/api/profile/skills", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const skill = await storage.addSkill({ userId, ...req.body });
    res.json(skill);
  });

  app.delete("/api/profile/skills/:id", ensureAuthenticated, async (req, res) => {
    await storage.removeSkill(req.params.id);
    res.status(204).end();
  });

  app.post("/api/profile/projects", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const project = await storage.addProject({ userId, ...req.body });
    res.json(project);
  });

  app.delete("/api/profile/projects/:id", ensureAuthenticated, async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).end();
  });

  app.post("/api/profile/experience", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const exp = await storage.addExperience({ userId, ...req.body });
    res.json(exp);
  });

  app.delete("/api/profile/experience/:id", ensureAuthenticated, async (req, res) => {
    await storage.deleteExperience(req.params.id);
    res.status(204).end();
  });

  // 🎯 INTEREST ROLES
  app.get("/api/profile/interest-roles", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);
    res.json(user?.interestRoles || []);
  });

  app.post("/api/profile/interest-roles", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length < 1 || roles.length > 4) {
      return res.status(400).json({ message: "Select between 1 and 4 roles" });
    }
    const updated = await storage.updateUser(userId, { interestRoles: roles });
    res.json(updated.interestRoles);
  });

  // ✅ PROFILE COMPLETENESS - SINGLE SOURCE OF TRUTH FOR DASHBOARD UNLOCK
  app.get("/api/profile/completeness", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const skills = await storage.getSkills(userId);

    // Calculate completion status based on LIVE profile data
    const interestRolesComplete = user.interestRoles && user.interestRoles.length >= 2;
    const resumeUploaded = !!user.resumeUrl;
    const careerStatusSet = !!user.userType;
    const skillsAdded = skills.length > 0;

    // Dashboard is unlocked ONLY when ALL requirements are met
    const dashboardUnlocked = interestRolesComplete && resumeUploaded && careerStatusSet && skillsAdded;

    console.log(`[DASHBOARD UNLOCK CHECK] User ${userId}:`, {
      interestRolesComplete,
      resumeUploaded,
      careerStatusSet,
      skillsAdded,
      dashboardUnlocked
    });

    res.json({
      interestRolesComplete,
      resumeUploaded,
      careerStatusSet,
      skillsAdded,
      dashboardUnlocked
    });
  });

  // 🌍 SOCIALS & RESUME
  app.put("/api/profile/linkedin", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const { url } = req.body;
    const updated = await storage.updateUser(userId, { linkedinUrl: url });
    res.json(updated);
  });

  app.put("/api/profile/github", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const { url } = req.body;
    const updated = await storage.updateUser(userId, { githubUrl: url });
    res.json(updated);
  });

  app.post("/api/profile/resume", ensureAuthenticated, upload.single("resume"), async (req, res) => {
    const userId = (req.user as User).id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Evaluate resume quality using AI-based heuristics
    const resumeScore = await evaluateResumeQuality(req.file.buffer, req.file.originalname, (req.user as User).userType);

    const updated = await storage.updateUser(userId, {
      resumeUrl: `/uploads/${req.file.filename}`,
      resumeName: req.file.originalname,
      resumeUploadedAt: new Date(),
      resumeScore: resumeScore
    });

    res.json(updated);
  });


  // 📊 DASHBOARD DATA
  app.get("/api/dashboard", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);
    const jobs = await fetchJobs();

    if (!user) return res.status(404).json({ message: "User not found" });

    const skills = await storage.getSkills(userId);
    const projects = await storage.getProjects(userId);
    const experiences = await storage.getExperiences(userId);

    const rolesToCalculate = (user.interestRoles && user.interestRoles.length >= 2)
      ? user.interestRoles
      : [];

    const unlockStatus = {
      hasRoles: rolesToCalculate.length >= 2,
      hasSkills: skills.length > 0,
      hasResume: !!user.resumeUrl,
      hasUserType: !!user.userType,
      hasProjects: projects.length > 0, // Not a gate but tracked
      hasExperience: experiences.length > 0
    };

    const isGated = !unlockStatus.hasRoles || !unlockStatus.hasSkills || !unlockStatus.hasResume || !unlockStatus.hasUserType;

    // Intelligence is only calculated if NOT gated
    const readinessScores = (!isGated && rolesToCalculate.length > 0) ? rolesToCalculate.map((roleName) => {
      const result = IntelligenceService.calculateReadiness(roleName, user, skills, projects, experiences);
      const roleReq = ROLE_REQUIREMENTS[roleName];

      // Get AI explanation (text only)
      const explanation = "Analysis pending. Complete your profile to unlock AI insights.";

      return {
        ...result,
        explanation
      };
    }) : [];

    // Market Snapshot - Always show basic market data? No, let's keep it minimal if gated
    const topRoles = Array.from(new Set(jobs.map(j => j.title))).slice(0, 3);
    const activeCompanies = jobs.map(j => j.company).filter((v, i, a) => a.indexOf(v) === i).length;

    // Overall hiring pulse (average of role scores)
    const avgScore = readinessScores.length > 0
      ? readinessScores.reduce((acc: number, curr: any) => acc + curr.score, 0) / readinessScores.length
      : 0;

    res.json({
      isDashboardGated: isGated,
      hiringPulse: {
        score: Math.round(avgScore),
        status: avgScore >= 70 ? "Strong" : avgScore >= 50 ? "Improving" : "Gated"
      },
      marketSnapshot: {
        topRoles,
        activeCompanies,
        highCompetitionRoles: jobs.slice(0, 3).map(j => j.title),
        trendingSkills: ["React", "Node.js", "Python"]
      },
      roleReadiness: readinessScores,
      recentActivity: [
        user.resumeUploadedAt ? { type: "analysis", label: "Resume Analyzed", timestamp: new Date(user.resumeUploadedAt).toLocaleDateString() } : null,
        skills.length > 0 ? { type: "skill", label: `Added ${skills.length} skills`, timestamp: "Recently" } : null,
        user.userType ? { type: "profile", label: `Status: ${user.userType}`, timestamp: "Recently" } : null,
        { type: "application", label: "Joined Platform", timestamp: "Recently" }
      ].filter(Boolean),
      peerComparison: {
        peerCount: 1540,
        rankPercentile: isGated ? 0 : Math.min(99, Math.floor(avgScore / 10) * 10 + 5),
        skills: skills.length > 5 ? "Above Average" : "Average",
        projects: projects.length > 2 ? "Above Average" : "Average"
      },
      actionSteps: readinessScores[0]?.gaps.map((g: string) => ({ type: "improve", text: g })) || [],
      unlockStatus
    });
  });

  app.post("/api/dashboard/simulate", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);
    const { action } = req.body; // e.g., { type: 'ADD_PROJECT' }

    if (!user) return res.status(404).json({ message: "User not found" });

    const skills = await storage.getSkills(userId);
    const projects = await storage.getProjects(userId);
    const experiences = await storage.getExperiences(userId);

    const rolesToSimulate = (user.interestRoles && user.interestRoles.length > 0)
      ? user.interestRoles
      : [];

    if (rolesToSimulate.length === 0) {
      return res.json([]);
    }

    const simulations = rolesToSimulate.map(roleName => {
      const current = IntelligenceService.calculateReadiness(roleName, user, skills, projects, experiences);
      const improvement = IntelligenceService.simulateImprovement(current, action, roleName, user, skills, projects, experiences);
      return { roleName, improvement };
    });

    res.json(simulations);
  });

  // 🤖 AI INSIGHTS
  app.get("/api/profile/ai-insights", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const skills = await storage.getSkills(userId);
      const projects = await storage.getProjects(userId);
      const experiences = await storage.getExperiences(userId);

      const { AIService } = await import("./services/ai.service");
      const insights = await AIService.analyzeProfile(user, skills, projects, experiences);

      res.json(insights);
    } catch (error) {
      console.error("Error in AI Insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Register analysis routes
  const analysisRouter = await import("./analysis.routes");
  app.use(analysisRouter.default);

  return httpServer;
}
