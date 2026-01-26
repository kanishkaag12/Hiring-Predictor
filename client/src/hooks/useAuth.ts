/**
 * Enhanced Authentication Hooks with Cache Invalidation
 * 
 * Automatically invalidates profile and dashboard caches on login/logout
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateScope, invalidateQueries } from "@/lib/cacheManager";
import { apiRequest } from "@/lib/queryClient";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  id: string;
  email: string;
  name?: string;
}

/**
 * Login mutation with automatic cache invalidation
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/auth/login", credentials);
      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: async () => {
      // Invalidate all scopes on successful login
      await invalidateScope("auth");
      await invalidateScope("profile");
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Auth] Login failed:", error);
    },
  });
}

/**
 * Logout mutation with automatic cache invalidation
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/auth/logout", null);
      return res.json();
    },
    onSuccess: async () => {
      // Clear all auth-related caches on logout
      await invalidateScope("auth");
      await invalidateScope("profile");
      await invalidateScope("dashboard");
    },
    onError: (error) => {
      console.error("[Auth] Logout failed:", error);
    },
  });
}

/**
 * Register mutation with automatic cache invalidation
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const res = await apiRequest("POST", "/auth/register", data);
      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: async () => {
      // Invalidate auth cache after successful registration
      await invalidateScope("auth");
      await invalidateScope("profile");
    },
    onError: (error) => {
      console.error("[Auth] Registration failed:", error);
    },
  });
}

/**
 * Fetch current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
      return res.json() as Promise<AuthResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });
}
