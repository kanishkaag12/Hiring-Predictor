import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface RoleChance {
    role: string;
    chance: number;
    competition: "Low" | "Medium" | "High";
}

interface YourChancesSummaryProps {
    roles: RoleChance[];
}

export function YourChancesSummary({ roles }: YourChancesSummaryProps) {
    const getCompetitionColor = (level: string) => {
        switch (level) {
            case "Low": return "text-emerald-400";
            case "Medium": return "text-amber-400";
            case "High": return "text-rose-400";
            default: return "";
        }
    };

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Your Top Match Risks & Rewards
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {roles.map((item, index) => (
                    <motion.div
                        key={item.role}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3"
                    >
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <h4 className="font-bold text-foreground/90">{item.role}</h4>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground uppercase tracking-wider">Competition</span>
                                    <span className={`font-bold ${getCompetitionColor(item.competition)}`}>
                                        {item.competition}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-primary">{item.chance}%</span>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Probability</p>
                            </div>
                        </div>

                        <div className="group relative">
                            <Progress value={item.chance} className="h-2.5 bg-muted/30" />
                            <div
                                className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                style={{ width: `${item.chance}%` }}
                            />
                        </div>

                        <Button variant="ghost" className="w-full justify-between h-9 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-all group">
                            Analyze My Chances
                            <Search className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Button>

                        {index < roles.length - 1 && <div className="h-px bg-border/40 mt-6" />}
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
}
