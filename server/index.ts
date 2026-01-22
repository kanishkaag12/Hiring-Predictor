import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { fetchJobs } from "./jobs/job.service";

import { log } from "./utils/logger";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...", "system");
    
    // PostgreSQL connection is initialized in storage.ts via Drizzle ORM
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in .env");
    }
    log("PostgreSQL configuration loaded", "database");

    log("Registering routes...", "system");
    setupAuth(app);
    await registerRoutes(httpServer, app);
    log("Routes registered", "system");

    app.get("/api/jobs/real", async (_req, res) => {
      const jobs = await fetchJobs();
      res.json(jobs);
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Middleware Error:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      log("Setting up static server (production)", "system");
      serveStatic(app);
    } else {
      log("Setting up Vite (development)", "system");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Vite setup complete", "system");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 3001;

    httpServer.listen(port, "127.0.0.1", () => {
      log(`Backend running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("CRITICAL SERVER ERROR:", err);
    process.exit(1);
  }
})();
