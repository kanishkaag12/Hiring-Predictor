import { motion } from "framer-motion";
import { Layout, HiringTrendChart, JobCard } from "@/components/index";
import { MOCK_JOBS, HIRING_TRENDS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold text-foreground mb-2"
          >
            Welcome back, {user?.name.split(" ")[0] || "User"}
          </motion.h1>
          <p className="text-muted-foreground text-lg">
            Market signals are trending <span className="text-emerald-500 font-medium">positive</span> for your profile today.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-l-4 border-l-primary shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Profile Rank</p>
                    <p className="text-2xl font-mono font-bold">Top 15%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Interview Probability</p>
                    <p className="text-2xl font-mono font-bold">High</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-l-4 border-l-amber-500 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg text-amber-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Active Peers</p>
                    <p className="text-2xl font-mono font-bold">1,240</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full border-border/60 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Market Hiring Trends</CardTitle>
                <p className="text-sm text-muted-foreground">Applications vs Openings (Last 6 Months)</p>
              </CardHeader>
              <CardContent>
                <HiringTrendChart data={HIRING_TRENDS} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommended Jobs */}
          <div className="space-y-6">
            <h2 className="text-xl font-display font-semibold">Recommended for You</h2>
            <div className="space-y-4">
              {MOCK_JOBS.slice(0, 3).map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                >
                  <JobCard job={job} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}