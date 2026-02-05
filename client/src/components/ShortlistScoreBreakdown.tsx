/**
 * Score Breakdown Component
 * 
 * Displays the individual components of the shortlist probability:
 * - Candidate Strength (ML: RandomForest)
 * - Job Match Score (ML: Sentence-BERT similarity)
 * - Final weighted combination
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Zap, Target } from 'lucide-react';
import type { ShortlistPrediction } from '@shared/shortlist-types';

interface ScoreBreakdownProps {
  prediction: ShortlistPrediction;
}

/**
 * Individual score card component
 */
function ScoreCard({
  title,
  score,
  max = 100,
  description,
  icon: Icon,
  color = 'blue',
}: {
  title: string;
  score: number;
  max?: number;
  description: string;
  icon: any;
  color?: 'blue' | 'green' | 'purple';
}) {
  const percentage = (score / max) * 100;
  
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: '#3b82f6' },
    green: { bg: 'bg-green-50', text: 'text-green-600', bar: '#10b981' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: '#a855f7' },
  };

  const colorConfig = colors[color];

  return (
    <Card className={colorConfig.bg}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${colorConfig.text}`} />
              <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{description}</p>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full`}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colorConfig.bar,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>0%</span>
                <span className={`font-bold ${colorConfig.text}`}>{score}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Score circle */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4" style={{ borderColor: colorConfig.bar }}>
              <span className="text-2xl font-bold" style={{ color: colorConfig.bar }}>
                {score}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShortlistScoreBreakdown({ prediction }: ScoreBreakdownProps) {
  // Prepare data for chart
  const chartData = [
    {
      name: 'Candidate Strength',
      value: prediction.candidateStrength,
      description: 'Your profile strength based on skills, experience, projects',
    },
    {
      name: 'Job Match',
      value: prediction.jobMatchScore,
      description: 'How well your skills match the job requirements',
    },
    {
      name: 'Final Probability',
      value: prediction.shortlistProbability,
      description: 'Weighted combination (40% strength + 60% match)',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Score Breakdown</h3>

      {/* Individual score cards */}
      <div className="space-y-3">
        <ScoreCard
          title="Candidate Strength"
          score={prediction.candidateStrength}
          description="Evaluated from your skills, experience, projects, and education"
          icon={Brain}
          color="blue"
        />

        <ScoreCard
          title="Job Match Score"
          score={prediction.jobMatchScore}
          description="Semantic similarity between your profile and job requirements"
          icon={Zap}
          color="green"
        />

        <ScoreCard
          title="Shortlist Probability"
          score={prediction.shortlistProbability}
          description="Final prediction: 40% strength + 60% job match (clamped 5-95%)"
          icon={Target}
          color="purple"
        />
      </div>

      {/* Visual breakdown chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                <Cell fill="#a855f7" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Formula explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-900">Calculation Formula</h4>
            <code className="text-sm text-blue-800 bg-blue-100 p-3 rounded block font-mono">
              shortlist_probability = clamp(
              <br />
              &nbsp;&nbsp;0.4 × candidate_strength +
              <br />
              &nbsp;&nbsp;0.6 × job_match_score,
              <br />
              &nbsp;&nbsp;min = 5%, max = 95%
              <br />
              )
            </code>
            <p className="text-xs text-blue-700 mt-2">
              The formula prevents zero collapse by ensuring minimum 5% and maximum 95% probability,
              giving meaningful signals even when both metrics are low.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
