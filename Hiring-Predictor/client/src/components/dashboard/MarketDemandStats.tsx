import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Users, Briefcase, Flame } from "lucide-react";

interface MarketStat {
  roleCategory: string;
  totalActiveJobs: number;
  averageApplicantsPerJob: number;
  demandTrend: "rising" | "stable" | "falling";
  marketDemandScore: number; // 0-1
  competitionScore: number; // 0-1
  sampleCompanies: string[];
  unavailable?: boolean;
}

interface MarketDemandStatsProps {
  stats: MarketStat[];
}

export function MarketDemandStats({ stats }: MarketDemandStatsProps) {
  if (!stats || stats.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-md">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Select interest roles to see market demand statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {stats.map((stat, idx) => {
        if (stat.unavailable) {
          return (
            <Card
              key={stat.roleCategory}
              className="border-border/40 bg-card/40 backdrop-blur-md opacity-50"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {stat.roleCategory}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    No data available
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        }

        const demandTrendIcon = {
          rising: <TrendingUp className="w-4 h-4 text-emerald-400" />,
          stable: <Minus className="w-4 h-4 text-amber-400" />,
          falling: <TrendingDown className="w-4 h-4 text-rose-400" />,
        }[stat.demandTrend];

        const demandTrendLabel = {
          rising: "Demand Rising",
          stable: "Stable Demand",
          falling: "Demand Falling",
        }[stat.demandTrend];

        const demandTrendColor = {
          rising: "text-emerald-400",
          stable: "text-amber-400",
          falling: "text-rose-400",
        }[stat.demandTrend];

        return (
          <motion.div
            key={stat.roleCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{stat.roleCategory}</CardTitle>
                  <div className={`flex items-center gap-1 ${demandTrendColor}`}>
                    {demandTrendIcon}
                    <span className="text-xs font-semibold">{demandTrendLabel}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Market Demand Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      Market Demand
                    </label>
                    <span className="text-sm font-bold text-foreground">
                      {(stat.marketDemandScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={stat.marketDemandScore * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {stat.totalActiveJobs} active jobs
                  </p>
                </div>

                {/* Competition Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5" />
                      Competition
                    </label>
                    <span className="text-sm font-bold text-foreground">
                      {(stat.competitionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={stat.competitionScore * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    ~{stat.averageApplicantsPerJob.toFixed(0)} applicants per job
                  </p>
                </div>

                {/* Sample Companies */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Top Hiring Companies
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stat.sampleCompanies.slice(0, 5).map((company, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Market Intelligence */}
                <div className="pt-2 border-t border-border/40">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {stat.marketDemandScore >= 0.7 && (
                      <p className="text-emerald-400">
                        ✨ High demand role - excellent market opportunity
                      </p>
                    )}
                    {stat.competitionScore >= 0.7 && (
                      <p className="text-amber-400">
                        ⚠️ High competition - focus on unique skills to stand out
                      </p>
                    )}
                    {stat.marketDemandScore < 0.5 && (
                      <p className="text-slate-400">
                        → Consider developing skills for roles with higher demand
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
