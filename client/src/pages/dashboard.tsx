import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Layout,
  HiringPulseHero,
  MarketSnapshot,
  PeerComparison,
  ActionableSteps,
  RecentActivity,
  RoleReadinessOverview,
  WhatIfSimulator
} from "@/components/index";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Lock, ArrowRight, ShieldCheck, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const { data: completeness, isLoading: completenessLoading } = useProfileCompleteness();
  const [analysisTriggered, setAnalysisTriggered] = useState(false);
  const data = dashboardData as any;

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

          <Card className="w-full max-w-md border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2rem]">
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
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Target Role Readiness</h3>
          </div>
          <RoleReadinessOverview roles={data.roleReadiness} isIntelligenceEnabled={dashboardUnlocked} />
          <p className="text-[10px] text-muted-foreground italic px-2">
            * Insights based on {hasResume ? "Resume, " : ""}{hasSkills ? `${data.marketSnapshot.trendingSkills.length}+ Skills, ` : ""}{hasProjects ? "Portfolio Projects" : "Basic Profile"}.
          </p>
        </div>

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
