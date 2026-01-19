// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobs } from "./jobs/job.service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  return httpServer;
}
