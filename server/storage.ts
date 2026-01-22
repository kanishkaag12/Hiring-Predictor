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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (useMemoryStorage || !db) return undefined;
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error("Database error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (useMemoryStorage || !db) return undefined;
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (useMemoryStorage || !db) return undefined;
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(users).values({
        ...insertUser,
        username: (insertUser as any).username || insertUser.email.split("@")[0],
        interestRoles: [],
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw error;
    }
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.update(users)
        .set(update)
        .where(eq(users.id, id))
        .returning();

      if (!result[0]) throw new Error("User not found");
      return result[0];
    } catch (error) {
      console.error("Database error in updateUser:", error);
      throw error;
    }
  }

  async getFavourites(userId: string): Promise<Favourite[]> {
    try {
      if (useMemoryStorage || !db) return [];
      return await db.select().from(favourites).where(eq(favourites.userId, userId));
    } catch (error) {
      console.error("Database error in getFavourites:", error);
      return [];
    }
  }

  async addFavourite(fav: InsertFavourite): Promise<Favourite> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(favourites).values(fav).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in addFavourite:", error);
      throw error;
    }
  }

  async removeFavourite(userId: string, jobId: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.delete(favourites).where(
        and(eq(favourites.userId, userId), eq(favourites.jobId, jobId))
      );
    } catch (error) {
      console.error("Database error in removeFavourite:", error);
    }
  }

  async getSkills(userId: string): Promise<Skill[]> {
    try {
      if (useMemoryStorage || !db) return [];
      return await db.select().from(skills).where(eq(skills.userId, userId));
    } catch (error) {
      console.error("Database error in getSkills:", error);
      return [];
    }
  }

  async addSkill(skill: InsertSkill): Promise<Skill> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(skills).values(skill).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in addSkill:", error);
      throw error;
    }
  }

  async removeSkill(id: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.delete(skills).where(eq(skills.id, id));
    } catch (error) {
      console.error("Database error in removeSkill:", error);
    }
  }

  async getProjects(userId: string): Promise<Project[]> {
    try {
      if (useMemoryStorage || !db) return [];
      return await db.select().from(projects).where(eq(projects.userId, userId));
    } catch (error) {
      console.error("Database error in getProjects:", error);
      return [];
    }
  }

  async addProject(project: InsertProject): Promise<Project> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(projects).values({
        ...project,
        techStack: project.techStack as string[]
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in addProject:", error);
      throw error;
    }
  }

  async updateProject(id: string, update: Partial<InsertProject>): Promise<Project> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const updateData: any = update.techStack
        ? { ...update, techStack: update.techStack as any as string[] }
        : update;

      const result = await db.update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      if (!result[0]) throw new Error("Project not found");
      return result[0];
    } catch (error) {
      console.error("Database error in updateProject:", error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.delete(projects).where(eq(projects.id, id));
    } catch (error) {
      console.error("Database error in deleteProject:", error);
    }
  }

  async getExperiences(userId: string): Promise<Experience[]> {
    try {
      if (useMemoryStorage || !db) return [];
      return await db.select().from(experience).where(eq(experience.userId, userId));
    } catch (error) {
      console.error("Database error in getExperiences:", error);
      return [];
    }
  }

  async addExperience(exp: InsertExperience): Promise<Experience> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(experience).values(exp).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in addExperience:", error);
      throw error;
    }
  }

  async deleteExperience(id: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.delete(experience).where(eq(experience.id, id));
    } catch (error) {
      console.error("Database error in deleteExperience:", error);
    }
  }
}

const postgresStorage = new PostgresStorage();
const memoryStorage = new InMemoryStorage();

// Use memory storage if database connection fails
export const storage = useMemoryStorage ? memoryStorage : postgresStorage;
