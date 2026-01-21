// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobs } from "./jobs/job.service";
import { storage } from "./storage";
import { User } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for PDF uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
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

    // Mock score calculation based on "scanning" the file
    // In a real app, you'd send this to an AI service
    const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100

    const updated = await storage.updateUser(userId, {
      resumeUrl: `/uploads/${req.file.filename}`,
      resumeName: req.file.originalname,
      resumeUploadedAt: new Date(),
      resumeScore: mockScore
    });

    res.json(updated);
  });


  // 📊 DASHBOARD DATA
  app.get("/api/dashboard", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);
    const jobs = await fetchJobs(); // Get all jobs for market snapshot
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Calculate Hiring Pulse based on resume score and profile completeness
    const resumeScore = user.resumeScore || 0;
    const skills = await storage.getSkills(userId);
    const projects = await storage.getProjects(userId);
    
    // Simple algorithm for status
    let status: "Strong" | "Improving" | "Needs Work" = "Needs Work";
    if (resumeScore > 75) status = "Strong";
    else if (resumeScore > 50) status = "Improving";

    // Market Snapshot - Aggregate from real jobs
    const topRoles = Array.from(new Set(jobs.map(j => j.title))).slice(0, 3);
    const activeCompanies = jobs.map(j => j.company).filter((v, i, a) => a.indexOf(v) === i).length;
    const highCompetitionRoles = jobs.slice(0, 3).map(j => j.title);
    
    // Chances - based on match (mocking match logic for now using score)
    const chances = [
      { role: "SDE Intern", chance: Math.min(100, resumeScore + 10), competition: "High" },
      { role: "Frontend Developer", chance: Math.min(100, resumeScore + 5), competition: "Medium" },
      { role: "Data Analyst", chance: Math.min(100, resumeScore - 5), competition: "High" },
    ];

    // Recent Activity - Derived from user data
    const activity = [];
    if (user.resumeUploadedAt) {
      activity.push({ type: "analysis", label: "Resume Analyzed", timestamp: new Date(user.resumeUploadedAt).toLocaleDateString() });
    }
    if (skills.length > 0) {
      activity.push({ type: "skill", label: `Added ${skills.length} skills`, timestamp: "Recently" });
    }
    activity.push({ type: "application", label: "Joined Platform", timestamp: "Recently" });

    res.json({
      hiringPulse: {
        score: resumeScore,
        trend: 5, // Static for now, requires history
        status
      },
      marketSnapshot: {
        topRoles,
        activeCompanies,
        highCompetitionRoles,
        trendingSkills: ["React", "Node.js", "Python"] // Can be aggregated if skills were in jobs
      },
      yourChances: chances,
      peerComparison: { // Mocked comparison stats
        peerCount: 1540,
        rankPercentile: Math.min(99, Math.floor(resumeScore / 10) * 10 + 5),
        skills: skills.length > 5 ? "Above Average" : "Average",
        projects: projects.length > 2 ? "Above Average" : "Average",
        internships: "Average"
      },
      actionSteps: [
        resumeScore < 70 ? { type: "improve", text: "Upload a better resume", impact: "+15%" } : null,
        skills.length < 3 ? { type: "skill", text: "Add more skills to your profile" } : null,
        projects.length < 1 ? { type: "warning", text: "Add a project to showcase availability" } : null
      ].filter(Boolean),
      recentActivity: activity
    });
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

  return httpServer;
}

