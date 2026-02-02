import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, Users, Activity, Briefcase, AlertCircle, Zap } from "lucide-react";
import {
    ResponsiveContainer,
} from "recharts";
import { JobWhatIfSimulator } from "./JobWhatIfSimulator";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentUser } from "@/hooks/useAuth";

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
}

export function AnalysisModal({ isOpen, onClose, job }: AnalysisModalProps) {
    const [stage, setStage] = useState<"analyzing" | "complete">("analyzing");
    const [mlPrediction, setMlPrediction] = useState<any>(null);
    const [mlLoading, setMlLoading] = useState(false);
    const { profile } = useProfile();
    const { data: user } = useCurrentUser();

    // Fetch ML prediction when modal opens
    useEffect(() => {
        if (isOpen && user?.id && job?.id) {
            setStage("analyzing");
            setMlLoading(true);
            
            // Call the ML API for real prediction
            fetch('/api/shortlist/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: user.id,
                    jobId: job.id
                })
            })
            .then(res => res.json())
            .then(data => {
                console.log('[ML Prediction] Received:', data);
                setMlPrediction(data.prediction);
                setMlLoading(false);
                // Show results after brief delay for UX
                setTimeout(() => setStage("complete"), 1500);
            })
            .catch(error => {
                console.error('[ML Prediction] Error:', error);
                setMlLoading(false);
                // Fall back to old analysis if ML fails
                setTimeout(() => setStage("complete"), 1500);
            });
        } else if (isOpen) {
            // No user or job, show old analysis
            setStage("analyzing");
            setTimeout(() => setStage("complete"), 2500);
        }
    }, [isOpen, user?.id, job?.id]);

    // Use ML prediction if available, otherwise fall back to old analysis
    const probability = mlPrediction
        ? mlPrediction.shortlistProbability
        : job.analysis.probability;

    // Helper function to interpret score and generate microcopy
    const getScoreInterpretation = (probability: number) => {
        if (probability >= 70) {
            return {
                emoji: "🌟",
                label: "Strong Match",
                recommendation: "Highly Recommended to Apply",
                description: "You meet most of the core requirements. Your chances of getting shortlisted are strong.",
                color: "from-green-500/20 to-green-500/5 border-green-500/50"
            };
        } else if (probability >= 50) {
            return {
                emoji: "👍",
                label: "Good Match",
                recommendation: "Recommended to Apply",
                description: "You have solid fundamentals. Applying is worth it—focus on highlighting your strengths.",
                color: "from-blue-500/20 to-blue-500/5 border-blue-500/50"
            };
        } else if (probability >= 30) {
            return {
                emoji: "⚠️",
                label: "Moderate Match",
                recommendation: "Consider Preparing First",
                description: "You have potential but would benefit from filling some skill gaps before applying.",
                color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/50"
            };
        } else {
            return {
                emoji: "❌",
                label: "Challenging Match",
                recommendation: "Focus on Building Skills",
                description: "This role requires expertise you're still developing. Build skills first, then apply.",
                color: "from-red-500/20 to-red-500/5 border-red-500/50"
            };
        }
    };

    // Helper to find weakest factor
    const getWeakestFactor = () => {
        if (!job.analysis.factors) return null;
        const factors = [
            { name: "Skill Fit", value: job.analysis.factors.skillFit },
            { name: "Profile Match", value: job.analysis.factors.profileMatch },
            { name: "Market Context", value: job.analysis.factors.marketContext },
            { name: "Company Signals", value: job.analysis.factors.companySignals }
        ];
        return factors.reduce((min, f) => f.value < min.value ? f : min);
    };

    // Helper to get factor priority color
    const getFactorColor = (value: number) => {
        if (value < 40) return "from-red-500/20 to-red-500/5 border-red-500/50 bg-red-500/10";
        if (value < 60) return "from-yellow-500/20 to-yellow-500/5 border-yellow-500/50 bg-yellow-500/10";
        return "from-green-500/20 to-green-500/5 border-green-500/50 bg-green-500/10";
    };

    const getFactorLabel = (value: number) => {
        if (value < 40) return "🔴 Critical Gap";
        if (value < 60) return "🟡 Improve";
        return "🟢 Strong";
    };

    const scoreData = getScoreInterpretation(probability);
    const weakestFactor = getWeakestFactor();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl border-2 border-primary/30 bg-linear-to-b from-background via-background to-muted/20 p-0 shadow-2xl flex flex-col overflow-hidden">
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
                            className="flex flex-col h-screen w-full"
                        >
                            {/* Header - Job Info Only */}
                            <div className="px-8 pt-6 pb-4 border-b bg-linear-to-r from-background to-muted/20 flex items-center justify-between shrink-0">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    {job.company} 
                                    <Badge variant="secondary" className="text-xs font-medium">{job.title}</Badge>
                                </h2>
                            </div>

                            <ScrollArea className="flex-1 w-full">
                                <div className="w-full px-8 py-8">
                                    <div className="space-y-12 max-w-6xl mx-auto pb-20">
                                    {/* Main Probability Card - Decision Zone */}
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`bg-linear-to-br ${scoreData.color} border-2 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 w-full`}
                                    >
                                        <div className="text-2xl font-black text-primary uppercase tracking-widest">YOUR SHORTLIST SCORE</div>
                                        <div className="text-7xl font-black text-primary">
                                            {mlLoading ? (
                                                <span className="animate-pulse">...</span>
                                            ) : (
                                                `${probability}%`
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2 pt-4">
                                            <div className="text-xl font-bold text-foreground">
                                                {scoreData.emoji} {scoreData.label}
                                            </div>
                                            <div className="text-base font-semibold text-primary">
                                                {scoreData.recommendation}
                                            </div>
                                            <p className="text-sm text-muted-foreground max-w-lg">
                                                {scoreData.description}
                                            </p>
                                        </div>

                                        {/* ML Prediction Details */}
                                        {mlPrediction && (
                                            <div className="pt-4 text-xs text-muted-foreground flex items-center gap-2">
                                                <Zap className="w-3 h-3" />
                                                <span>Powered by Machine Learning (RandomForest + SBERT)</span>
                                            </div>
                                        )}

                                        {/* Benchmark Context */}
                                        <div className="pt-6 border-t border-primary/30 w-full space-y-2">
                                            <div className="text-xs text-muted-foreground">Context</div>
                                            <div className="flex justify-around text-sm">
                                                <div>
                                                    <div className="font-bold text-foreground">{probability}%</div>
                                                    <div className="text-xs text-muted-foreground">Your Score</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">72%</div>
                                                    <div className="text-xs text-muted-foreground">Avg Shortlisted</div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">35%</div>
                                                    <div className="text-xs text-muted-foreground">Avg Applicants</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Biggest Gap - ML-Driven Diagnostic Section */}
                                    {mlPrediction?.improvements && mlPrediction.improvements.length > 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-linear-to-br from-orange-500/20 to-orange-500/5 border-2 border-orange-500/50 rounded-2xl p-6 space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                                <h3 className="font-bold text-lg">What's Holding You Back</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {mlPrediction.improvements.map((improvement, idx) => (
                                                    <div key={idx} className="flex gap-3 items-start">
                                                        <Zap className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                                        <span className="text-sm">{improvement}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-orange-500/30 text-sm text-muted-foreground">
                                                💡 These suggestions are based on ML analysis of your profile vs. job requirements
                                            </div>
                                        </motion.div>
                                    ) : weakestFactor && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`bg-linear-to-br ${getFactorColor(weakestFactor.value)} border-2 rounded-2xl p-6 space-y-4`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                <h3 className="font-bold text-lg">What's Holding You Back</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">{weakestFactor.name}</span>
                                                    <span className="text-sm font-bold">{getFactorLabel(weakestFactor.value)}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all"
                                                        style={{ width: `${weakestFactor.value}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-muted-foreground pt-2">
                                                    {weakestFactor.name === "Skill Fit" && "You're missing expertise in specialized areas. Most candidates for this role have advanced knowledge here."}
                                                    {weakestFactor.name === "Profile Match" && "Your experience level differs from typical candidates. Consider roles better aligned with your seniority."}
                                                    {weakestFactor.name === "Market Context" && "Market conditions affect your chances. But don't let this discourage you—applying is still worth it."}
                                                    {weakestFactor.name === "Company Signals" && "This company isn't actively hiring for your profile. But strong candidates still get opportunities."}
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-muted flex gap-3">
                                                <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                                                <div className="text-sm">
                                                    <span className="font-semibold">Opportunity:</span> Improving {weakestFactor.name.toLowerCase()} could boost your score by <span className="text-primary font-bold">+12-16%</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Analysis Breakdown - ML-Driven Scores */}
                                    {mlPrediction ? (
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                                                    <TrendingUp className="w-7 h-7 text-primary" />
                                                    Full Score Breakdown
                                                </h3>
                                                <p className="text-base text-muted-foreground">ML-powered analysis of your profile</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <Card
                                                    title="Candidate Strength"
                                                    value={`${mlPrediction.candidateStrength}%`}
                                                    desc="RandomForest prediction of your profile quality"
                                                    icon={<Briefcase className="w-6 h-6" />}
                                                    highlight={mlPrediction.candidateStrength > 50}
                                                />
                                                <Card
                                                    title="Job Match"
                                                    value={`${mlPrediction.jobMatchScore}%`}
                                                    desc="SBERT similarity: your skills vs job requirements"
                                                    icon={<Activity className="w-6 h-6" />}
                                                    highlight={mlPrediction.jobMatchScore > 50}
                                                />
                                            </div>
                                        </div>
                                    ) : job.analysis.factors && (
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                                                    <TrendingUp className="w-7 h-7 text-primary" />
                                                    Full Score Breakdown
                                                </h3>
                                                <p className="text-base text-muted-foreground">How your profile scores across all dimensions</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <Card
                                                    title="Profile Match"
                                                    value={`${job.analysis.factors.profileMatch}%`}
                                                    desc="Experience fit"
                                                    icon={<Briefcase className="w-6 h-6" />}
                                                    highlight={job.analysis.factors.profileMatch > 60}
                                                />
                                                <Card
                                                    title="Skill Fit"
                                                    value={`${job.analysis.factors.skillFit}%`}
                                                    desc="Skills match"
                                                    icon={<Activity className="w-6 h-6" />}
                                                    highlight={job.analysis.factors.skillFit > 60}
                                                />
                                                <Card
                                                    title="Market Context"
                                                    value={`${job.analysis.factors.marketContext}%`}
                                                    desc="Market opportunity"
                                                    icon={<TrendingUp className="w-6 h-6" />}
                                                    highlight={job.analysis.factors.marketContext > 60}
                                                />
                                                <Card
                                                    title="Company Signals"
                                                    value={`${job.analysis.factors.companySignals}%`}
                                                    desc="Hiring activity"
                                                    icon={<Users className="w-6 h-6" />}
                                                    highlight={job.analysis.factors.companySignals > 60}
                                                />
                                            </div>
                                        </div>
                                    )}



                                    {/* What-If Simulator for this specific job */}
                                    {profile && (
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-2xl font-bold mb-3 flex items-center gap-3">
                                                    <Zap className="w-7 h-7 text-primary" />
                                                    Improvement Roadmap
                                                </h3>
                                                <p className="text-base text-muted-foreground">Learn specific skills to boost your chances for this role</p>
                                            </div>
                                            <JobWhatIfSimulator 
                                                job={job} 
                                                userProfile={profile}
                                                currentScore={job.analysis.probability}
                                            />
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {job.analysis.actions?.length > 0 && (
                                        <div className="bg-linear-to-br from-blue-50/50 to-blue-50/25 dark:from-blue-950/30 dark:to-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-8 space-y-6">
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
