/**
 * Enhanced Dashboard Hooks with Automatic Cache Invalidation
 * 
 * Ensures dashboard data is fresh after:
 * - Analysis completion
 * - Resume upload
 * - Profile changes
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateScope, invalidateQueries } from "@/lib/cacheManager";
import { apiRequest } from "@/lib/queryClient";

export interface DashboardData {
  isDashboardGated: boolean;
  hiringPulse?: {
    score: number;
    status: string;
  };
  roleReadiness?: any[];
  mlRolePredictions?: any;
  marketStats?: any[];
  recentActivity?: any[];
  peerComparison?: any;
  actionSteps?: any[];
  unlockStatus?: any;
  resumeParsingStatus?: any;
  roleSkillMatches?: any[];
  roleSkillAnalysis?: any;
}

/**
 * Fetch dashboard data
 * 
 * Uses aggressive refresh strategy:
 * - Always refetches on mount to catch fresh data
 * - Stale after 30 seconds (refetch in background)
 */
export function useDashboardData() {
  return useQuery<DashboardData | null>({
    queryKey: queryKeys.dashboard.data(),
    queryFn: async () => {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch dashboard: ${res.status}`);
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds - dashboard changes frequently
    refetchOnMount: "always", // Always refetch on mount
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Fetch profile completeness status
 * 
 * Aggressively refetches as this determines if dashboard is unlocked
 */
export function useProfileCompleteness() {
  return useQuery({
    queryKey: queryKeys.profile.completeness(),
    queryFn: async () => {
      const res = await fetch("/api/profile/completeness", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch completeness: ${res.status}`);
      return res.json();
    },
    staleTime: 10 * 1000, // 10 seconds - changes when profile is updated
    refetchOnMount: "always", // Always refetch on mount
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Trigger analysis with automatic cache invalidation
 */
export function useTriggerAnalysis() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/analysis/trigger", null);
      return res.json();
    },
    onSuccess: async () => {
      console.log("[Analysis] Triggered, invalidating caches");
      
      // Invalidate analysis status to start polling for completion
      await invalidateQueries(queryKeys.analysis.status());
      await invalidateQueries(queryKeys.analysis.results());
      
      // Dashboard will update as analysis progresses
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Analysis] Trigger failed:", error);
    },
  });
}

/**
 * Fetch analysis status with polling support
 * 
 * Used to poll for analysis completion
 */
export function useAnalysisStatus(pollingEnabled = false) {
  return useQuery({
    queryKey: queryKeys.analysis.status(),
    queryFn: async () => {
      const res = await fetch("/api/analysis/status", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch analysis status: ${res.status}`);
      return res.json();
    },
    staleTime: pollingEnabled ? 0 : 30 * 1000, // Never stale when polling
    refetchInterval: pollingEnabled ? 2000 : false, // Poll every 2 seconds if enabled
    refetchOnMount: true,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Run what-if simulation with cache invalidation
 * 
 * Simulates profile improvements and shows updated readiness
 */
export function useSimulation() {
  return useMutation({
    mutationFn: async (action: { type: string; value?: string }) => {
      const res = await apiRequest("POST", "/api/dashboard/simulate", action);
      return res.json();
    },
    onSuccess: async () => {
      console.log("[Simulation] Completed");
      // Simulations don't modify server state, no cache invalidation needed
      // but we could refresh dashboard for consistency
    },
    onError: (error) => {
      console.error("[Simulation] Failed:", error);
    },
  });
}
