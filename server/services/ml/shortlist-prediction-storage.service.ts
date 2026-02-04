/**
 * Shortlist Predictions Database Service
 * 
 * Handles storing and retrieving shortlist predictions for:
 * - User analytics and history
 * - Tracking improvement over time
 * - What-if scenario logging
 */

import { randomUUID } from 'crypto';
import { pool } from '../../storage';
import type { ShortlistPrediction, WhatIfResult } from '@shared/shortlist-types';

export interface StoredPrediction {
  id: string;
  userId: string;
  jobId: string;
  shortlistProbability: number;
  candidateStrength: number;
  jobMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  improvements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredWhatIfResult {
  id: string;
  userId: string;
  jobId: string;
  baselineProbability: number;
  baselineCandidateStrength: number;
  baselineJobMatch: number;
  projectedProbability: number;
  projectedCandidateStrength: number;
  projectedJobMatch: number;
  probabilityDelta: number;
  candidateStrengthDelta: number;
  jobMatchDelta: number;
  scenarioAddedSkills?: string[];
  scenarioRemovedSkills?: string[];
  scenarioModifiedSkills?: Array<{ name: string; level: string }>;
  createdAt: Date;
}

export class ShortlistPredictionStorage {
  /**
   * Store a shortlist prediction in the database
   */
  static async storePrediction(
    userId: string,
    prediction: ShortlistPrediction
  ): Promise<StoredPrediction> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO shortlist_predictions (
        id,
        user_id,
        job_id,
        shortlist_probability,
        candidate_strength,
        job_match_score,
        matched_skills,
        missing_skills,
        weak_skills,
        improvements,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, job_id) DO UPDATE SET
        shortlist_probability = EXCLUDED.shortlist_probability,
        candidate_strength = EXCLUDED.candidate_strength,
        job_match_score = EXCLUDED.job_match_score,
        matched_skills = EXCLUDED.matched_skills,
        missing_skills = EXCLUDED.missing_skills,
        weak_skills = EXCLUDED.weak_skills,
        improvements = EXCLUDED.improvements,
        updated_at = EXCLUDED.updated_at
    `;

    const values = [
      id,
      userId,
      prediction.jobId,
      prediction.shortlistProbability,
      prediction.candidateStrength,
      prediction.jobMatchScore,
      JSON.stringify(prediction.matchedSkills || []),
      JSON.stringify(prediction.missingSkills || []),
      JSON.stringify(prediction.weakSkills || []),
      JSON.stringify(prediction.improvements || []),
      now,
      now,
    ];

    try {
      await pool.query(query, values);

      return {
        id,
        userId,
        jobId: prediction.jobId,
        shortlistProbability: prediction.shortlistProbability,
        candidateStrength: prediction.candidateStrength,
        jobMatchScore: prediction.jobMatchScore,
        matchedSkills: prediction.matchedSkills || [],
        missingSkills: prediction.missingSkills || [],
        weakSkills: prediction.weakSkills || [],
        improvements: prediction.improvements,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error storing prediction:', error);
      throw error;
    }
  }

  /**
   * Get prediction history for a user
   */
  static async getPredictionHistory(
    userId: string,
    limit: number = 50
  ): Promise<StoredPrediction[]> {
    const query = `
      SELECT * FROM shortlist_predictions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [userId, limit]);
      const results = result.rows as any[];

      return results.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        jobId: row.job_id,
        shortlistProbability: row.shortlist_probability,
        candidateStrength: row.candidate_strength,
        jobMatchScore: row.job_match_score,
        matchedSkills: JSON.parse(row.matched_skills || '[]'),
        missingSkills: JSON.parse(row.missing_skills || '[]'),
        weakSkills: JSON.parse(row.weak_skills || '[]'),
        improvements: JSON.parse(row.improvements || '[]'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      throw error;
    }
  }

  /**
   * Get latest prediction for a specific job
   */
  static async getLatestPrediction(
    userId: string,
    jobId: string
  ): Promise<StoredPrediction | null> {
    const query = `
      SELECT * FROM shortlist_predictions
      WHERE user_id = $1 AND job_id = $2
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [userId, jobId]);
      const results = result.rows as any[];

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return {
        id: row.id,
        userId: row.user_id,
        jobId: row.job_id,
        shortlistProbability: row.shortlist_probability,
        candidateStrength: row.candidate_strength,
        jobMatchScore: row.job_match_score,
        matchedSkills: JSON.parse(row.matched_skills || '[]'),
        missingSkills: JSON.parse(row.missing_skills || '[]'),
        weakSkills: JSON.parse(row.weak_skills || '[]'),
        improvements: JSON.parse(row.improvements || '[]'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      console.error('Error fetching latest prediction:', error);
      throw error;
    }
  }

  /**
   * Store a what-if simulation result
   */
  static async storeWhatIfResult(
    userId: string,
    result: WhatIfResult
  ): Promise<StoredWhatIfResult> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO what_if_simulations (
        id,
        user_id,
        job_id,
        baseline_probability,
        baseline_candidate_strength,
        baseline_job_match,
        projected_probability,
        projected_candidate_strength,
        projected_job_match,
        probability_delta,
        candidate_strength_delta,
        job_match_delta,
        scenario_added_skills,
        scenario_removed_skills,
        scenario_modified_skills,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `;

    const values = [
      id,
      userId,
      result.scenario.jobId,
      result.baselineShortlistProbability,
      result.baselineCandidateStrength,
      result.baselineJobMatchScore,
      result.projectedShortlistProbability,
      result.projectedCandidateStrength,
      result.projectedJobMatchScore,
      result.probabilityDelta,
      result.candidateStrengthDelta,
      result.jobMatchDelta,
      JSON.stringify(result.scenario.addedSkills || []),
      JSON.stringify(result.scenario.removedSkills || []),
      JSON.stringify(result.scenario.modifiedSkills || []),
      now,
    ];

    try {
      await pool.query(query, values);

      return {
        id,
        userId,
        jobId: result.scenario.jobId,
        baselineProbability: result.baselineShortlistProbability,
        baselineCandidateStrength: result.baselineCandidateStrength,
        baselineJobMatch: result.baselineJobMatchScore,
        projectedProbability: result.projectedShortlistProbability,
        projectedCandidateStrength: result.projectedCandidateStrength,
        projectedJobMatch: result.projectedJobMatchScore,
        probabilityDelta: result.probabilityDelta,
        candidateStrengthDelta: result.candidateStrengthDelta,
        jobMatchDelta: result.jobMatchDelta,
        scenarioAddedSkills: result.scenario.addedSkills,
        scenarioRemovedSkills: result.scenario.removedSkills,
        scenarioModifiedSkills: result.scenario.modifiedSkills,
        createdAt: now,
      };
    } catch (error) {
      console.error('Error storing what-if result:', error);
      throw error;
    }
  }

  /**
   * Get what-if simulation history for a user
   */
  static async getWhatIfHistory(
    userId: string,
    limit: number = 20
  ): Promise<StoredWhatIfResult[]> {
    const query = `
      SELECT * FROM what_if_simulations
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [userId, limit]);
      const results = result.rows as any[];

      return results.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        jobId: row.job_id,
        baselineProbability: row.baseline_probability,
        baselineCandidateStrength: row.baseline_candidate_strength,
        baselineJobMatch: row.baseline_job_match,
        projectedProbability: row.projected_probability,
        projectedCandidateStrength: row.projected_candidate_strength,
        projectedJobMatch: row.projected_job_match,
        probabilityDelta: row.probability_delta,
        candidateStrengthDelta: row.candidate_strength_delta,
        jobMatchDelta: row.job_match_delta,
        scenarioAddedSkills: JSON.parse(row.scenario_added_skills || '[]'),
        scenarioRemovedSkills: JSON.parse(row.scenario_removed_skills || '[]'),
        scenarioModifiedSkills: JSON.parse(row.scenario_modified_skills || '[]'),
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      console.error('Error fetching what-if history:', error);
      throw error;
    }
  }

  /**
   * Get analytics for predictions (aggregate stats)
   */
  static async getAnalytics(userId: string) {
    const query = `
      SELECT
        COUNT(*) as total_predictions,
        AVG(shortlist_probability) as avg_probability,
        MAX(shortlist_probability) as highest_probability,
        MIN(shortlist_probability) as lowest_probability,
        AVG(candidate_strength) as avg_candidate_strength,
        AVG(job_match_score) as avg_job_match
      FROM shortlist_predictions
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);
      const results = result.rows as any[];

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return {
        totalPredictions: row.total_predictions || 0,
        averageProbability: Math.round(row.avg_probability || 0),
        highestProbability: row.highest_probability || 0,
        lowestProbability: row.lowest_probability || 0,
        averageCandidateStrength: Math.round(row.avg_candidate_strength || 0),
        averageJobMatch: Math.round(row.avg_job_match || 0),
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Delete prediction (GDPR/privacy)
   */
  static async deletePrediction(id: string, userId: string): Promise<void> {
    const query = `DELETE FROM shortlist_predictions WHERE id = ? AND user_id = ?`;

    try {
      await pool.query(query, [id, userId]);
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  }
}
