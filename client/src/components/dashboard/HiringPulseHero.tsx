import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HiringPulseHeroProps {
    score: number;
    trend?: number;
    status: "Strong" | "Improving" | "Needs Work";
}

export function HiringPulseHero({ score, trend = 0, status }: HiringPulseHeroProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Strong": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
            case "Improving": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
            case "Needs Work": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
            default: return "";
        }
    };

    return (
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <CardContent className="p-8 md:p-10 flex flex-col items-center md:items-start gap-8 md:gap-16">
                <div className="flex-1 space-y-4 text-center md:text-left w-full">
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Your Hiring Pulse</h2>
                        <p className="text-muted-foreground text-lg">
                            Based on your skills, projects, and current market demand
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <Badge className={`px-4 py-1.5 text-sm font-semibold border ${getStatusColor(status)}`}>
                            {status}
                        </Badge>
                        <div className={`flex items-center gap-1.5 font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {trend >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            {trend >= 0 ? `+${trend}%` : `${trend}%`}
                            <span className="text-muted-foreground font-normal text-sm ml-1">vs last month</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
