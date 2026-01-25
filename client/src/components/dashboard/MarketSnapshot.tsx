import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Flame, Sparkles } from "lucide-react";

interface MarketSnapshotProps {
    data: {
        topRoles: string[];
        activeCompanies: number;
        highCompetitionRoles: string[];
        trendingSkills: string[];
    };
}

export function MarketSnapshot({ data }: MarketSnapshotProps) {
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
        </div>
    );
}
