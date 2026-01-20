// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobs } from "./jobs/job.service";
import { storage } from "./storage";
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


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Mock User Middleware (using the seeded user)
  const MOCK_USER_ID = "90479b15-998b-4b2a-9e19-0f0f3eb6a6d6";

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
  app.get("/api/favourites", async (_req, res) => {
    const favs = await storage.getFavourites(MOCK_USER_ID);
    res.json(favs);
  });

  app.post("/api/favourites/add", async (req, res) => {
    const { jobId, jobType } = req.body;
    const existing = await storage.getFavourites(MOCK_USER_ID);
    if (existing.some(f => f.jobId === jobId)) {
      return res.status(400).json({ message: "Already in favourites" });
    }
    const fav = await storage.addFavourite({ userId: MOCK_USER_ID, jobId, jobType });
    res.json(fav);
  });

  app.delete("/api/favourites/remove/:jobId", async (req, res) => {
    await storage.removeFavourite(MOCK_USER_ID, req.params.jobId);
    res.status(204).end();
  });

  // 👤 PROFILE
  app.get("/api/profile", async (_req, res) => {
    const user = await storage.getUser(MOCK_USER_ID);
    const skills = await storage.getSkills(MOCK_USER_ID);
    const projects = await storage.getProjects(MOCK_USER_ID);
    const experiences = await storage.getExperiences(MOCK_USER_ID);
    res.json({ ...user, skills, projects, experiences });
  });

  app.patch("/api/profile", async (req, res) => {
    const updated = await storage.updateUser(MOCK_USER_ID, req.body);
    res.json(updated);
  });

  app.post("/api/profile/skills", async (req, res) => {
    const skill = await storage.addSkill({ userId: MOCK_USER_ID, ...req.body });
    res.json(skill);
  });

  app.delete("/api/profile/skills/:id", async (req, res) => {
    await storage.removeSkill(req.params.id);
    res.status(204).end();
  });

  app.post("/api/profile/projects", async (req, res) => {
    const project = await storage.addProject({ userId: MOCK_USER_ID, ...req.body });
    res.json(project);
  });

  app.delete("/api/profile/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).end();
  });

  app.post("/api/profile/experience", async (req, res) => {
    const exp = await storage.addExperience({ userId: MOCK_USER_ID, ...req.body });
    res.json(exp);
  });

  app.delete("/api/profile/experience/:id", async (req, res) => {
    await storage.deleteExperience(req.params.id);
    res.status(204).end();
  });

  // 🌍 SOCIALS & RESUME
  app.put("/api/profile/linkedin", async (req, res) => {
    const { url } = req.body;
    const updated = await storage.updateUser(MOCK_USER_ID, { linkedinUrl: url });
    res.json(updated);
  });

  app.put("/api/profile/github", async (req, res) => {
    const { url } = req.body;
    const updated = await storage.updateUser(MOCK_USER_ID, { githubUrl: url });
    res.json(updated);
  });

  app.post("/api/profile/resume", upload.single("resume"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Mock score calculation based on "scanning" the file
    // In a real app, you'd send this to an AI service
    const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100

    const updated = await storage.updateUser(MOCK_USER_ID, {
      resumeUrl: `/uploads/${req.file.filename}`,
      resumeName: req.file.originalname,
      resumeUploadedAt: new Date(),
      resumeScore: mockScore
    });

    res.json(updated);
  });


  return httpServer;
}

