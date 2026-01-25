import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and } from "drizzle-orm";
import {
  type User, type InsertUser,
  type Favourite, type InsertFavourite,
  type Skill, type InsertSkill,
  type Project, type InsertProject,
  type Experience, type InsertExperience,
  type PasswordResetToken,
  users, favourites, skills, projects, experience, passwordResetTokens
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

  // Password Reset
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
}

// Initialize database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Persist to Postgres by default; opt into memory with USE_MEMORY_STORAGE=true
const useMemoryStorage = process.env.USE_MEMORY_STORAGE === "true";

if (useMemoryStorage) {
  console.warn("[storage] Using in-memory storage; accounts will reset on restart. Set USE_MEMORY_STORAGE=false to persist.");
}

class InMemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private favourites: Map<string, Favourite> = new Map();
  private skills: Map<string, Skill> = new Map();
  private projects: Map<string, Project> = new Map();
  private experience: Map<string, Experience> = new Map();
  private resetTokens: Map<string, PasswordResetToken> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...insertUser,
      id,
      username: (insertUser as any).username || insertUser.email.split("@")[0],
      role: null,
      college: null,
      gradYear: null,
      location: null,
      githubUrl: null,
      linkedinUrl: null,
      resumeUrl: null,
      resumeName: null,
      resumeUploadedAt: null,
      resumeScore: 0,
      userType: null,
      interestRoles: [],
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getFavourites(userId: string): Promise<Favourite[]> {
    return Array.from(this.favourites.values()).filter(fav => fav.userId === userId);
  }

  async addFavourite(fav: InsertFavourite): Promise<Favourite> {
    const id = crypto.randomUUID();
    const favourite: Favourite = {
      ...fav,
      id,
      savedAt: new Date(),
    };
    this.favourites.set(id, favourite);
    return favourite;
  }

  async removeFavourite(userId: string, jobId: string): Promise<void> {
    const fav = Array.from(this.favourites.values()).find(
      f => f.userId === userId && f.jobId === jobId
    );
    if (fav) {
      this.favourites.delete(fav.id);
    }
  }

  async getSkills(userId: string): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(skill => skill.userId === userId);
  }

  async addSkill(skill: InsertSkill): Promise<Skill> {
    const id = crypto.randomUUID();
    const newSkill: Skill = {
      ...skill,
      id,
    };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async removeSkill(id: string): Promise<void> {
    this.skills.delete(id);
  }

  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async addProject(project: InsertProject): Promise<Project> {
    const id = crypto.randomUUID();
    const newProject: Project = {
      ...project,
      id,
      techStack: project.techStack as string[],
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, update: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    const updatedProject = {
      ...project,
      ...update,
      techStack: update.techStack ? (update.techStack as string[]) : project.techStack,
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getExperiences(userId: string): Promise<Experience[]> {
    return Array.from(this.experience.values()).filter(exp => exp.userId === userId);
  }

  async addExperience(exp: InsertExperience): Promise<Experience> {
    const id = crypto.randomUUID();
    const newExp: Experience = {
      ...exp,
      id,
    };
    this.experience.set(id, newExp);
    return newExp;
  }

  async deleteExperience(id: string): Promise<void> {
    this.experience.delete(id);
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const id = crypto.randomUUID();
    const resetToken: PasswordResetToken = {
      id,
      userId,
      token,
      expiresAt,
      used: 0,
      createdAt: new Date(),
    };
    this.resetTokens.set(token, resetToken);
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.resetTokens.get(token);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    const resetToken = this.resetTokens.get(token);
    if (resetToken) {
      resetToken.used = 1;
      this.resetTokens.set(token, resetToken);
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = hashedPassword;
      this.users.set(userId, user);
    }
  }
}

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

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    try {
      if (useMemoryStorage || !db) throw new Error("Database not available");
      const result = await db.insert(passwordResetTokens).values({
        userId,
        token,
        expiresAt,
        used: 0,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Database error in createPasswordResetToken:", error);
      throw error;
    }
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    try {
      if (useMemoryStorage || !db) return undefined;
      const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return result[0];
    } catch (error) {
      console.error("Database error in getPasswordResetToken:", error);
      return undefined;
    }
  }

  async markTokenAsUsed(token: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.token, token));
    } catch (error) {
      console.error("Database error in markTokenAsUsed:", error);
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    try {
      if (useMemoryStorage || !db) return;
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
    } catch (error) {
      console.error("Database error in updateUserPassword:", error);
      throw error;
    }
  }
}

const postgresStorage = new PostgresStorage();
const memoryStorage = new InMemoryStorage();

// Use memory storage if database connection fails or explicitely set
export const storage = useMemoryStorage ? memoryStorage : postgresStorage;
