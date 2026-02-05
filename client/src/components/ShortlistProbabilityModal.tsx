/**
 * Shortlist Probability Modal Component
 * 
 * Displays:
 * 1. Final shortlist probability with visual gauge
 * 2. Score breakdown (candidate strength + job match)
 * 3. Missing/weak skills (ML-driven explanations)
 * 4. Improvement roadmap
 * 5. What-If simulator for testing improvements
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShortlistPrediction } from '@shared/shortlist-types';
import { useShortlistPrediction, useWhatIfSimulator } from '@/hooks/useShortlistProbability';
import { ShortlistScoreBreakdown, ShortlistMissingSkills, ShortlistWhatIfSimulator } from '@/components';

interface ShortlistProbabilityModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Probability gauge component that visually represents shortlist probability
 */
function ProbabilityGauge({ percentage }: { percentage: number }) {
  const getColor = (prob: number) => {
    if (prob >= 75) return 'from-green-400 to-green-600';
    if (prob >= 50) return 'from-yellow-400 to-yellow-600';
    if (prob >= 25) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getLabel = (prob: number) => {
    if (prob >= 75) return '🟢 Strong Chance';
    if (prob >= 50) return '🟡 Moderate Chance';
    if (prob >= 25) return '🟠 Low Chance';
    return '🔴 Very Low Chance';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        {/* Outer circle (background) */}
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 90 * (percentage / 100)} ${
              2 * Math.PI * 90
            }`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {percentage >= 75 ? (
                <>
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#16a34a" />
                </>
              ) : percentage >= 50 ? (
                <>
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </>
              ) : percentage >= 25 ? (
                <>
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#d97706" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-sm text-gray-600 mt-1">Probability</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-lg font-semibold text-gray-800">
          {getLabel(percentage)}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {percentage >= 75
            ? "You have a strong chance of getting shortlisted. Consider applying!"
            : percentage >= 50
            ? "You have a reasonable chance. Fill the gaps below to improve."
            : percentage >= 25
            ? "Low probability. Focus on acquiring the missing skills."
            : "Very low probability with current profile. Significant improvements needed."}
        </p>
      </div>
    </div>
  );
}

export function ShortlistProbabilityModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
}: ShortlistProbabilityModalProps) {
  const { prediction, isLoading, error, predict } = useShortlistPrediction();
  const [activeTab, setActiveTab] = useState<'overview' | 'whatif'>('overview');

  // Load prediction on modal open
  useEffect(() => {
    if (isOpen) {
      predict(jobId);
    }
  }, [isOpen, jobId, predict]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Analyze My Chances: {jobTitle}
          </DialogTitle>
          <DialogDescription>
            AI-powered prediction of your shortlist probability before applying
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Running ML prediction...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">Error</div>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {prediction && !isLoading && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'px-4 py-2 font-medium transition-colors',
                    activeTab === 'overview'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('whatif')}
                  className={cn(
                    'px-4 py-2 font-medium transition-colors',
                    activeTab === 'whatif'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  What-If Simulator
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Probability Gauge */}
                  <Card>
                    <CardContent className="pt-6">
                      <ProbabilityGauge percentage={prediction.shortlistProbability} />
                    </CardContent>
                  </Card>

                  {/* Score Breakdown */}
                  <ShortlistScoreBreakdown prediction={prediction} />

                  {/* Missing & Weak Skills */}
                  {(prediction.missingSkills.length > 0 ||
                    prediction.weakSkills.length > 0) && (
                    <ShortlistMissingSkills
                      missingSkills={prediction.missingSkills}
                      weakSkills={prediction.weakSkills}
                      matchedSkills={prediction.matchedSkills}
                    />
                  )}

                  {/* Improvements */}
                  {prediction.improvements && prediction.improvements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          Improvement Roadmap
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-3">
                          {prediction.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">
                                {improvement}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'whatif' && (
                <ShortlistWhatIfSimulator
                  jobId={jobId}
                  currentPrediction={prediction}
                />
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
