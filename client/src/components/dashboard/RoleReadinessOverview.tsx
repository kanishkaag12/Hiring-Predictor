import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Info, CheckCircle2, AlertCircle, XCircle, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleReadiness {
    roleName: string;
    score: number;
    status: "Strong" | "Needs Projects" | "Skill Gap" | "Beginner";
    explanation: string;
    gaps: string[];
    strengths: string[];
}

interface RoleReadinessOverviewProps {
    roles: RoleReadiness[];
    isIntelligenceEnabled: boolean;
}

export function RoleReadinessOverview({ roles, isIntelligenceEnabled }: RoleReadinessOverviewProps) {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest pl-1">Role Readiness Overview</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent className="w-64">
                            Intelligence is role-specific. HirePulse predicts your readiness for each role relative to current market demand and peer candidates.
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role, idx) => (
                    <motion.div
                        key={role.roleName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="h-full border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/20 transition-all flex flex-col overflow-hidden group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-bold">{role.roleName}</CardTitle>
                                        <Badge
                                            variant={role.status === "Strong" ? "default" : role.status === "Beginner" ? "secondary" : "outline"}
                                            className="mt-1"
                                        >
                                            {role.status === "Strong" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {role.status === "Needs Projects" && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {role.status === "Skill Gap" && <XCircle className="w-3 h-3 mr-1" />}
                                            {role.status}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex flex-col items-end ${!isIntelligenceEnabled ? 'opacity-30 blur-[2px]' : ''}`}>
                                            <p className="text-2xl font-black text-primary">{role.score}%</p>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Readiness</p>
                                        </div>
                                    </div>
                                </div>
                                {!isIntelligenceEnabled && (
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center z-10">
                                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-amber-500/20 text-amber-500 gap-1.5 py-1">
                                            <Lock className="w-3 h-3" /> Placeholder
                                        </Badge>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-4">
                                <Progress value={role.score} className="h-2" />

                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs italic text-foreground/80 leading-relaxed font-medium">
                                        "{role.explanation}"
                                    </p>
                                </div>

                                <div className={`space-y-3 transition-opacity ${!isIntelligenceEnabled ? 'opacity-20 select-none' : ''}`}>
                                    {role.gaps.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Top Gaps</p>
                                            {role.gaps.slice(0, 2).map((gap, i) => (
                                                <div key={i} className="flex gap-2 items-start text-[11px] text-muted-foreground">
                                                    <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                                    <span>{gap}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {role.strengths.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strengths</p>
                                            {role.strengths.slice(0, 2).map((strength, i) => (
                                                <div key={i} className="flex gap-2 items-start text-[11px] text-muted-foreground">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                    <span>{strength}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
