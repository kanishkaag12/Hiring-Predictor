/**
 * Shortlist Probability Feature - Type Definitions
 * 
 * Defines all types for the shortlist probability prediction system
 */

/**
 * Candidate strength prediction result
 * Score from random forest model: probability that user is a strong candidate (0-1)
 */
export interface CandidateStrengthResult {
  score: number; // 0-1 probability
  confidence: number; // Model confidence (0-1)
}

/**
 * Job match score - cosine similarity between user skills and job requirements
 */
export interface JobMatchResult {
  score: number; // 0-1 cosine similarity
  matchedSkills: string[]; // Skills that matched
  missingSkills: string[]; // Required skills not present
  weakSkills: string[]; // Skills present but at beginner level
  semanticSimilarity?: number; // Raw semantic similarity after adjustments
  embeddingFallbackUsed?: boolean; // Whether TF-IDF fallback was used
}

/**
 * Final shortlist probability prediction
 * Combines candidate strength × job match score
 * ✅ STRICT DETERMINISTIC OUTPUT - includes validation metadata
 */
export interface ShortlistPrediction {
  jobId: string;
  jobTitle: string;
  shortlistProbability: number; // 0-100 percentage
  candidateStrength: number; // 0-100 percentage
  jobMatchScore: number; // 0-100 percentage
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  improvements?: string[]; // ML-driven improvement suggestions
  timestamp: Date;
  // ✅ MANDATORY FIELDS for strict validation
  jobDescriptionHash: string; // SHA256 hash of full job description
  embeddingSource: 'fresh' | 'cache'; // Whether embeddings were computed fresh or from cache
  status: 'success' | 'fallback'; // Prediction status
  explanation?: string; // Job-specific reasoning for the score

  // ✅ STRICT OUTPUT FORMAT (snake_case)
  user_id: string;
  resume_id: string;
  job_id: string;
  shortlist_probability: number;
  candidate_strength: number;
  job_match_score: number;
  domain_match: 'strong' | 'moderate' | 'weak';
  confidence_reasoning: string;
}

/**
 * What-If simulation scenario
 * Test how adding/removing skills affects shortlist probability
 */
export interface WhatIfScenario {
  jobId: string;
  addedSkills?: string[]; // Skills to add temporarily
  removedSkills?: string[]; // Skills to remove temporarily
  modifiedSkills?: Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }>; // Skills with modified levels
}

/**
 * What-If simulation result
 * Shows predicted probability changes
 */
export interface WhatIfResult {
  baselineShortlistProbability: number; // Current probability
  baselineCandidateStrength: number;
  baselineJobMatchScore: number;
  
  projectedShortlistProbability: number; // After scenario changes
  projectedCandidateStrength: number;
  projectedJobMatchScore: number;
  
  probabilityDelta: number; // Percentage point change
  candidateStrengthDelta: number;
  jobMatchDelta: number;
  
  scenario: WhatIfScenario;
  timestamp: Date;
}

/**
 * User profile + resume for prediction
 */
export interface CandidateProfile {
  userId: string;
  // From users table
  userType?: string; // 'Student' | 'Working Professional' | 'Fresher' | 'Career Switcher'
  
  // Skills from skills table
  skills: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
  }>;
  
  // Education from parsed resume
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  
  // Experience from resume
  experienceMonths?: number;
  
  // Projects from parsed resume
  projectsCount?: number;
  
  // Technical projects from projects table
  projects?: Array<{
    title: string;
    techStack: string[];
    description: string;
    complexity: 'Low' | 'Medium' | 'High';
  }>;
  
  // Work experience from experience table
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    type: 'Job' | 'Internship';
  }>;
  
  // Academic metrics
  cgpa?: number;
  college?: string;
  gradYear?: string;
}

/**
 * API request for shortlist prediction
 */
export interface ShortlistPredictionRequest {
  jobId: string;
  userId: string;
  resumeId?: string;
}

/**
 * API response for shortlist prediction
 */
export interface ShortlistPredictionResponse {
  prediction: ShortlistPrediction;
  debug?: {
    candidateStrengthDebug?: any;
    jobMatchDebug?: any;
  };
}

/**
 * API request for What-If simulation
 */
export interface WhatIfSimulationRequest {
  jobId: string;
  userId: string;
  scenario: WhatIfScenario;
}

/**
 * API response for What-If simulation
 */
export interface WhatIfSimulationResponse {
  result: WhatIfResult;
}

/**
 * Batch prediction request for multiple jobs
 */
export interface BatchShortlistPredictionRequest {
  userId: string;
  jobIds: string[];
  resumeId?: string;
}

/**
 * Batch prediction response
 */
export interface BatchShortlistPredictionResponse {
  predictions: ShortlistPrediction[];
}
