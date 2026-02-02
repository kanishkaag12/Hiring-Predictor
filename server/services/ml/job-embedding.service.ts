/**
 * Job Embedding Service
 * 
 * Handles:
 * 1. Loading pre-trained job embeddings from job_embeddings.pkl
 * 2. Computing cosine similarity between user skills and job embeddings
 * 3. Extracting job information for embedding computation
 * 
 * Uses Sentence-BERT embeddings (384-dimensional vectors by default)
 */

import { JobMatchResult } from '@shared/shortlist-types';

export interface JobEmbedding {
  jobId: string;
  vector: number[];
  jobText?: string;
}

export class JobEmbeddingService {
  private static textEmbeddingService: any = null;
  private static jobEmbeddingsCache: Map<string, number[]> = new Map();

  /**
   * Initialize the embedding service
   */
  static initialize(): void {
    console.log('✓ Job Embedding Service initialized');
  }

  /**
   * Load pre-computed job embeddings from job_embeddings.pkl
   * Note: In production, these are loaded from the pickle file
   * For now, we compute on-demand using Sentence-BERT
   */
  static async loadJobEmbeddings(jobTexts: Map<string, string> | Record<string, string>): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();

    const entries = jobTexts instanceof Map 
      ? Array.from(jobTexts.entries())
      : Object.entries(jobTexts);

    for (const [jobId, jobText] of entries) {
      if (this.jobEmbeddingsCache.has(jobId)) {
        embeddings.set(jobId, this.jobEmbeddingsCache.get(jobId)!);
      } else {
        // Compute embedding for this job
        const embedding = await this.generateJobEmbedding(jobText);
        embeddings.set(jobId, embedding);
        this.jobEmbeddingsCache.set(jobId, embedding);
      }
    }

    return embeddings;
  }

  /**
   * Generate embedding for a job description
   * Uses Sentence-BERT or fallback TF-IDF approach
   */
  private static async generateJobEmbedding(jobText: string): Promise<number[]> {
    if (!jobText || jobText.trim().length === 0) {
      console.warn('⚠️ Empty job text, using fallback embedding');
      return this.generateTfIdfEmbedding('general job description');
    }

    // Try to use transformer-based embedding if available
    try {
      const { pipeline } = await import("@xenova/transformers");
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2" // Sentence-BERT equivalent
      );

      const result = await extractor(jobText, {
        pooling: 'mean',
        normalize: true,
      });

      // Return vector
      if (Array.isArray(result) && result[0]) {
        const embedding = Array.from(result[0]) as number[];
        console.log(`✓ Generated transformer embedding (${embedding.length}d)`);
        return embedding;
      }
    } catch (error) {
      console.warn('⚠️ Transformer model unavailable, falling back to TF-IDF:', error);
    }

    // Fallback: Use TF-IDF based embedding
    console.log('✓ Using TF-IDF fallback embedding');
    return this.generateTfIdfEmbedding(jobText);
  }

  /**
   * Fallback: Generate embedding using TF-IDF
   * Returns a 384-dimensional vector for consistency
   */
  private static generateTfIdfEmbedding(jobText: string): number[] {
    // Simple TF-IDF based embedding (384-dimensional for compatibility)
    const vector = new Array(384).fill(0);

    // Extract important job features
    const tokens = jobText.toLowerCase().split(/\s+/);
    const importanceKeywords = {
      'python': 0.8,
      'javascript': 0.8,
      'java': 0.8,
      'react': 0.7,
      'nodejs': 0.7,
      'sql': 0.7,
      'experience': 0.6,
      'required': 0.6,
      'skills': 0.8,
      'develop': 0.5,
      'manage': 0.5,
      'lead': 0.6,
      'team': 0.5,
      'project': 0.6,
      'system': 0.5,
      'api': 0.7,
      'database': 0.7,
      'aws': 0.7,
      'cloud': 0.6,
      'microservices': 0.7,
      'fullstack': 0.8,
      'frontend': 0.7,
      'backend': 0.7,
    };

    // Create simple feature vector
    let importanceScore = 0;
    for (const token of tokens) {
      if (importanceKeywords[token as keyof typeof importanceKeywords]) {
        importanceScore += importanceKeywords[token as keyof typeof importanceKeywords];
      }
    }

    // Distribute importance score across vector
    const avgImportance = importanceScore / vector.length;
    vector.fill(avgImportance);

    // Normalize to unit vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  /**
   * Compute cosine similarity between user skills embedding and job embedding
   */
  static computeJobMatch(
    userSkills: string[],
    jobEmbedding: number[],
    jobRequiredSkills: string[]
  ): JobMatchResult {
    // Generate embedding for user skills (use same dimensionality as job)
    const userSkillsText = userSkills.join(' ');
    const userEmbedding = this.generateTfIdfEmbedding(userSkillsText);

    // Compute cosine similarity (always between 0 and 1)
    let similarity = this.cosineSimilarity(userEmbedding, jobEmbedding);
    
    // Prevent NaN - if either vector is all zeros, similarity is 0
    if (isNaN(similarity) || !isFinite(similarity)) {
      console.warn('[Job Match] Similarity is NaN, defaulting to 0');
      similarity = 0;
    }
    
    // Boost similarity if user has ANY required skills (direct string matching)
    const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));
    const directMatches = jobRequiredSkills.filter(req => 
      userSkillsLower.has(req.toLowerCase())
    ).length;
    
    if (directMatches > 0 && similarity < 0.3) {
      // Boost base similarity if there are direct skill matches
      const boost = Math.min(0.2, directMatches * 0.05);
      similarity = Math.min(1.0, similarity + boost);
      console.log(`[Job Match] Applied skill match boost: ${directMatches} matches, +${(boost * 100).toFixed(1)}%`);
    }

    // Match skills (simple string matching)
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const requiredSkill of jobRequiredSkills) {
      if (userSkillsLower.has(requiredSkill.toLowerCase())) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    }

    // For weak skills, check if skill exists but user is beginner/intermediate
    // This would need user skill levels to be accurate
    const weakSkills: string[] = [];

    return {
      score: Math.max(0, Math.min(similarity, 1.0)), // Clamp to 0-1
      matchedSkills,
      missingSkills,
      weakSkills,
    };
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private static cosineSimilarity(vec1: number[], vec2: number[]): number {
    const minLength = Math.min(vec1.length, vec2.length);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Generate embedding from job description text
   * Called when a new job is added to the system
   */
  static async embedJobDescription(
    jobId: string,
    jobDescription: string
  ): Promise<number[]> {
    try {
      console.log(`[Job Embedding] Generating embedding for job ${jobId}, text length: ${jobDescription?.length || 0}`);
      const embedding = await this.generateJobEmbedding(jobDescription);
      if (!embedding || embedding.length === 0) {
        throw new Error('Generated embedding is empty');
      }
      this.jobEmbeddingsCache.set(jobId, embedding);
      console.log(`[Job Embedding] ✓ Cached embedding for job ${jobId} (${embedding.length}d)`);
      return embedding;
    } catch (error) {
      console.error(`[Job Embedding] ❌ Error generating embedding for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Clear embedding cache if needed
   */
  static clearCache(): void {
    this.jobEmbeddingsCache.clear();
  }

  /**
   * Get cached embedding for a job
   */
  static getCachedEmbedding(jobId: string): number[] | null {
    return this.jobEmbeddingsCache.get(jobId) || null;
  }
}
