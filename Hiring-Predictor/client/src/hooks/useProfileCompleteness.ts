import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface ProfileCompleteness {
  interestRolesComplete: boolean;
  resumeUploaded: boolean;
  careerStatusSet: boolean;
  skillsAdded: boolean;
  dashboardUnlocked: boolean;
}

export function useProfileCompleteness() {
  return useQuery<ProfileCompleteness>({
    queryKey: ["/api/profile/completeness"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Refetch whenever this hook is called, ensuring fresh data
    staleTime: 0,
    // Allow background refetching while showing cached data
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
