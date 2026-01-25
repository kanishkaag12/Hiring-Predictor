/**
 * TEXT EMBEDDING SERVICE
 * 
 * Provides text vectorization for semantic similarity matching.
 * Uses TF-IDF based approach for lightweight, no-external-dependency embedding.
 * 
 * Features:
 * - TF-IDF vectorization for documents
 * - Cosine similarity calculation
 * - N-gram support for better phrase matching
 * - Stopword removal
 * - Term frequency normalization
 */

// Common English stopwords to filter out
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now', 'also',
  'am', 'been', 'being', 'do', 'does', 'did', 'doing', 'would', 'could', 'might',
  'must', 'shall', 'into', 'about', 'over', 'after', 'before', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'any', 'if', 'or', 'because', 'until', 'while', 'during', 'throughout', 'above',
  'below', 'up', 'down', 'out', 'off', 'through', 'i', 'me', 'my', 'myself', 'we',
  'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'whom', 'these', 'those'
]);

export interface TextVector {
  terms: Map<string, number>;
  magnitude: number;
}

export interface SimilarityResult {
  score: number;
  matchedTerms: string[];
}

/**
 * Text Embedding Service
 * Converts text to vectors and computes similarity
 */
export class TextEmbeddingService {
  private vocabulary: Map<string, number> = new Map();
  private idfScores: Map<string, number> = new Map();
  private documentCount: number = 0;

  /**
   * Tokenize and normalize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s\+\#\.]/g, ' ')
      .split(/\s+/)
      .filter(token => 
        token.length > 1 && 
        !STOPWORDS.has(token) &&
        !/^\d+$/.test(token)
      );
  }

  /**
   * Generate n-grams from tokens
   */
  private generateNgrams(tokens: string[], n: number = 2): string[] {
    const ngrams: string[] = [...tokens]; // Include unigrams
    
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join('_'));
    }
    
    return ngrams;
  }

  /**
   * Calculate term frequency
   */
  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    
    // Normalize by document length
    const tfValues = Array.from(tf.values());
    const maxFreq = Math.max(...tfValues);
    Array.from(tf.entries()).forEach(([term, freq]) => {
      tf.set(term, freq / maxFreq);
    });
    
    return tf;
  }

  /**
   * Build vocabulary and IDF from a corpus of documents
   */
  buildVocabulary(documents: string[]): void {
    this.vocabulary.clear();
    this.idfScores.clear();
    this.documentCount = documents.length;
    
    const documentFrequency = new Map<string, number>();
    
    // Count document frequency for each term
    for (const doc of documents) {
      const tokens = this.tokenize(doc);
      const ngrams = this.generateNgrams(tokens);
      const uniqueTerms = Array.from(new Set(ngrams));
      
      for (const term of uniqueTerms) {
        documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
        
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }
      }
    }
    
    // Calculate IDF scores
    Array.from(documentFrequency.entries()).forEach(([term, df]) => {
      const idf = Math.log((this.documentCount + 1) / (df + 1)) + 1;
      this.idfScores.set(term, idf);
    });
  }

  /**
   * Convert text to TF-IDF vector
   */
  textToVector(text: string): TextVector {
    const tokens = this.tokenize(text);
    const ngrams = this.generateNgrams(tokens);
    const tf = this.calculateTF(ngrams);
    
    const terms = new Map<string, number>();
    let magnitudeSum = 0;
    
    Array.from(tf.entries()).forEach(([term, tfScore]) => {
      const idf = this.idfScores.get(term) || Math.log(this.documentCount + 1);
      const tfidf = tfScore * idf;
      
      terms.set(term, tfidf);
      magnitudeSum += tfidf * tfidf;
    });
    
    return {
      terms,
      magnitude: Math.sqrt(magnitudeSum)
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: TextVector, vecB: TextVector): SimilarityResult {
    if (vecA.magnitude === 0 || vecB.magnitude === 0) {
      return { score: 0, matchedTerms: [] };
    }
    
    let dotProduct = 0;
    const matchedTerms: string[] = [];
    
    Array.from(vecA.terms.entries()).forEach(([term, weightA]) => {
      const weightB = vecB.terms.get(term);
      if (weightB) {
        dotProduct += weightA * weightB;
        matchedTerms.push(term);
      }
    });
    
    const similarity = dotProduct / (vecA.magnitude * vecB.magnitude);
    
    return {
      score: Math.max(0, Math.min(1, similarity)),
      matchedTerms
    };
  }

  /**
   * Calculate similarity between two texts
   */
  calculateTextSimilarity(textA: string, textB: string): SimilarityResult {
    const vecA = this.textToVector(textA);
    const vecB = this.textToVector(textB);
    return this.cosineSimilarity(vecA, vecB);
  }

  /**
   * Find most similar documents from a corpus
   */
  findMostSimilar(
    query: string, 
    corpus: Array<{ id: string; text: string }>,
    topK: number = 5
  ): Array<{ id: string; similarity: number; matchedTerms: string[] }> {
    const queryVector = this.textToVector(query);
    
    const results = corpus.map(doc => {
      const docVector = this.textToVector(doc.text);
      const similarity = this.cosineSimilarity(queryVector, docVector);
      
      return {
        id: doc.id,
        similarity: similarity.score,
        matchedTerms: similarity.matchedTerms
      };
    });
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

/**
 * Semantic Similarity using keyword overlap with weighting
 * Lightweight alternative when TF-IDF vocabulary is not built
 */
export class KeywordMatcher {
  
  /**
   * Extract key phrases and skills from text
   */
  extractKeyPhrases(text: string): Set<string> {
    const normalized = text.toLowerCase();
    const phrases = new Set<string>();
    
    // Common skill patterns
    const skillPatterns = [
      // Programming languages
      /\b(python|java|javascript|typescript|c\+\+|c#|ruby|go|rust|php|swift|kotlin|scala|r)\b/gi,
      // Frameworks
      /\b(react|angular|vue|django|flask|spring|express|node\.?js|\.net|rails)\b/gi,
      // Databases
      /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch|oracle|cassandra)\b/gi,
      // Cloud
      /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins|ci\/cd)\b/gi,
      // Data/ML
      /\b(machine learning|deep learning|tensorflow|pytorch|pandas|numpy|scikit|nlp|computer vision)\b/gi,
      // Design
      /\b(figma|sketch|adobe|photoshop|illustrator|ux|ui|wireframe|prototype)\b/gi,
      // Business
      /\b(excel|powerpoint|tableau|power bi|sap|salesforce|crm|erp)\b/gi,
      // Soft skills
      /\b(leadership|communication|teamwork|problem solving|analytical|project management)\b/gi,
    ];
    
    for (const pattern of skillPatterns) {
      const matches = normalized.match(pattern);
      if (matches) {
        matches.forEach(m => phrases.add(m.toLowerCase()));
      }
    }
    
    // Also add individual significant words
    const words = normalized
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));
    
    words.forEach(w => phrases.add(w));
    
    return phrases;
  }

  /**
   * Calculate weighted keyword overlap
   */
  calculateOverlap(textA: string, textB: string): { score: number; matches: string[] } {
    const phrasesA = this.extractKeyPhrases(textA);
    const phrasesB = this.extractKeyPhrases(textB);
    
    const matches: string[] = [];
    const phrasesAArray = Array.from(phrasesA);
    const phrasesBArray = Array.from(phrasesB);
    
    for (const phrase of phrasesAArray) {
      if (phrasesB.has(phrase)) {
        matches.push(phrase);
      }
    }
    
    // Jaccard-like similarity with size normalization
    const combinedPhrases = [...phrasesAArray, ...phrasesBArray];
    const union = new Set(combinedPhrases).size;
    const intersection = matches.length;
    
    // Weight by how well B covers A (important for query → document matching)
    const coverageA = phrasesA.size > 0 ? intersection / phrasesA.size : 0;
    const coverageB = phrasesB.size > 0 ? intersection / phrasesB.size : 0;
    
    // Combined score emphasizing query coverage
    const score = (coverageA * 0.7) + (coverageB * 0.3);
    
    return { score: Math.min(1, score), matches };
  }
}

/**
 * Combined embedding service for role matching
 */
export class RoleEmbeddingService {
  private tfidfService: TextEmbeddingService;
  private keywordMatcher: KeywordMatcher;
  private isVocabularyBuilt: boolean = false;

  constructor() {
    this.tfidfService = new TextEmbeddingService();
    this.keywordMatcher = new KeywordMatcher();
  }

  /**
   * Initialize with role corpus
   */
  initialize(roleDescriptions: string[]): void {
    this.tfidfService.buildVocabulary(roleDescriptions);
    this.isVocabularyBuilt = true;
  }

  /**
   * Calculate combined similarity score
   */
  calculateSimilarity(resumeText: string, roleText: string): {
    score: number;
    tfidfScore: number;
    keywordScore: number;
    matchedTerms: string[];
  } {
    // Keyword-based similarity (always available)
    const keywordResult = this.keywordMatcher.calculateOverlap(resumeText, roleText);
    
    // TF-IDF similarity (if vocabulary is built)
    let tfidfScore = 0;
    let tfidfTerms: string[] = [];
    
    if (this.isVocabularyBuilt) {
      const tfidfResult = this.tfidfService.calculateTextSimilarity(resumeText, roleText);
      tfidfScore = tfidfResult.score;
      tfidfTerms = tfidfResult.matchedTerms;
    }
    
    // Combine scores (weight keyword matching more heavily for explainability)
    const combinedScore = this.isVocabularyBuilt
      ? (keywordResult.score * 0.6) + (tfidfScore * 0.4)
      : keywordResult.score;
    
    // Merge matched terms
    const allMatches = new Set([...keywordResult.matches, ...tfidfTerms]);
    
    return {
      score: combinedScore,
      tfidfScore,
      keywordScore: keywordResult.score,
      matchedTerms: Array.from(allMatches)
    };
  }
}

export default RoleEmbeddingService;
