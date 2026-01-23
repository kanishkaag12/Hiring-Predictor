import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role"),
  college: text("college"),
  gradYear: text("grad_year"),
  location: text("location"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  resumeUrl: text("resume_url"),
  resumeName: text("resume_name"),
  resumeUploadedAt: timestamp("resume_uploaded_at"),
  resumeScore: integer("resume_score").default(0),
});

export const favourites = pgTable("favourites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  jobId: varchar("job_id").notNull(),
  jobType: text("job_type").notNull(), // 'job' | 'internship'
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  level: text("level").notNull(), // 'Beginner' | 'Intermediate' | 'Advanced'
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  techStack: jsonb("tech_stack").$type<string[]>().notNull(),
  description: text("description").notNull(),
  githubLink: text("github_link"),
  complexity: text("complexity").notNull(), // 'Low' | 'Medium' | 'High'
});

export const experience = pgTable("experience", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  duration: text("duration").notNull(),
  type: text("type").notNull(), // 'Job' | 'Internship'
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Favourite = typeof favourites.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Experience = typeof experience.$inferSelect;

export type InsertFavourite = any;
export type InsertSkill = any;
export type InsertProject = any;
export type InsertExperience = any;


