import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and } from "drizzle-orm";
import {
  type User, type InsertUser,
  type Favourite, type InsertFavourite,
  type Skill, type InsertSkill,
  type Project, type InsertProject,
  type Experience, type InsertExperience,
  users, favourites, skills, projects, experience
} from "@shared/schema";

const { Pool } = pg;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, update: Partial<User>): Promise<User>;

  // Favourites
  getFavourites(userId: string): Promise<Favourite[]>;
  addFavourite(fav: InsertFavourite): Promise<Favourite>;
  removeFavourite(userId: string, jobId: string): Promise<void>;

  // Profile Sections
  getSkills(userId: string): Promise<Skill[]>;
  addSkill(skill: InsertSkill): Promise<Skill>;
  removeSkill(id: string): Promise<void>;

  getProjects(userId: string): Promise<Project[]>;
  addProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, update: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  getExperiences(userId: string): Promise<Experience[]>;
  addExperience(exp: InsertExperience): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;
}

// Initialize database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool);

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      username: (insertUser as any).username || insertUser.email.split("@")[0],
    }).returning();
    return result[0];
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) throw new Error("User not found");
    return result[0];
  }

  async getFavourites(userId: string): Promise<Favourite[]> {
    return await db.select().from(favourites).where(eq(favourites.userId, userId));
  }

  async addFavourite(fav: InsertFavourite): Promise<Favourite> {
    const result = await db.insert(favourites).values(fav).returning();
    return result[0];
  }

  async removeFavourite(userId: string, jobId: string): Promise<void> {
    await db.delete(favourites).where(
      and(eq(favourites.userId, userId), eq(favourites.jobId, jobId))
    );
  }

  async getSkills(userId: string): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.userId, userId));
  }

  async addSkill(skill: InsertSkill): Promise<Skill> {
    const result = await db.insert(skills).values(skill).returning();
    return result[0];
  }

  async removeSkill(id: string): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async addProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values({
      ...project,
      techStack: project.techStack as string[]
    }).returning();
    return result[0];
  }

  async updateProject(id: string, update: Partial<InsertProject>): Promise<Project> {
    // Type assertion for techStack compatibility with JSONB column
    const updateData: any = update.techStack 
      ? { ...update, techStack: update.techStack as any as string[] }
      : update;
    
    const result = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    
    if (!result[0]) throw new Error("Project not found");
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getExperiences(userId: string): Promise<Experience[]> {
    return await db.select().from(experience).where(eq(experience.userId, userId));
  }

  async addExperience(exp: InsertExperience): Promise<Experience> {
    const result = await db.insert(experience).values(exp).returning();
    return result[0];
  }

  async deleteExperience(id: string): Promise<void> {
    await db.delete(experience).where(eq(experience.id, id));
  }
}

export const storage = new PostgresStorage();
