/**
 * Shortlist Probability API Routes
 * 
 * Endpoints:
 * POST /api/shortlist/predict - Predict shortlist probability for a job
 * POST /api/shortlist/batch - Batch predictions for multiple jobs
 * POST /api/shortlist/what-if - What-If simulation
 * GET /api/shortlist/recommendations/:jobId - Get recommendations for improvement
 */

import type { Router } from 'express';
import { ShortlistProbabilityService } from '../services/ml/shortlist-probability.service';
import { WhatIfSimulatorService } from '../services/ml/what-if-simulator.service';
import type {
  ShortlistPredictionRequest,
  ShortlistPredictionResponse,
  BatchShortlistPredictionRequest,
  BatchShortlistPredictionResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
} from '@shared/shortlist-types';

/**
 * Register shortlist probability routes
 */
export function registerShortlistRoutes(router: Router) {
  /**
   * POST /api/shortlist/predict
   * Predict shortlist probability for a specific job
   * ALWAYS FRESH PREDICTION - NO CACHING
   * 
   * Body: { jobId: string, userId: string }
   * Response: { prediction, debug? }
   */
  router.post('/api/shortlist/predict', async (req, res) => {
    try {
      const { jobId, userId } = req.body as ShortlistPredictionRequest;

      console.log(`[API] ⚡ Analyze My Chances triggered: user=${userId}, job=${jobId}`);

      // Validate input
      if (!jobId || !userId) {
        return res.status(400).json({
          error: 'Missing required fields: jobId, userId',
        });
      }

      // Check if service is initialized
      if (!ShortlistProbabilityService.isReady()) {
        console.error('[API] ❌ ML service not ready - cannot predict');
        return res.status(503).json({
          error: 'ML service not initialized - trained models are not available',
          detail: 'The prediction service requires placement_random_forest_model.pkl to be loaded'
        });
      }

      console.log('[API] ✓ ML service ready - running fresh prediction');

      // Get prediction - FRESH COMPUTATION
      const prediction = await ShortlistProbabilityService.predict(userId, jobId);

      console.log(`[API] ✅ Prediction complete: ${prediction.shortlistProbability}% (strength=${prediction.candidateStrength}%, match=${prediction.jobMatchScore}%)`);

      const response: ShortlistPredictionResponse = {
        prediction,
      };

      res.json(response);
    } catch (error: any) {
      console.error('[API] ❌ Error in shortlist prediction:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * POST /api/shortlist/batch
   * Get predictions for multiple jobs in one request
   * 
   * Body: { userId: string, jobIds: string[] }
   * Response: { predictions: ShortlistPrediction[] }
   */
  router.post('/api/shortlist/batch', async (req, res) => {
    try {
      const { userId, jobIds } = req.body as BatchShortlistPredictionRequest;

      // Validate input
      if (!userId || !jobIds || jobIds.length === 0) {
        return res.status(400).json({
          error: 'Missing required fields: userId, jobIds (non-empty array)',
        });
      }

      // Limit batch size to prevent abuse
      if (jobIds.length > 100) {
        return res.status(400).json({
          error: 'Maximum 100 jobs per batch request',
        });
      }

      if (!ShortlistProbabilityService.isReady()) {
        return res.status(503).json({
          error: 'ML service not ready',
        });
      }

      // Get predictions
      const predictions = await ShortlistProbabilityService.predictBatch(userId, jobIds);

      const response: BatchShortlistPredictionResponse = {
        predictions,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in batch shortlist prediction:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * POST /api/shortlist/what-if
   * Run a What-If simulation scenario
   * ALWAYS RECOMPUTES - NO STATIC DELTAS
   * 
   * Body: {
   *   userId: string,
   *   jobId: string,
   *   scenario: {
   *     jobId: string,
   *     addedSkills?: string[],
   *     removedSkills?: string[],
   *     modifiedSkills?: Array<{ name: string, level: 'Beginner'|'Intermediate'|'Advanced' }>
   *   }
   * }
   * Response: { result: WhatIfResult }
   */
  router.post('/api/shortlist/what-if', async (req, res) => {
    try {
      const { userId, jobId, scenario } = req.body as WhatIfSimulationRequest;

      console.log(`[API] 🔄 What-If simulation triggered: user=${userId}, job=${jobId}`);
      console.log(`[API] Scenario changes:`, JSON.stringify({
        added: scenario.addedSkills,
        removed: scenario.removedSkills,
        modified: scenario.modifiedSkills
      }));

      // Validate input
      if (!userId || !jobId || !scenario) {
        return res.status(400).json({
          error: 'Missing required fields: userId, jobId, scenario',
        });
      }

      if (!ShortlistProbabilityService.isReady()) {
        console.error('[API] ❌ ML service not ready - cannot simulate');
        return res.status(503).json({
          error: 'ML service not ready',
        });
      }

      console.log('[API] ✓ Running What-If with FRESH model predictions');

      // Run simulation - FRESH COMPUTATION
      const result = await WhatIfSimulatorService.simulate(userId, jobId, scenario);

      console.log(`[API] ✅ What-If complete: ${result.baselineShortlistProbability}% → ${result.projectedShortlistProbability}% (Δ${result.probabilityDelta > 0 ? '+' : ''}${result.probabilityDelta}%)`);

      const response: WhatIfSimulationResponse = {
        result,
      };

      res.json(response);
    } catch (error: any) {
      console.error('[API] ❌ Error in What-If simulation:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/shortlist/recommendations/:jobId
   * Get recommendations for improving shortlist probability
   * 
   * Query: { userId: string }
   * Response: { topSkillsToLearn, skillsToImprove, estimatedImpact }
   */
  router.get('/api/shortlist/recommendations/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { userId } = req.query;

      // Validate input
      if (!jobId || !userId) {
        return res.status(400).json({
          error: 'Missing required parameters: jobId (URL param), userId (query)',
        });
      }

      if (!ShortlistProbabilityService.isReady()) {
        return res.status(503).json({
          error: 'ML service not ready',
        });
      }

      // Get recommendations
      const recommendations = await WhatIfSimulatorService.getRecommendations(
        userId as string,
        jobId
      );

      res.json(recommendations);
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * POST /api/shortlist/multiple-scenarios
   * Test multiple What-If scenarios
   * 
   * Body: {
   *   userId: string,
   *   jobId: string,
   *   scenarios: WhatIfScenario[]
   * }
   * Response: { results: WhatIfResult[] }
   */
  router.post('/api/shortlist/multiple-scenarios', async (req, res) => {
    try {
      const { userId, jobId, scenarios } = req.body;

      // Validate input
      if (!userId || !jobId || !Array.isArray(scenarios) || scenarios.length === 0) {
        return res.status(400).json({
          error: 'Missing required fields: userId, jobId, scenarios (non-empty array)',
        });
      }

      // Limit scenarios
      if (scenarios.length > 10) {
        return res.status(400).json({
          error: 'Maximum 10 scenarios per request',
        });
      }

      if (!ShortlistProbabilityService.isReady()) {
        return res.status(503).json({
          error: 'ML service not ready',
        });
      }

      // Run simulations
      const results = await WhatIfSimulatorService.simulateMultiple(userId, jobId, scenarios);

      res.json({ results });
    } catch (error: any) {
      console.error('Error in multiple scenarios:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  /**
   * GET /api/shortlist/optimal-skills/:jobId
   * Find optimal skills to reach target probability
   * 
   * Query: { userId: string, targetProbability?: number }
   * Response: { requiredSkills, requiredLevel, estimatedTimeMonths }
   */
  router.get('/api/shortlist/optimal-skills/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { userId, targetProbability } = req.query;

      // Validate input
      if (!jobId || !userId) {
        return res.status(400).json({
          error: 'Missing required parameters: jobId (URL param), userId (query)',
        });
      }

      if (!ShortlistProbabilityService.isReady()) {
        return res.status(503).json({
          error: 'ML service not ready',
        });
      }

      const target = targetProbability ? parseInt(targetProbability as string, 10) : 75;

      // Validate target
      if (isNaN(target) || target < 0 || target > 100) {
        return res.status(400).json({
          error: 'targetProbability must be a number between 0 and 100',
        });
      }

      // Get optimal skills
      const optimalSkills = await WhatIfSimulatorService.findOptimalSkills(
        userId as string,
        jobId,
        target / 100
      );

      res.json(optimalSkills);
    } catch (error: any) {
      console.error('Error finding optimal skills:', error);
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  });

  console.log('✓ Shortlist probability routes registered');
}
