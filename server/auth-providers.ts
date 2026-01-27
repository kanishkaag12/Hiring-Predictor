
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "YOUR_GITHUB_CLIENT_ID";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "YOUR_GITHUB_CLIENT_SECRET";
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
console.log("GITHUB_CLIENT_ID:", GITHUB_CLIENT_ID);
console.log("APP_BASE_URL:", APP_BASE_URL);

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${APP_BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      console.log("Google profile:", profile);
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"), undefined);
      }

      try {
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createUser({
            email,
            name: profile.displayName,
            password: "",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${APP_BASE_URL}/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      console.log("GitHub profile:", profile);
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in GitHub profile"), undefined);
      }
      try {
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createUser({
            email,
            name: profile.displayName || profile.username,
            password: "",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);
