/**
 * Resume Persistence Service
 * 
 * Persists parsed resume data to database tables:
 * - skills table (via storage.addSkill)
 * - projects table (via storage.addProject)
 * - experience table (via storage.addExperience)
 * 
 * This ensures ML system can build unified profile from DB,
 * not just from users.resumeParsedSkills JSON column.
 */

import { storage } from '../storage';
import { ParsedResumeData } from './resume-parser.service';

/**
 * Infer project complexity based on tech stack count and description
 */
function inferProjectComplexity(project: any): 'Low' | 'Medium' | 'High' {
  const techCount = project.tools_methods_used?.length || project.tech_stack?.length || 0;
  const description = (project.description || '').toLowerCase();
  
  // High complexity indicators
  const highComplexityKeywords = [
    'machine learning', 'ml', 'deep learning', 'neural network',
    'distributed', 'microservices', 'scalable', 'real-time',
    'production', 'deployed', 'cloud', 'aws', 'azure', 'gcp',
    'kubernetes', 'docker', 'ci/cd', 'devops'
  ];
  
  // Medium complexity indicators
  const mediumComplexityKeywords = [
    'api', 'backend', 'frontend', 'database', 'authentication',
    'integration', 'deployment', 'testing', 'responsive'
  ];
  
  const hasHighKeywords = highComplexityKeywords.some(keyword => 
    description.includes(keyword)
  );
  
  const hasMediumKeywords = mediumComplexityKeywords.some(keyword => 
    description.includes(keyword)
  );
  
  // Decision logic
  if (techCount >= 5 || hasHighKeywords) return 'High';
  if (techCount >= 3 || hasMediumKeywords) return 'Medium';
  return 'Low';
}

/**
 * Extract education level as numeric value for ML
 */
export function getEducationLevel(degree: string): number {
  const degreeStr = (degree || '').toLowerCase();
  
  if (degreeStr.includes('phd') || degreeStr.includes('ph.d') || degreeStr.includes('doctorate')) {
    return 5;
  }
  if (degreeStr.includes('master') || degreeStr.includes('m.tech') || 
      degreeStr.includes('m.s') || degreeStr.includes('mba') || 
      degreeStr.includes('m.e')) {
    return 4;
  }
  if (degreeStr.includes('bachelor') || degreeStr.includes('b.tech') || 
      degreeStr.includes('b.e') || degreeStr.includes('b.s') || 
      degreeStr.includes('bca') || degreeStr.includes('b.sc')) {
    return 3;
  }
  if (degreeStr.includes('diploma') || degreeStr.includes('associate')) {
    return 2;
  }
  
  return 1; // Default for other education levels
}

/**
 * Persist parsed resume data to database
 * 
 * ✅ FIX 1 & 2 (ATOMIC REPLACE):
 * CRITICAL: Old resume data should be DELETED before this function is called
 * This is done in routes.ts POST /api/profile/resume endpoint
 * 
 * This function:
 * 1. Assumes old data was already deleted atomically
 * 2. INSERTs fresh resume-derived data
 * 3. Updates user metadata (experience_months, projects_count)
 * 4. Logs all operations for transparency
 * 
 * IMPORTANT: DO NOT call this without first clearing old data!
 * 
 * @param userId - User ID
 * @param parsedResume - Parsed resume data from Python parser
 */
export async function persistResumeData(
  userId: string,
  parsedResume: ParsedResumeData
): Promise<void> {
  try {
    console.log(`[DB] ========================================`);
    console.log(`[DB] Persisting FRESH resume data for user ${userId}...`);
    console.log(`[DB] (Assumes old resume data was already deleted atomically)`);
    console.log(`[DB] ========================================`);
    
    let skillsCount = 0;
    let projectsCount = 0;
    let experienceCount = 0;
    
    // ========================================
    // 1. INSERT NEW SKILLS (ALL TECHNICAL CATEGORIES)
    // ========================================
    const allSkills: string[] = [
      ...(parsedResume.technical_skills || []),
      ...(parsedResume.programming_languages || []),
      ...(parsedResume.frameworks_libraries || []),
      ...(parsedResume.tools_platforms || []),
      ...(parsedResume.databases || [])
    ];
    
    if (allSkills.length > 0) {
      for (const skill of allSkills) {
        if (!skill || skill.trim().length === 0) continue;
        
        try {
          await storage.addSkill({
            userId,
            name: skill,
            level: 'Intermediate',
          });
          skillsCount++;
        } catch (error) {
          // Skip duplicate key errors (shouldn't happen since old was deleted, but be safe)
          if (error instanceof Error && !error.message.includes('duplicate')) {
            console.error(`[DB] Failed to insert skill "${skill}":`, error);
          }
        }
      }
      console.log(`[DB] ✓ Inserted ${skillsCount} NEW skills from resume`);
    } else {
      console.log(`[DB] ℹ️  No skills in parsed resume`);
    }
    
    // ========================================
    // 2. INSERT NEW PROJECTS
    // ========================================
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      for (const project of parsedResume.projects) {
        if (!project.title || project.title.trim().length === 0) continue;
        
        try {
          await storage.addProject({
            userId,
            title: project.title,
            techStack: project.tools_methods_used || project.tech_stack || [],
            description: project.description || '',
            complexity: inferProjectComplexity(project),
            githubLink: undefined,
          });
          projectsCount++;
        } catch (error) {
          console.error(`[DB] Failed to insert project "${project.title}":`, error);
        }
      }
      console.log(`[DB] ✓ Inserted ${projectsCount} NEW projects from resume`);
    } else {
      console.log(`[DB] ℹ️  No projects in parsed resume`);
    }
    
    // ========================================
    // 3. INSERT NEW EXPERIENCE
    // ========================================
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      for (const exp of parsedResume.experience) {
        if (!exp.role || exp.role.trim().length === 0) continue;
        
        try {
          await storage.addExperience({
            userId,
            company: exp.company || 'Not specified',
            role: exp.role,
            duration: exp.duration 
              || (exp.duration_months ? `${exp.duration_months} months` : 'Not specified'),
            type: (exp.type === 'internship' || exp.type === 'training' || exp.type === 'Internship') 
              ? 'Internship'
              : 'Job',
          });
          experienceCount++;
        } catch (error) {
          console.error(`[DB] Failed to insert experience "${exp.role}":`, error);
        }
      }
      console.log(`[DB] ✓ Inserted ${experienceCount} NEW experience entries from resume`);
    } else {
      console.log(`[DB] ℹ️  No experience in parsed resume`);
    }
    
    // ========================================
    // 4. UPDATE USER METADATA WITH FRESH DATA
    // ========================================
    // Store total experience months + projects count in user table
    // These values are used by ML prediction to build unified profile
    const totalExperienceMonths = parsedResume.experience_months_total || parsedResume.experience_months || 0;
    const projectsTotal = parsedResume.projects_count || parsedResume.projects?.length || 0;
    
    // ⚠️ IMPORTANT: These REPLACE previous values (not cumulative)
    // Each resume upload should reset these to fresh values
    await storage.updateUser(userId, {
      resumeExperienceMonths: totalExperienceMonths,
      resumeProjectsCount: projectsTotal,
    });
    
    console.log(`[DB] ✓ Updated user metadata with FRESH values:`);
    console.log(`[DB]   - resumeExperienceMonths: ${totalExperienceMonths}`);
    console.log(`[DB]   - resumeProjectsCount: ${projectsTotal}`);
    
    // ========================================
    // 5. FINAL CONFIRMATION LOG
    // ========================================
    console.log(`[DB] ========================================`);
    console.log(`[DB] ✅ FRESH resume data persisted for user ${userId}`);
    console.log(`[DB]   Skills: ${skillsCount} (from ${allSkills.length} in resume)`);
    console.log(`[DB]   Projects: ${projectsCount} (from ${parsedResume.projects?.length || 0} in resume)`);
    console.log(`[DB]   Experience: ${experienceCount} entries`);
    console.log(`[DB]   Total Experience: ${totalExperienceMonths} months`);
    console.log(`[DB]   Education: ${parsedResume.education?.length || 0} entries`);
    console.log(`[DB] ========================================`);
    console.log(`[DB] 🔄 ML system will rebuild unified profile on next prediction`);
    
  } catch (error) {
    console.error(`[DB] ❌ FAILED to persist resume data for user ${userId}:`, error);
    throw new Error(`Resume persistence failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if user has resume data in DB
 */
export async function hasResumeData(userId: string): Promise<boolean> {
  try {
    const userSkills = await storage.getSkills(userId);
    const userProjects = await storage.getProjects(userId);
    const userExperience = await storage.getExperiences(userId);
    
    return userSkills.length > 0 || userProjects.length > 0 || userExperience.length > 0;
  } catch (error) {
    console.error(`[DB] Error checking resume data for user ${userId}:`, error);
    return false;
  }
}

export default {
  persistResumeData,
  hasResumeData,
  getEducationLevel,
};
