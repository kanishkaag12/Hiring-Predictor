/**
 * What-If Simulator Service
 * 
 * Allows testing how changes to the user's profile affect shortlist probability
 * Supports:
 * 1. Adding new skills
 * 2. Removing skills
 * 3. Modifying skill levels
 * 
 * Returns comparison between baseline and projected scenarios
 */

import { ShortlistProbabilityService } from './shortlist-probability.service';
import { CandidateFeaturesService } from './candidate-features.service';
import { JobEmbeddingService } from './job-embedding.service';
import {
  CandidateProfile,
  WhatIfScenario,
  WhatIfResult,
} from '@shared/shortlist-types';

export class WhatIfSimulatorService {
  /**
   * Run What-If simulation
   * Computes baseline prediction, applies scenario changes, and computes new prediction
   */
  static async simulate(
    userId: string,
    jobId: string,
    scenario: WhatIfScenario
  ): Promise<WhatIfResult> {
    // Get baseline prediction
    const baselinePrediction = await ShortlistProbabilityService.predict(userId, jobId);

    // Get candidate profile
    const candidateProfile = await ShortlistProbabilityService.fetchCandidateProfile(userId);

    // Apply scenario changes to create modified profile
    const modifiedProfile = this.applyScenarioToProfile(candidateProfile, scenario);

    // Get job data
    const jobData = await ShortlistProbabilityService.fetchJob(jobId);

    // Get baseline strength and match
    const baselineStrength = await ShortlistProbabilityService.predictCandidateStrength(candidateProfile);
    const baselineMatch = await ShortlistProbabilityService.predictJobMatch(
      candidateProfile.skills.map(s => s.name),
      jobData
    );

    // Get projected strength and match
    const projectedStrength = await ShortlistProbabilityService.predictCandidateStrength(modifiedProfile);
    const projectedMatch = await ShortlistProbabilityService.predictJobMatch(
      modifiedProfile.skills.map(s => s.name),
      jobData
    );

    // Calculate probabilities using WEIGHTED SUM (same as predict method)
    const baselineProb = Math.max(0.05, Math.min(0.95, (0.3 * baselineStrength.score) + (0.7 * baselineMatch.score)));
    const projectedProb = Math.max(0.05, Math.min(0.95, (0.3 * projectedStrength.score) + (0.7 * projectedMatch.score)));

    return {
      baselineShortlistProbability: Math.round(baselineProb * 100),
      baselineCandidateStrength: Math.round(baselineStrength.score * 100),
      baselineJobMatchScore: Math.round(baselineMatch.score * 100),
      
      projectedShortlistProbability: Math.round(projectedProb * 100),
      projectedCandidateStrength: Math.round(projectedStrength.score * 100),
      projectedJobMatchScore: Math.round(projectedMatch.score * 100),
      
      probabilityDelta: Math.round((projectedProb - baselineProb) * 100),
      candidateStrengthDelta: Math.round((projectedStrength.score - baselineStrength.score) * 100),
      jobMatchDelta: Math.round((projectedMatch.score - baselineMatch.score) * 100),
      
      scenario,
      timestamp: new Date(),
    };
  }

  /**
   * Apply scenario changes to candidate profile
   */
  private static applyScenarioToProfile(
    originalProfile: CandidateProfile,
    scenario: WhatIfScenario
  ): CandidateProfile {
    // Deep copy the profile
    const modifiedProfile = JSON.parse(JSON.stringify(originalProfile)) as CandidateProfile;

    // Get current skills as a map for easier manipulation
    const skillsMap = new Map(
      modifiedProfile.skills.map(s => [s.name.toLowerCase(), s])
    );

    // Remove skills if specified
    if (scenario.removedSkills && scenario.removedSkills.length > 0) {
      for (const skillToRemove of scenario.removedSkills) {
        skillsMap.delete(skillToRemove.toLowerCase());
      }
    }

    // Add new skills if specified
    if (scenario.addedSkills && scenario.addedSkills.length > 0) {
      for (const skillToAdd of scenario.addedSkills) {
        const lowerSkill = skillToAdd.toLowerCase();
        if (!skillsMap.has(lowerSkill)) {
          skillsMap.set(lowerSkill, {
            name: skillToAdd,
            level: 'Intermediate', // Default level for added skills
          });
        }
      }
    }

    // Modify skill levels if specified
    if (scenario.modifiedSkills && scenario.modifiedSkills.length > 0) {
      for (const modifiedSkill of scenario.modifiedSkills) {
        const lowerSkill = modifiedSkill.name.toLowerCase();
        if (skillsMap.has(lowerSkill)) {
          skillsMap.get(lowerSkill)!.level = modifiedSkill.level;
        } else {
          // Add skill if it doesn't exist
          skillsMap.set(lowerSkill, {
            name: modifiedSkill.name,
            level: modifiedSkill.level,
          });
        }
      }
    }

    // Update profile with modified skills
    modifiedProfile.skills = Array.from(skillsMap.values());

    return modifiedProfile;
  }

  /**
   * Get recommendations for improving shortlist probability
   * Returns suggestions for skills to learn or improve
   */
  static async getRecommendations(
    userId: string,
    jobId: string
  ): Promise<{
    topSkillsToLearn: string[];
    skillsToImprove: string[];
    estimatedImpact: number; // Percentage point improvement
  }> {
    // Get baseline prediction
    const prediction = await ShortlistProbabilityService.predict(userId, jobId);

    // Get candidate profile and job
    const candidateProfile = await ShortlistProbabilityService.fetchCandidateProfile(userId);
    const jobData = await ShortlistProbabilityService.fetchJob(jobId);

    // Missing skills are the best targets
    const topSkillsToLearn = prediction.missingSkills.slice(0, 5);

    // Weak skills should be improved
    const skillsToImprove = prediction.weakSkills.slice(0, 3);

    // Estimate impact of learning top missing skill
    let estimatedImpact = 0;
    if (topSkillsToLearn.length > 0) {
      const scenario: WhatIfScenario = {
        jobId,
        addedSkills: [topSkillsToLearn[0]],
      };

      const result = await this.simulate(userId, jobId, scenario);
      estimatedImpact = result.probabilityDelta;
    }

    return {
      topSkillsToLearn,
      skillsToImprove,
      estimatedImpact,
    };
  }

  /**
   * Test multiple scenarios in parallel
   */
  static async simulateMultiple(
    userId: string,
    jobId: string,
    scenarios: WhatIfScenario[]
  ): Promise<WhatIfResult[]> {
    const results = await Promise.all(
      scenarios.map(scenario => this.simulate(userId, jobId, scenario))
    );
    return results;
  }

  /**
   * Find optimal skill combination to reach target probability
   */
  static async findOptimalSkills(
    userId: string,
    jobId: string,
    targetProbability: number
  ): Promise<{
    requiredSkills: string[];
    requiredLevel: string;
    estimatedTimeMonths: number;
  }> {
    // Get job requirements
    const jobData = await ShortlistProbabilityService.fetchJob(jobId);
    const requiredSkills = (jobData.skills as string[]) || [];

    // Get candidate profile
    const candidateProfile = await ShortlistProbabilityService.fetchCandidateProfile(userId);
    const userSkillNames = new Set(candidateProfile.skills.map(s => s.name.toLowerCase()));

    // Find missing critical skills
    const missingCritical = requiredSkills.filter(
      s => !userSkillNames.has(s.toLowerCase())
    );

    // Estimate learning time (simple heuristic)
    const estimatedTimeMonths = Math.max(
      1,
      Math.ceil(missingCritical.length * 2) // 2 months per skill
    );

    return {
      requiredSkills: missingCritical.slice(0, 3), // Top 3 priorities
      requiredLevel: 'Intermediate',
      estimatedTimeMonths,
    };
  }
}
