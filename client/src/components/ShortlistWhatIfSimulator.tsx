/**
 * What-If Simulator Component
 * 
 * Allows testing how changes to the user's profile affect shortlist probability:
 * - Add new skills (with auto-detection of what to add based on job)
 * - Improve skill levels (Beginner → Intermediate → Advanced)
 * - See real ML recomputation results
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  X,
  TrendingUp,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useWhatIfSimulator } from '@/hooks/useShortlistProbability';
import type { ShortlistPrediction, WhatIfScenario } from '@shared/shortlist-types';
import { cn } from '@/lib/utils';

interface WhatIfSimulatorProps {
  jobId: string;
  currentPrediction: ShortlistPrediction;
}

/**
 * Component to build What-If scenarios
 */
function ScenarioBuilder({
  jobId,
  currentPrediction,
  onSimulate,
  isLoading,
}: {
  jobId: string;
  currentPrediction: ShortlistPrediction;
  onSimulate: (jobId: string, scenario: WhatIfScenario) => void;
  isLoading: boolean;
}) {
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [improvementLevel, setImprovementLevel] = useState<
    'Beginner' | 'Intermediate' | 'Advanced'
  >('Intermediate');

  const handleAddSkill = () => {
    if (newSkill.trim() && !addedSkills.includes(newSkill.trim())) {
      setAddedSkills([...addedSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setAddedSkills(addedSkills.filter((s) => s !== skill));
  };

  const handleSimulate = () => {
    const scenario: WhatIfScenario = {
      jobId,
      addedSkills: addedSkills.length > 0 ? addedSkills : undefined,
    };
    onSimulate(jobId, scenario);
  };

  return (
    <div className="space-y-4">
      {/* Add Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Test how learning new skills would improve your chances for this role.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Enter a skill (e.g., Docker, React, SQL)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button onClick={handleAddSkill} size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested missing skills */}
          {currentPrediction.missingSkills.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Quick add (missing skills):</p>
              <div className="flex flex-wrap gap-2">
                {currentPrediction.missingSkills.slice(0, 5).map((skill) => (
                  <Button
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!addedSkills.includes(skill)) {
                        setAddedSkills([...addedSkills, skill]);
                      }
                    }}
                  >
                    + {skill}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Added skills list */}
          {addedSkills.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Skills to add ({addedSkills.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {addedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Simulate button */}
          <Button
            onClick={handleSimulate}
            disabled={addedSkills.length === 0 || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading
              ? 'Running What-If Simulation...'
              : 'See Impact on Probability'}
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Tip</h4>
          <p className="text-sm text-blue-800">
            The simulator reruns the ML models with your changes to show the
            ACTUAL impact, not an estimate. See exactly how much each skill
            improves your chances.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Component to display What-If results
 */
function WhatIfResults({
  baseline,
  projected,
}: {
  baseline: ShortlistPrediction;
  projected: any;
}) {
  const probDelta = projected.projectedShortlistProbability - baseline.shortlistProbability;
  const strengthDelta = projected.projectedCandidateStrength - baseline.candidateStrength;
  const matchDelta = projected.projectedJobMatchScore - baseline.jobMatchScore;

  const isPositive = probDelta >= 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Simulation Results</h3>

      {/* Main probability comparison */}
      <Card className={isPositive ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Baseline */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current</p>
              <div className="text-3xl font-bold text-gray-900">
                {baseline.shortlistProbability}%
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <TrendingUp
                className={cn(
                  'w-8 h-8',
                  isPositive ? 'text-green-600' : 'text-orange-600'
                )}
              />
            </div>

            {/* Projected */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">After Changes</p>
              <div className={cn(
                'text-3xl font-bold',
                isPositive ? 'text-green-700' : 'text-orange-700'
              )}>
                {projected.projectedShortlistProbability}%
              </div>
            </div>
          </div>

          {/* Delta */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Change</p>
            <p
              className={cn(
                'text-2xl font-bold',
                isPositive
                  ? 'text-green-700'
                  : 'text-orange-700'
              )}
            >
              {isPositive ? '+' : ''}{probDelta}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 gap-3">
        {/* Candidate Strength */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Candidate Strength</p>
                <p className="text-xs text-gray-600">Your profile strength</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">
                  {baseline.candidateStrength}% → {projected.projectedCandidateStrength}%
                </p>
                <p className={cn(
                  'text-sm font-bold',
                  strengthDelta >= 0 ? 'text-green-600' : 'text-gray-600'
                )}>
                  {strengthDelta >= 0 ? '+' : ''}{strengthDelta}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Match */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Job Match Score</p>
                <p className="text-xs text-gray-600">Skill alignment with job</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">
                  {baseline.jobMatchScore}% → {projected.projectedJobMatchScore}%
                </p>
                <p className={cn(
                  'text-sm font-bold',
                  matchDelta >= 0 ? 'text-green-600' : 'text-gray-600'
                )}>
                  {matchDelta >= 0 ? '+' : ''}{matchDelta}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interpretation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900">What This Means</h4>
            <p className="text-sm text-blue-800">
              {isPositive && probDelta > 20 && (
                <>
                  <strong>Major Impact!</strong> Adding these skills would significantly boost your chances.
                  This is a high-impact improvement strategy.
                </>
              )}
              {isPositive && probDelta <= 20 && probDelta > 0 && (
                <>
                  <strong>Good Progress.</strong> These skills would moderately improve your profile.
                  Consider combining with other improvements.
                </>
              )}
              {probDelta === 0 && (
                <>
                  <strong>No Change.</strong> These skills don't align with this job's requirements.
                  Try adding different skills from the "Missing Skills" section.
                </>
              )}
              {!isPositive && (
                <>
                  <strong>Note:</strong> This scenario doesn't improve your probability for this specific role.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ShortlistWhatIfSimulator({
  jobId,
  currentPrediction,
}: WhatIfSimulatorProps) {
  const { result, isLoading, error, simulate, reset } = useWhatIfSimulator();

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900">Simulation Error</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {!result ? (
        <ScenarioBuilder
          jobId={jobId}
          currentPrediction={currentPrediction}
          onSimulate={simulate}
          isLoading={isLoading}
        />
      ) : (
        <>
          <WhatIfResults
            baseline={currentPrediction}
            projected={result}
          />

          <Button
            onClick={() => reset()}
            variant="outline"
            className="w-full"
          >
            Run Another Simulation
          </Button>
        </>
      )}
    </div>
  );
}
