import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HiringPulseHeroProps {
    score: number;
    trend: number;
    status: "Strong" | "Improving" | "Needs Work";
}

export function HiringPulseHero({ score, trend, status }: HiringPulseHeroProps) {
    const data = [
        { value: score },
        { value: 100 - score },
    ];

    const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

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
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="80%"
                                outerRadius="100%"
                                startAngle={90}
                                endAngle={450}
                                paddingAngle={0}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl md:text-7xl font-bold tracking-tighter"
                        >
                            {score}
                        </motion.span>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest">Readiness</span>
                    </div>
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left">
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
