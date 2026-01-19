import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Briefcase,
  Building2,
  Clock,
  ExternalLink,
  MapPin,
  TrendingUp,
  BrainCircuit,
  TrendingDown,
  Minus
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AnalysisModal } from "./analysis-modal";

interface JobCardProps {
  job: any;
}

/* ---------------- APPLY SIGNAL UI ---------------- */

function getApplySignalUI(signal?: string) {
  switch (signal) {
    case "GOOD":
      return {
        text: "Good time to apply",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "SOON":
      return {
        text: "Apply soon",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    case "WAIT":
      return {
        text: "Wait / low priority",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
    default:
      return null;
  }
}

/* ---------------- JOB CARD ---------------- */

export default function JobCard({ job }: JobCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  // ✅ SAFELY read analysis
  const analysis = job.analysis ?? null;

  const applySignalUI = getApplySignalUI(
    analysis?.applySignal ?? job.applySignal
  );

  const probability =
    analysis?.probability ?? job.probability ?? null;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75)
      return "bg-emerald-500/15 text-emerald-600 border-emerald-500/20";
    if (prob >= 50)
      return "bg-amber-500/15 text-amber-600 border-amber-500/20";
    return "bg-rose-500/15 text-rose-600 border-rose-500/20";
  };

  const getSignalIcon = (signal: string) => {
    if (signal === "Surge")
      return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (signal === "Slowdown")
      return <TrendingDown className="h-3 w-3 text-rose-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className="flex flex-col h-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4" />

      <CardHeader className="p-5 pb-2 space-y-2">
        {/* Apply Signal Badge */}
        {applySignalUI && (
          <Badge
            variant="outline"
            className={cn("w-fit text-xs font-medium", applySignalUI.className)}
          >
            {applySignalUI.text}
          </Badge>
        )}

        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-sm border border-border">
              {job.logo ?? job.company?.[0] ?? "J"}
            </div>

            <div>
              <h3 className="font-display font-semibold text-lg leading-none mb-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>

              {/* Company Metadata */}
              <div className="flex flex-wrap gap-2 mt-1">
                {job.companyType && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-accent text-accent-foreground border-transparent">
                    {job.companyType}
                  </Badge>
                )}
                {job.companyTags && job.companyTags.map((tag: string) => (
                  <span key={tag} className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5 border border-transparent">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Probability */}
          {typeof probability === "number" && (
            <Badge
              variant="outline"
              className={cn(
                "ml-auto font-mono",
                getProbabilityColor(probability)
              )}
            >
              {probability}% Chance
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3 flex-1">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          {job.hiringSignal && (
            <span className="flex items-center gap-1 bg-accent/50 px-2 py-1 rounded">
              {getSignalIcon(job.hiringSignal)} {job.hiringSignal}
            </span>
          )}
          {job.location && <span>{job.location}</span>}
          {job.salary && <span>{job.salary}</span>}
        </div>

        {job.applicants && (
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Competition: <span className="font-mono text-foreground">{job.applicants}</span> applicants
            </span>
            {job.companySizeTag && (
              <span className="opacity-70 italic text-[10px]">Est. {job.companySizeTag}</span>
            )}
          </p>
        )}

        {/* Transparency / Source Info */}
        <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
          {job.hiringPlatform && (
            <div className="flex items-center gap-1.5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title={`Verified job from ${job.hiringPlatform} board`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium tracking-tight">Hiring via {job.hiringPlatform}</span>
            </div>
          )}
          <span className="text-[9px] text-muted-foreground/60 italic leading-none max-w-[120px]">
            Sourced from verified hiring systems
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-2 mt-auto">
        <Button
          variant="outline"
          className="w-full h-11 justify-center gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
          onClick={() => setShowAnalysis(true)}
        >
          <BrainCircuit className="w-4 h-4 group-hover:text-primary transition-colors" />
          Analyze My Chances
        </Button>
        <Button
          className="w-full h-11 justify-center gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all duration-200"
          onClick={() => window.open(job.applyUrl, '_blank')}
        >
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </Button>

        <AnalysisModal
          isOpen={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          job={job}
        />
      </CardFooter>
    </Card>
  );
}

