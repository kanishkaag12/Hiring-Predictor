import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "email" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Single source of truth: fetch authenticated user from /api/auth/me
  const authQueryKey = ["/api/auth/me"] as const;

  const {
    data: user,
    error,
    isLoading,
    isFetching,
  } = useQuery<SelectUser | null, Error>({
    queryKey: authQueryKey,
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes (user session doesn't change often)
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data.user;
    },
    onSuccess: async (loginUser) => {
      console.log("[Auth] Login succeeded, invalidating auth query to trigger refetch");
      // Invalidate and refetch - this forces a fresh request instead of returning cached null
      await queryClient.invalidateQueries({
        queryKey: authQueryKey,
        refetchType: 'active'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (newUser: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", newUser);
      const data = await res.json();
      return data.user;
    },
    onSuccess: async () => {
      console.log("[Auth] Registration succeeded, invalidating auth query to trigger refetch");
      // Invalidate and refetch - this forces a fresh request instead of returning cached null
      await queryClient.invalidateQueries({
        queryKey: authQueryKey,
        refetchType: 'active'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      localStorage.removeItem("token"); // Clean up any legacy token
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(authQueryKey, null);
      queryClient.invalidateQueries({ queryKey: authQueryKey });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || isFetching,
        isAuthenticated: !!user,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
