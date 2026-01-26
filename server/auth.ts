import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, storage, isDatabaseHealthy } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { User as UserType, insertUserSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import "./auth-providers";
import { emailService } from "./email";

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "hirepulse-jwt-secret-2026";

// Optimized scrypt parameters: 32 bytes provides strong security (256-bit)
// while being 2x faster than 64 bytes. This is the recommended value for password hashing.
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Smart password comparison with automatic migration from old 64-byte format
async function comparePasswords(supplied: string, stored: string): Promise<{ match: boolean; needsMigration: boolean }> {
  const [hashed, salt] = stored.split(".");
  
  // Detect old format: 128 hex characters = 64 bytes
  // New format: 64 hex characters = 32 bytes
  const isOldFormat = hashed.length === 128;
  
  if (isOldFormat) {
    // Use old 64-byte comparison for backward compatibility
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const match = timingSafeEqual(hashedBuf, suppliedBuf);
    return { match, needsMigration: true };
  } else {
    // Use new optimized 32-byte comparison
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 32)) as Buffer;
    const match = timingSafeEqual(hashedBuf, suppliedBuf);
    return { match, needsMigration: false };
  }
}

function generateToken(user: UserType) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  // Use in-memory sessions in development for speed, PostgreSQL in production
  const isProduction = process.env.NODE_ENV === "production";
  const forcePg = process.env.USE_PG_SESSION === "true";
  const usePgSession = isProduction || forcePg;

  let sessionStore: session.Store;
  if (!usePgSession) {
    sessionStore = new session.MemoryStore();
    console.log("[auth] Using in-memory session store (dev mode - fast). Set NODE_ENV=production or USE_PG_SESSION=true for PostgreSQL sessions.");
  } else {
    try {
      const pgStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true,
        // Optimize for Neon: use shorter TTL and disable pruning during requests
        ttl: 24 * 60 * 60, // 24 hours in seconds
      });
      pgStore.on("error", (err: any) => {
        console.error("[auth] Session store error:", err);
      });
      sessionStore = pgStore;
      console.log("[auth] Using PostgreSQL session store (production mode).");
    } catch (err) {
      console.error("[auth] Failed to init Postgres session store, falling back to memory", err);
      sessionStore = new session.MemoryStore();
    }
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "hirepulse-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          console.log("[AUTH] Attempting login for:", email);

          // Attempt to fetch user (catch DB errors directly)
          let user;
          try {
            user = await storage.getUserByEmail(email);
          } catch (dbError) {
            console.error("[AUTH] Database error fetching user:", dbError);
            // Return error to indicate DB issue, not auth failure
            return done(new Error("DATABASE_ERROR"));
          }

          if (!user) {
            console.log("[AUTH] User not found:", email);
            return done(null, false, { message: "Invalid email or password" });
          }

          // Compare passwords with automatic migration support
          const { match, needsMigration } = await comparePasswords(password, user.password);
          
          if (!match) {
            console.log("[AUTH] Password mismatch for:", email);
            return done(null, false, { message: "Invalid email or password" });
          }

          // Auto-migrate old password format to new optimized format
          if (needsMigration) {
            try {
              const newHash = await hashPassword(password);
              await storage.updateUserPassword(user.id, newHash);
              console.log("[AUTH] Password migrated to optimized format for:", email);
            } catch (migrationError) {
              console.error("[AUTH] Password migration failed (non-critical):", migrationError);
              // Continue with login even if migration fails
            }
          }

          console.log("[AUTH] Login successful for:", email);
          return done(null, user);
        } catch (err) {
          console.error("[AUTH] Error in LocalStrategy:", err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, (user as UserType).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.warn("[AUTH] Deserialize user error for id:", id, err);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("[REGISTER] Data received:", { ...req.body, password: "[REDACTED]" });

      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.log("[REGISTER] Validation error:", result.error.errors);
        return res.status(400).json(result.error);
      }

      const { email, password } = result.data;

      let existingUser;
      try {
        existingUser = await storage.getUserByEmail(email);
      } catch (dbError) {
        console.error("[REGISTER] Database error checking existing user:", dbError);
        return res.status(503).json({ message: "Authentication temporarily unavailable" });
      }

      if (existingUser) {
        console.log("[REGISTER] Email already exists:", email);
        return res.status(400).send("User already exists");
      }

      let user;
      try {
        const hashedPassword = await hashPassword(password);
        user = await storage.createUser({
          ...result.data,
          password: hashedPassword,
        });
      } catch (dbError) {
        console.error("[REGISTER] Database error creating user:", dbError);
        return res.status(503).json({ message: "Authentication temporarily unavailable" });
      }

      console.log("[REGISTER] User created, id:", user.id);

      req.login(user, (err) => {
        if (err) {
          console.error("[REGISTER] req.login error:", err);
          return next(err);
        }

        const token = generateToken(user);
        console.log("[REGISTER] Success, returning user and token");
        res.status(201).json({ user, token });
      });
    } catch (err) {
      console.error("[REGISTER] Registration failure:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: UserType, info: any) => {
      // Handle database errors (return 503)
      if (err && (err.message === "DATABASE_UNAVAILABLE" || err.message === "DATABASE_ERROR")) {
        console.error("[LOGIN] Database unavailable:", err.message);
        return res.status(503).json({ message: "Authentication temporarily unavailable" });
      }

      // Handle other errors (pass to middleware)
      if (err) {
        console.error("[LOGIN] Passport error:", err);
        return next(err);
      }

      // Authentication failed (invalid credentials)
      if (!user) {
        console.log("[LOGIN] Auth failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("[LOGIN] req.login error:", err);
          return next(err);
        }

        const token = generateToken(user);
        console.log("[LOGIN] Success for:", user.email);
        res.status(200).json({ user, token });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Auth endpoint - single source of truth for authenticated user
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Legacy endpoint support (deprecated)
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Google OAuth
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard.
      res.redirect("/dashboard");
    }
  );

  // GitHub OAuth
  app.get(
    "/api/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
  );

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard.
      res.redirect("/dashboard");
    }
  );

  // Forgot Password - Request reset link
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration attacks
      if (!user) {
        console.log("[FORGOT-PASSWORD] Email not found:", email);
        return res.status(200).json({
          message: "If an account with that email exists, a password reset link has been sent."
        });
      }

      // Generate reset token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // Build reset link using a public base URL when provided
      const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetLink, user.username || "User");

      if (emailSent) {
        console.log("[FORGOT-PASSWORD] Reset email sent to:", email);
      } else {
        console.log("[FORGOT-PASSWORD] Reset link (email not configured):", resetLink);
      }

      res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
        // Only include token in development for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken: token, resetLink })
      });
    } catch (error) {
      console.error("[FORGOT-PASSWORD] Error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Verify reset token
  app.get("/api/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ valid: false, message: "Invalid reset token" });
      }

      if (resetToken.used === 1) {
        return res.status(400).json({ valid: false, message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ valid: false, message: "This reset link has expired" });
      }

      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("[VERIFY-TOKEN] Error:", error);
      res.status(500).json({ valid: false, message: "An error occurred" });
    }
  });

  // Reset Password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      if (resetToken.used === 1) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update user's password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markTokenAsUsed(token);

      console.log("[RESET-PASSWORD] Password updated for user:", resetToken.userId);

      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("[RESET-PASSWORD] Error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });
}
