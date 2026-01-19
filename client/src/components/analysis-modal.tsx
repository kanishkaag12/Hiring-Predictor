import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Users, Activity, Clock, Briefcase } from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from "recharts";

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
}

export function AnalysisModal({ isOpen, onClose, job }: AnalysisModalProps) {
    const [stage, setStage] = useState<"analyzing" | "complete">("analyzing");

    useEffect(() => {
        if (isOpen) {
            setStage("analyzing");
            const timer = setTimeout(() => {
                setStage("complete");
            }, 2500); // 2.5s delay for "intelligence" feel
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const patterns = job?.analysis?.hiringPatterns || {};
    const comparison = job?.analysis?.candidateComparison || {};

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-none rounded-none border-none bg-background/95 backdrop-blur-xl p-0 shadow-none flex flex-col">
                <AnimatePresence mode="wait">
                    {stage === "analyzing" ? (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="relative z-10 w-24 h-24 border-4 border-primary/30 border-t-primary rounded-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Analyzing hiring patterns...</h3>
                                <p className="text-muted-foreground">Comparing your profile with {comparison.peerCount || "1,200+"} recent applicants</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Header */}
                            <div className="p-6 border-b bg-muted/30 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {job.company} <Badge variant="outline">{job.title}</Badge>
                                    </h2>
                                    <p className="text-muted-foreground mt-1">Based on live hiring signals & peer data</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-primary">{job.analysis.probability}%</div>
                                    <div className="text-sm font-medium text-muted-foreground">Shortlist Probability</div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-8">
                                    {/* Section 1: Hiring Patterns */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-primary" />
                                                Company Hiring Patterns
                                            </h3>
                                            <Badge variant="outline" className="text-muted-foreground">Hiring Score: {patterns.hiringScore}/10</Badge>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <Card
                                                title="Hiring Activity"
                                                value={patterns.activityLevel || "Medium"}
                                                desc="Based on open roles this month"
                                                icon={<Briefcase className="w-4 h-4" />}
                                                highlight={patterns.activityLevel === "High"}
                                            />
                                            <Card
                                                title="Internship Phase"
                                                value={patterns.internshipPhase || "Open"}
                                                desc="Application window status"
                                                icon={<Clock className="w-4 h-4" />}
                                                highlight={patterns.internshipPhase === "Open"}
                                            />
                                            <Card
                                                title="Role Demand"
                                                value={patterns.roleDemand || "Stable"}
                                                desc="Trend vs last month"
                                                icon={<TrendingUp className="w-4 h-4" />}
                                                highlight={patterns.roleDemand === "Growing"}
                                            />
                                        </div>

                                        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                                            <div>
                                                <h4 className="font-medium mb-1">Hiring Trend (Last 6 Months)</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    📅 This company hires interns mostly in <strong>Feb–April</strong>.
                                                    Backend roles increased by <strong>30%</strong> this month.
                                                </p>
                                            </div>
                                            <div className="h-[200px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={patterns.trendData || []}>
                                                        <defs>
                                                            <linearGradient id="colorRoles" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                        <XAxis
                                                            dataKey="month"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="roles"
                                                            stroke="hsl(var(--primary))"
                                                            fillOpacity={1}
                                                            fill="url(#colorRoles)"
                                                            strokeWidth={3}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Candidate Comparison */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary" />
                                            Candidate Comparison
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Rank Card */}
                                            <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-center space-y-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground mb-1">Your Rank among 1,200+ peers</div>
                                                    <div className="text-4xl font-bold text-primary">Top {comparison.percentileRank}%</div>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        You rank higher than <strong>{100 - (comparison.percentileRank || 0)}%</strong> of candidates applying right now.
                                                    </p>
                                                </div>
                                                <div className="space-y-2 pt-2 border-t">
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span><strong>Positive Signal:</strong> People with {comparison.skillMatch?.[0]?.skill || "your skills"} had better results.</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Skill Chart */}
                                            <div className="bg-card border rounded-xl p-6 shadow-sm">
                                                <h4 className="font-medium mb-4 text-center">Skill Strength vs Peers</h4>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={comparison.skillMatch || []} layout="vertical" barSize={12} margin={{ left: 40 }}>
                                                            <XAxis type="number" hide domain={[0, 100]} />
                                                            <YAxis
                                                                dataKey="skill"
                                                                type="category"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                                                                width={80}
                                                            />
                                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                                            <Legend verticalAlign="top" height={36} />
                                                            <Bar dataKey="match" name="You" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                                            <Bar dataKey="peerAvg" name="Avg Peer" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="p-6 border-t bg-muted/30 flex justify-end gap-4">
                                <Button variant="outline" onClick={onClose}>Close</Button>
                                <Button className="w-full md:w-auto" onClick={() => window.open(job.applyUrl, '_blank')}>
                                    Apply Now
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

function Card({ title, value, desc, icon, highlight }: any) {
    return (
        <div className={`p-4 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {icon}
                {title}
            </div>
            <div className={`text-xl font-bold mb-1 ${highlight ? 'text-primary' : ''}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
    );
}
