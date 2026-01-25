import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Building2, Flame, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MarketStat, DemandTrend } from "@/lib/dashboardMockData";

interface MarketSnapshotProps {
    data: {
        topRoles: string[];
        activeCompanies: number;
        highCompetitionRoles: string[];
        trendingSkills: string[];
        marketStats?: Array<{
            role: string;
            activeRoles?: number;
            avgApplicants?: number;
            marketDemand?: number;
            competition?: number;
            demandTrend?: "rising" | "stable" | "falling";
            notableCompanies?: string[];
            unavailable?: boolean;
            message?: string;
        }>;
    };
}

export function MarketSnapshot({ data }: MarketSnapshotProps) {
    const marketStats = data.marketStats || [];

    const cards = [
        {
            title: "Active Hiring Roles",
            value: data.topRoles.join(", "),
            icon: Briefcase,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            title: "Companies Hiring",
            value: data.activeCompanies.toString(),
            icon: Building2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            title: "High Competition",
            value: data.highCompetitionRoles?.join(", ") || "N/A",
            icon: Flame,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
        },
        {
            title: "Trending Skills",
            value: data.trendingSkills.join(", "),
            icon: Sparkles,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
    ];

    const trendIcon = (trend?: string) => {
        if (trend === "rising") return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        if (trend === "falling") return <TrendingDown className="w-4 h-4 text-rose-500" />;
        return <Minus className="w-4 h-4 text-amber-500" />;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="h-full border-border/40 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 overflow-hidden">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {card.title}
                                </p>
                                <p className="text-sm font-bold truncate">
                                    {card.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {/* Market demand & competition list - aligned with role readiness */}
            {marketStats.length > 0 && (
                <motion.div
                    className="sm:col-span-2 lg:col-span-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Market Demand & Competition</CardTitle>
                                <Badge variant="secondary">Live Snapshot</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {marketStats.map((stat) => (
                                <div 
                                    key={stat.role} 
                                    className="rounded-lg border border-border/40 p-3 bg-background/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{stat.role}</p>
                                            {stat.unavailable ? (
                                                <p className="text-xs text-amber-500 font-medium mt-1">{stat.message}</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">{stat.activeRoles} active roles · {stat.avgApplicants} avg applicants</p>
                                            )}
                                        </div>
                                        {!stat.unavailable && stat.demandTrend && (
                                            <Badge variant="outline" className="gap-1">
                                                {trendIcon(stat.demandTrend)}
                                                <span className="capitalize">{stat.demandTrend}</span>
                                            </Badge>
                                        )}
                                    </div>

                                    {!stat.unavailable && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                                <div>
                                                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                                                        <span>Market Demand</span>
                                                        <span>{stat.marketDemand}%</span>
                                                    </div>
                                                    <Progress value={stat.marketDemand || 0} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                                                        <span>Competition</span>
                                                        <span>{stat.competition}%</span>
                                                    </div>
                                                    <Progress value={stat.competition || 0} className="h-2" />
                                                </div>
                                            </div>

                                            {stat.notableCompanies && stat.notableCompanies.length > 0 && (
                                                <p className="text-[11px] text-muted-foreground mt-2 truncate">Notable hiring: {stat.notableCompanies.join(", ")}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
