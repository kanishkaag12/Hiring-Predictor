import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Code, FolderGit2, GraduationCap } from "lucide-react";

interface PeerComparisonProps {
    data: {
        peerCount?: number;
        rankPercentile?: number;
        skills?: string;
        projects?: string;
        internships?: string;
    } | null;
}

export function PeerComparison({ data }: PeerComparisonProps) {
    // Safe fallback if data is null
    if (!data) {
        return (
            <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-md relative overflow-hidden">
                <CardContent className="p-6 text-center text-muted-foreground">
                    Peer comparison data not available yet
                </CardContent>
            </Card>
        );
    }

    const stats = [
        { label: "Skill Strength", value: data.skills || "N/A", icon: Code },
        { label: "Project Depth", value: data.projects || "N/A", icon: FolderGit2 },
        { label: "Internship Exp.", value: data.internships || "N/A", icon: GraduationCap },
    ];

    const getBadgeVariant = (val: string) => {
        if (val === "Above Average") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
        if (val === "Average") return "bg-blue-500/20 text-blue-400 border-blue-500/50";
        return "bg-rose-500/20 text-rose-400 border-rose-500/50";
    };

    return (
        <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Users className="w-32 h-32" />
            </div>

            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Peer Standing
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Compared to <span className="text-foreground font-bold">{(data.peerCount || 1540).toLocaleString()}</span> similar candidates
                </p>
            </CardHeader>

            <CardContent className="space-y-8">
                <div className="text-center py-6 bg-background/40 rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Your Rank</p>
                    <div className="flex items-baseline justify-center gap-1">
                        <motion.span
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
                        >
                            #{data.rankPercentile || 0}
                        </motion.span>
                        <span className="text-xl font-bold text-muted-foreground">/ {data.peerCount || 1540}</span>
                    </div>
                    <p className="text-sm font-medium mt-2 text-primary/80">Top {Math.round(((data.rankPercentile || 0) / (data.peerCount || 1540)) * 100)}% of candidates</p>
                </div>

                <div className="space-y-4">
                    {stats.map((item, index) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/5 font-primary">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">{item.label}</span>
                            </div>
                            <Badge className={`px-3 py-0.5 text-[10px] font-bold border ${getBadgeVariant(item.value)}`}>
                                {item.value}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
