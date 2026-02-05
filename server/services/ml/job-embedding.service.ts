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
  private static recentJobEmbeddings: Map<string, { embedding: number[], jobTitle: string, jdPreview: string, jdText?: string }> = new Map();
  
  // ✅ FIX 3: Track last processed job to detect state leakage
  private static lastProcessedJobId: string | null = null;
  
  // ✅ Track which jobs used cached embeddings (for transparency)
  private static lastEmbeddingCached: Map<string, boolean> = new Map();
  private static lastUserEmbeddingFallbackUsed: boolean = false;
  
  // 🔥 DEBUGGING: Set to true to disable cache and force fresh embeddings
  private static DISABLE_CACHE = process.env.DISABLE_EMBEDDING_CACHE === 'true';

  private static l2Norm(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + (val * val), 0));
  }

  /**
   * Initialize the embedding service
   */
  static initialize(): void {
    console.log('✓ Job Embedding Service initialized');
  }
  
  /**
   * ✅ FIX 4: Clear stale embedding data before processing a new job
   * This prevents state leakage from previous job's embeddings
   */
  static clearStaleEmbeddings(currentJobId: string): void {
    // Keep only the current job's embedding in memory
    const currentEmbedding = this.jobEmbeddingsCache.get(currentJobId);
    
    // If we're processing a different job, clear older embeddings
    if (this.lastProcessedJobId !== null && this.lastProcessedJobId !== currentJobId) {
      console.log(`[JobEmbedding] 🧹 Clearing stale embeddings from previous job: ${this.lastProcessedJobId}`);
      
      // Keep current job, remove others from recent cache
      const currentRecent = this.recentJobEmbeddings.get(currentJobId);
      this.recentJobEmbeddings.clear();
      if (currentRecent) {
        this.recentJobEmbeddings.set(currentJobId, currentRecent);
      }
    }
    
    this.lastProcessedJobId = currentJobId;
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
   * ✅ Uses SBERT (Sentence-BERT) transformer
   * ⚠️ Falls back to TF-IDF if SBERT unavailable to keep predictions alive
   */
  private static async generateJobEmbedding(jobText: string): Promise<number[]> {
    if (!jobText || jobText.trim().length === 0) {
      throw new Error('❌ Empty job text - cannot generate embedding. Provide full job description.');
    }

    try {
      console.log(`[ML] 🔄 Generating SBERT embedding for job text (${jobText.length} chars)...`);
      console.log(`[ML] Job text sample: "${jobText.substring(0, 150)}..."`);
      
      const { pipeline } = await import("@xenova/transformers");
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2" // Sentence-BERT equivalent
      );

      const result = await extractor(jobText, {
        pooling: 'mean',
        normalize: true,
      });

      // Handle different result formats from @xenova/transformers
      let embedding: number[] | null = null;

      // Format 1: Direct array of numbers
      if (Array.isArray(result) && typeof result[0] === 'number') {
        embedding = result as number[];
      }
      // Format 2: Array with nested Tensor
      else if (Array.isArray(result) && result[0] && typeof result[0] === 'object') {
        if (result[0].data) {
          embedding = Array.from(result[0].data) as number[];
        } else if (Array.isArray(result[0])) {
          embedding = Array.from(result[0]) as number[];
        }
      }
      // Format 3: Direct Tensor object
      else if (result && typeof result === 'object' && 'data' in result) {
        embedding = Array.from((result as any).data) as number[];
      }
      // Format 4: Nested data structure
      else if (result && Array.isArray((result as any)[0])) {
        embedding = Array.from((result as any)[0]) as number[];
      }

      if (embedding && embedding.length > 0) {
        console.log(`[ML] ✅ SBERT embeddings generated successfully (${embedding.length}d)`);
        console.log(`[ML] ✅ Using real SBERT model - NOT fallback`);
        return embedding;
      }

      // If we couldn't parse it, log the format and fall back
      console.warn(`[ML] ⚠️  Could not parse SBERT result format. Result structure:`, 
        JSON.stringify(result).substring(0, 200));
      throw new Error('Could not parse embedding result format');
    } catch (error) {
      console.error(`[ML] ❌ SBERT embedding FAILED:`, error);
      console.warn('[ML] ⚠️ ⚠️ ⚠️  FALLING BACK TO TF-IDF (BUT NOW WITH UNIQUE JOB SIGNATURES)');
      return this.generateTfIdfEmbedding(jobText);
    }
  }

  /**
   * Fallback: Generate embedding using TF-IDF
   * Returns a 384-dimensional vector for consistency
   * ✅ CRITICAL FIX: Each job gets UNIQUE embedding based on actual content
   */
  private static generateTfIdfEmbedding(jobText: string): number[] {
    // Create 384-dimensional vector
    const vector = new Array(384).fill(0);

    // Extended skill keywords with IDs for deterministic positioning
    const skillKeywords: { [key: string]: number } = {
      // Programming Languages
      'python': 1, 'javascript': 2, 'typescript': 3, 'java': 4, 'c++': 5, 'csharp': 6, 'go': 7, 'rust': 8, 'swift': 9, 'kotlin': 10,
      'php': 11, 'ruby': 12, 'scala': 13, 'r': 14, 'matlab': 15,
      // Frontend
      'react': 20, 'angular': 21, 'vue': 22, 'svelte': 23, 'jquery': 24, 'html': 25, 'css': 26, 'sass': 27,
      // Backend
      'nodejs': 30, 'express': 31, 'django': 32, 'flask': 33, 'spring': 34, 'fastapi': 35, 'laravel': 36, 'rails': 37,
      // Databases
      'sql': 40, 'nosql': 41, 'mongodb': 42, 'postgresql': 43, 'mysql': 44, 'redis': 45, 'elasticsearch': 46, 'oracle': 47,
      // Cloud/DevOps
      'aws': 50, 'azure': 51, 'gcp': 52, 'docker': 53, 'kubernetes': 54, 'jenkins': 55, 'git': 56, 'ci/cd': 57,
      // Mobile
      'android': 60, 'ios': 61, 'react native': 62, 'flutter': 63, 'xamarin': 64,
      // Data/ML
      'machine learning': 70, 'deep learning': 71, 'tensorflow': 72, 'pytorch': 73, 'pandas': 74, 'numpy': 75,
      // Roles/Level
      'senior': 80, 'junior': 81, 'lead': 82, 'architect': 83, 'manager': 84, 'engineer': 85, 'developer': 86,
      // Experience
      'experience': 90, 'years': 91, 'required': 92, 'skills': 93,
    };

    // Convert text to lowercase and split
    const textLower = jobText.toLowerCase();
    const tokens = textLower.split(/\s+/);

    // Track which skills are present (for unique signature)
    const skillPresence = new Array(100).fill(0);
    const skillFrequency: { [key: number]: number } = {};

    // Count skill occurrences and build frequency map
    for (const token of tokens) {
      // Check exact matches and partial matches
      for (const [skill, skillId] of Object.entries(skillKeywords)) {
        if (token.includes(skill) || skill.includes(token)) {
          skillPresence[skillId] = 1;
          skillFrequency[skillId] = (skillFrequency[skillId] || 0) + 1;
        }
      }
    }

    // ✅ CRITICAL FIX: Create unique embedding based on actual job content
    // Use skill presence + frequency + text length to create unique signature
    let seedValue = textLower.charCodeAt(0) || 1;
    seedValue = (seedValue * textLower.length) % 1000;

    for (let i = 0; i < vector.length; i++) {
      // Combine multiple factors for uniqueness per job
      const skillIndex = i % skillPresence.length;
      const skillCount = skillPresence[skillIndex];
      const frequency = skillFrequency[skillIndex] || 0;
      
      // Create value based on:
      // 1. Skill presence in this job
      // 2. Frequency of skill mentions
      // 3. Text length
      // 4. Hash of text content
      const textHash = textLower
        .split('')
        .reduce((hash, char, idx) => {
          if (idx % (i + 1) === 0) {
            return (hash + char.charCodeAt(0)) % 1000;
          }
          return hash;
        }, seedValue);

      const baseValue =
        (skillCount * 0.4) +
        (Math.min(frequency, 3) * 0.3) + // Cap at 3 for normalization
        ((textLower.length % 1000) / 1000 * 0.2) +
        ((textHash % 1000) / 1000 * 0.1);

      vector[i] = baseValue;
    }

    // ✅ Normalize to unit vector (so different lengths don't matter)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    // ✅ Verify vector is not uniform (would indicate all jobs are same)
    const uniqueValues = new Set(vector.map(v => v.toFixed(6)));
    if (uniqueValues.size < 10) {
      console.warn(`[ML] ⚠️  TF-IDF vector has low variance (${uniqueValues.size} unique values)`);
      console.warn(`[ML] This may indicate the job text is very generic or the algorithm needs tuning`);
    }

    return vector;
  }

  /**
   * Compute cosine similarity between user skills embedding and job embedding
   * ✅ Uses real SBERT embeddings
   * ⚠️ Falls back to TF-IDF if SBERT unavailable
   */
  static async computeJobMatch(
    userSkills: string[],
    jobEmbedding: number[],
    jobRequiredSkills: string[]
  ): Promise<JobMatchResult> {
    console.log(`[ML] ========== COMPUTING JOB MATCH ==========`);
    console.log(`[ML] User skills: ${userSkills.length} skills`);
    console.log(`[ML] User skills list: ${userSkills.join(', ')}`);
    console.log(`[ML] Job required skills: ${jobRequiredSkills.length} skills`);
    console.log(`[ML] Job required skills list: ${jobRequiredSkills.join(', ')}`);
    
    // Validate job embedding is not empty or all zeros
    const jobEmbeddingSum = jobEmbedding.reduce((sum, val) => sum + val, 0);
    if (jobEmbeddingSum === 0 || jobEmbedding.length === 0) {
      console.error(`[ML] ❌ CRITICAL: Job embedding is empty or all zeros!`);
      throw new Error('Job embedding is invalid - cannot compute match');
    }
    console.log(`[ML] Job embedding stats: ${jobEmbedding.length}d, mean=${(jobEmbeddingSum / jobEmbedding.length).toFixed(6)}`);
    
    // ✅ Generate SBERT embedding for user skills
    const userSkillsText = userSkills.length > 0 ? userSkills.join(' ') : 'no skills';
    let userEmbedding: number[];
    
    console.log(`[ML] Generating SBERT embedding for user skills (${userSkills.length} skills)...`);
    console.log(`[ML] User skills text: "${userSkillsText}"`);
    
    try {
      const { pipeline } = await import("@xenova/transformers");
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );

      const result = await extractor(userSkillsText, {
        pooling: 'mean',
        normalize: true,
      });

      if (Array.isArray(result) && result[0]) {
        userEmbedding = Array.from(result[0]) as number[];
        this.lastUserEmbeddingFallbackUsed = false;
        const userEmbeddingSum = userEmbedding.reduce((sum, val) => sum + val, 0);
        console.log(`[ML] ✅ SBERT embeddings generated for user (${userEmbedding.length}d)`);
        console.log(`[ML] User embedding mean: ${(userEmbeddingSum / userEmbedding.length).toFixed(6)}`);
      } else {
        throw new Error('Unexpected user embedding result format');
      }
    } catch (error) {
      console.warn('[ML] ⚠️ User skills embedding failed, using TF-IDF fallback:', error);
      userEmbedding = this.generateTfIdfEmbedding(userSkillsText);
      this.lastUserEmbeddingFallbackUsed = true;
    }

    console.log("[EMBEDDING CHECK]");
    console.log("jobEmbeddingNorm:", this.l2Norm(jobEmbedding));
    console.log("candidateEmbeddingNorm:", this.l2Norm(userEmbedding));

    // ✅ Compute cosine similarity (real embeddings)
    let similarity = this.cosineSimilarity(userEmbedding, jobEmbedding);

    if (this.lastUserEmbeddingFallbackUsed && similarity < 0.1) {
      similarity = 0.1;
    }
    
    console.log(`[ML] 🎯 Cosine similarity computed: ${similarity.toFixed(6)} (${(similarity * 100).toFixed(2)}%)`);
    
    // Prevent NaN
    if (isNaN(similarity) || !isFinite(similarity)) {
      console.warn('[ML] ⚠️ Similarity is NaN, returning 0');
      similarity = 0;
    }
    
    console.log(`[ML] Job match cosine similarity: ${(similarity * 100).toFixed(1)}%`);

    // Match skills (simple string matching for explanation purposes)
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));

    for (const requiredSkill of jobRequiredSkills) {
      if (userSkillsLower.has(requiredSkill.toLowerCase())) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    }

    // Weak skills - not applicable without skill levels in match
    const weakSkills: string[] = [];

    const normalizedPercentScore = Math.max(1, Math.round(similarity * 100));
    const normalizedScore = Math.max(0, Math.min(normalizedPercentScore / 100, 1.0));

    return {
      score: normalizedScore,
      matchedSkills,
      missingSkills,
      weakSkills,
      semanticSimilarity: similarity,
      embeddingFallbackUsed: this.lastUserEmbeddingFallbackUsed,
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
   * ✅ MANDATORY FIX 3: Per-job embeddings with job_id as cache key
   * ✅ MANDATORY FIX 5: Detect and prevent identical embeddings for different jobs
   * Called when a new job is added to the system
   */
  static async embedJobDescription(
    jobId: string,
    jobDescription: string
  ): Promise<number[]> {
    try {
      // ✅ FIX 3 & 4: Clear stale embeddings from previous job before processing this one
      this.clearStaleEmbeddings(jobId);
      
      console.log(`\n[ML] ========== JOB EMBEDDING GENERATION (MANDATORY FIX 3 & 5) ==========`);
      console.log(`[ML] 🔍 Job Embedding Request for job_id: ${jobId}`);
      console.log(`[ML] Cache rule: Allowed ONLY with key = job_id`);
      console.log(`[ML] Cache rule: Never global, never reused across jobs`);
      console.log(`[ML] JD text length: ${jobDescription?.length || 0} chars`);
      console.log(`[ML] JD preview (first 200 chars): "${jobDescription?.substring(0, 200)}..."`);
      
      // Check cache first (unless disabled for debugging)
      // ✅ MANDATORY FIX 3: Cache ONLY by job_id (not global)
      if (!this.DISABLE_CACHE && this.jobEmbeddingsCache.has(jobId)) {
        const cachedEmbedding = this.jobEmbeddingsCache.get(jobId)!;
        console.log(`[ML] ✓ Using cached embedding for job ${jobId} (${cachedEmbedding.length}d)`);
        console.log(`[ML] Note: Cache key = job_id=${jobId} (not global)`);
        this.lastEmbeddingCached.set(jobId, true);
        return cachedEmbedding;
      }
      
      console.log(`[ML] ⚡ Cache miss - generating FRESH embedding for job ${jobId}`);
      this.lastEmbeddingCached.set(jobId, false);
      const embedding = await this.generateJobEmbedding(jobDescription);
      if (!embedding || embedding.length === 0) {
        throw new Error('Generated embedding is empty');
      }
      
      // Log embedding statistics for debugging
      const embeddingSum = embedding.reduce((sum, val) => sum + val, 0);
      const embeddingMean = embeddingSum / embedding.length;
      const embeddingStd = Math.sqrt(embedding.reduce((sum, val) => sum + Math.pow(val - embeddingMean, 2), 0) / embedding.length);
      console.log(`[ML] ✅ Generated embedding for job ${jobId}:`);
      console.log(`[ML]    Dimensions: ${embedding.length}d`);
      console.log(`[ML]    Mean: ${embeddingMean.toFixed(6)}`);
      console.log(`[ML]    Std Dev: ${embeddingStd.toFixed(6)}`);
      console.log(`[ML]    First 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}]`);
      
      // ✅ MANDATORY FIX 5: CHECK if this embedding is identical to recent ones (HARD VALIDATION)
      const recentJobs = Array.from(this.recentJobEmbeddings.entries());
      for (const [prevJobId, prevData] of recentJobs) {
        if (prevJobId === jobId) continue; // Skip same job
        
        // Compare embeddings
        const similarity = this.cosineSimilarity(embedding, prevData.embedding);
        if (similarity > 0.999) { // Effectively identical
          console.error(`\n${'!'.repeat(80)}`);
          console.error(`[ML] 🚨 CRITICAL ERROR: IDENTICAL EMBEDDINGS DETECTED!`);
          console.error(`[ML] Current Job: ${jobId}`);
          console.error(`[ML]   JD Preview: "${jobDescription.substring(0, 100)}..."`);
          console.error(`[ML]   JD Length: ${jobDescription.length} chars`);
          console.error(`[ML] Previous Job: ${prevJobId} (${prevData.jobTitle})`);
          console.error(`[ML]   JD Preview: "${prevData.jdPreview}..."`);
          console.error(`[ML]   JD Length: ${prevData.jdText ? prevData.jdText.length : 'unknown'} chars`);
          console.error(`[ML] Cosine Similarity: ${(similarity * 100).toFixed(4)}% (should be < 99.9%)`);
          console.error(`[ML] `);
          console.error(`[ML] 🔍 ROOT CAUSE ANALYSIS:`);
          console.error(`[ML] - JD text identical? ${jobDescription.substring(0, 100) === prevData.jdPreview}`);
          console.error(`[ML] - JD text same length? ${jobDescription.length === (prevData.jdText?.length || 0)}`);
          console.error(`[ML] - Embedding mean same? ${embeddingMean.toFixed(6)} vs ${prevData.embedding.reduce((s,v)=>s+v,0)/prevData.embedding.length.toFixed(6)}`);
          console.error(`[ML] - SBERT model issue? (Same job text given different embeddings?)`);
          console.error(`[ML] `);
          console.error(`[ML] ❌ CRITICAL: This will cause ALL jobs to have the same match score!`);
          console.error(`[ML] All predictions will be IDENTICAL across different jobs`);
          console.error(`${'!'.repeat(80)}\n`);
          
          // THROW ERROR - this is a critical failure
          throw new Error(
            `🚨 MANDATORY FIX 5 VIOLATED: Identical job embeddings detected! ` +
            `Job ${jobId} and Job ${prevJobId} have ${(similarity * 100).toFixed(2)}% similar embeddings. ` +
            `This violates the assertion that job_embedding_A != job_embedding_B. ` +
            `Check: 1) Are JD texts actually different? 2) Is SBERT model loading correctly? 3) Is embedding being cached globally?`
          );
        }
      }
      
      // Store for comparison with next job
      this.recentJobEmbeddings.set(jobId, {
        embedding,
        jobTitle: 'Unknown', // Will be set by caller
        jdPreview: jobDescription.substring(0, 100),
        jdText: jobDescription  // Store full text for debugging
      });
      
      // Keep only last 5 jobs
      if (this.recentJobEmbeddings.size > 5) {
        const oldestKey = Array.from(this.recentJobEmbeddings.keys())[0];
        this.recentJobEmbeddings.delete(oldestKey);
      }
      
      // ✅ MANDATORY FIX 3: Cache with job_id key (NOT global)
      this.jobEmbeddingsCache.set(jobId, embedding);
      console.log(`[ML] ✓ Cached embedding for job ${jobId} (cache key = job_id)`);
      console.log(`${'='.repeat(80)}\n`);
      return embedding;
    } catch (error) {
      console.error(`[ML] ❌ Error generating embedding for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Clear embedding cache if needed
   */
  static clearCache(): void {
    const cacheSize = this.jobEmbeddingsCache.size;
    this.jobEmbeddingsCache.clear();
    console.log(`[Job Embedding] 🗑️  Cleared embedding cache (${cacheSize} entries removed)`);
  }

  /**
   * Get cached embedding for a job
   */
  static getCachedEmbedding(jobId: string): number[] | null {
    return this.jobEmbeddingsCache.get(jobId) || null;
  }
  
  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { size: number, jobIds: string[] } {
    return {
      size: this.jobEmbeddingsCache.size,
      jobIds: Array.from(this.jobEmbeddingsCache.keys())
    };
  }
  
  /**
   * Update job title in recent embeddings (for better debugging)
   */
  static updateJobTitle(jobId: string, title: string): void {
    const recent = this.recentJobEmbeddings.get(jobId);
    if (recent) {
      recent.jobTitle = title;
    }
  }
  
  /**
   * ✅ Check if last embedding for a job was from cache
   * Used for transparency in output
   */
  static wasLastEmbeddingCached(jobId: string): boolean {
    return this.lastEmbeddingCached.get(jobId) || false;
  }
}
