/**
 * Missing & Weak Skills Component
 * 
 * Displays:
 * - Skills matched with the job
 * - Skills that are missing from the user's profile
 * - Skills that exist but are at beginner level (weak)
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

interface MissingSkillsProps {
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
}

export function ShortlistMissingSkills({
  matchedSkills,
  missingSkills,
  weakSkills,
}: MissingSkillsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Skills Analysis</h3>

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Matched Skills ({matchedSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  ✓ {skill}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-green-700 mt-3">
              Great! You have {matchedSkills.length} skill{matchedSkills.length !== 1 ? 's' : ''} that match this role.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Missing Skills ({missingSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {missingSkills.slice(0, 8).map((skill) => (
                <Badge key={skill} variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  ✗ {skill}
                </Badge>
              ))}
              {missingSkills.length > 8 && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  +{missingSkills.length - 8} more
                </Badge>
              )}
            </div>
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Priority to Learn:</strong> Most shortlisted candidates for this role have{' '}
                <strong>{missingSkills.slice(0, 3).join(', ')}</strong> experience.
                Consider acquiring these skills to improve your chances.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak Skills */}
      {weakSkills.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Skills to Improve ({weakSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {weakSkills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  ⚠ {skill} (Beginner)
                </Badge>
              ))}
              {weakSkills.length > 6 && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  +{weakSkills.length - 6} more
                </Badge>
              )}
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                You have these skills but they're at beginner level. Advancing from{' '}
                <strong>Beginner → Intermediate</strong> can significantly improve your match score.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gap Summary */}
      {(missingSkills.length > 0 || weakSkills.length > 0) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900">How to Improve</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>
                  <strong>1. Learn Missing Skills:</strong> Pick the top 2-3 missing skills
                  ({missingSkills.slice(0, 2).join(', ')}) and spend 4-8 weeks learning them.
                </li>
                {weakSkills.length > 0 && (
                  <li>
                    <strong>2. Deepen Existing Skills:</strong> Advance{' '}
                    {weakSkills.slice(0, 2).join(', ')} from Beginner to Intermediate through projects.
                  </li>
                )}
                <li>
                  <strong>{weakSkills.length > 0 ? '3' : '2'}. Build Projects:</strong> Create portfolio projects using
                  the newly learned skills to demonstrate practical experience.
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No gaps */}
      {missingSkills.length === 0 && weakSkills.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Perfect Match!</p>
              <p className="text-sm text-green-800">
                You have all the required skills. Your strong profile makes you a competitive
                candidate for this role. Apply now!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
