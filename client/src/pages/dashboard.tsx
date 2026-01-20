import { motion } from "framer-motion";
import {
  Layout,
  HiringPulseHero,
  MarketSnapshot,
  YourChancesSummary,
  PeerComparison,
  ActionableSteps,
  RecentActivity
} from "@/components/index";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
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

  return (
    <Layout>
      <div className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        {/* Section 1: Hero Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiringPulseHero
            score={data.hiringPulse.score}
            trend={data.hiringPulse.trend}
            status={data.hiringPulse.status}
          />
        </motion.div>

        {/* Section 2: Market Snapshot */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Market Snapshot</h3>
          <MarketSnapshot data={data.marketSnapshot} />
        </section>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Chances & Recommendations */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 3: Your Chances */}
            <YourChancesSummary roles={data.yourChances} />

            {/* Section 5: Actionable Steps */}
            <ActionableSteps steps={data.actionSteps} />
          </div>

          {/* Right Column: Peer Comparison & Activity */}
          <div className="space-y-8">
            {/* Section 4: Peer Comparison */}
            <PeerComparison data={data.peerComparison} />

            {/* Section 6: Recent Activity */}
            <RecentActivity activities={data.recentActivity} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
