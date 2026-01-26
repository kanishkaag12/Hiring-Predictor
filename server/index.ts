import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";
import { createServer } from "http";
import { fetchJobs } from "./jobs/job.service";
import path from "path";
import { testDatabaseConnection, warmConnectionPool } from "./storage";

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

// Serve uploads folder as static files for resume access
const uploadsPath = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));
log(`Serving uploads directory from: ${uploadsPath}`, "system");

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

      // Only log response body in development and for small payloads to avoid performance hit
      if (process.env.NODE_ENV !== "production" && capturedJsonResponse) {
        const bodyStr = JSON.stringify(capturedJsonResponse);
        if (bodyStr.length < 1000) {
          logLine += ` :: ${bodyStr}`;
        } else {
          logLine += ` :: {body truncated for performance}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...", "system");

    // ====================
    // 1. DATABASE INITIALIZATION
    // ====================
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in .env");
    }
    log("PostgreSQL configuration loaded", "database");

    // ====================
    // 2. DATABASE HEALTH CHECK
    // ====================
    const dbHealthy = await testDatabaseConnection();
    if (!dbHealthy) {
      console.warn("[system] Warning: Database connection failed at startup");
      console.warn("[system] Server will continue, but authentication will return 503 until database is available");
      console.warn("[system] Check your DATABASE_URL and ensure the database server is reachable");
    } else {
      // Warm up connection pool to reduce cold start latency
      await warmConnectionPool(5);
    }

    // ====================
    // 3. SETUP AUTH (must happen before routes)
    // ====================
    log("Setting up authentication...", "system");
    setupAuth(app);

    // ====================
    // 4. REGISTER ROUTES
    // ====================
    log("Registering routes...", "system");

    // Check resume parser availability
    const { logParserStatus } = await import("./services/resume-parser.service");
    logParserStatus();

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
    const port = parseInt(process.env.PORT || "5000", 10);

    console.log("GOOGLE_CLIENT_ID before server start:", process.env.GOOGLE_CLIENT_ID);

    httpServer.listen(port, "127.0.0.1", () => {
      log(`Backend running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("CRITICAL SERVER ERROR:", err);
    process.exit(1);
  }
})();
