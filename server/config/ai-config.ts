/**
 * Centralized AI Configuration
 * 
 * IMPORTANT: This is the ONLY place where AI model names should be defined.
 * All services must import from this file.
 * 
 * Why centralized config?
 * - Single point of change when Google updates model availability
 * - Easy to switch models for testing/production
 * - Validates API key at startup (fail fast)
 * - Consistent configuration across all services
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate API key exists
const GEMINI_API_KEY = process.env.Gemini_API_HIREPULSE;
if (!GEMINI_API_KEY) {
  console.warn('[AI Config] GEMINI_API_KEY not set - AI features will use mock responses');
}

/**
 * GEMINI MODEL CONFIGURATION
 * 
 * Current Model: models/gemini-1.5-flash-latest
 * - Fast and efficient
 * - Good for production workloads
 * - Works with most API keys
 * - Best for text generation
 * - Note: Requires "models/" prefix and "-latest" suffix
 * 
 * If you need to change the model:
 * 1. Update GEMINI_MODEL_NAME below
 * 2. Test thoroughly
 * 3. No other files need changes
 * 
 * Available models (as of Jan 2026):
 * - "models/gemini-1.5-flash-latest" - Fast and efficient (RECOMMENDED)
 * - "models/gemini-1.5-pro-latest" - Advanced features
 * - "models/gemini-pro" - Legacy stable model
 * - "models/gemini-pro-vision" - Text + images
 */
export const GEMINI_MODEL_NAME = "models/gemini-1.5-flash-latest";

/**
 * Default generation configuration
 * Applied to all model instances unless overridden
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,        // Balance between creativity and consistency
  topP: 0.95,             // Nucleus sampling threshold
  topK: 40,               // Top-k sampling
  maxOutputTokens: 8192,  // Maximum response length
};

/**
 * Singleton GoogleGenerativeAI instance
 * Reused across all services for efficiency
 */
let genAIInstance: GoogleGenerativeAI | null = null;

/**
 * Get the shared GoogleGenerativeAI instance
 * Creates instance on first call, returns cached instance thereafter
 */
export function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required but not set in environment variables');
    }
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log(`[AI Config] Initialized Google Generative AI with model: ${GEMINI_MODEL_NAME}`);
  }
  return genAIInstance;
}

/**
 * Get a configured Gemini model instance
 * Use this in all services instead of calling genAI.getGenerativeModel directly
 * 
 * @param customConfig - Optional custom generation config (merged with defaults)
 * @returns Configured GenerativeModel instance
 */
export function getGeminiModel(customConfig?: Partial<typeof DEFAULT_GENERATION_CONFIG>) {
  const genAI = getGenAI();
  
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      ...DEFAULT_GENERATION_CONFIG,
      ...customConfig,
    },
  });
}

/**
 * Check if AI features are enabled
 * Returns false if API key is not configured
 */
export function isAIEnabled(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Get AI configuration info for debugging
 */
export function getAIConfigInfo() {
  return {
    enabled: isAIEnabled(),
    model: GEMINI_MODEL_NAME,
    apiKeyConfigured: !!GEMINI_API_KEY,
  };
}
