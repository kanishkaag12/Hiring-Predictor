/**
 * Query Cache Manager
 * 
 * Centralized API for cache invalidation across the application.
 * This ensures consistent, predictable cache behavior after mutations.
 */

import { QueryClient } from "@tanstack/react-query";
import { queryKeys, QueryScope, getInvalidationScope } from "./queryKeys";

let queryClientInstance: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    throw new Error("QueryClient not initialized. Call setQueryClient first.");
  }
  return queryClientInstance as any as QueryClient;
}

/**
 * Invalidate queries by scope
 * Common usage:
 * - invalidateScope("profile") after profile update
 * - invalidateScope("dashboard") after analysis completion
 * - invalidateScope("auth") after login/logout
 */
export async function invalidateScope(scope: QueryScope) {
  const client = queryClientInstance as unknown as QueryClient;
  const scopeKey = getInvalidationScope(scope);
  
  console.log(`[Cache] Invalidating scope: ${scope}`, scopeKey);
  
  if (scopeKey.length === 0) {
    // Invalidate all queries
    await client.invalidateQueries();
  } else {
    await client.invalidateQueries({ queryKey: scopeKey });
  }
}

/**
 * Invalidate specific queries
 */
export async function invalidateQueries(keys: readonly any[]) {
  const client = queryClientInstance as unknown as QueryClient;
  console.log(`[Cache] Invalidating queries:`, keys);
  await client.invalidateQueries({ queryKey: keys as any[] });
}

/**
 * Refetch specific query
 */
export async function refetchQuery(keys: readonly any[]) {
  const client = queryClientInstance as unknown as QueryClient;
  console.log(`[Cache] Refetching query:`, keys);
  await client.refetchQueries({ queryKey: keys as any[] });
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
  const client = queryClientInstance as unknown as QueryClient;
  console.log("[Cache] Clearing all cache");
  client.clear();
}

/**
 * Get current cache state (development only)
 */
export function getCacheState() {
  const client = queryClientInstance as unknown as QueryClient;
  return (client.getQueryCache() as any).getAll();
}

// Export query keys for direct cache management
export { queryKeys };
