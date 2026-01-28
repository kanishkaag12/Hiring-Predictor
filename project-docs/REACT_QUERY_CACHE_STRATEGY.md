/**
 * Query Cache Invalidation Documentation & Best Practices
 * 
 * This document explains the automatic cache invalidation strategy
 * and how to properly use it across the application.
 */

# React Query Cache Invalidation Strategy

## Overview

This app uses React Query (TanStack Query) with a centralized cache invalidation system to ensure the UI automatically updates after data changes without requiring manual page refreshes.

## Key Concepts

### 1. Query Keys

All query keys are defined in `lib/queryKeys.ts` using a hierarchical structure:

```typescript
queryKeys.profile.full()        // Full user profile
queryKeys.profile.skills()      // User skills list
queryKeys.dashboard.data()      // Dashboard data
queryKeys.analysis.status()     // Analysis status
```

This structure enables invalidating groups of related queries at once.

### 2. Stale Time vs. Cache Time

- **Stale Time**: How long before cached data is considered "stale". While stale, React Query will still use cached data but may refetch in the background.
- **Cache Time (gcTime)**: How long cached data persists in memory before being garbage collected.

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,    // 10 minutes
```

### 3. Automatic Refetch on Mount

Some queries refetch automatically when the component mounts, ensuring fresh data:

```typescript
refetchOnMount: "always"  // Always refetch when component mounts
refetchOnMount: "stale"   // Refetch only if data is stale
refetchOnMount: false     // Never refetch on mount (default)
```

## Cache Invalidation Patterns

### Pattern 1: Simple Mutation with Scope Invalidation

When you update a user skill, invalidate the profile scope:

```typescript
function MyComponent() {
  const addSkill = useAddSkill();
  
  return (
    <button onClick={() => addSkill.mutate("React")}>
      Add Skill
    </button>
  );
}

// In useAddSkill hook:
onSuccess: async () => {
  await invalidateScope("profile");    // Invalidates all profile queries
  await invalidateScope("dashboard");  // Dashboard depends on profile
}
```

### Pattern 2: Cascading Invalidations

Resume upload affects multiple systems and must invalidate in order:

```typescript
onSuccess: async () => {
  // 1. Invalidate profile (resume data)
  await invalidateQueries(queryKeys.profile.resume());
  
  // 2. Invalidate completeness (may change after resume)
  await invalidateQueries(queryKeys.profile.completeness());
  
  // 3. Reset analysis (new resume = new analysis needed)
  await invalidateQueries(queryKeys.analysis.status());
  
  // 4. Refresh dashboard (depends on all above)
  await invalidateScope("dashboard");
}
```

### Pattern 3: Analysis Completion Polling

When analysis is running, poll for completion and invalidate on finish:

```typescript
function Dashboard() {
  const completeness = useProfileCompleteness();
  const analysisStatus = useAnalysisStatus(completeness?.dashboardUnlocked);
  
  // When analysis completes, dashboard will auto-refresh
  // because analysisStatus query completion triggers dashboard invalidation
}
```

## Data Flow & Automatic Updates

### Login Flow
```
User clicks "Login"
  ↓
useLogin mutation executes
  ↓
Server returns auth token
  ↓
onSuccess: invalidateScope("profile") + invalidateScope("dashboard")
  ↓
Profile queries refetch with auth token
Dashboard queries refetch with new profile data
  ↓
UI automatically updates with fresh data
```

### Resume Upload Flow
```
User selects resume file
  ↓
useUploadResume mutation executes
  ↓
Server uploads, parses, extracts skills
  ↓
onSuccess: cascading invalidations
  ↓
1. Profile resume queries refetch
2. Completeness query refetches (may unlock dashboard)
3. Analysis status resets
4. Dashboard refetches (now with unlocked view)
  ↓
UI automatically shows:
- Parsed resume data
- Updated completeness
- Analysis trigger button
- Full dashboard (if unlocked)
```

### Analysis Completion Flow
```
User triggers analysis
  ↓
useTriggerAnalysis mutation executes
  ↓
Server starts background job
  ↓
useAnalysisStatus starts polling (every 2 seconds)
  ↓
When analysis completes on server:
  ↓
Dashboard query refetches automatically
  ↓
UI shows analysis results without manual refresh
```

## Hook Usage Guide

### In Components

**Before (without proper caching):**
```typescript
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile);
  }, []);
  
  // Stale data! User has to manually refresh
  // No cache invalidation on mutations
}
```

**After (with React Query):**
```typescript
function ProfilePage() {
  const { data: profile } = useFullProfile();
  const addSkill = useAddSkill();
  
  return (
    <>
      <button onClick={() => addSkill.mutate("React")}>
        Add Skill
      </button>
      {addSkill.isPending && <Spinner />}
      {profile && <SkillsList skills={profile.skills} />}
    </>
  );
  // UI automatically updates after skill added!
  // Cache automatically invalidated by mutation
}
```

## Key Rules

1. **Always use hooks, not raw fetch** - Hooks manage cache automatically
2. **Never manually call `window.location.reload()`** - Use cache invalidation instead
3. **Use scopes for related data** - `invalidateScope("profile")` is better than invalidating individual queries
4. **Invalidate on success, not error** - Errors don't change data
5. **Cascade invalidations properly** - Resume upload invalidates profile, then dashboard
6. **Use stale time strategically** - Fast-changing data (analysis) has short stale time, stable data (skills) has longer stale time

## Troubleshooting

### Issue: Data not updating after mutation
**Solution**: Ensure mutation `onSuccess` calls `invalidateScope()` or `invalidateQueries()`

### Issue: Too many refetches
**Solution**: Increase `staleTime` to reduce background refetches, but decrease for frequently-changing data

### Issue: Stale data shown briefly
**Solution**: This is intentional - React Query shows cached data immediately while refetching in background. Use `isPending` or `isRefetching` to show loading states.

### Issue: Analysis stuck on pending
**Solution**: `useAnalysisStatus` must have `pollingEnabled=true` and query refetch interval set to 2 seconds

## Development Helpers

```typescript
// In dev console
import { getCacheState } from '@/lib/cacheManager';
getCacheState(); // See all cached queries

import { invalidateScope } from '@/lib/cacheManager';
invalidateScope("dashboard"); // Manually invalidate
```

## Files

- `lib/queryKeys.ts` - All query key definitions
- `lib/cacheManager.ts` - Cache invalidation API
- `lib/queryClientConfig.ts` - QueryClient configuration
- `hooks/useAuth.ts` - Auth mutations with invalidation
- `hooks/useProfileMutations.ts` - Profile mutations with invalidation
- `hooks/useDashboardDataEnhanced.ts` - Dashboard queries and mutations with invalidation
