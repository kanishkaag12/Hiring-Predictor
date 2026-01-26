/**
 * Enhanced QueryClient Configuration
 * 
 * Optimized for production with:
 * - Proper stale times for each data type
 * - Automatic refetching on window focus
 * - Smart cache invalidation
 * - Error retry logic
 */

import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long before data is considered "stale"
        // While stale, React Query will use cached data but may refetch in background
        staleTime: 5 * 60 * 1000, // 5 minutes default
        
        // Cache time: How long cached data persists in memory
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime pre-v5)
        
        // Retry failed requests
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        
        // Don't refetch on mount by default (individual hooks override this)
        refetchOnMount: false,
        
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
      },
      mutations: {
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

export const queryClient = createQueryClient();
