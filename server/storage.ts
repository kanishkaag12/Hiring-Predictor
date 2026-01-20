import {
  type User, type InsertUser,
  type Favourite, type InsertFavourite,
  type Skill, type InsertSkill,
  type Project, type InsertProject,
  type Experience, type InsertExperience
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private favourites: Map<string, Favourite>;
  private skills: Map<string, Skill>;
  private projects: Map<string, Project>;
  private experiences: Map<string, Experience>;

  constructor() {
    this.users = new Map();
    this.favourites = new Map();
    this.skills = new Map();
    this.projects = new Map();
    this.experiences = new Map();

    // Seed a mock user for convenience
    const mockUserId = "90479b15-998b-4b2a-9e19-0f0f3eb6a6d6";
    this.users.set(mockUserId, {
      id: mockUserId,
      username: "alex_chen",
      password: "password123",
      name: "Alex Chen",
      role: "Software Engineer Intern",
      college: "University of Tech",
      gradYear: "2026",
      location: "San Francisco, CA",
      githubUrl: "https://github.com/alexchen",
      linkedinUrl: "https://linkedin.com/in/alexchen",
      resumeUrl: "/resumes/alex_resume.pdf",
      resumeName: "alex_resume.pdf",
      resumeUploadedAt: new Date(),
      resumeScore: 88,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      name: null, role: null, college: null, gradYear: null,
      location: null, githubUrl: null, linkedinUrl: null,
      resumeUrl: null, resumeName: null, resumeUploadedAt: null,
      resumeScore: 0
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
    return Array.from(this.favourites.values()).filter(f => f.userId === userId);
  }

  async addFavourite(fav: InsertFavourite): Promise<Favourite> {
    const id = randomUUID();
    const newFav: Favourite = { ...fav, id, savedAt: new Date() };
    this.favourites.set(id, newFav);
    return newFav;
  }

  async removeFavourite(userId: string, jobId: string): Promise<void> {
    const fav = Array.from(this.favourites.values()).find(f => f.userId === userId && f.jobId === jobId);
    if (fav) this.favourites.delete(fav.id);
  }

  async getSkills(userId: string): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(s => s.userId === userId);
  }

  async addSkill(skill: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const newSkill: Skill = { ...(skill as any), id };
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
    const id = randomUUID();
    const newProject: Project = { ...(project as any), id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, update: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    const updatedProject = { ...project, ...(update as any) } as Project;
    this.projects.set(id, updatedProject);
    return updatedProject;
  }



  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getExperiences(userId: string): Promise<Experience[]> {
    return Array.from(this.experiences.values()).filter(e => e.userId === userId);
  }

  async addExperience(exp: InsertExperience): Promise<Experience> {
    const id = randomUUID();
    const newExp: Experience = { ...(exp as any), id };
    this.experiences.set(id, newExp);
    return newExp;
  }

  async deleteExperience(id: string): Promise<void> {
    this.experiences.delete(id);
  }
}

export const storage = new MemStorage();

