/**
 * ML ROLE PREDICTOR SERVICE
 * 
 * Background-agnostic role prediction using semantic similarity.
 * Predicts relevant job roles for users from ANY background without
 * relying on fixed role definitions or degree-based assumptions.
 * 
 * Features:
 * - Semantic matching between resume content and job roles
 * - Probabilistic predictions (not deterministic)
 * - Cluster-based role grouping
 * - Explainable outputs (why each role is suggested)
 * - Dynamic role emergence based on skill patterns
 * - Fallback to rule-based matching when needed
 */

import { RoleEmbeddingService } from './embedding.service';
import { JOB_ROLE_CORPUS, JobRole, JOB_ROLE_CLUSTERS } from './job-role-corpus';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RolePrediction {
  roleId: string;
  roleTitle: string;
  cluster: string;
  probability: number;  // 0-1 calibrated fit score (displayed to user)
  confidence: 'high' | 'medium' | 'low';
  matchedSkills: string[];
  matchedKeywords: string[];
  explanation: string;
  reasons: string[];
  rawSimilarity?: number;  // Internal: raw semantic similarity (not displayed)
}

export interface ClusterPrediction {
  cluster: string;
  probability: number;
  topRoles: RolePrediction[];
  explanation: string;
}

export interface PredictionResult {
  // Top role predictions across all clusters
  topRoles: RolePrediction[];
  
  // Cluster-level predictions
  clusterPredictions: ClusterPrediction[];
  
  // Cross-domain roles for hybrid profiles
  crossDomainRoles: RolePrediction[];
  
  // Skills that contributed most to predictions
  keySkillsIdentified: string[];
  
  // Career trajectory suggestions
  careerPaths: Array<{
    currentFit: string;
    growthPath: string[];
    requiredSkills: string[];
  }>;
  
  // Metadata
  modelVersion: string;
  timestamp: Date;
  inputSummary: {
    skillCount: number;
    experienceSignals: number;
    educationSignals: number;
  };
}

export interface ResumeInput {
  skills: string[];
  rawText?: string;
  education?: Array<{
    degree?: string;
    institution?: string;
    field?: string;
  }>;
  experienceMonths?: number;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
  }>;
  experiences?: Array<{
    title?: string;
    company?: string;
    description?: string;
  }>;
  // User context for calibration
  userLevel?: 'student' | 'fresher' | 'junior' | 'mid' | 'senior';
  resumeQualityScore?: number;  // 0-1 completeness/quality from parser
  projectsCount?: number;
  educationDegree?: string;
}

// ============================================================================
// ML ROLE PREDICTOR
// ============================================================================

export class MLRolePredictor {
  private embeddingService: RoleEmbeddingService;
  private roleCorpus: JobRole[];
  private isInitialized: boolean = false;

  constructor() {
    this.embeddingService = new RoleEmbeddingService();
    this.roleCorpus = JOB_ROLE_CORPUS;
  }

  /**
   * Initialize the predictor with role corpus
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Build vocabulary from all role descriptions and keywords
    const roleDescriptions = this.roleCorpus.map(role =>
      `${role.title} ${role.description} ${role.keySkills.join(' ')} ${role.keywords.join(' ')}`
    );

    this.embeddingService.initialize(roleDescriptions);
    this.isInitialized = true;
  }

  /**
   * Predict roles for a given resume
   */
  predictRoles(input: ResumeInput): PredictionResult {
    this.initialize();

    // Build comprehensive resume text from all inputs
    const resumeText = this.buildResumeText(input);

    // Calculate similarity with each role
    const roleSimilarities = this.calculateRoleSimilarities(resumeText, input.skills);

    // Convert to predictions with explanations
    const allPredictions = this.generatePredictions(roleSimilarities, input);

    // Apply domain guardrails to keep recommendations relevant
    let predictions = this.applyDomainGuardrails(input, allPredictions);

    // Calibrate fit scores to reflect readiness at user's career stage, not raw similarity
    predictions = this.calibrateFitScores(predictions, input);

    // Group by cluster
    const clusterPredictions = this.groupByCluster(predictions);

    // Identify cross-domain roles
    const crossDomainRoles = this.identifyCrossDomainRoles(predictions);

    // Extract key skills
    const keySkillsIdentified = this.extractKeySkills(predictions);

    // Generate career paths
    const careerPaths = this.suggestCareerPaths(predictions, input);

    return {
      topRoles: predictions.slice(0, 10),
      clusterPredictions,
      crossDomainRoles,
      keySkillsIdentified,
      careerPaths,
      modelVersion: '1.0.0-calibrated',
      timestamp: new Date(),
      inputSummary: {
        skillCount: input.skills.length,
        experienceSignals: input.experienceMonths || 0,
        educationSignals: input.education?.length || 0
      }
    };
  }

  /**
   * Build comprehensive text from resume inputs
   */
  private buildResumeText(input: ResumeInput): string {
    const parts: string[] = [];

    // Add skills
    if (input.skills.length > 0) {
      parts.push(input.skills.join(' '));
    }

    // Add raw text if available
    if (input.rawText) {
      parts.push(input.rawText);
    }

    // Add education context
    if (input.education) {
      for (const edu of input.education) {
        if (edu.degree) parts.push(edu.degree);
        if (edu.field) parts.push(edu.field);
        if (edu.institution) parts.push(edu.institution);
      }
    }

    // Add project context
    if (input.projects) {
      for (const project of input.projects) {
        parts.push(project.name);
        if (project.description) parts.push(project.description);
        if (project.technologies) parts.push(project.technologies.join(' '));
      }
    }

    return parts.join(' ');
  }

  /**
   * Calculate similarity scores for all roles
   */
  private calculateRoleSimilarities(
    resumeText: string,
    skills: string[]
  ): Array<{
    role: JobRole;
    similarity: number;
    matchedTerms: string[];
    skillMatches: string[];
  }> {
    const results: Array<{
      role: JobRole;
      similarity: number;
      matchedTerms: string[];
      skillMatches: string[];
    }> = [];

    const skillsLower = skills.map(s => s.toLowerCase());

    for (const role of this.roleCorpus) {
      // Build role text for comparison
      const roleText = `${role.title} ${role.description} ${role.keySkills.join(' ')} ${role.keywords.join(' ')}`;

      // Calculate semantic similarity
      const embeddingResult = this.embeddingService.calculateSimilarity(resumeText, roleText);

      // Direct skill matching bonus
      const skillMatches = role.keySkills.filter(rs =>
        skillsLower.some(us => 
          us.includes(rs.toLowerCase()) || rs.toLowerCase().includes(us)
        )
      );

      // Keyword matching bonus
      const keywordMatches = role.keywords.filter(kw =>
        skillsLower.some(us => 
          us.includes(kw.toLowerCase()) || kw.toLowerCase().includes(us)
        )
      );

      // Combined score with bonuses
      const skillBonus = Math.min(0.3, skillMatches.length * 0.1);
      const keywordBonus = Math.min(0.2, keywordMatches.length * 0.05);
      
      const finalSimilarity = Math.min(1, 
        embeddingResult.score + skillBonus + keywordBonus
      );

      results.push({
        role,
        similarity: finalSimilarity,
        matchedTerms: embeddingResult.matchedTerms,
        skillMatches
      });
    }

    // Sort by similarity descending
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Generate predictions with explanations
   */
  private generatePredictions(
    similarities: Array<{
      role: JobRole;
      similarity: number;
      matchedTerms: string[];
      skillMatches: string[];
    }>,
    input: ResumeInput
  ): RolePrediction[] {
    return similarities.map(({ role, similarity, matchedTerms, skillMatches }) => {
      const confidence = this.getConfidenceLevel(similarity);
      const explanation = this.generateExplanation(role, skillMatches, matchedTerms, similarity);
      const reasons = this.generateReasons(role, skillMatches, matchedTerms, input);

      return {
        roleId: role.id,
        roleTitle: role.title,
        cluster: role.cluster,
        probability: Math.round(similarity * 100) / 100,
        confidence,
        matchedSkills: skillMatches,
        matchedKeywords: matchedTerms.filter(t => !skillMatches.includes(t)).slice(0, 5),
        explanation,
        reasons,
        rawSimilarity: similarity  // Store for later calibration
      };
    });
  }

  /**
   * Get confidence level from probability
   */
  private getConfidenceLevel(probability: number): 'high' | 'medium' | 'low' {
    if (probability >= 0.6) return 'high';
    if (probability >= 0.35) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable explanation (initial; will be replaced by calibration)
   */
  private generateExplanation(
    role: JobRole,
    skillMatches: string[],
    matchedTerms: string[],
    similarity: number
  ): string {
    const percentage = Math.round(similarity * 100);

    if (skillMatches.length >= 3) {
      return `Potential match for ${role.title} based on your skills in ${skillMatches.slice(0, 3).join(', ')}.`;
    }

    if (skillMatches.length > 0) {
      return `Potential match for ${role.title}. Your ${skillMatches[0]} skills are relevant to this role.`;
    }

    if (matchedTerms.length > 0) {
      return `Potential match for ${role.title} based on your experience with ${matchedTerms.slice(0, 2).join(' and ')}.`;
    }

    return `Potential match for ${role.title} worth exploring as you develop your career.`;
  }

  /**
   * Generate specific reasons for the match
   */
  private generateReasons(
    role: JobRole,
    skillMatches: string[],
    matchedTerms: string[],
    input: ResumeInput
  ): string[] {
    const reasons: string[] = [];

    // Skill-based reasons
    if (skillMatches.length > 0) {
      reasons.push(`You have ${skillMatches.length} skills that directly match this role: ${skillMatches.slice(0, 4).join(', ')}`);
    }

    // Experience-based reasons
    if (input.experienceMonths && input.experienceMonths > 0) {
      const years = Math.floor(input.experienceMonths / 12);
      if (years > 0) {
        reasons.push(`Your ${years}+ years of experience is valuable for this role`);
      }
    }

    // Project-based reasons
    if (input.projects && input.projects.length > 0) {
      reasons.push(`Your ${input.projects.length} projects demonstrate hands-on experience`);
    }

    // Keyword-based reasons
    if (matchedTerms.length > 2) {
      reasons.push(`Your profile mentions relevant terms: ${matchedTerms.slice(0, 3).join(', ')}`);
    }

    // Industry alignment
    if (role.industries.length > 0 && role.industries[0] !== 'All Industries') {
      reasons.push(`This role is common in: ${role.industries.slice(0, 2).join(', ')}`);
    }

    // Fallback reason
    if (reasons.length === 0) {
      reasons.push(`Based on semantic analysis of your profile and market data`);
    }

    return reasons;
  }

  /**
   * Group predictions by cluster
   */
  private groupByCluster(predictions: RolePrediction[]): ClusterPrediction[] {
    const clusterMap = new Map<string, RolePrediction[]>();

    for (const pred of predictions) {
      const existing = clusterMap.get(pred.cluster) || [];
      existing.push(pred);
      clusterMap.set(pred.cluster, existing);
    }

    const clusterPredictions: ClusterPrediction[] = [];

    for (const cluster of JOB_ROLE_CLUSTERS) {
      const roles = clusterMap.get(cluster) || [];
      if (roles.length === 0) continue;

      // Calculate cluster probability as weighted average of top roles
      const topRoles = roles.slice(0, 3);
      const clusterProb = topRoles.reduce((sum, r) => sum + r.probability, 0) / topRoles.length;

      clusterPredictions.push({
        cluster,
        probability: Math.round(clusterProb * 100) / 100,
        topRoles: topRoles,
        explanation: this.generateClusterExplanation(cluster, topRoles)
      });
    }

    return clusterPredictions
      .filter(c => c.probability > 0.1)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 6);
  }

  /**
   * Generate cluster explanation
   */
  private generateClusterExplanation(cluster: string, topRoles: RolePrediction[]): string {
    const avgProb = Math.round(topRoles.reduce((s, r) => s + r.probability, 0) / topRoles.length * 100);
    const roleNames = topRoles.slice(0, 2).map(r => r.roleTitle).join(' and ');
    
    return `${avgProb}% affinity with ${cluster}. Best fits: ${roleNames}.`;
  }

  /**
   * Identify cross-domain roles for hybrid profiles
   */
  private identifyCrossDomainRoles(predictions: RolePrediction[]): RolePrediction[] {
    // Find predictions that span multiple clusters
    const clusterCounts = new Map<string, number>();
    
    for (const pred of predictions.slice(0, 15)) {
      const count = clusterCounts.get(pred.cluster) || 0;
      clusterCounts.set(pred.cluster, count + 1);
    }

    // If user has strong signals in multiple clusters, suggest bridge roles
    const strongClusters = Array.from(clusterCounts.entries())
      .filter(([, count]) => count >= 2)
      .map(([cluster]) => cluster);

    if (strongClusters.length >= 2) {
      // Find roles that could bridge these domains
      return predictions
        .filter(p => strongClusters.includes(p.cluster) && p.probability > 0.3)
        .slice(0, 3);
    }

    return [];
  }

  /**
   * Domain guardrails: keep roles within relevant professional domains unless strong signals.
   */
  private applyDomainGuardrails(input: ResumeInput, predictions: RolePrediction[]): RolePrediction[] {
    const irrelevantClusters = new Set<string>(['Skilled Trades', 'Hospitality & Service']);
    return predictions.filter(p => {
      if (!irrelevantClusters.has(p.cluster)) return true;
      const hasSignals = (p.matchedSkills && p.matchedSkills.length > 0) || (p.matchedKeywords && p.matchedKeywords.length > 0);
      return hasSignals && p.probability >= 0.25;
    });
  }

  /**
   * Calibrate fit scores to reflect user readiness at their career stage.
   * Normalizes raw similarity into meaningful, motivating percentages.
   */
  private calibrateFitScores(predictions: RolePrediction[], input: ResumeInput): RolePrediction[] {
    const userLevel = input.userLevel || 'fresher';
    const resumeQuality = input.resumeQualityScore || 0.5;
    const skillCount = input.skills?.length || 0;
    const hasProjects = (input.projectsCount || 0) > 0;
    const months = input.experienceMonths || 0;
    const isStudent = userLevel === 'student';
    const isEarly = months < 12;

    // Entry-level benchmark: raw similarity thresholds for student/fresher profiles
    const entryLevelBenchmark = isStudent ? 0.15 : isEarly ? 0.20 : 0.25;

    return predictions.map(p => {
      const raw = p.rawSimilarity || p.probability;
      let calibrated = raw;
      let confidence: 'high' | 'medium' | 'low' = 'low';

      if (isStudent || isEarly) {
        // For students/early-career: shift scale so entry-level roles appear achievable
        if (raw >= entryLevelBenchmark) {
          const normalized = (raw - entryLevelBenchmark) / (1 - entryLevelBenchmark);
          calibrated = 0.40 + (normalized * 0.50);  // Map to 40-90%
        } else {
          calibrated = 0.20 + (raw * 0.20);  // Below threshold: 20-40%
        }
        // Resume quality bonus
        if (resumeQuality > 0.6 && skillCount >= 5 && hasProjects) {
          calibrated = Math.min(0.85, calibrated + 0.10);
        }
      } else {
        // For professionals: standard mapping
        calibrated = raw;
        if (resumeQuality > 0.7 && skillCount >= 8) {
          calibrated = Math.min(0.9, calibrated + 0.08);
        }
      }

      // Confidence bands
      const displayPercentage = Math.round(calibrated * 100);
      if (displayPercentage >= 65) confidence = 'high';
      else if (displayPercentage >= 40) confidence = 'medium';
      else confidence = 'low';

      return {
        ...p,
        probability: calibrated,
        confidence,
        explanation: this.generateCalibratedExplanation(p, calibrated, input, displayPercentage)
      };
    });
  }

  /**
   * Generate calibrated, motivating explanation
   */
  private generateCalibratedExplanation(
    prediction: RolePrediction,
    calibratedScore: number,
    input: ResumeInput,
    displayPercentage: number
  ): string {
    const userLevel = input.userLevel || 'fresher';
    const isStudent = userLevel === 'student';
    const months = input.experienceMonths || 0;

    if (displayPercentage >= 70) {
      if (prediction.matchedSkills.length >= 3) {
        return `Strong ${displayPercentage}% fit for ${prediction.roleTitle}. Your ${prediction.matchedSkills.slice(0, 3).join(', ')} skills align well.`;
      }
      return `Strong ${displayPercentage}% fit for ${prediction.roleTitle}${isStudent ? ' at your stage' : ''}. Solid foundational skills for this path.`;
    }

    if (displayPercentage >= 45) {
      if (isStudent) {
        return `Good ${displayPercentage}% match for ${prediction.roleTitle}. As a student, this is achievable with focused development in ${prediction.matchedKeywords?.[0] || 'key areas'}.`;
      }
      if (prediction.matchedSkills.length > 0) {
        return `Solid ${displayPercentage}% match for ${prediction.roleTitle}. Your ${prediction.matchedSkills[0]} background is valuable; growing ${prediction.matchedKeywords?.[0] || 'supporting skills'} would strengthen your fit.`;
      }
      return `${displayPercentage}% fit for ${prediction.roleTitle}. Targeted skill development would boost your readiness.`;
    }

    return `${displayPercentage}% potential fit for ${prediction.roleTitle}. Worth exploring as you build expertise in ${prediction.matchedKeywords?.[0] || 'this domain'}.`;
  }

  /**
   * Extract key skills that drove predictions
   */
  private extractKeySkills(predictions: RolePrediction[]): string[] {
    const skillCounts = new Map<string, number>();

    for (const pred of predictions.slice(0, 10)) {
      for (const skill of pred.matchedSkills) {
        const count = skillCounts.get(skill) || 0;
        skillCounts.set(skill, count + pred.probability);
      }
    }

    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);
  }

  /**
   * Suggest career growth paths
   */
  private suggestCareerPaths(
    predictions: RolePrediction[],
    input: ResumeInput
  ): Array<{
    currentFit: string;
    growthPath: string[];
    requiredSkills: string[];
  }> {
    const paths: Array<{
      currentFit: string;
      growthPath: string[];
      requiredSkills: string[];
    }> = [];

    const topRole = predictions[0];
    if (!topRole) return paths;

    // Define career progressions
    const careerProgressions: Record<string, { growth: string[]; skills: string[] }> = {
      'Software Engineer': {
        growth: ['Senior Software Engineer', 'Staff Engineer', 'Engineering Manager'],
        skills: ['System Design', 'Leadership', 'Architecture']
      },
      'Data Analyst': {
        growth: ['Senior Data Analyst', 'Data Scientist', 'Analytics Manager'],
        skills: ['Machine Learning', 'Python', 'Statistical Modeling']
      },
      'Product Manager': {
        growth: ['Senior PM', 'Director of Product', 'VP of Product'],
        skills: ['Strategy', 'Leadership', 'Data Analysis']
      },
      'UX Designer': {
        growth: ['Senior UX Designer', 'UX Lead', 'Design Director'],
        skills: ['Design Systems', 'User Research', 'Leadership']
      },
      'Marketing Manager': {
        growth: ['Senior Marketing Manager', 'Director of Marketing', 'CMO'],
        skills: ['Analytics', 'Strategy', 'Leadership']
      }
    };

    const progression = careerProgressions[topRole.roleTitle];
    if (progression) {
      paths.push({
        currentFit: topRole.roleTitle,
        growthPath: progression.growth,
        requiredSkills: progression.skills
      });
    } else {
      // Generic progression
      paths.push({
        currentFit: topRole.roleTitle,
        growthPath: [`Senior ${topRole.roleTitle}`, `Lead ${topRole.roleTitle}`],
        requiredSkills: ['Leadership', 'Domain Expertise', 'Strategic Thinking']
      });
    }

    return paths;
  }

  /**
   * Analyze a specific role against user's profile and generate detailed alignment insights.
   * Used for user-selected roles that may not be in top predictions.
   * Returns: alignment status, gap analysis, supporting skills, and growth pathways.
   */
  analyzeRoleAlignment(
    roleName: string,
    input: ResumeInput
  ): {
    roleTitle: string;
    alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage';
    confidence: 'high' | 'medium' | 'low';
    probability: number;
    matchedSkills: string[];
    matchedKeywords: string[];
    growthAreas: string[];
    explanation: string;
    constructiveGuidance: string;
  } {
    // Find the role in the corpus
    const targetRole = this.roleCorpus.find(
      r => r.title.toLowerCase() === roleName.toLowerCase()
    );

    // Build resume text for comparison
    const resumeText = this.buildResumeText(input);
    const skills = input.skills || [];

    if (!targetRole) {
      // Role not found in corpus - still analyze by semantic similarity
      return this.analyzeUnknownRole(roleName, resumeText, skills, input);
    }

    // Calculate similarity for this specific role
    const roleText = `${targetRole.title} ${targetRole.description} ${targetRole.keySkills.join(' ')} ${targetRole.keywords.join(' ')}`;
    const embeddingResult = this.embeddingService.calculateSimilarity(resumeText, roleText);
    let similarity = embeddingResult.score;

    // Direct skill matching
    const skillsLower = skills.map(s => s.toLowerCase());
    const matchedSkills = targetRole.keySkills.filter(rs =>
      skillsLower.some(us =>
        us.includes(rs.toLowerCase()) || rs.toLowerCase().includes(us)
      )
    );

    // Find missing key skills (growth areas)
    const missingSkills = targetRole.keySkills.filter(
      rs => !skillsLower.some(us =>
        us.includes(rs.toLowerCase()) || rs.toLowerCase().includes(us)
      )
    );

    // Keyword matching
    const matchedKeywords = targetRole.keywords.filter(k =>
      resumeText.toLowerCase().includes(k.toLowerCase())
    );

    // Keyword gaps (growth areas)
    const missingKeywords = targetRole.keywords.filter(
      k => !resumeText.toLowerCase().includes(k.toLowerCase())
    ).slice(0, 3);

    // Apply calibration to get meaningful probability
    const calibratedPreds = this.calibrateFitScores(
      [{
        roleId: targetRole.id,
        roleTitle: targetRole.title,
        cluster: targetRole.cluster,
        probability: similarity,
        confidence: 'medium',
        matchedSkills,
        matchedKeywords,
        explanation: '',
        reasons: [],
        rawSimilarity: similarity
      }],
      input
    );

    const calibrated = calibratedPreds[0];
    const probability = calibrated.probability;
    const displayPercentage = Math.round(probability * 100);

    // Determine alignment status based on confidence + context
    let alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage';
    const userLevel = input.userLevel || 'fresher';
    const isStudent = userLevel === 'student';

    if (displayPercentage >= 70) {
      alignmentStatus = 'Strong Fit';
    } else if (displayPercentage >= 45 || (isStudent && matchedSkills.length >= 2)) {
      alignmentStatus = 'Growing Fit';
    } else {
      alignmentStatus = 'Early Stage';
    }

    // Generate growth areas text
    const topGrowthAreas = missingSkills.length > 0
      ? missingSkills.slice(0, 3)
      : missingKeywords.slice(0, 3);

    // Generate constructive guidance
    const constructiveGuidance = this.generateConstructiveGuidance(
      alignmentStatus,
      matchedSkills,
      topGrowthAreas,
      targetRole.title,
      isStudent
    );

    return {
      roleTitle: targetRole.title,
      alignmentStatus,
      confidence: calibrated.confidence,
      probability,
      matchedSkills: matchedSkills.slice(0, 5),
      matchedKeywords: matchedKeywords.slice(0, 3),
      growthAreas: topGrowthAreas,
      explanation: calibrated.explanation,
      constructiveGuidance
    };
  }

  /**
   * Analyze a role not in our corpus (fallback for custom user interests)
   */
  private analyzeUnknownRole(
    roleName: string,
    resumeText: string,
    skills: string[],
    input: ResumeInput
  ): {
    roleTitle: string;
    alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage';
    confidence: 'high' | 'medium' | 'low';
    probability: number;
    matchedSkills: string[];
    matchedKeywords: string[];
    growthAreas: string[];
    explanation: string;
    constructiveGuidance: string;
  } {
    // For unknown roles, use semantic similarity against role name and description
    const roleText = roleName;
    const embeddingResult = this.embeddingService.calculateSimilarity(resumeText, roleText);
    let similarity = embeddingResult.score || 0.2;

    // If similarity is very low, assume minimal match
    if (similarity < 0.15) similarity = 0.15;

    // Apply calibration
    const calibratedPreds = this.calibrateFitScores(
      [{
        roleId: 'unknown',
        roleTitle: roleName,
        cluster: 'Professional Services',
        probability: similarity,
        confidence: 'medium',
        matchedSkills: [],
        matchedKeywords: [],
        explanation: '',
        reasons: [],
        rawSimilarity: similarity
      }],
      input
    );

    const calibrated = calibratedPreds[0];
    const probability = calibrated.probability;
    const displayPercentage = Math.round(probability * 100);

    // Determine alignment status
    let alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage';
    if (displayPercentage >= 70) {
      alignmentStatus = 'Strong Fit';
    } else if (displayPercentage >= 45) {
      alignmentStatus = 'Growing Fit';
    } else {
      alignmentStatus = 'Early Stage';
    }

    return {
      roleTitle: roleName,
      alignmentStatus,
      confidence: calibrated.confidence,
      probability,
      matchedSkills: skills.slice(0, 5),
      matchedKeywords: [],
      growthAreas: ['Explore role requirements', 'Build domain-specific expertise'],
      explanation: calibrated.explanation,
      constructiveGuidance: `This is a great goal to work towards. Focus on understanding what ${roleName} roles require and building those skills incrementally.`
    };
  }

  /**
   * Generate constructive, motivating guidance based on alignment status
   */
  private generateConstructiveGuidance(
    alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage',
    matchedSkills: string[],
    growthAreas: string[],
    roleTitle: string,
    isStudent: boolean
  ): string {
    if (alignmentStatus === 'Strong Fit') {
      return `Excellent alignment! Your ${matchedSkills.slice(0, 2).join(' and ')} skills are exactly what ${roleTitle} roles need. Focus on deepening your expertise.`;
    }

    if (alignmentStatus === 'Growing Fit') {
      const growthText = growthAreas.length > 0
        ? `Prioritize learning ${growthAreas.slice(0, 2).join(' and ')} to strengthen your readiness.`
        : `Continue building your foundational skills.`;
      if (isStudent) {
        return `You're on the right track for ${roleTitle}! ${growthText}`;
      }
      return `Good potential for ${roleTitle}. ${growthText}`;
    }

    // Early Stage
    const startingPoint = matchedSkills.length > 0
      ? `You have a foundation in ${matchedSkills[0]}, which is valuable.`
      : `This is an excellent long-term career goal.`;
    return `${startingPoint} To prepare for ${roleTitle}, focus on ${growthAreas[0] || 'building key skills'} and gaining related experience.`;
  }

  /**
   * Quick prediction without full analysis (for performance)
   */
  predictTopRoles(skills: string[], limit: number = 5): RolePrediction[] {
    const input: ResumeInput = { skills };
    const result = this.predictRoles(input);
    return result.topRoles.slice(0, limit);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let predictorInstance: MLRolePredictor | null = null;

export function getRolePredictor(): MLRolePredictor {
  if (!predictorInstance) {
    predictorInstance = new MLRolePredictor();
    predictorInstance.initialize();
  }
  return predictorInstance;
}

export default MLRolePredictor;
