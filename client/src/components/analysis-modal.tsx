import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Users, Activity, Briefcase } from "lucide-react";
import {
    ResponsiveContainer,
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-none rounded-none border-none bg-gradient-to-b from-background via-background to-muted/20 p-0 shadow-none flex flex-col overflow-hidden">
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
                                <h3 className="text-2xl font-bold">Analyzing job match...</h3>
                                <p className="text-muted-foreground">Calculating your fit for this role</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Header - Job Info Only */}
                            <div className="px-8 pt-6 pb-4 border-b bg-gradient-to-r from-muted/50 to-muted/30 flex items-center justify-between shrink-0">
                                <h2 className="text-3xl font-bold flex items-center gap-3">
                                    {job.company} 
                                    <Badge variant="secondary" className="text-xs font-medium">{job.title}</Badge>
                                </h2>
                                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <ScrollArea className="flex-1 w-full overflow-hidden">
                                <div className="w-full h-full px-8 py-8">
                                    <div className="space-y-12 max-w-6xl mx-auto pb-8">
                                    {/* Main Probability Card - Prominent */}
                                    <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="text-base font-bold text-primary uppercase tracking-widest">Your Shortlist Score</div>
                                        <div className="text-8xl font-black text-primary">{job.analysis.probability}%</div>
                                        <div className="text-lg text-muted-foreground max-w-xl">
                                            Based on your real profile, skills, and experience
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-primary/30 w-full">
                                            <p className="text-base text-muted-foreground font-medium">
                                                {job.analysis.probability >= 70 ? "✨ Strong fit - Apply now!" : job.analysis.probability >= 45 ? "👍 Decent fit - Worth exploring" : "💪 Challenging fit - Focus on gaps"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Analysis Breakdown - 4 Pillar Scores */}
                                    {job.analysis.factors && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                    <TrendingUp className="w-6 h-6 text-primary" />
                                                    Score Breakdown
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-6">How your profile stacks up across different dimensions</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <Card
                                                    title="Profile Match"
                                                    value={`${job.analysis.factors.profileMatch}%`}
                                                    desc="Experience fit"
                                                    icon={<Briefcase className="w-5 h-5" />}
                                                    highlight={job.analysis.factors.profileMatch > 60}
                                                />
                                                <Card
                                                    title="Skill Fit"
                                                    value={`${job.analysis.factors.skillFit}%`}
                                                    desc="Skills match"
                                                    icon={<Activity className="w-5 h-5" />}
                                                    highlight={job.analysis.factors.skillFit > 60}
                                                />
                                                <Card
                                                    title="Market Context"
                                                    value={`${job.analysis.factors.marketContext}%`}
                                                    desc="Market opportunity"
                                                    icon={<TrendingUp className="w-5 h-5" />}
                                                    highlight={job.analysis.factors.marketContext > 60}
                                                />
                                                <Card
                                                    title="Company Signals"
                                                    value={`${job.analysis.factors.companySignals}%`}
                                                    desc="Hiring activity"
                                                    icon={<Users className="w-5 h-5" />}
                                                    highlight={job.analysis.factors.companySignals > 60}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Strengths & Weaknesses */}
                                    {(job.analysis.strengths?.length > 0 || job.analysis.weaknesses?.length > 0) && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold">Your Profile Analysis</h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {job.analysis.strengths?.length > 0 && (
                                                    <div className="bg-gradient-to-br from-green-50/50 to-green-50/25 dark:from-green-950/30 dark:to-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-xl p-6">
                                                        <h4 className="font-bold mb-4 text-green-700 dark:text-green-400 flex items-center gap-2">
                                                            <span className="text-lg">✓</span> Your Strengths
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {job.analysis.strengths.map((str: string, i: number) => (
                                                                <li key={i} className="text-sm flex gap-3">
                                                                    <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">•</span>
                                                                    <span className="text-foreground">{str}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {job.analysis.weaknesses?.length > 0 && (
                                                    <div className="bg-gradient-to-br from-orange-50/50 to-orange-50/25 dark:from-orange-950/30 dark:to-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-xl p-6">
                                                        <h4 className="font-bold mb-4 text-orange-700 dark:text-orange-400 flex items-center gap-2">
                                                            <span className="text-lg">⚠</span> Areas to Improve
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {job.analysis.weaknesses.map((weak: string, i: number) => (
                                                                <li key={i} className="text-sm flex gap-3">
                                                                    <span className="text-orange-600 dark:text-orange-400 font-bold mt-0.5">•</span>
                                                                    <span className="text-foreground">{weak}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {job.analysis.actions?.length > 0 && (
                                        <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/25 dark:from-blue-950/30 dark:to-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-8 space-y-6">
                                            <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-3 text-lg">
                                                <span className="text-2xl">💡</span> Recommendations to Improve
                                            </h4>
                                            <ul className="space-y-4">
                                                {job.analysis.actions.map((action: string, i: number) => (
                                                    <li key={i} className="text-base flex gap-3">
                                                        <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">→</span>
                                                        <span className="text-foreground">{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="px-8 py-6 border-t bg-gradient-to-r from-muted/50 to-muted/30 flex justify-end gap-4 shrink-0">
                                <Button variant="outline" size="lg" onClick={onClose}>Close</Button>
                                <Button size="lg" className="px-10 font-semibold" onClick={() => window.open(job.applyUrl, '_blank')}>
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
        <div className={`p-6 rounded-2xl border-2 transition-all ${
            highlight 
                ? 'bg-primary/15 border-primary/60 shadow-lg' 
                : 'bg-muted/40 border-muted-foreground/20'
        }`}>
            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground mb-4">
                {icon}
                {title}
            </div>
            <div className={`text-4xl font-black mb-3 ${highlight ? 'text-primary' : 'text-foreground'}`}>
                {value}
            </div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    );
}
