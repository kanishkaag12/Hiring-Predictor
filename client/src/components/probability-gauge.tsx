import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProbabilityGaugeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export default function ProbabilityGauge({ score, size = "md", className, showLabel = true }: ProbabilityGaugeProps) {
  // Determine color based on score
  let colorClass = "text-red-500";
  let bgClass = "bg-red-500/10";
  let strokeClass = "stroke-red-500";
  
  if (score >= 70) {
    colorClass = "text-emerald-500";
    bgClass = "bg-emerald-500/10";
    strokeClass = "stroke-emerald-500";
  } else if (score >= 40) {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-500/10";
    strokeClass = "stroke-amber-500";
  }

  const sizes = {
    sm: { width: 60, stroke: 4, text: "text-sm" },
    md: { width: 120, stroke: 8, text: "text-3xl" },
    lg: { width: 200, stroke: 12, text: "text-5xl" },
  };

  const { width, stroke, text } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  // Arc logic for semi-circle gauge could be used, but full circle is cleaner for dashboard
  // Let's do a 3/4 circle open at bottom
  
  const dashArray = circumference;
  const dashOffset = circumference - ((score / 100) * circumference);

  return (
    <div className={cn("flex flex-col items-center justify-center relative", className)}>
      <div className="relative" style={{ width, height: width }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
          />
          {/* Progress Circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            className={strokeClass}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={cn("font-mono font-bold tracking-tighter", text, colorClass)}
          >
            {score}%
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
          Shortlist Prob.
        </span>
      )}
    </div>
  );
}