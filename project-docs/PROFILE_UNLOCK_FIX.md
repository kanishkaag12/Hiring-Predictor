# HirePulse Profile Data & Dashboard Unlock - Root Cause Analysis & Fixes

## Problem Summary
Users cannot add/save profile data properly, and the Dashboard remains locked even after completing required profile sections.

## Root Causes Identified

### 1. **Missing Query Invalidation on Profile Mutations** ✅ FIXED
**Issue**: Several mutations (`addProject`, `removeProject`, `addExperience`, `removeExperience`, `updateLinkedin`, `updateGithub`) were NOT invalidating the `/api/profile/completeness` query after updates.

**Impact**: 
- Profile data was saved but the frontend didn't know about it
- Dashboard unlock status was never recalculated
- Users saw stale data

**Fix Applied**:
Modified `client/src/hooks/useProfile.ts` to invalidate completeness on all profile mutations:
```typescript
// Before: Only invalidated /api/profile
queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

// After: Invalidates both profile and completeness
queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
```

**Files Modified**:
- `client/src/hooks/useProfile.ts` - Added completeness invalidation to:
  - `addProject`
  - `removeProject`
  - `addExperience`
  - `removeExperience`
  - `updateLinkedin`
  - `updateGithub`

---

### 2. **Database Schema Missing Profile Fields** ✅ FIXED
**Issue**: The TypeScript schema included `userType` and `interestRoles` fields, but they weren't properly initialized in storage.

**Impact**:
- Backend couldn't save/retrieve these critical fields properly
- Dashboard unlock logic couldn't verify these conditions

**Fix Applied**:
- Updated `shared/schema.ts` to include both fields with proper types and defaults
- Updated `server/storage.ts` InMemoryStorage createUser method to initialize these fields
- Created migration `migrations/0002_add_profile_fields.sql` to add columns to database

**Files Modified**:
- `shared/schema.ts` - Added schema definitions for `userType` and `interestRoles`
- `server/storage.ts` - Added initialization in InMemoryStorage.createUser()
- `migrations/0002_add_profile_fields.sql` - New migration file (created)

---

## Backend Dashboard Unlock Logic

The backend correctly checks completion at `/api/profile/completeness`:

```typescript
const interestRolesComplete = user.interestRoles && user.interestRoles.length >= 2;
const resumeUploaded = !!user.resumeUrl;
const careerStatusSet = !!user.userType;
const skillsAdded = skills.length > 0;

// Dashboard is unlocked ONLY when ALL requirements are met
const dashboardUnlocked = interestRolesComplete && resumeUploaded && careerStatusSet && skillsAdded;
```

**Requirements for Dashboard Unlock**:
1. ✅ At least 2 interest roles selected
2. ✅ Resume uploaded
3. ✅ Career status (userType) set
4. ✅ At least 1 skill added

---

## Frontend Profile Completeness Hook

The `useProfileCompleteness` hook correctly fetches the server-calculated value:

```typescript
export function useProfileCompleteness() {
  return useQuery<ProfileCompleteness>({
    queryKey: ["/api/profile/completeness"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 5,
  });
}
```

---

## Testing Checklist

### 1. Profile Data Persistence
- [ ] Add a skill → Verify it appears in the profile
- [ ] Remove a skill → Verify it's deleted
- [ ] Add a project → Verify it appears in the profile
- [ ] Remove a project → Verify it's deleted
- [ ] Add experience → Verify it appears in the profile
- [ ] Remove experience → Verify it's deleted

### 2. Dashboard Unlock Requirements
- [ ] Set career status (userType) → Check completeness updates
- [ ] Select 2+ interest roles → Check completeness updates
- [ ] Upload resume → Check completeness updates
- [ ] Add skill → Check completeness updates
- [ ] Verify dashboard unlocks ONLY when all 4 are met

### 3. UI Reflection
- [ ] Profile completion percentage updates dynamically
- [ ] Dashboard shows unlock animation when all requirements are met
- [ ] Dashboard shows "Not Unlocked" state with requirements list before unlocking
- [ ] Dashboard shows content after unlock

### 4. State Management
- [ ] Adding data updates local React state immediately
- [ ] API calls complete successfully (check Network tab)
- [ ] `useProfileCompleteness` hook refetches after mutations
- [ ] Refresh page and verify data persists

---

## Database Migration Instructions

### For PostgreSQL Users (Production):
```bash
# Run migrations to add missing columns
npm run migrate
```

The migration file `0002_add_profile_fields.sql` will:
- Add `user_type` column to users table
- Add `interest_roles` column to users table with default empty array

### For In-Memory Storage Users (Development):
No action needed - the in-memory storage now properly initializes these fields.

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile` | Get full profile with skills, projects, experiences |
| PATCH | `/api/profile` | Update basic profile info |
| POST | `/api/profile/skills` | Add skill |
| DELETE | `/api/profile/skills/:id` | Remove skill |
| POST | `/api/profile/projects` | Add project |
| DELETE | `/api/profile/projects/:id` | Remove project |
| POST | `/api/profile/experience` | Add experience |
| DELETE | `/api/profile/experience/:id` | Remove experience |
| POST | `/api/profile/interest-roles` | Set interest roles (2-4) |
| GET | `/api/profile/completeness` | Get dashboard unlock status |
| PUT | `/api/profile/linkedin` | Link LinkedIn profile |
| PUT | `/api/profile/github` | Link GitHub profile |
| POST | `/api/profile/resume` | Upload resume PDF |

---

## How Profile Completion Works (Data Flow)

### 1. User Adds Data (Frontend)
```
User adds skill → useProfile.addSkill() mutation fires
                → API request to POST /api/profile/skills
                → Backend stores in database
                → onSuccess callback invalidates /api/profile and /api/profile/completeness
```

### 2. Frontend Recalculates State
```
Invalidation triggers → useProfile and useProfileCompleteness hooks refetch
                      → Profile data updates
                      → Completeness status recalculated on backend
                      → Backend returns updated dashboardUnlocked flag
```

### 3. Dashboard Renders
```
dashboardUnlocked = true → Show dashboard content
dashboardUnlocked = false → Show unlock requirements screen
```

---

## Debugging Tips

### Check if data is being saved:
1. Open Network tab in DevTools
2. Perform an action (add skill, etc.)
3. Look for POST request to `/api/profile/skills`
4. Response should contain the new skill with an ID

### Check if completeness is updating:
1. After any profile change, look for GET to `/api/profile/completeness`
2. Response should contain updated flags:
   ```json
   {
     "interestRolesComplete": true/false,
     "resumeUploaded": true/false,
     "careerStatusSet": true/false,
     "skillsAdded": true/false,
     "dashboardUnlocked": true/false
   }
   ```

### Check React Query cache:
1. Install React Query Devtools (optional)
2. Check if queries have the `staleTime: 0` setting (always refetch fresh)
3. Verify mutations invalidate the correct query keys

---

## Summary of Changes

### Files Modified:
1. ✅ `shared/schema.ts` - Added userType and interestRoles fields
2. ✅ `server/storage.ts` - Updated InMemoryStorage to initialize new fields
3. ✅ `client/src/hooks/useProfile.ts` - Added completeness invalidation to 6 mutations

### Files Created:
1. ✅ `migrations/0002_add_profile_fields.sql` - Database migration

### Expected Behavior After Fixes:
- ✅ Profile data saves immediately and persists
- ✅ Profile completion percentage updates in real-time
- ✅ Dashboard unlocks automatically when all 4 requirements are met
- ✅ Buttons reflect actual profile state (no stale UI)
- ✅ Page refresh maintains all data

---

## Next Steps

1. **Run migrations** (if using PostgreSQL)
   ```bash
   npm run migrate
   ```

2. **Restart development server**
   ```bash
   npm run dev
   ```

3. **Test the profile completion flow**
   - Go to /profile
   - Set career status
   - Select 2+ interest roles
   - Upload resume
   - Add at least 1 skill
   - Verify dashboard unlocks

4. **Monitor console** for any errors related to profile updates

---

## Questions or Issues?

If you encounter any issues:

1. Check browser console for errors
2. Check network requests in DevTools
3. Verify database columns exist if using PostgreSQL
4. Ensure all migrations have run successfully

The system is now configured to properly track and display profile completion status.
