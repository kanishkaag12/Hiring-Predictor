/**
 * Enhanced Profile Hooks with Automatic Cache Invalidation
 * 
 * All mutations automatically invalidate relevant caches:
 * - Profile updates trigger dashboard refresh
 * - Resume upload triggers analysis reset
 * - Skill changes trigger ML predictions refresh
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateScope, invalidateQueries } from "@/lib/cacheManager";
import { apiRequest } from "@/lib/queryClient";

export interface Skill {
  id: string;
  name: string;
  proficiency?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link?: string;
  technologies?: string[];
}

export interface FullProfile {
  id: string;
  email: string;
  name?: string;
  userType?: string;
  interestRoles?: string[];
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  resumeUploadedAt?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

/**
 * Fetch full user profile
 */
export function useFullProfile() {
  return useQuery<FullProfile | null>({
    queryKey: queryKeys.profile.full(),
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });
}

/**
 * Add skill with automatic cache invalidation
 */
export function useAddSkill() {
  return useMutation({
    mutationFn: async (skillName: string) => {
      const res = await apiRequest("POST", "/api/profile/skills", { name: skillName });
      return res.json();
    },
    onSuccess: async () => {
      // Invalidate profile and dashboard after skill addition
      await invalidateQueries(queryKeys.profile.skills());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
      
      // Refetch ML predictions since skills changed
      await invalidateQueries(queryKeys.ml.predictions());
    },
    onError: (error) => {
      console.error("[Profile] Add skill failed:", error);
    },
  });
}

/**
 * Remove skill with automatic cache invalidation
 */
export function useRemoveSkill() {
  return useMutation({
    mutationFn: async (skillId: string) => {
      const res = await apiRequest("DELETE", `/api/profile/skills/${skillId}`, null);
      return res.json();
    },
    onSuccess: async () => {
      // Invalidate affected caches
      await invalidateQueries(queryKeys.profile.skills());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
      await invalidateQueries(queryKeys.ml.predictions());
    },
    onError: (error) => {
      console.error("[Profile] Remove skill failed:", error);
    },
  });
}

/**
 * Add experience with automatic cache invalidation
 */
export function useAddExperience() {
  return useMutation({
    mutationFn: async (data: Omit<Experience, "id">) => {
      const res = await apiRequest("POST", "/api/profile/experiences", data);
      return res.json();
    },
    onSuccess: async () => {
      await invalidateQueries(queryKeys.profile.experiences());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Profile] Add experience failed:", error);
    },
  });
}

/**
 * Remove experience with automatic cache invalidation
 */
export function useRemoveExperience() {
  return useMutation({
    mutationFn: async (experienceId: string) => {
      const res = await apiRequest("DELETE", `/api/profile/experiences/${experienceId}`, null);
      return res.json();
    },
    onSuccess: async () => {
      await invalidateQueries(queryKeys.profile.experiences());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Profile] Remove experience failed:", error);
    },
  });
}

/**
 * Add project with automatic cache invalidation
 */
export function useAddProject() {
  return useMutation({
    mutationFn: async (data: Omit<Project, "id">) => {
      const res = await apiRequest("POST", "/api/profile/projects", data);
      return res.json();
    },
    onSuccess: async () => {
      await invalidateQueries(queryKeys.profile.projects());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Profile] Add project failed:", error);
    },
  });
}

/**
 * Remove project with automatic cache invalidation
 */
export function useRemoveProject() {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiRequest("DELETE", `/api/profile/projects/${projectId}`, null);
      return res.json();
    },
    onSuccess: async () => {
      await invalidateQueries(queryKeys.profile.projects());
      await invalidateQueries(queryKeys.profile.full());
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Profile] Remove project failed:", error);
    },
  });
}

/**
 * Upload resume with automatic cache invalidation
 * 
 * This is critical - resume parsing and analysis depend on this
 */
export function useUploadResume() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!res.ok) throw new Error(`Failed to upload resume: ${res.status}`);
      return res.json();
    },
    onSuccess: async () => {
      console.log("[Resume] Upload successful, invalidating caches");
      
      // Invalidate profile caches immediately
      await invalidateQueries(queryKeys.profile.resume());
      await invalidateQueries(queryKeys.profile.resumeStatus());
      await invalidateQueries(queryKeys.profile.full());
      
      // Invalidate completeness (may change after resume upload)
      await invalidateQueries(queryKeys.profile.completeness());
      
      // Reset analysis status (new resume means new analysis needed)
      await invalidateQueries(queryKeys.analysis.status());
      await invalidateQueries(queryKeys.analysis.results());
      
      // Refetch dashboard data
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Resume] Upload failed:", error);
    },
  });
}

/**
 * Update interest roles with automatic cache invalidation
 */
export function useUpdateInterestRoles() {
  return useMutation({
    mutationFn: async (roles: string[]) => {
      const res = await apiRequest("POST", "/api/profile/interest-roles", { roles });
      return res.json();
    },
    onSuccess: async () => {
      await invalidateQueries(queryKeys.profile.full());
      
      // Interest roles change affects ML predictions and dashboard
      await invalidateScope("dashboard");
      await invalidateQueries(queryKeys.ml.predictions());
    },
    onError: (error) => {
      console.error("[Profile] Update interest roles failed:", error);
    },
  });
}
