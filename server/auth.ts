import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { storage } from "./storage";
import { User as UserType, insertUserSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "hirepulse-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, 
    }),
    cookie: {
      secure: app.get("env") === "production",
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
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
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
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("[REGISTER] Request body keys:", req.body ? Object.keys(req.body) : "NONE");
      
      if (!req.body) {
        console.error("[REGISTER] Request body is missing");
        return res.status(400).send("Request body is missing");
      }

      if (!insertUserSchema) {
        console.error("[REGISTER] insertUserSchema is not imported or undefined");
        return res.status(500).send("Internal validation error");
      }

      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.log("[REGISTER] Validation failed:", JSON.stringify(result.error));
        return res.status(400).json(result.error);
      }
      
      const { email, password } = result.data;
      console.log("[REGISTER] Validated email:", email);

      let existingUser;
      try {
        existingUser = await storage.getUserByEmail(email);
      } catch (storageErr) {
        console.error("[REGISTER] Error in storage.getUserByEmail:", storageErr);
        throw storageErr;
      }
      
      if (existingUser) {
        console.log("[REGISTER] User already exists:", email);
        return res.status(400).send("User already exists");
      }

      let hashedPassword;
      try {
        hashedPassword = await hashPassword(password);
      } catch (hashErr) {
        console.error("[REGISTER] Error hashing password:", hashErr);
        throw hashErr;
      }
      
      let user;
      try {
        user = await storage.createUser({
          ...result.data,
          password: hashedPassword,
        });
        console.log("[REGISTER] User created successfully, id:", user.id);
      } catch (createErr) {
        console.error("[REGISTER] Error in storage.createUser:", createErr);
        throw createErr;
      }

      console.log("[REGISTER] Attempting req.login");
      req.login(user, (err) => {
        if (err) {
          console.error("[REGISTER] req.login error:", err);
          return next(err);
        }
        console.log("[REGISTER] Login successful, sending response");
        res.status(201).json(user);
      });
    } catch (err) {
      console.error("[REGISTER] Unhandled error during registration:", err);
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
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
