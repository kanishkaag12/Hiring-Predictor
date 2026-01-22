EXACT CHANGES MADE - TECHNICAL REFERENCE
=========================================


FILE 1: server/routes.ts
========================

ADDED: New endpoint after interest-roles routes (lines 182-213)

// ✅ PROFILE COMPLETENESS - SINGLE SOURCE OF TRUTH FOR DASHBOARD UNLOCK
app.get("/api/profile/completeness", ensureAuthenticated, async (req, res) => {
  const userId = (req.user as User).id;
  const user = await storage.getUser(userId);

  if (!user) return res.status(404).json({ message: "User not found" });

  const skills = await storage.getSkills(userId);

  // Calculate completion status based on LIVE profile data
  const interestRolesComplete = user.interestRoles && user.interestRoles.length >= 2;
  const resumeUploaded = !!user.resumeUrl;
  const careerStatusSet = !!user.userType;
  const skillsAdded = skills.length > 0;

  // Dashboard is unlocked ONLY when ALL requirements are met
  const dashboardUnlocked = interestRolesComplete && resumeUploaded && careerStatusSet && skillsAdded;

  console.log(`[DASHBOARD UNLOCK CHECK] User ${userId}:`, {
    interestRolesComplete,
    resumeUploaded,
    careerStatusSet,
    skillsAdded,
    dashboardUnlocked
  });

  res.json({
    interestRolesComplete,
    resumeUploaded,
    careerStatusSet,
    skillsAdded,
    dashboardUnlocked
  });
});


FILE 2: client/src/hooks/useProfileCompleteness.ts (NEW FILE)
==============================================================

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


FILE 3: client/src/hooks/useProfile.ts
========================================

MODIFIED: updateProfile mutation - Added completeness invalidation

FROM:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
},

TO:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  // Also invalidate dashboard completeness check
  queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
},


MODIFIED: addSkill mutation - Added completeness invalidation

FROM:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
},

TO:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
},


MODIFIED: removeSkill mutation - Added completeness invalidation

FROM:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
},

TO:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
},


MODIFIED: uploadResume mutation - Added completeness invalidation

FROM:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
},

TO:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
},


MODIFIED: updateInterestRoles mutation - Added completeness invalidation

FROM:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
},

TO:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
  queryClient.invalidateQueries({ queryKey: ["/api/profile/completeness"] });
},


FILE 4: client/src/pages/dashboard.tsx
=======================================

MODIFIED: Imports - Added completeness hook

FROM:
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

TO:
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Skeleton } from "@/components/ui/skeleton";
import { ... } from "lucide-react";
import { ... } from "@/components/ui/button";
import { ... } from "wouter";
import { ... } from "@/components/ui/card";
import { ... } from "@/components/ui/badge";
import { useEffect } from "react";


MODIFIED: Component setup - Added completeness hook and logging

FROM:
export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const data = dashboardData as any;

  if (isLoading) {

TO:
export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const { data: completeness, isLoading: completenessLoading } = useProfileCompleteness();
  const data = dashboardData as any;

  // Detailed lock status
  useEffect(() => {
    if (completeness) {
      console.log("[DASHBOARD] Profile completeness status:", completeness);
    }
  }, [completeness]);

  if (isLoading || completenessLoading) {


MODIFIED: Lock status evaluation - Changed to API-driven

FROM:
const { hasRoles, hasSkills, hasResume, hasUserType, hasProjects, hasExperience } = data.unlockStatus || {};
const isIntelligenceEnabled = hasSkills && hasResume && hasUserType && hasRoles;

if (data.isDashboardGated || !hasRoles) {
  const checklist = [
    { id: "roles", label: "Select interest roles (min 2)", complete: hasRoles, ... },
    { id: "resume", label: "Upload your resume", complete: hasResume, ... },
    { id: "usertype", label: "Set your Career Status", complete: hasUserType, ... },
    { id: "skills", label: "Add at least one skill", complete: hasSkills, ... },
  ];

TO:
// Use backend-calculated completeness flag instead of frontend logic
const dashboardUnlocked = completeness?.dashboardUnlocked ?? false;

const { hasRoles, hasSkills, hasResume, hasUserType, hasProjects, hasExperience } = data.unlockStatus || {};
const isIntelligenceEnabled = hasSkills && hasResume && hasUserType && hasRoles;

if (!dashboardUnlocked) {
  // Show detailed checklist based on completeness flags
  const checklist = [
    { 
      id: "roles", 
      label: "Select interest roles (min 2)", 
      complete: completeness?.interestRolesComplete ?? false, 
      path: "/profile?tab=identity" 
    },
    { 
      id: "resume", 
      label: "Upload your resume", 
      complete: completeness?.resumeUploaded ?? false, 
      path: "/profile?tab=identity" 
    },
    { 
      id: "usertype", 
      label: "Set your Career Status", 
      complete: completeness?.careerStatusSet ?? false, 
      path: "/profile" 
    },
    { 
      id: "skills", 
      label: "Add at least one skill", 
      complete: completeness?.skillsAdded ?? false, 
      path: "/profile?tab=skills" 
    },
  ];

  const completedCount = checklist.filter(item => item.complete).length;
  const totalCount = checklist.length;

  return (
    <Layout>
      <div className="...">
        ...
        <div className="text-center space-y-4 max-w-xl">
          <h2 className="text-4xl font-black tracking-tight tracking-tight uppercase italic">Intelligence Locked</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            HirePulse is a Zero-Assumption platform. We require explicit data before generating career intelligence to ensure maximum accuracy and ethical AI behavior.
          </p>
          <div className="pt-2">
            <Badge variant="outline" className="gap-2">
              Progress: {completedCount} of {totalCount} requirements
            </Badge>
          </div>
        </div>


KEY CHANGES SUMMARY:
====================

1. Backend:
   + New GET /api/profile/completeness endpoint
   + Returns all 4 requirement flags + dashboardUnlocked boolean
   + Single source of truth
   + No caching, always fresh

2. Frontend Hooks:
   + New useProfileCompleteness() hook
   + All mutations invalidate completeness query
   + Auto-refetch on any profile change

3. Dashboard Component:
   - Remove hardcoded lock logic
   + Use dashboardUnlocked from API
   + Display progress tracking
   + Show specific missing requirements
   + Add debugging logs

4. Architecture:
   BEFORE: Frontend → Local state → Hardcoded checks
   AFTER:  Frontend → API → Backend validation → Live data
