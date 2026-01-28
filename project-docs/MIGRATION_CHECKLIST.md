# Auto-Refresh System - Migration Checklist

This checklist guides you through migrating your app to use automatic cache invalidation and eliminate manual refresh requirements.

## ✅ Completed Foundation

- [x] QueryClient with optimized defaults created
- [x] Query key factory (`lib/queryKeys.ts`)
- [x] Cache manager API (`lib/cacheManager.ts`)
- [x] Auth hooks with invalidation (`hooks/useAuth.ts`)
- [x] Profile mutation hooks (`hooks/useProfileMutations.ts`)
- [x] Enhanced dashboard hooks (`hooks/useDashboardDataEnhanced.ts`)
- [x] Documentation complete

## 🔧 Phase 1: Update Core Files

### Main App Component
- [ ] Update `App.tsx` imports to use `queryClientConfig`
- [ ] Verify `setQueryClient()` called on app startup
- [ ] No errors in browser console

### Old QueryClient
- [ ] Keep `lib/queryClient.ts` for backwards compatibility
- [ ] Update it to import from `queryClientConfig`
- [ ] Update imports: `import { queryClient } from "@/lib/queryClientConfig"`

## 📄 Phase 2: Migrate Components (One at a Time)

### Auth Page (`client/src/pages/auth.tsx`)

Current:
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  setLoading(true);
  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    // Manual refresh needed here
    window.location.href = "/dashboard";
  } finally {
    setLoading(false);
  }
};
```

New:
```typescript
import { useLogin } from "@/hooks/useAuth";

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const login = useLogin();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  login.mutate({ email, password });
  // Automatic redirect after mutation
};

// In JSX
{login.isPending && <Spinner />}
{login.isError && <ErrorMessage>{login.error?.message}</ErrorMessage>}
```

**Checklist for Auth Page:**
- [ ] Import `useLogin` hook
- [ ] Replace form submission to call `login.mutate()`
- [ ] Update error handling to use `login.error`
- [ ] Update loading state to use `login.isPending`
- [ ] Remove `window.location.reload()` calls
- [ ] Test login flow

### Dashboard Page (`client/src/pages/dashboard.tsx`)

Current:
```typescript
import { useDashboardData } from "@/hooks/useDashboardData";

function Dashboard() {
  const { data, isLoading } = useDashboardData();
  // ...
  const handleAnalysis = async () => {
    await fetch("/api/analysis/trigger", { method: "POST" });
    window.location.reload();  // ❌ Manual refresh
  };
}
```

New:
```typescript
import { useDashboardData, useTriggerAnalysis, useAnalysisStatus } from "@/hooks/useDashboardDataEnhanced";
import { useProfileCompleteness } from "@/hooks/useDashboardDataEnhanced";

function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const { data: completeness } = useProfileCompleteness();
  const triggerAnalysis = useTriggerAnalysis();
  const { data: analysisStatus } = useAnalysisStatus(
    completeness?.dashboardUnlocked && !data?.isDone
  );
  
  const handleAnalysis = () => {
    triggerAnalysis.mutate();
    // Cache invalidation happens automatically
  };
}
```

**Checklist for Dashboard:**
- [ ] Import `useDashboardDataEnhanced` instead of `useDashboardData`
- [ ] Import `useAnalysisStatus` for polling
- [ ] Replace analysis trigger with `useTriggerAnalysis()`
- [ ] Set up polling: `useAnalysisStatus(shouldPoll)`
- [ ] Remove all `window.location.reload()` calls
- [ ] Remove manual `refetch()` calls
- [ ] Test resume upload → data shows immediately
- [ ] Test analysis trigger → results appear when complete

### Profile Page (`client/src/pages/profile.tsx`)

Current:
```typescript
const handleAddSkill = async (skillName: string) => {
  await fetch("/api/profile/skills", {
    method: "POST",
    body: JSON.stringify({ name: skillName })
  });
  window.location.reload();  // ❌ Manual refresh
};

const handleUploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append("resume", file);
  await fetch("/api/profile/resume", {
    method: "POST",
    body: formData
  });
  window.location.reload();  // ❌ Manual refresh
};
```

New:
```typescript
import { useAddSkill, useUploadResume } from "@/hooks/useProfileMutations";

const addSkill = useAddSkill();
const uploadResume = useUploadResume();

const handleAddSkill = (skillName: string) => {
  addSkill.mutate(skillName);
  // Automatic cache invalidation
};

const handleUploadResume = (file: File) => {
  uploadResume.mutate(file);
  // Cascading invalidations: profile → completeness → analysis → dashboard
};
```

**Checklist for Profile:**
- [ ] Import mutation hooks: `useAddSkill`, `useRemoveSkill`, `useAddExperience`, etc.
- [ ] Replace form submissions with mutation calls
- [ ] Update loading states to use `isPending`
- [ ] Update error handling to use `isError` and `error`
- [ ] Remove all `window.location.reload()` calls
- [ ] Test skill addition → profile updates immediately
- [ ] Test resume upload → parsed data shows immediately

### Other Components

- [ ] Search/Filter components - use `useQuery` directly
- [ ] Favorites page - add `useFavourites` hook if needed
- [ ] Settings page - add `useUpdateSettings` mutation hook
- [ ] Job details - add cache invalidation after job interaction

## 🔍 Phase 3: Verify & Test

### Verify No Refresh Calls
```bash
# Search for old refresh patterns
grep -r "window.location" client/src/
grep -r ".reload()" client/src/
grep -r "window.location.href" client/src/
```

Should return no results (except protected-route redirects).

### Test Scenarios

- [ ] **Login**: User logs in → dashboard loads automatically (no manual refresh)
- [ ] **Resume Upload**: Upload PDF → parsed data shows in 2-3 seconds
- [ ] **Analysis**: Trigger analysis → results appear when complete (polling works)
- [ ] **Skill Addition**: Add skill → profile and dashboard update immediately
- [ ] **Navigation**: Navigate to profile, back to dashboard → data fresh
- [ ] **Logout**: Logout → redirect to login (all cache cleared)
- [ ] **Error Handling**: Network error → graceful error message (no crash)

### Browser DevTools

- [ ] Open Network tab → monitor fetch requests after mutations
- [ ] Check that unnecessary requests aren't happening
- [ ] Verify data updates without full page reload
- [ ] Console should show `[Cache]` prefixed messages

## 📊 Phase 4: Performance Optimization

### Monitor Cache Hits
```javascript
// In browser console
import { getCacheState } from '@/lib/cacheManager';
getCacheState().length  // Should show increasing cache hits
```

- [ ] First page load: fetch all data
- [ ] After navigation: use cache (instant load)
- [ ] After mutation: refetch just that data
- [ ] After logout: clear all cache

### Adjust Stale Times

If seeing too many background refetches:
- [ ] Increase stale times for stable data (profile, skills)
- [ ] Keep short stale times for volatile data (analysis, dashboard)

If seeing stale data:
- [ ] Decrease stale times
- [ ] Use `refetchOnMount: "always"` for critical pages

### Memory Usage
- [ ] Monitor DevTools Memory tab
- [ ] Cache grows gracefully over time
- [ ] No memory leaks (cache cleared on logout)

## 🚀 Phase 5: Deployment

### Pre-deployment Checklist
- [ ] All components migrated to use new hooks
- [ ] No `window.location.reload()` calls remain
- [ ] No console errors in dev tools
- [ ] All test scenarios passing
- [ ] Performance acceptable (load times < 1 second)
- [ ] Error handling graceful

### Rollback Plan
- [ ] Keep old code in git for quick rollback
- [ ] Monitor error logs in production
- [ ] Have cache manager `clearAllCache()` ready

### Post-deployment Monitoring
- [ ] Monitor error logs (no 500s from cache issues)
- [ ] Check network requests (reasonable rate)
- [ ] Monitor user feedback (faster experience?)
- [ ] Check PageSpeed (should improve with fewer reloads)

## 📚 Documentation

- [ ] Read `REACT_QUERY_CACHE_STRATEGY.md` for architecture
- [ ] Read `AUTO_REFRESH_IMPLEMENTATION_GUIDE.md` for patterns
- [ ] Bookmark `REACT_QUERY_QUICK_REFERENCE.md` for copy-paste patterns
- [ ] Add links to dev docs

## 🎓 Team Training

- [ ] Share `REACT_QUERY_QUICK_REFERENCE.md` with team
- [ ] Show demos of automatic refresh working
- [ ] Explain query keys structure
- [ ] Show cache invalidation in action

## ✅ Final Sign-Off

When all phases complete:

- [ ] No manual refresh needed anywhere in the app
- [ ] All data automatically updates after changes
- [ ] Performance acceptable or improved
- [ ] Team trained and comfortable with system
- [ ] Documentation complete and linked

**🎉 Automatic refresh system fully deployed!**

---

## Troubleshooting During Migration

### Problem: Data not updating after mutation
**Solution:**
1. Check mutation `onSuccess` calls appropriate `invalidateScope()`
2. Verify component uses hook-based query
3. Check console for `[Cache]` logs

### Problem: Stale data shown briefly
**This is normal** - React Query shows cached data while refetching. Add `isFetching` loading state.

### Problem: Too many requests
**Solution:**
1. Increase `staleTime` for less critical data
2. Remove unnecessary `refetchOnMount: "always"`
3. Check for duplicate mutations

### Problem: Old code still using `window.location.reload()`
**Solution:**
1. Search: `grep -r "window.location.reload" client/`
2. Replace with appropriate cache invalidation
3. Test thoroughly before committing

---

## Questions?

Refer to:
1. `REACT_QUERY_QUICK_REFERENCE.md` - Copy-paste patterns
2. `AUTO_REFRESH_IMPLEMENTATION_GUIDE.md` - Detailed explanations
3. `hooks/` folder - Real implementation examples
