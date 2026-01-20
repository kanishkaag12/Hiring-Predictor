import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Hammer, Zap } from "lucide-react";

interface ActionStep {
    type: "improve" | "warning" | "skill";
    text: string;
    impact?: string;
}

interface ActionableStepsProps {
    steps: ActionStep[];
}

export function ActionableSteps({ steps }: ActionableStepsProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case "improve": return <Hammer className="w-5 h-5 text-blue-400" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case "skill": return <Zap className="w-5 h-5 text-emerald-400" />;
            default: return <CheckCircle2 className="w-5 h-5 text-primary" />;
        }
    };

    const getBg = (type: string) => {
        switch (type) {
            case "improve": return "bg-blue-500/5 border-blue-500/10";
            case "warning": return "bg-amber-500/5 border-amber-500/10";
            case "skill": return "bg-emerald-500/5 border-emerald-500/10";
            default: return "bg-primary/5 border-primary/10";
        }
    };

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Actionable Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-4 p-4 rounded-2xl border ${getBg(step.type)} hover:scale-[1.02] transition-transform cursor-pointer group`}
                    >
                        <div className="mt-0.5">{getIcon(step.type)}</div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                                {step.text}
                            </p>
                            {step.impact && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    <span className="bg-primary/20 px-1.5 py-0.5 rounded">Impact {step.impact}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
}
