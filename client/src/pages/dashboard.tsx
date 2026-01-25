import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Layout,
  HiringPulseHero,
  MarketSnapshot,
  MarketDemandStats,
  PeerComparison,
  ActionableSteps,
  RecentActivity,
  RoleReadinessOverview,
  WhatIfSimulator
} from "@/components/index";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Lock, ArrowRight, ShieldCheck, CheckCircle2, Info, Loader2, TrendingUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const { data: completeness, isLoading: completenessLoading, refetch: refetchCompleteness } = useProfileCompleteness();
  const [analysisTriggered, setAnalysisTriggered] = useState(false);
  const data = dashboardData as any;

  // Force refetch completeness on mount to ensure fresh data
  useEffect(() => {
    refetchCompleteness();
  }, [refetchCompleteness]);

  // Log completeness data for debugging
  useEffect(() => {
    if (completeness) {
      console.log("[DASHBOARD] Completeness data:", completeness);
    }
  }, [completeness]);

  // Query for analysis status
  const { data: analysisStatus } = useQuery({
    queryKey: ["analysis", completeness?.dashboardUnlocked],
    queryFn: async () => {
      if (!completeness?.dashboardUnlocked) return null;
      const res = await fetch("/api/analysis/status");
      return res.json();
    },
    enabled: !!completeness?.dashboardUnlocked,
    refetchInterval: analysisTriggered ? 2000 : false // Poll every 2s if pending
  });

  // Trigger analysis when profile completes
  useEffect(() => {
    if (completeness?.dashboardUnlocked && !analysisTriggered) {
      fetch("/api/analysis/trigger", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          console.log("[DASHBOARD] Analysis triggered:", data);
          setAnalysisTriggered(true);
        })
        .catch(err => console.error("Failed to trigger analysis:", err));
    }
  }, [completeness?.dashboardUnlocked, analysisTriggered]);

  if (isLoading || completenessLoading) {
    return (
      <Layout>
        <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
          <Skeleton className="h-[300px] w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[500px] lg:col-span-2 rounded-3xl" />
            <Skeleton className="h-[500px] rounded-3xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="p-6 md:p-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground">We couldn't load your dashboard data. Please try again later.</p>
        </div>
      </Layout>
    );
  }

  // Use backend-calculated completeness flag as single source of truth
  const dashboardUnlocked = completeness?.dashboardUnlocked ?? false;
  
  // Extract data for context only - DO NOT use for lock/unlock decisions
  const { hasRoles, hasSkills, hasResume, hasUserType, hasProjects, hasExperience } = data.unlockStatus || {};
  
  // Check for resume parsing errors even if dashboard is unlocked
  const resumeParsingStatus = data.resumeParsingStatus;
  const hasParsingError = resumeParsingStatus?.hasError;

  // Show pending analysis state
  if (dashboardUnlocked && analysisStatus?.status === "pending") {
    return (
      <Layout>
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-[80vh] flex flex-col items-center justify-center space-y-10">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center shadow-lg"
          >
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </motion.div>
          
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight">🔍 Analyzing Your Profile</h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Our AI is analyzing your resume, skills, and experience to generate personalized insights...
            </p>
            <p className="text-sm text-muted-foreground">This usually takes 10-30 seconds</p>
          </div>

          <Card className="w-full border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-600 dark:text-blue-400">What we're doing:</p>
                <ul className="space-y-1 text-muted-foreground text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    Analyzing your resume
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    Computing role readiness scores
                  </li>
                  <li className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    Identifying skill gaps
                  </li>
                  <li className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    Generating recommendations
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-[80vh] flex flex-col items-center justify-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5"
          >
            <Lock className="w-10 h-10 text-primary" />
          </motion.div>

          <div className="text-center space-y-4 max-w-xl">
            <h2 className="text-4xl font-black tracking-tight uppercase italic">Intelligence Locked</h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              HirePulse is a Zero-Assumption platform. We require explicit data before generating career intelligence to ensure maximum accuracy and ethical AI behavior.
            </p>
            <div className="pt-2">
              <Badge variant="outline" className="gap-2">
                Progress: {completedCount} of {totalCount} requirements
              </Badge>
            </div>
          </div>

          <Card className="w-full max-w-md border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-4xl">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest text-center">Unlock Requirements</h3>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <Link key={item.id} href={item.path}>
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                      item.complete
                        ? "bg-primary/5 border-primary/20 text-primary"
                        : "bg-muted/5 border-border/40 hover:border-primary/20 text-muted-foreground hover:text-foreground"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          item.complete
                            ? "bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20"
                            : "border-border/60 group-hover:border-primary/40"
                        )}>
                          {item.complete
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/40" />
                          }
                        </div>
                        <span className={cn(
                          "text-sm font-bold transition-colors",
                          item.complete ? "text-emerald-500" : "opacity-80 group-hover:opacity-100"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-all",
                        item.complete ? "text-emerald-500 opacity-40" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                      )} />
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/profile">
                <Button className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 mt-4">
                  Complete Profile In-Depth
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8 opacity-40">
            {[
              { icon: Target, label: "Role Readiness", desc: "Pure market-truth matching" },
              { icon: ShieldCheck, label: "Peer Indexing", desc: "Relative competitive analysis" },
              { icon: Lock, label: "Predictive AI", desc: "Role-specific roadmap generation" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-2">
                <feature.icon className="w-5 h-5" />
                <p className="text-[10px] font-bold uppercase tracking-widest">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-12 space-y-12 max-w-7xl mx-auto">
        {/* Resume Parsing Error Warning */}
        {hasParsingError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">⚠️</div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Resume Parsing Issue</p>
                <p className="text-amber-800 dark:text-amber-200 text-xs mt-1">{resumeParsingStatus?.error}</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-2">
                  Your role predictions may be incomplete. Try uploading a different resume or ensure it contains clear structured content.
                </p>
                <Link href="/profile?tab=identity">
                  <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
                    Re-upload Resume
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section 1: Hero Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiringPulseHero
            score={data.hiringPulse.score}
            status={data.hiringPulse.status}
          />
        </motion.div>

        {/* Section: Role Readiness Overview (MULTI-ROLE) */}
        {/* Removed: deterministic readiness overview to streamline AI guidance */}

        {/* Skills & Role Intelligence Section */}
        {/* Removed: deterministic role alignment and raw match percentages to avoid conflicting signals */}

        {/* Section: Your Career Interests */}
        {data.userInterestRoles && data.userInterestRoles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">
                Your Career Interests
              </h3>
              <Badge variant="outline" className="text-xs">
                User-Selected
              </Badge>
            </div>

            {/* User Selected Roles with AI Alignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.userInterestRoles.map((roleName: string, idx: number) => {
                // Get AI alignment data if available
                const aiAlignment = data.mlRolePredictions?.userSelectedRoles?.find(
                  (r: any) => r.roleTitle === roleName
                )?.aiAlignment;

                return (
                  <Card
                    key={idx}
                    className={cn(
                      "border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                      aiAlignment?.confidence === 'high'
                        ? "bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30"
                        : aiAlignment?.confidence === 'medium'
                          ? "bg-linear-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30"
                          : "bg-card/50 border-border/30"
                    )}
                  >
                    <CardContent className="p-5">
                      {/* Role Title + Alignment Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold leading-tight mb-1">{roleName}</h4>
                          {aiAlignment?.alignmentStatus && (
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-medium capitalize px-2 py-1 rounded-full",
                                aiAlignment.alignmentStatus === 'Strong Fit'
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                  : aiAlignment.alignmentStatus === 'Growing Fit'
                                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                              )}>
                                {aiAlignment.alignmentStatus}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {Math.round(aiAlignment.probability * 100)}% alignment
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Alignment Insights */}
                      {aiAlignment ? (
                        <>
                          {/* Show matched skills (Your Strengths) */}
                          {aiAlignment.matchedSkills && aiAlignment.matchedSkills.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Your Strengths:</p>
                              <div className="flex flex-wrap gap-1">
                                {aiAlignment.matchedSkills.slice(0, 3).map((skill: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[10px] py-0.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
                                  >
                                    ✓ {skill}
                                  </Badge>
                                ))}
                                {aiAlignment.matchedSkills.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] py-0.5 text-muted-foreground">
                                    +{aiAlignment.matchedSkills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Show growth areas (What to focus on) */}
                          {aiAlignment.growthAreas && aiAlignment.growthAreas.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Growth Areas:</p>
                              <div className="space-y-1">
                                {aiAlignment.growthAreas.slice(0, 3).map((area: string, i: number) => (
                                  <div
                                    key={i}
                                    className="text-xs text-foreground/70 flex items-start gap-2"
                                  >
                                    <span className="text-amber-500 mt-0.5">→</span>
                                    <span>{area}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Constructive Guidance */}
                          <div className={cn(
                            "p-3 rounded-lg border text-sm",
                            aiAlignment.alignmentStatus === 'Strong Fit'
                              ? "bg-emerald-500/5 border-emerald-500/20 text-foreground"
                              : aiAlignment.alignmentStatus === 'Growing Fit'
                                ? "bg-amber-500/5 border-amber-500/20 text-foreground"
                                : "bg-slate-500/5 border-slate-500/20 text-foreground"
                          )}>
                            <p className="text-xs leading-relaxed">
                              <span className="font-medium block mb-1">💡 Your AI Guidance</span>
                              {aiAlignment.constructiveGuidance}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Upload a resume to unlock AI alignment insights for this role.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* AI Alignment Information */}
            {data.mlRolePredictions && (
              <div className="px-1 py-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-900/70 dark:text-blue-100/70">
                  <span className="font-semibold">How AI Alignment Works:</span> We analyze how close you are to your selected roles using semantic similarity and skill matching. <strong>Strong Fit</strong> = well-prepared; <strong>Growing Fit</strong> = on the right track; <strong>Early Stage</strong> = work toward this goal.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Role Recommendations */}
        {data.mlRolePredictions && data.mlRolePredictions.topRoles?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">
                Recommended Career Paths
              </h3>
              <Badge variant="outline" className="text-xs">
                AI-Powered
              </Badge>
            </div>

            {/* Top Predicted Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.mlRolePredictions.topRoles?.slice(0, 6).map((role: any, idx: number) => (
                <Card 
                  key={idx}
                  className={cn(
                    "border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                    role.confidence === 'high' 
                      ? "bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30"
                      : role.confidence === 'medium'
                        ? "bg-linear-to-br from-primary/10 to-primary/5 border-primary/30"
                        : "bg-card/50"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold leading-tight">{role.roleTitle}</h4>
                          {role.isUserSelected && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300">
                              Your Interest
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{role.cluster}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] capitalize shrink-0",
                          role.confidence === 'high' ? "border-emerald-500/50 text-emerald-500" :
                          role.confidence === 'medium' ? "border-primary/50 text-primary" : 
                          "border-muted-foreground/50 text-muted-foreground"
                        )}
                      >
                        {role.confidence}
                      </Badge>
                    </div>
                    
                    {/* Probability Display */}
                    <div className="flex items-end gap-2 mb-3">
                      <span className={cn(
                        "text-3xl font-black tabular-nums",
                        role.confidence === 'high' ? "text-emerald-500" :
                        role.confidence === 'medium' ? "text-primary" : "text-muted-foreground"
                      )}>
                        {Math.round(role.probability * 100)}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">% fit</span>
                    </div>
                    
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(role.probability * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          role.confidence === 'high' ? "bg-linear-to-r from-emerald-500 to-emerald-400" :
                          role.confidence === 'medium' ? "bg-linear-to-r from-primary to-primary/70" : 
                          "bg-muted-foreground/40"
                        )}
                      />
                    </div>

                    {/* Matched Skills */}
                    {role.matchedSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {role.matchedSkills.slice(0, 3).map((skill: string, sIdx: number) => (
                          <Badge key={sIdx} variant="secondary" className="text-[10px] px-2 py-0">
                            {skill}
                          </Badge>
                        ))}
                        {role.matchedSkills.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            +{role.matchedSkills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Brief explanation */}
                    {role.explanation && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {role.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Career Path Suggestions */}
            {data.mlRolePredictions.careerPaths?.length > 0 && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Growth Trajectory</span>
                  </div>
                  <div className="space-y-3">
                    {data.mlRolePredictions.careerPaths.slice(0, 2).map((careerPath: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {careerPath.currentFit}
                        </Badge>
                        {(careerPath.growthPath || []).map((step: string, sIdx: number) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {step}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Section: What-If Simulator (Progressive) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1 flex items-center gap-2">
              What-If Simulator
            </h3>
          </div>
          <WhatIfSimulator />
        </div>

        {/* Section 2: Market Snapshot */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Market Snapshot</h3>
          <MarketSnapshot data={data.marketSnapshot} />
        </section>

        {/* Section 3: Market Demand & Competition per Role */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Market Demand & Competition</h3>
          <MarketDemandStats stats={data.marketStats} />
        </section>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Recommendations */}
          <div className="lg:col-span-2 space-y-10">
            {/* Section 5: Actionable Steps */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Recommended Actions</h3>
              <ActionableSteps steps={data.actionSteps} />
            </div>
          </div>

          {/* Right Column: Peer Comparison & Activity */}
          <div className="space-y-10">
            {/* Section 4: Peer Comparison */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1 flex items-center gap-2">
                Peer Benchmarking
              </h3>
              <PeerComparison data={data.peerComparison} />
            </div>

            {/* Section 6: Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Recent Activity</h3>
              <RecentActivity activities={data.recentActivity} />
            </div>
          </div>
        </div>

        {/* Transparency Requirement */}
        <div className="pt-10 border-t border-border/40">
          <p className="text-center text-[10px] text-muted-foreground font-medium italic opacity-60 max-w-2xl mx-auto">
            "HirePulse is a role-led career intelligence platform. All readiness scores are probabilistic estimates
            based on market truth and peer relative analysis. They are provided for guidance only and do not guarantee hiring outcomes."
          </p>
        </div>
      </div>
    </Layout>
  );
}
