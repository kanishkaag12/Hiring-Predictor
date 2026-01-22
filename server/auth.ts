import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { User as UserType, insertUserSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "hirepulse-jwt-secret-2026";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: UserType) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  // Default to in-memory sessions unless explicitly forced to PG
  const forcePg = process.env.USE_PG_SESSION === "true";

  let sessionStore: session.Store;
  if (!forcePg) {
    sessionStore = new session.MemoryStore();
    console.warn("[auth] Using in-memory session store (dev). Set USE_PG_SESSION=true to use Postgres.");
  } else {
    try {
      const pgStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true,
      });
      pgStore.on("error", (err: any) => {
        console.error("[auth] Session store error; consider disabling USE_PG_SESSION in dev", err);
      });
      sessionStore = pgStore;
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
          const user = await storage.getUserByEmail(email);
          if (!user) {
            console.log("[AUTH] User not found:", email);
            return done(null, false, { message: "Invalid email or password" });
          }
          
          const isMatch = await comparePasswords(password, user.password);
          if (!isMatch) {
            console.log("[AUTH] Password mismatch for:", email);
            return done(null, false, { message: "Invalid email or password" });
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
      console.warn("Deserialize user error for id:", id, err);
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

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("[REGISTER] Email already exists:", email);
        return res.status(400).send("User already exists");
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        ...result.data,
        password: hashedPassword,
      });

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
      if (err) {
        console.error("[LOGIN] Passport error:", err);
        return next(err);
      }
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

