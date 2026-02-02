/**
 * Candidate Feature Engineering Service
 * 
 * Converts user profile + resume data into a feature vector
 * suitable for the placement_random_forest_model
 * 
 * Features extracted:
 * 1. Technical skills (normalized count)
 * 2. Years of experience
 * 3. Education level
 * 4. Project complexity score
 * 5. Skills diversity
 * 6. Experience relevance
 */

import { CandidateProfile } from "@shared/shortlist-types";

export interface CandidateFeatures {
  // Skill features
  skillCount: number; // Total number of unique skills
  advancedSkillCount: number; // Number of advanced-level skills
  intermediateSkillCount: number; // Number of intermediate skills
  beginnerSkillCount: number; // Number of beginner-level skills
  skillDiversity: number; // Normalized skill diversity score (0-1)
  
  // Experience features
  totalExperienceMonths: number; // Total months of work experience
  internshipCount: number; // Number of internships
  jobCount: number; // Number of full-time jobs
  hasRelevantExperience: number; // 1 if has work experience, 0 otherwise
  avgExperienceDuration: number; // Average duration per experience (months)
  
  // Education features
  educationLevel: number; // 0=None, 1=Diploma, 2=Bachelor, 3=Master, 4=PhD
  hasQualifyingEducation: number; // 1 if has bachelor+, 0 otherwise
  cgpa: number; // CGPA score (0-10 scale, normalized to 0-1)
  
  // Project features
  projectCount: number; // Total number of projects
  highComplexityProjects: number; // Count of high-complexity projects
  mediumComplexityProjects: number; // Count of medium-complexity projects
  projectComplexityScore: number; // Average project complexity (0-1)
  
  // Derived metrics
  overallStrengthScore: number; // Overall candidate strength (0-1)
}

export class CandidateFeaturesService {
  /**
   * Extract features from candidate profile
   */
  static extractFeatures(profile: CandidateProfile): CandidateFeatures {
    const skillFeatures = this.extractSkillFeatures(profile.skills || []);
    const experienceFeatures = this.extractExperienceFeatures(
      profile.experience || [],
      profile.experienceMonths || 0
    );
    const educationFeatures = this.extractEducationFeatures(
      profile.education || [],
      profile.userType,
      profile.cgpa
    );
    const projectFeatures = this.extractProjectFeatures(profile.projects || []);

    // Combine all features with default values (18 features total)
    const features: CandidateFeatures = {
      skillCount: 0,
      advancedSkillCount: 0,
      intermediateSkillCount: 0,
      beginnerSkillCount: 0,
      skillDiversity: 0,
      totalExperienceMonths: 0,
      internshipCount: 0,
      jobCount: 0,
      hasRelevantExperience: 0,
      avgExperienceDuration: 0,
      educationLevel: 0,
      hasQualifyingEducation: 0,
      cgpa: 0,
      projectCount: 0,
      highComplexityProjects: 0,
      mediumComplexityProjects: 0,
      projectComplexityScore: 0,
      overallStrengthScore: 0,
      ...skillFeatures,
      ...experienceFeatures,
      ...educationFeatures,
      ...projectFeatures,
    };

    // Calculate overall strength score (weighted combination)
    features.overallStrengthScore = this.calculateStrengthScore(features);

    return features;
  }

  /**
   * Extract features related to technical skills
   */
  private static extractSkillFeatures(
    skills: Array<{ name: string; level: string }>
  ): Partial<CandidateFeatures> {
    const skillCount = skills.length;
    const advancedSkillCount = skills.filter(s => s.level === 'Advanced').length;
    const intermediateSkillCount = skills.filter(s => s.level === 'Intermediate').length;
    const beginnerSkillCount = skills.filter(s => s.level === 'Beginner').length;

    // Skill diversity: penalty if too few, reward if well-distributed
    let skillDiversity = 0;
    if (skillCount === 0) skillDiversity = 0;
    else if (skillCount < 3) skillDiversity = 0.3;
    else if (skillCount < 5) skillDiversity = 0.6;
    else if (skillCount < 10) skillDiversity = 0.8;
    else skillDiversity = 1.0;

    return {
      skillCount,
      advancedSkillCount,
      intermediateSkillCount,
      beginnerSkillCount,
      skillDiversity,
    };
  }

  /**
   * Extract features related to work experience
   */
  private static extractExperienceFeatures(
    experiences: Array<{ type: string; duration?: string | number }>,
    totalExperienceMonths: number
  ): Partial<CandidateFeatures> {
    const internshipCount = experiences.filter(e => e.type === 'Internship').length;
    const jobCount = experiences.filter(e => e.type === 'Job').length;
    const hasRelevantExperience = experiences.length > 0 ? 1 : 0;
    
    // Calculate average experience duration
    const avgExperienceDuration = experiences.length > 0
      ? totalExperienceMonths / experiences.length
      : 0;

    return {
      totalExperienceMonths,
      internshipCount,
      jobCount,
      hasRelevantExperience,
      avgExperienceDuration,
    };
  }

  /**
   * Extract features related to education
   */
  private static extractEducationFeatures(
    education: Array<{ degree?: string; cgpa?: number }>,
    userType?: string,
    profileCgpa?: number
  ): Partial<CandidateFeatures> {
    let educationLevel = 0;
    let hasQualifyingEducation = 0;
    let cgpa = 0;

    // Check explicitly provided education
    if (education && education.length > 0) {
      const degrees = education.map(e => (e.degree || '').toLowerCase());
      
      if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) {
        educationLevel = 4;
        hasQualifyingEducation = 1;
      } else if (degrees.some(d => d.includes('master') || d.includes('mtech') || d.includes('m.s'))) {
        educationLevel = 3;
        hasQualifyingEducation = 1;
      } else if (degrees.some(d => d.includes('bachelor') || d.includes('b.tech') || d.includes('bsc') || d.includes('b.s'))) {
        educationLevel = 2;
        hasQualifyingEducation = 1;
      } else if (degrees.some(d => d.includes('diploma'))) {
        educationLevel = 1;
      }
      
      // Extract CGPA from education records
      const cgpaValues = education
        .map(e => e.cgpa)
        .filter((c): c is number => c !== undefined && c > 0);
      if (cgpaValues.length > 0) {
        cgpa = Math.max(...cgpaValues) / 10; // Normalize to 0-1 (assuming 10 scale)
      }
    }
    
    // Use profile CGPA if available
    if (profileCgpa && profileCgpa > 0) {
      cgpa = profileCgpa / 10; // Normalize to 0-1
    }

    // Also check user type for inference
    if (userType === 'Student') {
      // Likely pursuing bachelor's
      educationLevel = Math.max(educationLevel, 2);
    } else if (userType === 'Fresher') {
      // Recently completed bachelor's
      educationLevel = Math.max(educationLevel, 2);
      hasQualifyingEducation = 1;
    }

    return {
      educationLevel,
      hasQualifyingEducation,
      cgpa,
    };
  }

  /**
   * Extract features related to projects
   */
  private static extractProjectFeatures(
    projects: Array<{ complexity?: string }>
  ): Partial<CandidateFeatures> {
    const projectCount = projects.length;
    const highComplexityProjects = projects.filter(p => p.complexity === 'High').length;
    const mediumComplexityProjects = projects.filter(p => p.complexity === 'Medium').length;

    let projectComplexityScore = 0;
    if (projectCount > 0) {
      const complexityValues = projects.map(p => {
        switch (p.complexity) {
          case 'High': return 1.0;
          case 'Medium': return 0.6;
          case 'Low': return 0.3;
          default: return 0.5;
        }
      });
      projectComplexityScore = complexityValues.reduce((a, b) => a + b, 0) / projectCount;
    }

    return {
      projectCount,
      highComplexityProjects,
      mediumComplexityProjects,
      projectComplexityScore,
    };
  }

  /**
   * Calculate overall strength score using weighted combination
   * Higher score = stronger candidate
   */
  private static calculateStrengthScore(features: CandidateFeatures): number {
    // Normalize individual features to 0-1 range
    const normalizedSkills = Math.min(features.skillCount / 10, 1.0);
    const normalizedAdvanced = Math.min(features.advancedSkillCount / 5, 1.0);
    const normalizedExperience = Math.min(features.totalExperienceMonths / 60, 1.0); // 5 years = max
    const normalizedProjects = Math.min(features.projectCount / 5, 1.0);
    const normalizedEducation = features.educationLevel / 4;

    // Weighted combination (empirically derived)
    const weights = {
      skills: 0.25,
      advancedSkills: 0.15,
      experience: 0.20,
      projects: 0.15,
      education: 0.15,
      skillDiversity: 0.10,
    };

    const score =
      weights.skills * normalizedSkills +
      weights.advancedSkills * normalizedAdvanced +
      weights.experience * normalizedExperience +
      weights.projects * normalizedProjects +
      weights.education * normalizedEducation +
      weights.skillDiversity * features.skillDiversity;

    return Math.min(Math.max(score, 0), 1.0); // Clamp to 0-1
  }

  /**
   * Convert features to input array for random forest model
   * Features are ordered consistently (18 features total)
   */
  static featuresToArray(features: CandidateFeatures): number[] {
    return [
      features.skillCount,
      features.advancedSkillCount,
      features.intermediateSkillCount,
      features.beginnerSkillCount,
      features.skillDiversity,
      features.totalExperienceMonths,
      features.internshipCount,
      features.jobCount,
      features.hasRelevantExperience,
      features.avgExperienceDuration,
      features.educationLevel,
      features.hasQualifyingEducation,
      features.cgpa,
      features.projectCount,
      features.highComplexityProjects,
      features.mediumComplexityProjects,
      features.projectComplexityScore,
      features.overallStrengthScore,  // 18th feature
    ];
  }

  /**
   * Get feature names for model interpretation (18 features)
   */
  static getFeatureNames(): string[] {
    return [
      'skillCount',
      'advancedSkillCount',
      'intermediateSkillCount',
      'beginnerSkillCount',
      'skillDiversity',
      'totalExperienceMonths',
      'internshipCount',
      'jobCount',
      'hasRelevantExperience',
      'avgExperienceDuration',
      'educationLevel',
      'hasQualifyingEducation',
      'cgpa',
      'projectCount',
      'highComplexityProjects',
      'mediumComplexityProjects',
      'projectComplexityScore',
      'overallStrengthScore',  // 18th feature
    ];
  }
}
