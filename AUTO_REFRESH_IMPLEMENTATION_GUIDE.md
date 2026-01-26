/**
 * React Query Auto-Refresh Implementation Guide
 * 
 * Step-by-step guide to implementing automatic UI updates
 * without manual page refreshes.
 */

# Implementation Guide: Automatic UI Refresh with React Query

## What Was Implemented

A complete React Query caching and cache invalidation system that ensures:
- ✅ UI automatically updates after login/logout
- ✅ Dashboard updates after resume upload  
- ✅ Dashboard updates after analysis completion
- ✅ Profile updates trigger dashboard refresh
- ✅ Skill/experience/project changes propagate immediately
- ✅ NO manual page reloads required
- ✅ NO window.location.reload() anywhere

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         React Query (TanStack Query)            │
│  ┌───────────────────────────────────────────┐  │
│  │ QueryClient with Smart Cache Config       │  │
│  │ - 5 min stale time (most queries)          │  │
│  │ - 30 sec stale time (dashboard)            │  │
│  │ - 10 sec stale time (analysis status)      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│      Custom Hooks with Auto-Invalidation        │
│                                                 │
│  useLogin() → invalidates auth+profile+dashboard
│  useProfileMutations() → invalidate cascading   │
│  useUploadResume() → triggers analysis reset    │
│  useDashboardData() → refetches on demand       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│     Cache Manager (Centralized API)             │
│                                                 │
│  invalidateScope("profile")                     │
│  invalidateScope("dashboard")                   │
│  refetchQuery(keys)                             │
│  clearAllCache()                                │
└─────────────────────────────────────────────────┘
```

## New Files Created

### 1. `lib/queryKeys.ts`
**Purpose**: Centralized query key definitions

```typescript
queryKeys.auth.user()          // Current user
queryKeys.profile.full()       // Full profile
queryKeys.profile.skills()     // User skills
queryKeys.dashboard.data()     // Dashboard view
queryKeys.analysis.status()    // Analysis status
```

**Why**: Ensures consistent query keys across the app, enables cache invalidation by scope.

### 2. `lib/queryClientConfig.ts`
**Purpose**: Optimized QueryClient configuration

```typescript
staleTime: 5 * 60 * 1000     // 5 minutes (default)
gcTime: 10 * 60 * 1000       // 10 minutes cache retention
retry: 1                      // Retry failed requests once
refetchOnWindowFocus: false   // Don't refetch on window focus
```

**Why**: Balances freshness and performance. Different queries override these defaults.

### 3. `lib/cacheManager.ts`
**Purpose**: Centralized cache invalidation API

```typescript
await invalidateScope("profile")  // Invalidate all profile queries
await invalidateQueries(keys)     // Invalidate specific queries
await refetchQuery(keys)          // Force refetch
```

**Why**: Single source of truth for cache management, easier to debug and change globally.

### 4. `hooks/useAuth.ts`
**Purpose**: Auth mutations with automatic cache invalidation

```typescript
useLogin()     → logs in, invalidates auth+profile+dashboard
useLogout()    → logs out, clears all caches
useRegister()  → creates account, invalidates auth+profile
```

**Why**: Ensures UI updates after auth changes without manual refresh.

### 5. `hooks/useProfileMutations.ts`
**Purpose**: All profile mutations with cascading invalidations

```typescript
useAddSkill()           → adds skill, invalidates profile+dashboard
useUploadResume()       → uploads, parses, invalidates everything
useAddExperience()      → adds experience, updates dashboard
useUpdateInterestRoles()→ updates roles, triggers ML predictions refresh
```

**Why**: Encapsulates mutation logic and cache invalidation in one place.

### 6. `hooks/useDashboardDataEnhanced.ts`
**Purpose**: Dashboard queries with aggressive refresh strategy

```typescript
useDashboardData()       → refetches on mount, 30 sec stale time
useProfileCompleteness() → refetches on mount, 10 sec stale time
useAnalysisStatus()      → polls every 2 sec while running
```

**Why**: Dashboard is the main view and changes frequently, needs fresh data.

## Step-by-Step Migration

### Step 1: Update imports in components

**Before:**
```typescript
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProfile } from "@/hooks/useProfile";
```

**After:**
```typescript
import { useDashboardData } from "@/hooks/useDashboardDataEnhanced";
import { useFullProfile } from "@/hooks/useProfileMutations";
import { useUploadResume, useAddSkill } from "@/hooks/useProfileMutations";
```

### Step 2: Update component logic

**Before (no auto-refresh):**
```typescript
function Dashboard() {
  const { data } = useDashboardData();
  const [skills, setSkills] = useState([]);
  
  const handleAddSkill = async (skill) => {
    await fetch('/api/profile/skills', { method: 'POST', body: skill });
    // User has to manually refresh!
    window.location.reload();
  };
  
  return <div>{data?.someField}</div>;
}
```

**After (auto-refresh):**
```typescript
function Dashboard() {
  const { data } = useDashboardData();
  const addSkill = useAddSkill();
  
  const handleAddSkill = (skill) => {
    addSkill.mutate(skill);
    // Dashboard automatically refreshes when mutation succeeds!
    // Cache invalidation happens transparently
  };
  
  return (
    <div>
      {addSkill.isPending && <Spinner />}
      {data?.someField}
    </div>
  );
}
```

### Step 3: Update mutation error handling

**Before:**
```typescript
const handleError = (error) => {
  // Just show a toast
  showToast(error.message);
};
```

**After:**
```typescript
const handleError = (error) => {
  // Show specific error and maintain cache state
  if (error.message.includes('401')) {
    // Auth error - user logged out?
    // Cache will be cleared automatically
    showToast('Session expired, please login again');
  } else {
    showToast(error.message);
    // Data cache remains valid
  }
};
```

## Key Behaviors

### 1. Login/Logout
```
User Login:
  ↓ useLogin().mutate()
  ↓ Server validates credentials
  ↓ onSuccess: invalidateScope("profile") + invalidateScope("dashboard")
  ↓ All profile/dashboard queries refetch with auth token
  ↓ UI updates with logged-in state
```

### 2. Resume Upload
```
User uploads resume.pdf:
  ↓ useUploadResume().mutate(file)
  ↓ Server uploads, parses, extracts skills, stores in DB
  ↓ onSuccess: cascading invalidations
    ├─ invalidate profile.resume
    ├─ invalidate profile.completeness (may unlock dashboard)
    ├─ invalidate analysis.status (reset)
    └─ invalidateScope("dashboard") (refresh everything)
  ↓ UI shows parsed resume data
  ↓ If dashboard unlocked, shows analysis button
```

### 3. Analysis Completion
```
Analysis running:
  ↓ useAnalysisStatus(true) with polling enabled
  ↓ Every 2 seconds: GET /api/analysis/status
  ↓ When server returns "completed":
    └─ Dashboard query invalidated automatically
  ↓ UI shows analysis results
  ↓ NO manual refresh needed
```

### 4. Profile Changes
```
User adds a skill:
  ↓ useAddSkill().mutate("React")
  ↓ Server adds skill to profile
  ↓ onSuccess: 
    ├─ invalidate profile.skills
    ├─ invalidate profile.full
    ├─ invalidateScope("dashboard") (updated skills displayed)
    └─ invalidate ml.predictions (ML model sees new skills)
  ↓ UI updates immediately with new skill
  ↓ Dashboard updates if skills affect readiness
```

## Debugging & Monitoring

### Check Cache State in Dev Console
```javascript
import { getCacheState } from '@/lib/cacheManager';
getCacheState(); // Returns all cached queries and their states
```

### Manual Cache Operations
```javascript
import { invalidateScope, refetchQuery } from '@/lib/cacheManager';

// Manually invalidate dashboard
invalidateScope("dashboard");

// Force refetch
refetchQuery(queryKeys.dashboard.data());

// Clear everything
import { clearAllCache } from '@/lib/cacheManager';
clearAllCache();
```

### Log Cache Invalidations
All invalidations log to console with `[Cache]` prefix:
```
[Cache] Invalidating scope: profile
[Cache] Invalidating queries: ["dashboard"]
[Cache] Refetching query: ["analysis","status"]
```

## Common Patterns

### Pattern 1: Loading State During Mutation
```typescript
const addSkill = useAddSkill();

return (
  <>
    <button disabled={addSkill.isPending} onClick={() => addSkill.mutate("React")}>
      {addSkill.isPending ? "Adding..." : "Add Skill"}
    </button>
    {addSkill.isError && <ErrorMessage>{addSkill.error?.message}</ErrorMessage>}
  </>
);
```

### Pattern 2: Optimistic Updates (Optional)
```typescript
const addSkill = useAddSkill();

// Show skill immediately, revert if fails
const { data: profile } = useFullProfile();
const [optimisticSkills, setOptimisticSkills] = useState([]);

const handleAdd = (skill) => {
  setOptimisticSkills([...optimisticSkills, skill]);
  addSkill.mutate(skill, {
    onError: () => {
      setOptimisticSkills(optimisticSkills.filter(s => s !== skill));
    },
  });
};
```

### Pattern 3: Dependent Queries
```typescript
const { data: completeness } = useProfileCompleteness();
const analysisStatus = useAnalysisStatus(
  completeness?.dashboardUnlocked  // Only poll if unlocked
);

// When completeness changes, polling starts/stops automatically
```

## Stale Time Configuration

```typescript
// Fast-changing data - refetch often
analysis status:        staleTime: 0        (always stale, polling)
dashboard:             staleTime: 30 sec   (refetch in background every ~30s)
profile completeness:  staleTime: 10 sec   (refetch frequently)

// Stable data - cache longer
user skills:           staleTime: 5 min    (won't refetch unless invalidated)
user experiences:      staleTime: 5 min    (won't refetch unless invalidated)
settings:              staleTime: 10 min   (very stable)
```

## Production Checklist

- [ ] All page refreshes use cache invalidation instead of `window.location.reload()`
- [ ] All mutations call appropriate invalidation scopes
- [ ] Dashboard has `refetchOnMount: "always"` to ensure fresh data on navigation
- [ ] Analysis polling works (useAnalysisStatus with pollingEnabled)
- [ ] Resume upload cascading invalidations tested
- [ ] Login/logout clears caches properly
- [ ] No console warnings about stale closures in effects
- [ ] Performance acceptable (no excessive refetches)
- [ ] Error handling graceful (mutations show errors without crashing)

## Troubleshooting

### Issue: Dashboard doesn't update after skill added
**Check:**
1. useAddSkill has `invalidateScope("dashboard")` in onSuccess
2. Dashboard component uses `useDashboardData()` (not useQuery directly)
3. Browser dev tools show cache invalidation in console

### Issue: Resume upload seems to hang
**Check:**
1. Check file size (should be < 5MB)
2. Check console for errors
3. Ensure `useUploadResume().onSuccess` includes analysis invalidation
4. Check if analysis auto-triggers (if completeness changed)

### Issue: Excessive refetches
**Check:**
1. staleTime might be too short
2. refetchOnMount might be "always" when it should be "stale"
3. Check for dependency array issues in useEffect

### Issue: Data appears briefly stale
**This is normal** - React Query shows cached data while refetching in background
- Use `isRefetching` or `isFetching` to show loading indicator
- Use `isPending` for initial load

## Files to Update When Adding New Data

1. Add query key to `lib/queryKeys.ts`
2. Create/update hook in appropriate hooks file
3. Add cache invalidation to related mutations
4. Update component to use new hook
5. Test: mutation → cache invalidation → UI updates
