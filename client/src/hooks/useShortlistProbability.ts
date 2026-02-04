/**
 * Hook for Shortlist Probability Predictions
 * Manages API calls to fetch predictions, what-if simulations, and recommendations
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { 
  ShortlistPrediction, 
  WhatIfResult, 
  WhatIfScenario 
} from '@shared/shortlist-types';

interface UseShortlistProbabilityState {
  prediction: ShortlistPrediction | null;
  isLoading: boolean;
  error: string | null;
}

interface UseWhatIfSimulatorState {
  result: WhatIfResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch shortlist probability prediction for a job
 */
export function useShortlistPrediction() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<UseShortlistProbabilityState>({
    prediction: null,
    isLoading: false,
    error: null,
  });

  const predict = useCallback(
    async (jobId: string) => {
      if (!user?.id) {
        setState((s) => ({
          ...s,
          error: 'User not authenticated',
        }));
        return null;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/shortlist/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get prediction');
        }

        const data = await response.json();
        const prediction = data.prediction;

        setState((s) => ({
          ...s,
          prediction,
          isLoading: false,
          error: null,
        }));

        return prediction;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to predict shortlist probability';
        setState((s) => ({
          ...s,
          error: errorMessage,
          isLoading: false,
        }));

        toast({
          title: 'Prediction Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return null;
      }
    },
    [user, toast]
  );

  const reset = useCallback(() => {
    setState({
      prediction: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, predict, reset };
}

/**
 * Hook for What-If simulations
 */
export function useWhatIfSimulator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<UseWhatIfSimulatorState>({
    result: null,
    isLoading: false,
    error: null,
  });

  const simulate = useCallback(
    async (jobId: string, scenario: WhatIfScenario) => {
      if (!user?.id) {
        setState((s) => ({
          ...s,
          error: 'User not authenticated',
        }));
        return null;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/shortlist/what-if', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            jobId,
            scenario,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'What-If simulation failed');
        }

        const data = await response.json();
        const result = data.result;

        setState((s) => ({
          ...s,
          result,
          isLoading: false,
          error: null,
        }));

        return result;
      } catch (error: any) {
        const errorMessage = error.message || 'What-If simulation failed';
        setState((s) => ({
          ...s,
          error: errorMessage,
          isLoading: false,
        }));

        toast({
          title: 'Simulation Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return null;
      }
    },
    [user, toast]
  );

  const reset = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, simulate, reset };
}

/**
 * Hook to fetch recommendations
 */
export function useShortlistRecommendations() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(
    async (jobId: string) => {
      if (!user?.id) {
        setError('User not authenticated');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/shortlist/recommendations/${jobId}?userId=${user.id}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch recommendations');
        }

        const data = await response.json();
        setIsLoading(false);
        return data;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to fetch recommendations';
        setError(errorMessage);
        setIsLoading(false);
        return null;
      }
    },
    [user]
  );

  return { getRecommendations, isLoading, error };
}
