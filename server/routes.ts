// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import { fetchJobSources } from "./services/jobSources.service";

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

  return httpServer;
}
