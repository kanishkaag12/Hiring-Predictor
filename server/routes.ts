// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";
import { fetchJobById } from "./jobs/job.service";
import { fetchJobs } from "./jobs/job.service";


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /**
   * Job Sources API
   * Returns only ENABLED job sources
   * (currently empty array – expected behavior ✅)
   */
  app.get("/api/job-sources", (_req, res) => {
    const sources = fetchJobSources();
    res.json(sources);
  });


  app.get("/api/jobs/:id", async (req, res) => {
    const { id } = req.params;

    const jobs = await fetchJobs();
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  });


  return httpServer;
}
