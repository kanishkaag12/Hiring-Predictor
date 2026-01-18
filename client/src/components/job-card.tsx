import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

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
  const getProbabilityColor = (prob: number) => {
    if (prob >= 75)
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (prob >= 50)
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
  };

  const getSignalIcon = (signal: string) => {
    if (signal === "Surge")
      return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (signal === "Slowdown")
      return <TrendingDown className="h-3 w-3 text-rose-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const applySignal = getApplySignalUI(job.applySignal);

  return (
    <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden relative">
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 duration-500"
        )}
      />

      <CardHeader className="p-5 pb-2 space-y-2">
        {/* Apply signal badge */}
        {applySignal && (
          <Badge
            variant="outline"
            className={cn(
              "w-fit text-xs font-medium",
              applySignal.className
            )}
          >
            {applySignal.text}
          </Badge>
        )}

        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-sm border border-border">
              {job.logo ?? job.company?.[0]}
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg leading-none mb-1 group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>

          {job.probability && (
            <Badge
              variant="outline"
              className={cn(
                "ml-auto font-mono",
                getProbabilityColor(job.probability)
              )}
            >
              {job.probability}% Chance
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
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
          <p className="text-xs text-muted-foreground">
            Competition:{" "}
            <span className="font-mono text-foreground">
              {job.applicants}
            </span>{" "}
            applicants
          </p>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link href={`/jobs/${job.id}`}>
          <Button className="w-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm group-hover:shadow-md transition-all">
            Analyze My Odds <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
