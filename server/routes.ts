// server/routes.ts
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobs, aggregateMarketStats, UserContext } from "./jobs/job.service";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { ROLE_REQUIREMENTS } from "@shared/roles";
import { IntelligenceService } from "./services/intelligence.service";
import { AIService } from "./services/ai.service";
import { AISimulationService } from "./services/ai-simulation.service";
import { SkillRoleMappingService } from "./services/skill-role-mapping.service";
import { getRolePredictor } from "./services/ml/role-predictor.service";
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

// Configure multer for photo uploads
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "photo-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
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
      const userCtx = await buildUserContext(req);
      const jobs = await fetchJobs(filters, userCtx || undefined);
      res.json(jobs);
    } catch (error) {
      console.error("Error finding jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // ✅ SINGLE JOB
  app.get("/api/jobs/:id", async (req, res) => {
    const { id } = req.params;
    const userCtx = await buildUserContext(req);
    const jobs = await fetchJobs({}, userCtx || undefined);
    const job = jobs.find(j => j.id === id);
    try {
      // Improved: Use the job service to fetch only the specific job if possible
      // For now, fetchJobs is the only entry point, but we should minimize impact
      const jobs = await fetchJobs();
      const job = jobs.find(j => j.id === id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      res.status(500).json({ error: "Failed to fetch job details" });
    }
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

    // Parallelize database calls for faster profile load
    const [user, skills, projects, experiences] = await Promise.all([
      storage.getUser(userId),
      storage.getSkills(userId),
      storage.getProjects(userId),
      storage.getExperiences(userId)
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

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
    if (!Array.isArray(roles) || roles.length < 2 || roles.length > 6) {
      return res.status(400).json({ message: "Select between 2 and 6 roles" });
    }
    // Normalize: trim and deduplicate (case-insensitive)
    const normalized = Array.from(new Set(roles.map((r: string) => r.trim())));
    const updated = await storage.updateUser(userId, { interestRoles: normalized });
    res.json(updated.interestRoles);
  });

  // ✅ PROFILE COMPLETENESS - SINGLE SOURCE OF TRUTH FOR DASHBOARD UNLOCK
  app.get("/api/profile/completeness", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const skills = await storage.getSkills(userId);

    // Calculate completion status based on LIVE profile data
    // Ensure interestRoles is an array and has at least 2 items
    const interestRolesArray = Array.isArray(user.interestRoles) ? user.interestRoles : [];
    const interestRolesComplete = interestRolesArray.length >= 2;
    const resumeUploaded = !!user.resumeUrl;
    const careerStatusSet = !!user.userType;
    const skillsAdded = skills.length > 0;

    // Dashboard is unlocked ONLY when ALL requirements are met
    const dashboardUnlocked = interestRolesComplete && resumeUploaded && careerStatusSet && skillsAdded;

    console.log(`[DASHBOARD UNLOCK CHECK] User ${userId}:`, {
      interestRoles: user.interestRoles,
      interestRolesArray,
      interestRolesComplete,
      resumeUrl: user.resumeUrl,
      resumeUploaded,
      userType: user.userType,
      careerStatusSet,
      skillsCount: skills.length,
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

  // 📊 USER DASHBOARD STATS - For Quick Stats Panel
  app.get("/api/dashboard/stats", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const user = await storage.getUser(userId);
      const favs = await storage.getFavourites(userId);
      
      if (!user) return res.status(404).json({ message: "User not found" });

      // Calculate profile score (0-100)
      let profileScore = 0;
      profileScore += user.name ? 10 : 0;
      profileScore += user.linkedinUrl ? 15 : 0;
      profileScore += user.githubUrl ? 15 : 0;
      profileScore += user.resumeUrl ? 20 : 0;
      profileScore += user.resumeScore ? Math.min(40, user.resumeScore) : 0;
      
      const skills = await storage.getSkills(userId);
      profileScore += Math.min(skills.length * 5, 20); // Max 20 points for skills
      
      const projects = await storage.getProjects(userId);
      profileScore += Math.min(projects.length * 5, 20); // Max 20 points for projects

      res.json({
        profileScore: Math.min(100, profileScore),
        jobsApplied: favs.length,
        interviews: 0, // TODO: Add interviews tracking to schema
        favoriteCount: favs.length
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // 📋 USER RECENT ACTIVITY - For Activity Panel
  app.get("/api/dashboard/activity", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const user = await storage.getUser(userId);
      
      if (!user) return res.status(404).json({ message: "User not found" });

      const activities = [];

      // Recent resume update
      if (user.resumeUploadedAt) {
        activities.push({
          type: "resume",
          title: "Resume updated",
          description: user.resumeName || "Resume uploaded",
          timestamp: new Date(user.resumeUploadedAt),
          icon: "📄"
        });
      }

      // Skills added
      const skills = await storage.getSkills(userId);
      if (skills.length > 0 && Array.isArray(skills)) {
        activities.push({
          type: "skills",
          title: `Added ${skills.length} skill${skills.length > 1 ? 's' : ''}`,
          description: skills.slice(0, 3).map((s: any) => s.name).join(", "),
          timestamp: new Date(), // TODO: Add created_at to skills schema
          icon: "🎯"
        });
      }

      // Projects added
      const projects = await storage.getProjects(userId);
      if (projects.length > 0 && Array.isArray(projects)) {
        activities.push({
          type: "projects",
          title: `Created ${projects.length} project${projects.length > 1 ? 's' : ''}`,
          description: projects[0]?.title || "Project added",
          timestamp: new Date(), // TODO: Add created_at to projects schema
          icon: "💼"
        });
      }

      // Favorites added
      const favs = await storage.getFavourites(userId);
      if (favs.length > 0 && Array.isArray(favs)) {
        // Get the most recent favorite (assuming they're sorted)
        const recentFav = favs[0];
        activities.push({
          type: "favorite",
          title: "Added job to favorites",
          description: recentFav.jobId || "Job saved",
          timestamp: new Date(recentFav.savedAt || new Date()),
          icon: "⭐"
        });
      }

      // Sort by timestamp (most recent first) and limit to 5
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      res.json(sortedActivities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
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

  app.post("/api/profile/photo", ensureAuthenticated, photoUpload.single("photo"), async (req, res) => {
    const userId = (req.user as User).id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const photoUrl = `/uploads/${req.file.filename}`;
      const updated = await storage.updateUser(userId, { profileImage: photoUrl });
      res.json({ profileImage: photoUrl, user: updated });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ message: "Failed to save profile photo" });
    }
  });

  app.delete("/api/profile/photo", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;

    try {
      const updated = await storage.updateUser(userId, { profileImage: null });
      res.json({ message: "Photo removed successfully", user: updated });
    } catch (error) {
      console.error("Photo removal error:", error);
      res.status(500).json({ message: "Failed to remove profile photo" });
    }
  });

  app.post("/api/profile/resume", ensureAuthenticated, upload.single("resume"), async (req, res) => {
    const userId = (req.user as User).id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Import resume parser service
      const { parseResumeWithFallback } = await import("./services/resume-parser.service");
      // ====================
      // 1. IMPORT & INITIALIZE
      // ====================
      const { parseResume: parseResumeFunction } = await import("./services/resume-parser.service");

      // Read the uploaded file from disk with absolute path
      const savedFilePath = path.resolve(uploadDir, req.file.filename);

      if (devMode) {
        console.log(`[Resume Upload] Processing file: ${req.file.originalname}`);
        console.log(`[Resume Upload] Saved path: ${savedFilePath}`);
      }

      if (!fs.existsSync(savedFilePath)) {
        return res.status(500).json({
          message: "Resume file not accessible",
          detail: "File was uploaded but cannot be read"
        });
      }

      // Read the uploaded file from disk to ensure a valid Buffer
      const savedFilePath = path.join(uploadDir, req.file.filename);
      const fileBuffer = fs.readFileSync(savedFilePath);

      // Evaluate resume quality using AI-based heuristics
      const resumeScore = await evaluateResumeQuality(fileBuffer, req.file.originalname, (req.user as User).userType ?? undefined);

      let parsedResume;
      // ====================
      // 3. PARSE RESUME WITH RESILIENT ERROR HANDLING
      // ====================
      let parsedResume: ParsedResumeData = {
        skills: [],
        education: [],
        experience_months: 0,
        projects_count: 0,
        resume_completeness_score: 0,
      };

      let parsingStatus = "SUCCESS";
      let parsingError: string | null = null;
      const parsingAttemptedAt = new Date();

      // Attempt to parse the resume
      try {
        parsedResume = await parseResumeWithFallback(
          fileBuffer,
          req.file.originalname
        );
        // Validate that we got actual data, not just empty defaults
        if (!parsedResume.skills || parsedResume.skills.length === 0) {
          parsingError = "Resume parsing completed but no skills were extracted. The resume may not contain enough structured content.";
        const parseStartTime = Date.now();

        parsedResume = await parseResumeFunction(
          fileBuffer,
          req.file.originalname
        );

        parsingDuration = Date.now() - parseStartTime;

        // Validate parsing results
        if (!parsedResume || typeof parsedResume !== "object") {
          parsingStatus = "FAILED";
          parsingError = "Parser returned invalid data structure";
          parsedResume = {
            skills: [],
            education: [],
            experience_months: 0,
            projects_count: 0,
            resume_completeness_score: 0,
          };
        } else if (!parsedResume.skills || parsedResume.skills.length === 0) {
          parsingStatus = "PARTIAL";
          parsingError = "No skills were extracted from resume";
          if (devMode) {
            console.log(`[Resume Upload] Parsing completed but no skills found: ${JSON.stringify(parsedResume).substring(0, 200)}`);
          }
        } else {
          parsingStatus = "SUCCESS";
          if (devMode) {
            console.log(`[Resume Upload] Parsing successful in ${parsingDuration}ms: ${parsedResume.skills.length} skills, completeness ${parsedResume.resume_completeness_score}`);
          }
        }
      } catch (parseError) {
        parsingError = parseError instanceof Error ? parseError.message : String(parseError);
        // Provide a fallback result structure but mark it as an error

        console.error(`[Resume Upload] Parsing failed: ${parsingError}`);

        // Return empty but valid defaults (graceful degradation)
        parsedResume = {
          skills: [],
          education: [],
          experience_months: 0,
          projects_count: 0,
          resume_completeness_score: 0,
        };
      }

      // Update user with resume metadata and parsed data
      // ====================
      // 4. UPDATE USER WITH PARSED DATA & STATUS
      // ====================
      const resumeUploadedAt = new Date();

      const updateData: Partial<User> = {
        resumeUrl: `/uploads/${req.file.filename}`,
        resumeName: req.file.originalname,
        resumeUploadedAt: new Date(),
        resumeScore: resumeScore,
        // Add parsed resume data
        resumeParsedSkills: parsedResume.skills,
        resumeEducation: parsedResume.education,
        resumeExperienceMonths: parsedResume.experience_months,
        resumeProjectsCount: parsedResume.projects_count,
        resumeCompletenessScore: String(parsedResume.resume_completeness_score),
        // Track parsing status
        resumeParsingError: parsingError,
        resumeParsingAttemptedAt: parsingAttemptedAt,
      };

      const updated = await storage.updateUser(userId, updateData);

      // 🔄 SYNC PARSED SKILLS TO SKILLS TABLE
      // This ensures the probability engine uses the latest resume skills
      if (parsedResume.skills && parsedResume.skills.length > 0) {
        // Get existing skills to avoid duplicates
        const existingSkills = await storage.getSkills(userId);
        const existingSkillNames = new Set(existingSkills.map(s => s.name.toLowerCase()));
        
        // Add new skills from resume that don't already exist
        const newSkillsToAdd = parsedResume.skills.filter(
          skillName => !existingSkillNames.has(skillName.toLowerCase())
        );
        
        for (const skillName of newSkillsToAdd) {
          await storage.addSkill({
            userId: userId,
            name: skillName,
            level: "Intermediate" // Beginner | Intermediate | Advanced
          });
        }
        
        console.log(`✅ Synced ${newSkillsToAdd.length} new skills from resume to skills table`);
      }

      // Calculate role skill match scores from parsed skills
      const roleSkillMatches = SkillRoleMappingService.calculateAllRoleMatches(parsedResume.skills);

      // Return response with parsed data and error status if applicable
      res.json({
        ...updated,
        parsedResume: {
          skills: parsedResume.skills,
          education: parsedResume.education,
          experience_months: parsedResume.experience_months,
          projects_count: parsedResume.projects_count,
          resume_completeness_score: parsedResume.resume_completeness_score,
        },
        parsingError,
        roleSkillMatches,
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({
        message: "Error processing resume",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });


  // 🤖 ML ROLE PREDICTIONS
  app.get("/api/ml/predict-roles", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const skills = await storage.getSkills(userId);
      const projects = await storage.getProjects(userId);
      const experiences = await storage.getExperiences(userId);

      const resumeSkills: string[] = Array.isArray(user.resumeParsedSkills)
        ? user.resumeParsedSkills
        : [];

      // Combine parsed resume skills with manually added skills
      const skillSet = new Set([
        ...resumeSkills,
        ...skills.map(s => s.name)
      ]);
      const allSkills = Array.from(skillSet);

      if (allSkills.length === 0 && projects.length === 0 && experiences.length === 0) {
        return res.json({
          success: false,
          message: "Add skills, projects, or experience to get ML-based role predictions",
          predictions: null
        });
      }

      const predictor = getRolePredictor();
      const predictions = predictor.predictRoles({
        skills: allSkills,
        education: Array.isArray(user.resumeEducation) ? user.resumeEducation : undefined,
        experienceMonths: typeof user.resumeExperienceMonths === 'number' ? user.resumeExperienceMonths : undefined,
        projects: projects.map(p => ({
          name: p.title || '',
          description: p.description || ''
        })),
        experiences: experiences.map(e => ({
          title: e.role || '',
          company: e.company || ''
        })),
        // Pass parsed resume data for feature engineering
        parsedResume: user.resumeParsedSkills ? {
          skills: user.resumeParsedSkills || [],
          education: user.resumeEducation || [],
          experience_months: user.resumeExperienceMonths || 0,
          projects_count: user.resumeProjectsCount || 0,
          resume_completeness_score: parseFloat(user.resumeCompletenessScore as string) || 0
        } : undefined
      });

      res.json({
        success: true,
        predictions,
        skillsUsed: allSkills
      });
    } catch (error) {
      console.error('[ML Prediction Error]', error);
      res.status(500).json({
        success: false,
        message: "Failed to generate predictions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Quick prediction with just skills (no auth required for demo)
  app.post("/api/ml/quick-predict", async (req, res) => {
    try {
      const { skills, limit = 10 } = req.body;

      if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of skills"
        });
      }

      const predictor = getRolePredictor();
      const predictions = predictor.predictTopRoles(skills, limit);

      res.json({
        success: true,
        predictions,
        skillsUsed: skills
      });
    } catch (error) {
      console.error('[Quick Prediction Error]', error);
      res.status(500).json({
        success: false,
        message: "Failed to generate predictions",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });


  // 📊 DASHBOARD DATA
  app.get("/api/dashboard", ensureAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;

    // Parallelize all data fetching for the dashboard
    const [user, jobs, skills, projects, experiences] = await Promise.all([
      storage.getUser(userId),
      fetchJobs(),
      storage.getSkills(userId),
      storage.getProjects(userId),
      storage.getExperiences(userId)
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const rolesToCalculate = (user.interestRoles && user.interestRoles.length >= 2)
      ? user.interestRoles
      : [];

    // Calculate skill-to-role match scores from parsed resume skills
    const resumeSkills: string[] = Array.isArray(user.resumeParsedSkills)
      ? user.resumeParsedSkills
      : [];

    // Track if resume parsing failed
    const resumeParsingError = user.resumeParsingError || null;
    const resumeParsingStatus = {
      attempted: !!user.resumeParsingAttemptedAt,
      attemptedAt: user.resumeParsingAttemptedAt || null,
      hasError: !!resumeParsingError,
      error: resumeParsingError,
    };

    const roleSkillMatches = SkillRoleMappingService.calculateAllRoleMatches(resumeSkills);

    // ML-based role predictions (probabilistic, background-agnostic)
    let mlRolePredictions = null;
    if (resumeSkills.length > 0 || projects.length > 0 || experiences.length > 0) {
      try {
        const predictor = getRolePredictor();
        mlRolePredictions = predictor.predictRoles({
          skills: resumeSkills,
          education: Array.isArray(user.resumeEducation) ? user.resumeEducation : undefined,
          experienceMonths: typeof user.resumeExperienceMonths === 'number' ? user.resumeExperienceMonths : undefined,
          projects: projects.map(p => ({
            name: p.title || '',
            description: p.description || ''
          })),
          experiences: experiences.map(e => ({
            title: e.role || '',
            company: e.company || ''
          })),
          // User context for calibration
          userLevel: (user.userType as any) || 'fresher',
          resumeQualityScore: typeof user.resumeCompletenessScore === 'number'
            ? user.resumeCompletenessScore / 100  // Convert 0-100 to 0-1
            : 0.5,
          // Pass parsed resume data for feature engineering
          parsedResume: user.resumeParsedSkills ? {
            skills: user.resumeParsedSkills || [],
            education: user.resumeEducation || [],
            experience_months: user.resumeExperienceMonths || 0,
            projects_count: user.resumeProjectsCount || 0,
            resume_completeness_score: parseFloat(user.resumeCompletenessScore as string) || 0
          } : undefined,
          projectsCount: projects.length,
          educationDegree: user.resumeEducation?.[0]?.degree || undefined
        });
      } catch (err) {
        console.error('[Dashboard] ML prediction error:', err);
        mlRolePredictions = null;
      }
    }

    // Get detailed role skill analysis for interest roles
    const roleSkillAnalysis = rolesToCalculate.map(roleName => {
      try {
        return SkillRoleMappingService.calculateSkillMatchScore(roleName, resumeSkills);
      } catch {
        return {
          roleName,
          overallScore: 0,
          matchPercentage: 0,
          components: [],
          essentialGaps: [],
          strengths: [],
          recommendations: [],
          explanation: `Role "${roleName}" analysis unavailable`
        };
      }
    });

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

    // Enrich ML predictions with user intent (AI alignment guidance for selected roles)
    const userInterestRoles = user.interestRoles || [];
    const enrichedMLPredictions = mlRolePredictions ? {
      ...mlRolePredictions,
      topRoles: mlRolePredictions.topRoles?.map((role: any) => ({
        ...role,
        isUserSelected: userInterestRoles.includes(role.roleTitle)
      })) || [],
      userSelectedRoles: userInterestRoles.map(roleName => {
        // Analyze each user-selected role for detailed AI alignment insights
        let aiAlignment = null;
        try {
          if (resumeSkills.length > 0 || projects.length > 0 || experiences.length > 0) {
            const predictor = getRolePredictor();
            const analysis = predictor.analyzeRoleAlignment(roleName, {
              skills: resumeSkills,
              education: Array.isArray(user.resumeEducation) ? user.resumeEducation : undefined,
              experienceMonths: typeof user.resumeExperienceMonths === 'number' ? user.resumeExperienceMonths : undefined,
              projects: projects.map(p => ({
                name: p.title || '',
                description: p.description || ''
              })),
              experiences: experiences.map(e => ({
                title: e.role || '',
                company: e.company || ''
              })),
              userLevel: (user.userType as any) || 'fresher',
              resumeQualityScore: typeof user.resumeCompletenessScore === 'number'
                ? user.resumeCompletenessScore / 100
                : 0.5,
              projectsCount: projects.length,
              educationDegree: user.resumeEducation?.[0]?.degree || undefined
            });
            aiAlignment = {
              alignmentStatus: analysis.alignmentStatus,
              confidence: analysis.confidence,
              probability: analysis.probability,
              matchedSkills: analysis.matchedSkills,
              matchedKeywords: analysis.matchedKeywords,
              growthAreas: analysis.growthAreas,
              explanation: analysis.explanation,
              constructiveGuidance: analysis.constructiveGuidance
            };
          }
        } catch (err) {
          console.error(`[Dashboard] Role alignment analysis error for ${roleName}:`, err);
        }

        return {
          roleTitle: roleName,
          isUserSelected: true,
          // AI alignment data (comprehensive analysis)
          aiAlignment
        };
      })
    } : null;

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
      unlockStatus,
      // User interest roles
      userInterestRoles,
      // Resume parsing status - track if parsing failed
      resumeParsingStatus,
      // Skill-to-Role Mapping (Deterministic scores from parsed resume skills)
      roleSkillMatches,
      roleSkillAnalysis,
      resumeSkillsUsed: resumeSkills,
      // ML-based role predictions (probabilistic, background-agnostic) with user intent
      mlRolePredictions: enrichedMLPredictions,
      // Market statistics aggregated and aligned with user's interest roles
      marketStats: (() => {
        const stats = aggregateMarketStats(jobs);
        return userInterestRoles.map(userRole => {
          const normalized = userRole.toLowerCase().trim();
          return stats.find(stat =>
            stat.roleCategory.toLowerCase() === normalized
          ) || {
            roleCategory: userRole,
            totalActiveJobs: 0,
            averageApplicantsPerJob: 0,
            demandTrend: "stable" as const,
            marketDemandScore: 0,
            competitionScore: 0,
            sampleCompanies: [],
            unavailable: true
          };
        });
      })()
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

  // 🔮 AI What-If Simulator (LLM-driven)
  app.post("/api/ai/simulate", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { userQuery } = req.body || {};

      if (!userQuery || !userQuery.trim()) {
        return res.status(400).json({ message: "userQuery is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const skills = await storage.getSkills(userId);
      const projects = await storage.getProjects(userId);
      const experiences = await storage.getExperiences(userId);
      const interestRoles = user.interestRoles || [];

      // Optional resume text to improve context
      let resumeText: string | undefined;
      if (user.resumeUrl) {
        try {
          const resumePath = path.join(process.cwd(), "uploads", path.basename(user.resumeUrl));
          if (fs.existsSync(resumePath)) {
            resumeText = fs.readFileSync(resumePath, "utf-8").substring(0, 2000);
          }
        } catch (err) {
          console.warn("Could not read resume file:", err);
        }
      }

      const simulation = await AISimulationService.simulate(
        userQuery.trim(),
        user,
        skills,
        projects,
        experiences,
        interestRoles,
        resumeText
      );

      res.json(simulation);
    } catch (error) {
      console.error("Error in /api/ai/simulate:", error);
      res.status(500).json({
        message: "Failed to run simulation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 🔮 WHAT-IF SIMULATOR (Chat-based)
  app.post("/api/what-if/chat", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { userInput } = req.body;

      if (!userInput || !userInput.trim()) {
        return res.status(400).json({ message: "userInput is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const skills = await storage.getSkills(userId);
      const projects = await storage.getProjects(userId);
      const experiences = await storage.getExperiences(userId);
      const interestRoles = user.interestRoles || [];

      if (interestRoles.length === 0) {
        return res.status(400).json({
          message: "Please select at least one interest role before using the simulator"
        });
      }

      // Get resume text if uploaded
      let resumeText: string | undefined;
      if (user.resumeUrl) {
        try {
          const resumePath = path.join(process.cwd(), "uploads", path.basename(user.resumeUrl));
          if (fs.existsSync(resumePath)) {
            resumeText = fs.readFileSync(resumePath, "utf-8").substring(0, 2000);
          }
        } catch (err) {
          console.warn("Could not read resume file:", err);
        }
      }

      // Use the what-if simulator prompt service
      const { WhatIfSimulatorPrompt } = await import("./services/what-if-simulator-prompt");
      const simulation = await WhatIfSimulatorPrompt.simulateCareerAction(
        userInput,
        user,
        skills,
        projects,
        experiences,
        interestRoles,
        resumeText
      );

      res.json(simulation);
    } catch (error) {
      console.error("Error in What-If Simulator:", error);
      res.status(500).json({
        message: "Failed to simulate career action",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 🎯 JOB-SPECIFIC WHAT-IF SIMULATOR (for Analyze My Chances modal)
  app.post("/api/ai/simulate-for-job", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const { jobTitle, jobDescription, jobRequirements, query } = req.body;
  // ============================================================================
  // DEVELOPMENT/TEST ENDPOINTS (Prompt 5 Verification)
  // ============================================================================

  /**
   * TEST ENDPOINT: Verify feature engineering function (Prompt 5)
   * 
   * Returns ML-ready feature vectors for the logged-in user across all roles.
   * This endpoint is for development verification only.
   * 
   * Response format:
   * {
   *   user_id: string,
   *   feature_vectors: {
   *     [role_name]: {
   *       skill_match_score: number (0-1),
   *       experience_gap_score: number (0-1),
   *       resume_completeness_score: number (0-1),
   *       behavioral_intent_score: number (0-1),
   *       market_demand_score: number (0-1),
   *       competition_score: number (0-1)
   *     }
   *   }
   * }
   */
  app.get("/api/dev/feature-vectors", ensureAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 1. Get parsed resume data
      const parsedResume: any = {
        skills: user.resumeParsedSkills || [],
        education: user.resumeEducation || [],
        experience_months: user.resumeExperienceMonths || 0,
        projects_count: user.resumeProjectsCount || 0,
        resume_completeness_score: user.resumeCompletenessScore || 0,
      };

      // 2. Calculate role skill match scores using existing logic
      const roleSkillMatchesRaw = SkillRoleMappingService.calculateAllRoleMatches(
        parsedResume.skills
      );

      // Extract just the scores (feature engineering expects Record<string, number>)
      const roleSkillMatchScores: Record<string, number> = {};
      for (const [roleName, matchData] of Object.entries(roleSkillMatchesRaw)) {
        roleSkillMatchScores[roleName] = (matchData as any).score ?? 0;
      }

      // 3. Get market features (use placeholder data for now)
      // In production, this would come from job market analysis
      const roleMarketFeatures: Record<string, any> = {};
      const allRoles = [
        "Software Engineer",
        "Data Scientist",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Data Analyst",
        "ML Engineer",
        "DevOps Engineer",
        "UI/UX Designer",
        "Product Manager",
      ];

      for (const role of allRoles) {
        roleMarketFeatures[role] = {
          market_demand_score: 0.7, // Placeholder: moderate demand
          competition_score: 0.5,   // Placeholder: moderate competition
          baseline_experience_months: 24, // Placeholder: 2 years baseline
        };
      }

      // 4. Call the feature engineering function
      const { generateCombinedFeatureVectors } = await import(
        "./services/ml/feature-engineering.service"
      );

      const featureVectors = generateCombinedFeatureVectors(
        parsedResume,
        roleSkillMatchScores, // Now passing just the scores
        roleMarketFeatures,
        undefined // behavioral_intent_score: not yet available
      );

      // 5. Return the results
      res.json({
        user_id: userId,
        user_email: user.email,
        parsed_resume: parsedResume,
        role_skill_matches: roleSkillMatchesRaw, // Return full match data for debugging
        feature_vectors: featureVectors,
        _note: "This is a development endpoint for verifying Prompt 5 feature engineering",
      });
    } catch (error) {
      console.error("Error in /api/dev/feature-vectors:", error);
      res.status(500).json({
        message: "Failed to generate feature vectors",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Register analysis routes
  const analysisRouter = await import("./analysis.routes");
  app.use(analysisRouter.default);

  // ============================================================================
  // ML SHORTLIST INFERENCE ENDPOINT (uses trained model from Prompt 6)
  // ============================================================================

  /**
   * GET /api/ml/shortlist-test/:role_category
   * Debug endpoint (no auth required) - for testing only
   */
  app.get("/api/ml/shortlist-test/:role_category", async (req, res) => {
    const roleCategory = req.params.role_category;

    // Use a test user ID (hardcoded for testing)
    const testUserId = "49205cf8-cbc9-4399-b547-b10ac6df280d";

    const shortlistModelPath = process.env.SHORTLIST_MODEL_PATH || path.join(process.cwd(), "models", "shortlist_model.pkl");

      console.log("[Simulator Route] Received query:", query);
      console.log("[Simulator Route] Query type:", typeof query);
      console.log("[Simulator Route] Query length:", query ? query.length : 0);

      if (!jobTitle || !jobDescription) {
        return res.status(400).json({ message: "jobTitle and jobDescription are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const skills = await storage.getSkills(userId);
      const projects = await storage.getProjects(userId);
      const experiences = await storage.getExperiences(userId);
      const interestRoles = user.interestRoles || [];

      // Get resume text if uploaded
      let resumeText: string | undefined;
      if (user.resumeUrl) {
        try {
          const resumePath = path.join(process.cwd(), "uploads", path.basename(user.resumeUrl));
          if (fs.existsSync(resumePath)) {
            resumeText = fs.readFileSync(resumePath, "utf-8").substring(0, 2000);
          }
          if (!stdout) {
            console.error(`[ML-TEST] Python script produced no output`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const result = JSON.parse(stdout);

          // Check for error in result
          if (result.error) {
            console.error(`[ML-TEST] Python inference error: ${result.error}`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const prob = result.shortlist_probability ?? null;

          // Validate probability is a number in [0, 1]
          if (typeof prob !== "number" || prob < 0 || prob > 1) {
            console.error(`[ML-TEST] Invalid probability returned: ${prob}`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const confidence_level = prob >= 0.66 ? "High" : prob >= 0.33 ? "Medium" : "Low";
          const contributions = Array.isArray(result.contributions)
            ? result.contributions.slice(0, 5).map((c: any) => ({
              feature: c.feature,
              impact: c.impact,
              description: `Feature '${c.feature}' contributed with impact ${c.impact?.toFixed?.(4) ?? c.impact}`,
            }))
            : [];

          // Success response
          hasResponded = true;
          return res.json({
            test: true,
            user_id: testUserId,
            role_category: roleCategory,
            shortlist_probability: prob,
            confidence_level,
            top_contributing_factors: contributions,
            status: "success",
          });
        } catch (parseErr) {
          console.error(`[ML-TEST] Failed to parse Python output: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          console.error(`[ML-TEST] stdout was: ${stdout}`);
          console.error(`[ML-TEST] stderr was: ${stderr}`);
          if (!hasResponded) {
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }
        }
      });
    } catch (error) {
      console.error("[ML-TEST] Unexpected error in /api/ml/shortlist-test:", error);
      return res.status(500).json({
        shortlist_probability: null,
        status: "error",
        message: "ML inference failed – see server logs",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/ml/shortlist
   * Body: { role_category: string }
   * Auth: required
   *
   * Steps:
   * 1) Load cached model (or fail fast if missing)
   * 2) Build engineered feature vector for (user, role)
   * 3) Run predict_proba via Python helper (uses saved .pkl)
   * 4) Return shortlist probability + top contributing factors
   */
  const shortlistModelPath = process.env.SHORTLIST_MODEL_PATH || path.join(process.cwd(), "models", "shortlist_model.pkl");

  // Test endpoint (no auth) - for development only
  app.post("/api/test/ml/shortlist", async (req, res) => {
    const roleCategory = (req.body?.role_category || req.body?.role)?.toString();
    if (!roleCategory) {
      return res.status(400).json({ message: "role_category is required" });
    }

    // 1) Check model file exists
    if (!fs.existsSync(shortlistModelPath)) {
      return res.status(500).json({
        message: "Shortlist model file is missing",
        detail: `Expected at ${shortlistModelPath}`,
      });
    }

    // Use hardcoded test user for this endpoint
    const userId = "test_user_001";

    try {
      // Fetch user (for test endpoint, use a sample user or create mock data)
      let user = await storage.getUser(userId);

      // If test user doesn't exist, create mock data
      if (!user) {
        user = {
          id: userId,
          email: "test@example.com",
          resumeParsedSkills: ["JavaScript", "React", "Node.js", "Python"],
          resumeEducation: [],
          resumeExperienceMonths: 24,
          resumeProjectsCount: 5,
          resumeCompletenessScore: "0.75",
        } as any;
      }

      // Build parsed resume snapshot
      const parsedResume: any = {
        skills: user!.resumeParsedSkills || [],
        education: user!.resumeEducation || [],
        experience_months: user!.resumeExperienceMonths || 0,
        projects_count: user!.resumeProjectsCount || 0,
        resume_completeness_score: user!.resumeCompletenessScore || 0,
      };

      // Role skill matches -> numeric scores
      const roleSkillMatchesRaw = SkillRoleMappingService.calculateAllRoleMatches(parsedResume.skills || []);
      const roleSkillMatchScores: Record<string, number> = {};
      for (const [r, data] of Object.entries(roleSkillMatchesRaw)) {
        roleSkillMatchScores[r] = (data as any).score ?? 0;
      }

      // Market features placeholder (replace with real stats when available)
      const roleMarketFeatures: Record<string, any> = {
        [roleCategory]: {
          market_demand_score: 0.7,
          competition_score: 0.5,
          baseline_experience_months: 24,
        },
      };

      // Generate engineered features for this role
      const { generateCombinedFeatureVectors } = await import("./services/ml/feature-engineering.service");
      const featureVectors = generateCombinedFeatureVectors(
        parsedResume,
        roleSkillMatchScores,
        roleMarketFeatures,
        undefined
      );

      const fv = featureVectors[roleCategory];
      if (!fv) {
        return res.status(400).json({
          message: "Could not build feature vector for role",
          detail: `Role '${roleCategory}' is missing from skill match scores or market data.`,
        });
      }

      const featureNames = [
        "skill_match_score",
        "experience_gap_score",
        "resume_completeness_score",
        "behavioral_intent_score",
        "market_demand_score",
        "competition_score",
      ];

      const featureArray = [
        fv.skill_match_score ?? 0,
        fv.experience_gap_score ?? 0,
        fv.resume_completeness_score ?? 0,
        fv.behavioral_intent_score ?? 0,
        fv.market_demand_score ?? 0,
        fv.competition_score ?? 0,
      ];

      // 3) Run inference via Python helper (predict_proba)
      const pythonScript = path.join(process.cwd(), "scripts", "ml-training", "run_inference.py");
      if (!fs.existsSync(pythonScript)) {
        return res.status(500).json({ message: "Inference script missing", detail: pythonScript });
      }

      const payload = JSON.stringify({ features: featureArray, feature_names: featureNames });

      // Find the correct Python executable from .venv
      const projectRoot = process.cwd(); // Outer root where .venv is located
      const pythonExe = findPythonExecutable(projectRoot);

      console.log(`[ML Shortlist] Spawning Python: ${pythonExe}`);
      console.log(`[ML Shortlist] Script: ${pythonScript}`);
      console.log(`[ML Shortlist] Model: ${shortlistModelPath}`);
      console.log(`[ML Shortlist] Payload: ${payload}`);

      let responseHandled = false;
      const timeoutMs = 15000; // 15 second timeout

      const py = spawn(pythonExe, [pythonScript, shortlistModelPath], {
        cwd: process.cwd(),
        env: process.env
      });

      let stdout = "";
      let stderr = "";

      const timeout = setTimeout(() => {
        if (!responseHandled) {
          responseHandled = true;
          py.kill();
          console.error("[ML Shortlist] Python process timed out");
          return res.status(500).json({
            message: "Inference timed out",
            detail: `Process exceeded ${timeoutMs}ms timeout`,
          });
        }
      }, timeoutMs);

      py.stdout.on("data", (d) => {
        stdout += d.toString();
        console.log(`[ML Shortlist] Python stdout: ${d.toString()}`);
      });

      py.stderr.on("data", (d) => {
        stderr += d.toString();
        console.error(`[ML Shortlist] Python stderr: ${d.toString()}`);
      });

      py.on("error", (err) => {
        clearTimeout(timeout);
        if (!responseHandled) {
          responseHandled = true;
          console.error("[ML Shortlist] Python spawn error:", err);
          return res.status(500).json({
            message: "Failed to spawn Python process",
            detail: err.message,
          });
        }
      });

      py.stdin.write(payload);
      py.stdin.end();

      py.on("close", (code) => {
        clearTimeout(timeout);
        if (responseHandled) return;
        responseHandled = true;

        console.log(`[ML Shortlist] Python process closed with code ${code}`);
        console.log(`[ML Shortlist] stdout: ${stdout}`);
        console.log(`[ML Shortlist] stderr: ${stderr}`);

        if (code !== 0) {
          return res.status(500).json({
            message: "Inference failed",
            detail: stderr || stdout || `exit code ${code}`,
          });
        }

        try {
          const result = JSON.parse(stdout);
          const prob = result.shortlist_probability ?? 0;

          const confidence_level = prob >= 0.66 ? "High" : prob >= 0.33 ? "Medium" : "Low";

          const contributions = Array.isArray(result.contributions)
            ? result.contributions.slice(0, 5).map((c: any) => ({
              feature: c.feature,
              impact: c.impact,
              description: `Feature '${c.feature}' contributed with impact ${c.impact?.toFixed?.(4) ?? c.impact}`,
            }))
            : [];

          return res.json({
            user_id: userId,
            role_category: roleCategory,
            shortlist_probability: prob,
            confidence_level,
            top_contributing_factors: contributions,
            _note: "Probabilities are derived from the trained shortlist model; no raw weights exposed.",
          });
        } catch (err) {
          console.warn("Could not read resume file:", err);
        }
      });
    } catch (error) {
      console.error("Error in /api/ml/shortlist:", error);
      return res.status(500).json({
        message: "Shortlist inference failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Authenticated version (with dev bypass for testing)
  app.post("/api/ml/shortlist", ensureAuthenticated, async (req, res) => {
    const roleCategory = (req.body?.role_category || req.body?.role)?.toString();
    if (!req.user) {
      console.error("[ML] ✗ Inference rejected: req.user is undefined");
      return res.status(401).json({
        message: "Unauthorized - user must be authenticated to run inference",
        status: "error"
      });
    }

    const userId = (req.user as User).id;
    const userEmail = (req.user as User).email || "unknown";

    if (!userId) {
      console.error("[ML] ✗ Inference rejected: userId is undefined or invalid");
      return res.status(401).json({
        message: "Unauthorized - invalid user session",
        status: "error"
      });
    }

    console.log(`[ML] Inference request for role: ${roleCategory}, userId: ${userId}, email: ${userEmail}`);

    // ====================
    // 1. VALIDATE MODEL AVAILABILITY
    // ====================
    const shortlistModelPath = process.env.SHORTLIST_MODEL_PATH || path.join(process.cwd(), "models", "shortlist_model.pkl");
    if (!fs.existsSync(shortlistModelPath)) {
      console.error(`[ML] Model file missing at: ${shortlistModelPath}`);
      return res.status(500).json({
        shortlist_probability: null,
        status: "error",
        message: "ML inference failed – see server logs",
        detail: `Model file not found at ${shortlistModelPath}`,
      });
    }

    try {
      // Fetch user from database to ensure we have latest resume data
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`[ML] User not found in database: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`[ML] ✓ Resolved userId: ${userId}, proceeding with inference`);

      // Build parsed resume snapshot
      const parsedResume: any = {
        skills: user.resumeParsedSkills || [],
        education: user.resumeEducation || [],
        experience_months: user.resumeExperienceMonths || 0,
        projects_count: user.resumeProjectsCount || 0,
        resume_completeness_score: user.resumeCompletenessScore || 0,
      };

      // Role skill matches -> numeric scores
      const roleSkillMatchesRaw = SkillRoleMappingService.calculateAllRoleMatches(parsedResume.skills || []);
      const roleSkillMatchScores: Record<string, number> = {};
      for (const [r, data] of Object.entries(roleSkillMatchesRaw)) {
        roleSkillMatchScores[r] = (data as any).score ?? 0;
      }

      // Use the job-specific what-if simulator
      const { JobWhatIfSimulator } = await import("./services/job-what-if-simulator");
      const simulation = await JobWhatIfSimulator.simulateForJob(
        jobTitle,
        jobDescription,
        jobRequirements || [],
        query || "",
        user,
        skills,
        projects,
        experiences,
        interestRoles,
        resumeText
      );

      res.json(simulation);
      const fv = featureVectors[roleCategory];
      if (!fv) {
        return res.status(400).json({
          message: "Could not build feature vector for role",
          detail: `Role '${roleCategory}' is missing from skill match scores or market data.`,
        });
      }

      // ====================
      // 2. DEFENSIVE FEATURE VALIDATION
      // ====================
      // Expected feature order (MUST match training and Python script)
      const featureNames = [
        "skill_match_score",
        "experience_gap_score",
        "resume_completeness_score",
        "behavioral_intent_score",
        "market_demand_score",
        "competition_score",
      ];

      // Extract features with defensive validation
      const rawFeatures = [
        fv.skill_match_score,
        fv.experience_gap_score,
        fv.resume_completeness_score,
        fv.behavioral_intent_score,
        fv.market_demand_score,
        fv.competition_score,
      ];

      // Validate and convert each feature to a safe number (0-1)
      const featureArray: number[] = [];
      for (let i = 0; i < featureNames.length; i++) {
        const featureName = featureNames[i];
        let value = rawFeatures[i];

        // Convert string numbers to float
        if (typeof value === "string") {
          value = parseFloat(value);
        }

        // Replace undefined/null/NaN with safe default
        if (value === null || value === undefined || isNaN(value)) {
          console.warn(`[ML] Feature '${featureName}' was null/undefined/NaN, defaulting to 0.0`);
          value = 0.0;
        }

        // Clamp to [0, 1] range
        if (typeof value === "number") {
          if (value < 0 || value > 1) {
            console.warn(`[ML] Feature '${featureName}' is out of range [0,1]: ${value}, clamping`);
            value = Math.max(0, Math.min(1, value));
          }
        } else {
          console.warn(`[ML] Feature '${featureName}' is not a number: ${typeof value}, defaulting to 0.0`);
          value = 0.0;
        }

        featureArray.push(value);
      }

      // Log feature vector for debugging
      console.log(`[ML] Feature vector for role '${roleCategory}':`, {
        features: featureArray,
        feature_names: featureNames,
        user_id: userId,
        model_path: shortlistModelPath,
      });

      // Run inference via Python helper
      const pythonScript = path.join(process.cwd(), "scripts", "ml-training", "run_inference.py");
      if (!fs.existsSync(pythonScript)) {
        console.error(`[ML] Inference script not found at: ${pythonScript}`);
        return res.status(500).json({
          shortlist_probability: null,
          status: "error",
          message: "ML inference failed – see server logs",
        });
      }

      const payload = JSON.stringify({ features: featureArray, feature_names: featureNames });

      // Find the correct Python executable from .venv
      const projectRoot = process.cwd(); // Outer root where .venv is located
      const pythonExe = findPythonExecutable(projectRoot);

      // ====================
      // 3. SAFE PYTHON EXECUTION WITH ERROR HANDLING
      // ====================
      let hasResponded = false; // Guard against multiple responses

      const py = spawn(pythonExe, [pythonScript, shortlistModelPath]);
      let stdout = "";
      let stderr = "";
      let processError: string | null = null;

      // Handle process-level errors
      py.on("error", (err) => {
        processError = err.message;
        console.error(`[ML] Python process error: ${err.message}`);
        if (!hasResponded) {
          hasResponded = true;
          return res.status(500).json({
            shortlist_probability: null,
            status: "error",
            message: "ML inference failed – see server logs",
          });
        }
      });

      // Capture output
      py.stdout.on("data", (d) => {
        stdout += d.toString();
      });

      py.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      // Write input and close stdin
      try {
        py.stdin.write(payload);
        py.stdin.end();
      } catch (err) {
        console.error(`[ML] Failed to write to Python stdin: ${err instanceof Error ? err.message : String(err)}`);
        if (!hasResponded) {
          hasResponded = true;
          return res.status(500).json({
            shortlist_probability: null,
            status: "error",
            message: "ML inference failed – see server logs",
          });
        }
      }

      // Handle process close
      py.on("close", (code) => {
        if (hasResponded) return; // Already sent response

        // Check for non-zero exit code
        if (code !== 0) {
          console.error(`[ML] Python process exited with code ${code}`);
          console.error(`[ML] stderr: ${stderr}`);
          console.error(`[ML] stdout: ${stdout}`);
          hasResponded = true;
          return res.status(500).json({
            shortlist_probability: null,
            status: "error",
            message: "ML inference failed – see server logs",
          });
        }

        // Parse Python output
        try {
          if (!stdout) {
            console.error(`[ML] Python script produced no output`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const result = JSON.parse(stdout);

          // Check for error in result
          if (result.error) {
            console.error(`[ML] Python inference error: ${result.error}`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const prob = result.shortlist_probability ?? null;

          // Validate probability is a number in [0, 1]
          if (typeof prob !== "number" || prob < 0 || prob > 1) {
            console.error(`[ML] Invalid probability returned: ${prob}`);
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }

          const confidence_level = prob >= 0.66 ? "High" : prob >= 0.33 ? "Medium" : "Low";

          const contributions = Array.isArray(result.contributions)
            ? result.contributions.slice(0, 5).map((c: any) => ({
              feature: c.feature,
              impact: c.impact,
              description: `Feature '${c.feature}' contributed with impact ${c.impact?.toFixed?.(4) ?? c.impact}`,
            }))
            : [];

          // Success response
          hasResponded = true;
          return res.json({
            user_id: userId,
            role_category: roleCategory,
            shortlist_probability: prob,
            confidence_level,
            top_contributing_factors: contributions,
            status: "success",
            _note: "Probabilities are derived from the trained shortlist model; no raw weights exposed.",
          });
        } catch (parseErr) {
          console.error(`[ML] Failed to parse Python output: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
          console.error(`[ML] stdout was: ${stdout}`);
          console.error(`[ML] stderr was: ${stderr}`);
          if (!hasResponded) {
            hasResponded = true;
            return res.status(500).json({
              shortlist_probability: null,
              status: "error",
              message: "ML inference failed – see server logs",
            });
          }
        }
      });
    } catch (error) {
      console.error("Error in Job What-If Simulator:", error);
      res.status(500).json({
        message: "Failed to simulate job-specific improvements",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Register analysis routes
  const analysisRouter = await import("./analysis.routes");
  app.use(analysisRouter.default);

  return httpServer;
}

/**
 * Build user context (user + skills + projects + experiences)
 * Returns null if unauthenticated
 */
async function buildUserContext(req: Request): Promise<UserContext | null> {
  const authUser = req.user as User | undefined;
  if (!authUser) return null;

  const userId = authUser.id;
  const [user, skills, projects, experiences] = await Promise.all([
    storage.getUser(userId),
    storage.getSkills(userId),
    storage.getProjects(userId),
    storage.getExperiences(userId)
  ]);

  if (!user) return null;

  return {
    user,
    skills,
    projects,
    experiences
  };
}
