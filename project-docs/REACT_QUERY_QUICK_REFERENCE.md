/**
 * React Query Auto-Refresh - Quick Reference Card
 * 
 * Copy-paste this for common patterns
 */

# React Query Auto-Refresh - Quick Reference

## Import What You Need

```typescript
// For reading data
import { useDashboardData } from "@/hooks/useDashboardDataEnhanced";
import { useFullProfile } from "@/hooks/useProfileMutations";
import { useProfileCompleteness } from "@/hooks/useDashboardDataEnhanced";

// For modifying data
import { useLogin, useLogout } from "@/hooks/useAuth";
import { useUploadResume, useAddSkill, useAddExperience, useAddProject } from "@/hooks/useProfileMutations";
import { useTriggerAnalysis, useAnalysisStatus } from "@/hooks/useDashboardDataEnhanced";

// For manual cache control (rare)
import { invalidateScope, invalidateQueries, refetchQuery } from "@/lib/cacheManager";
import { queryKeys } from "@/lib/queryKeys";
```

## Pattern 1: Display Data from Cache

```typescript
function Dashboard() {
  const { data, isLoading, error } = useDashboardData();
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorState />;
  
  return <div>{data?.someField}</div>;
}
```

## Pattern 2: Mutate Data (Add/Update/Delete)

```typescript
function AddSkillButton() {
  const addSkill = useAddSkill();
  
  return (
    <>
      <button 
        disabled={addSkill.isPending}
        onClick={() => addSkill.mutate("React")}
      >
        {addSkill.isPending ? "Adding..." : "Add Skill"}
      </button>
      {addSkill.isError && <Error>{addSkill.error?.message}</Error>}
    </>
  );
}
```

## Pattern 3: Upload File

```typescript
function ResumeUploadButton() {
  const uploadResume = useUploadResume();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  return (
    <>
      <input 
        type="file"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
      />
      <button
        disabled={!selectedFile || uploadResume.isPending}
        onClick={() => selectedFile && uploadResume.mutate(selectedFile)}
      >
        {uploadResume.isPending ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}
```

## Pattern 4: Poll for Long-Running Task

```typescript
function AnalysisStatus() {
  const { data: completeness } = useProfileCompleteness();
  const { data: analysisStatus } = useAnalysisStatus(
    completeness?.dashboardUnlocked  // Only poll if unlocked
  );
  
  if (analysisStatus?.status === "pending") {
    return <Spinner>Analysis running...</Spinner>;
  }
  
  if (analysisStatus?.status === "completed") {
    return <ResultsDisplay results={analysisStatus.results} />;
  }
  
  return null;
}
```

## Pattern 5: Combined Query + Mutation

```typescript
function SkillManager() {
  const { data: profile } = useFullProfile();
  const addSkill = useAddSkill();
  const removeSkill = useRemoveSkill();
  
  return (
    <div>
      {/* Display current skills */}
      {profile?.skills.map(skill => (
        <SkillTag
          key={skill.id}
          name={skill.name}
          onRemove={() => removeSkill.mutate(skill.id)}
          isRemoving={removeSkill.isPending}
        />
      ))}
      
      {/* Add new skill */}
      <AddSkillInput 
        onAdd={(name) => addSkill.mutate(name)}
        isAdding={addSkill.isPending}
      />
    </div>
  );
}
```

## Pattern 6: Auth Flow (Login)

```typescript
function LoginForm() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLogin = async (e) => {
    e.preventDefault();
    login.mutate({ email, password });
    // Cache automatically invalidated, UI updates
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign In"}
      </button>
      {login.isError && <Error>{login.error?.message}</Error>}
    </form>
  );
}
```

## Pattern 7: Dependent Queries

```typescript
function ConditionalData() {
  // First query
  const { data: user } = useCurrentUser();
  
  // Second query depends on first
  const { data: dashboard } = useDashboardData();
  
  if (!user) return <LoginPrompt />;
  if (!dashboard) return <Spinner />;
  
  return <Dashboard data={dashboard} />;
}
```

## Manual Cache Control (Rare)

```typescript
// Invalidate entire scope
import { invalidateScope } from '@/lib/cacheManager';
await invalidateScope("profile");      // All profile queries
await invalidateScope("dashboard");    // All dashboard queries

// Invalidate specific queries
import { invalidateQueries, queryKeys } from '@/lib/cacheManager';
await invalidateQueries(queryKeys.profile.skills());
await invalidateQueries(queryKeys.analysis.status());

// Force refetch
import { refetchQuery } from '@/lib/cacheManager';
await refetchQuery(queryKeys.dashboard.data());

// Clear everything (on logout)
import { clearAllCache } from '@/lib/cacheManager';
await clearAllCache();
```

## What Gets Cached

```typescript
// User data
queryKeys.auth.user()              // Current user profile
queryKeys.profile.full()           // Full user profile
queryKeys.profile.completeness()   // Profile completeness status

// Dashboard
queryKeys.dashboard.data()         // Main dashboard view
queryKeys.analysis.status()        // Analysis job status

// Profile components
queryKeys.profile.skills()         // Skills list
queryKeys.profile.experiences()    // Experiences list
queryKeys.profile.projects()       // Projects list
queryKeys.profile.resume()         // Resume data
```

## Stale Times

```typescript
queryKeys.analysis.status()      // staleTime: 0 (always stale, polling)
queryKeys.dashboard.data()       // staleTime: 30 seconds
queryKeys.profile.completeness() // staleTime: 10 seconds
queryKeys.profile.full()         // staleTime: 5 minutes
queryKeys.profile.skills()       // staleTime: 5 minutes
```

## Loading States

```typescript
// During fetch
const { isLoading } = useQuery(...)  // true while fetching initial data
const { isFetching } = useQuery(...) // true while fetching (including background)

// During mutation
const { isPending } = useMutation(...)   // true while mutation running
const { isError, error } = useMutation(...) // error details
```

## Error Handling

```typescript
function Component() {
  const query = useQuery(...);
  const mutation = useMutation(...);
  
  // Query errors
  if (query.isError) {
    return <div>Error: {query.error?.message}</div>;
  }
  
  // Mutation errors
  if (mutation.isError) {
    return <div>Error: {mutation.error?.message}</div>;
  }
  
  return null;
}
```

## Performance Tips

1. **Use `isPending` for mutations, `isLoading` for queries**
   ```typescript
   // Good
   const { isPending } = useMutation(...);
   const { isLoading } = useQuery(...);
   
   // Not as good
   const { isLoading } = useMutation(...);  // Use isPending
   ```

2. **Let mutations handle invalidation**
   ```typescript
   // Good - mutation handles cache
   const addSkill = useAddSkill(); // invalidates automatically
   addSkill.mutate("React");
   
   // Not ideal - manual invalidation
   const addSkill = useMutation(...);
   addSkill.mutate("React");
   queryClient.invalidateQueries(...); // Do this in mutation instead
   ```

3. **Adjust stale times for data freshness**
   ```typescript
   // Fast-changing: short stale time
   staleTime: 10 * 1000   // 10 seconds
   
   // Stable: longer stale time
   staleTime: 5 * 60 * 1000  // 5 minutes
   ```

## Common Mistakes to Avoid

❌ **Don't use `window.location.reload()`**
```typescript
// Bad
addSkill.mutate("React", {
  onSuccess: () => window.location.reload()  // NO!
});

// Good
// Mutation handles invalidation automatically
addSkill.mutate("React");
```

❌ **Don't call refetch() manually in mutation**
```typescript
// Bad
const query = useQuery(...);
query.mutate(..., {
  onSuccess: () => query.refetch()  // Unnecessary
});

// Good
// Mutation onSuccess handles invalidation
```

❌ **Don't forget to set stale times**
```typescript
// Bad
useQuery({
  queryKey: [...],
  queryFn: ...,
  // Missing staleTime - defaults to Infinity (never refetch)
});

// Good
useQuery({
  queryKey: [...],
  queryFn: ...,
  staleTime: 5 * 60 * 1000  // 5 minutes
});
```

## Debugging in Console

```javascript
// See all cached queries
import { getCacheState } from '@/lib/cacheManager';
getCacheState().forEach(q => {
  console.log(q.queryKey, q.state);
});

// Manually invalidate
import { invalidateScope } from '@/lib/cacheManager';
await invalidateScope("dashboard");

// Check specific query
getCacheState().find(q => q.queryKey[0] === 'dashboard');
```

---

**Need more help?** Check these files:
- `REACT_QUERY_CACHE_STRATEGY.md` - Architecture details
- `AUTO_REFRESH_IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- Hook files - Real implementation examples
