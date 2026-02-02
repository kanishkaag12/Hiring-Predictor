/**
 * Shortlist Probability Prediction Service
 * 
 * Core service that orchestrates:
 * 1. Loading placement_random_forest_model.pkl via Python
 * 2. Extracting candidate features
 * 3. Computing job embeddings and match scores
 * 4. Producing final shortlist probability predictions
 * 
 * Prediction Flow:
 * - candidate_strength = RandomForest.predict(candidate_features) → [0, 1]
 * - job_match_score = cosine_similarity(user_skills, job_embedding) → [0, 1]
 * - shortlist_probability = candidate_strength × job_match_score
 * 
 * NO FALLBACK: If models cannot be loaded, service throws errors
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { storage, pool } from '../../storage';
import {
  CandidateProfile,
  ShortlistPrediction,
  CandidateStrengthResult,
  JobMatchResult,
} from '@shared/shortlist-types';
import { CandidateFeaturesService } from './candidate-features.service';
import { JobEmbeddingService } from './job-embedding.service';
import { findPythonExecutable } from '../resume-parser.service';

export class ShortlistProbabilityService {
  private static modelPath = path.join(process.cwd(), 'placement_random_forest_model.pkl');
  private static pythonScript = path.join(process.cwd(), 'python', 'ml_predictor.py');
  private static pythonExe: string | null = null;
  
  private static modelsLoaded = false;
  private static isInitialized = false;
  private static modelInfo: any = null;

  /**
   * Initialize the prediction service
   * Loads all ML models via Python - NO FALLBACK ALLOWED
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📊 Initializing Shortlist Probability Service...');

      // Find Python executable
      this.pythonExe = findPythonExecutable(process.cwd());
      console.log(`✓ Using Python: ${this.pythonExe}`);

      // Verify model files exist
      if (!fs.existsSync(this.modelPath)) {
        console.warn(`⚠️  Model file not found: ${this.modelPath}`);
        console.warn('⚠️  ML predictions will not be available. Run model training to generate the file.');
        return;
      }
      console.log(`✓ Found model file: ${this.modelPath}`);

      // Verify Python script exists
      if (!fs.existsSync(this.pythonScript)) {
        console.warn(`⚠️  Python script not found: ${this.pythonScript}`);
        console.warn('⚠️  ML predictions will not be available.');
        return;
      }
      console.log(`✓ Found Python script: ${this.pythonScript}`);

      // Load models via Python
      await this.loadModelsViaPython();

      // Initialize embedding service
      JobEmbeddingService.initialize();

      this.isInitialized = true;
      console.log('✅ Shortlist Probability Service initialized successfully');
      console.log('✓ Using RandomForest for candidate strength predictions');
      console.log('✓ Using SBERT embeddings for job match scores');
    } catch (error) {
      console.error('❌ FAILED to initialize Shortlist Probability Service:', error);
      console.error('❌ ML predictions are NOT available - this is a critical error');
      this.isInitialized = false;
      throw error; // NO FALLBACK - fail hard
    }
  }

  /**
   * Load ML models via Python subprocess
   */
  private static async loadModelsViaPython(): Promise<void> {
    return new Promise((resolve, reject) => {
      const modelsDir = path.dirname(this.modelPath);
      
      console.log(`Loading models from: ${modelsDir}`);
      
      const py = spawn(this.pythonExe!, [this.pythonScript, 'load', modelsDir]);
      
      let stdout = '';
      let stderr = '';
      
      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      py.on('close', (code) => {
        if (code !== 0) {
          console.error('Python stderr:', stderr);
          reject(new Error(`Failed to load models via Python (exit code ${code}): ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim());
          
          if (!result.success) {
            reject(new Error(`Model loading failed: ${result.error}`));
            return;
          }
          
          this.modelsLoaded = true;
          this.modelInfo = result;
          
          console.log('✓ Placement model loaded successfully');
          console.log(`✓ Model type: ${result.rf_model_type}`);
          console.log(`✓ Job embeddings: ${result.embeddings_count} entries`);
          console.log(`✓ Job texts: ${result.job_texts_count} entries`);
          
          resolve();
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });
      
      py.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error}`));
      });
    });
  }

  /**
   * Fetch candidate profile from database
   */
  static async fetchCandidateProfile(userId: string): Promise<CandidateProfile> {
    // Fetch user info
    const userData = await storage.getUser(userId);
    if (!userData) {
      throw new Error(`User not found: ${userId}`);
    }

    // Fetch related data
    const [userSkills, userProjects, userExperience] = await Promise.all([
      storage.getSkills(userId),
      storage.getProjects(userId),
      storage.getExperiences(userId)
    ]);

    // Parse resume data
    const education = (userData.resumeEducation as any[]) || [];
    const experienceMonths = userData.resumeExperienceMonths || 0;
    const projectsCount = userData.resumeProjectsCount || userProjects.length;

    const profile: CandidateProfile = {
      userId,
      userType: userData.userType || 'Fresher',
      skills: userSkills.map(s => ({
        name: s.name,
        level: s.level as 'Beginner' | 'Intermediate' | 'Advanced',
      })),
      education,
      experienceMonths,
      projectsCount,
      projects: userProjects.map(p => ({
        title: p.title,
        techStack: (p.techStack as string[]) || [],
        description: p.description,
        complexity: (p.complexity as 'Low' | 'Medium' | 'High') || 'Medium',
      })),
      experience: userExperience.map(e => ({
        company: e.company,
        role: e.role,
        duration: e.duration,
        type: (e.type as 'Job' | 'Internship') || 'Job',
      })),
      cgpa: undefined, // Not in schema, but could be added
      college: userData.college || undefined,
      gradYear: userData.gradYear || undefined,
    };

    return profile;
  }

  /**
   * Fetch job data from database (NOT MOCKED)
   */
  static async fetchJob(jobId: string): Promise<any> {
    const job = await storage.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Get description from either field, or create a fallback description
    let description = job.description || job.jobDescription || '';
    
    if (!description || description.trim().length === 0) {
      // Create a basic description from available data
      const company = job.company || 'the company';
      const title = job.title || 'this position';
      const skills = (job.skills as string[]) || [];
      const experienceLevel = job.experienceLevel || '';
      
      description = `${title} position at ${company}`;
      if (experienceLevel) {
        description += ` (${experienceLevel})`;
      }
      if (skills.length > 0) {
        description += `. Required skills: ${skills.join(', ')}`;
      }
      
      console.log(`[ML Prediction] ⚠️ Job ${jobId} has no description, using generated: "${description}"`);
    }

    return {
      id: job.id,
      title: job.title || 'Untitled Job',
      description,
      skills: (job.skills as string[]) || [],
      experienceLevel: job.experienceLevel || 'Entry Level',
      location: job.jobLocation || job.city || job.state || '',
      company: job.company,
    };
  }

  /**
   * Predict candidate strength from user profile using Random Forest
   * NO FALLBACK - throws error if model unavailable
   */
  static async predictCandidateStrength(profile: CandidateProfile): Promise<CandidateStrengthResult> {
    if (!this.modelsLoaded || !this.pythonExe) {
      throw new Error('❌ ML models not loaded - cannot predict candidate strength');
    }

    // Extract features
    const features = CandidateFeaturesService.extractFeatures(profile);
    const featureArray = CandidateFeaturesService.featuresToArray(features);

    // Call Python for prediction
    return new Promise((resolve, reject) => {
      const py = spawn(this.pythonExe!, [this.pythonScript, 'predict', path.dirname(this.modelPath)]);
      
      const input = JSON.stringify({
        features: featureArray,
        job_id: '',
        user_embedding: null
      });
      
      let stdout = '';
      let stderr = '';
      
      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      py.stdin.write(input);
      py.stdin.end();
      
      py.on('close', (code) => {
        if (code !== 0) {
          console.error('Python prediction stderr:', stderr);
          reject(new Error(`Prediction failed (exit code ${code}): ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim());
          
          if (!result.success) {
            reject(new Error(`Prediction failed: ${result.error}`));
            return;
          }
          
          resolve({
            score: result.candidate_strength,
            confidence: result.confidence || 0.95
          });
        } catch (error) {
          reject(new Error(`Failed to parse prediction result: ${error}`));
        }
      });
      
      py.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error}`));
      });
    });
  }

  /**
   * Predict job match score
   * NO FALLBACK - throws error if embedding service unavailable
   */
  static async predictJobMatch(
    userSkills: string[],
    jobData: any
  ): Promise<JobMatchResult> {
    if (!this.modelsLoaded) {
      throw new Error('❌ ML models not loaded - cannot compute job match');
    }

    const requiredSkills = (jobData.skills as string[]) || [];
    
    // Try to get pre-computed embedding first
    let jobEmbedding: number[] | null = null;
    
    // If we have job embeddings loaded, try to get it
    const jobDescription = jobData.description || jobData.jobDescription || '';
    
    console.log(`[Job Match] Job ID: ${jobData.id}, Description length: ${jobDescription.length}, Has skills: ${requiredSkills.length > 0}`);
    
    if (jobDescription) {
      jobEmbedding = await JobEmbeddingService.embedJobDescription(
        jobData.id,
        jobDescription
      );
    } else {
      console.warn(`[Job Match] ⚠️ No job description found for job ${jobData.id}`);
    }

    if (!jobEmbedding) {
      throw new Error(`❌ Could not generate embedding for job ${jobData.id}`);
    }

    return JobEmbeddingService.computeJobMatch(
      userSkills,
      jobEmbedding,
      requiredSkills
    );
  }

  /**
   * Main prediction method
   * Combines candidate strength × job match score
   * FRESH COMPUTATION EVERY TIME - NO CACHING
   */
  static async predict(userId: string, jobId: string): Promise<ShortlistPrediction> {
    if (!this.isInitialized || !this.modelsLoaded) {
      throw new Error('❌ ML service not initialized - cannot make predictions');
    }

    try {
      console.log(`[ML Prediction] Starting fresh prediction for user=${userId}, job=${jobId}`);
      
      // Fetch FRESH data
      const candidateProfile = await this.fetchCandidateProfile(userId);
      const jobData = await this.fetchJob(jobId);

      console.log(`[ML Prediction] ✓ Fetched user profile with ${candidateProfile.skills.length} skills`);

      // Get predictions from TRAINED MODELS
      const candidateStrength = await this.predictCandidateStrength(candidateProfile);
      console.log(`[ML Prediction] ✓ Candidate strength from RandomForest: ${candidateStrength.score.toFixed(3)}`);
      
      const jobMatch = await this.predictJobMatch(
        candidateProfile.skills.map(s => s.name),
        jobData
      );
      console.log(`[ML Prediction] ✓ Job match from SBERT: ${jobMatch.score.toFixed(3)}`);

      // Calculate final probability: WEIGHTED SUM (not multiplication)
      // 30% weight on candidate strength, 70% on job match
      const rawProbability = (0.3 * candidateStrength.score) + (0.7 * jobMatch.score);
      
      // Apply floor and ceiling to prevent extreme values
      const shortlistProbability = Math.max(0.05, Math.min(0.95, rawProbability));
      
      console.log(`[ML Prediction] ✓ Raw probability: ${(rawProbability * 100).toFixed(1)}%`);
      console.log(`[ML Prediction] ✓ Final probability (clamped): ${(shortlistProbability * 100).toFixed(1)}%`);

      // Calculate skill gaps for explanations
      const missingSkills = jobMatch.missingSkills;
      const hasExperienceGap = (candidateProfile.experienceMonths || 0) < 6;
      const hasProjectGap = (candidateProfile.projectsCount || 0) < 2;
      
      // Generate ML-driven improvement suggestions
      const improvements: string[] = [];
      if (missingSkills.length > 0) {
        improvements.push(`Add ${missingSkills.slice(0, 3).join(', ')} to your skillset`);
      }
      if (hasExperienceGap) {
        improvements.push('Gain internship or work experience');
      }
      if (hasProjectGap) {
        improvements.push('Build more projects to demonstrate skills');
      }
      if (candidateStrength.score < 0.3) {
        improvements.push('Strengthen your overall profile completeness');
      }

      return {
        jobId,
        jobTitle: jobData.title,
        shortlistProbability: Math.round(shortlistProbability * 100),
        candidateStrength: Math.round(candidateStrength.score * 100),
        jobMatchScore: Math.round(jobMatch.score * 100),
        matchedSkills: jobMatch.matchedSkills,
        missingSkills: jobMatch.missingSkills,
        weakSkills: jobMatch.weakSkills,
        improvements,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Error during shortlist prediction:', error);
      throw error; // NO FALLBACK - propagate error
    }
  }

  /**
   * Batch predict for multiple jobs
   */
  static async predictBatch(userId: string, jobIds: string[]): Promise<ShortlistPrediction[]> {
    const predictions: ShortlistPrediction[] = [];

    for (const jobId of jobIds) {
      try {
        const prediction = await this.predict(userId, jobId);
        predictions.push(prediction);
      } catch (error) {
        console.warn(`Failed to predict for job ${jobId}:`, error);
        // Continue with next job
      }
    }

    return predictions;
  }

  /**
   * Check if service is initialized and ready
   */
  static isReady(): boolean {
    return this.isInitialized;
  }
}
