/**
 * Test Resume Shortlist Predictions
 * 
 * This script:
 * 1. Parses an existing resume PDF
 * 2. Creates a temporary test user profile
 * 3. Fetches all jobs from database
 * 4. Runs shortlist predictions for each job
 * 5. Displays results in a formatted table
 * 
 * Usage:
 *   npx tsx test-resume-predictions.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parseResume } from './server/services/resume-parser.service';
import { storage } from './server/storage';
import { ShortlistProbabilityService } from './server/services/ml/shortlist-probability.service';
import type { CandidateProfile } from '@shared/shortlist-types';

const RESUME_PATH = 'uploads/resume-1769407134942-931026016.pdf';
const TEST_USER_ID = 'test-resume-user-' + Date.now();

interface TestResult {
  jobId: string;
  jobTitle: string;
  company: string;
  shortlistProbability: number;
  candidateStrength: number;
  jobMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 RESUME SHORTLIST PROBABILITY TEST');
  console.log('='.repeat(80));
  console.log(`Resume: ${RESUME_PATH}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('='.repeat(80) + '\n');

  try {
    // ========================================
    // STEP 1: VERIFY RESUME FILE EXISTS
    // ========================================
    console.log('[STEP 1] Verifying resume file...');
    const resumePath = path.resolve(process.cwd(), RESUME_PATH);
    
    if (!fs.existsSync(resumePath)) {
      console.error(`❌ Resume file not found: ${resumePath}`);
      console.error('Please ensure the file exists at the specified path.');
      process.exit(1);
    }
    
    const resumeBuffer = fs.readFileSync(resumePath);
    console.log(`✅ Resume file found (${(resumeBuffer.length / 1024).toFixed(2)} KB)`);

    // ========================================
    // STEP 2: PARSE RESUME
    // ========================================
    console.log('\n[STEP 2] Parsing resume...');
    const parsedResume = await parseResume(resumeBuffer, path.basename(resumePath));
    
    console.log('✅ Resume parsed successfully:');
    console.log(`   - Skills: ${parsedResume.technical_skills?.length || 0} technical, ${parsedResume.soft_skills?.length || 0} soft`);
    console.log(`   - Experience: ${parsedResume.experience_months_total || 0} months`);
    console.log(`   - Projects: ${parsedResume.projects?.length || 0}`);
    console.log(`   - Education: ${parsedResume.education?.length || 0} entries`);
    console.log(`   - Completeness Score: ${(parsedResume.resume_completeness_score * 100).toFixed(0)}%`);

    // ========================================
    // STEP 3: BUILD CANDIDATE PROFILE
    // ========================================
    console.log('\n[STEP 3] Building candidate profile from resume...');
    
    // Combine all technical skills
    const allSkills: string[] = [
      ...(parsedResume.technical_skills || []),
      ...(parsedResume.programming_languages || []),
      ...(parsedResume.frameworks_libraries || []),
      ...(parsedResume.tools_platforms || []),
      ...(parsedResume.databases || [])
    ];

    const candidateProfile: CandidateProfile = {
      userId: TEST_USER_ID,
      userType: parsedResume.experience_months_total > 12 ? 'Working Professional' : 'Fresher',
      skills: allSkills.map(skill => ({
        name: skill,
        level: 'Intermediate' as const,
      })),
      education: parsedResume.education?.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        year: edu.year,
      })) || [],
      experienceMonths: parsedResume.experience_months_total || 0,
      projectsCount: parsedResume.projects?.length || 0,
      projects: parsedResume.projects?.map(proj => ({
        title: proj.title,
        techStack: proj.tech_stack || proj.tools_methods_used || [],
        description: proj.description || '',
        complexity: 'Medium' as const,
      })) || [],
      experience: parsedResume.experience?.map(exp => ({
        company: exp.company || 'Not specified',
        role: exp.role,
        duration: exp.duration || '',
        type: (exp.type === 'internship' || exp.type === 'training') ? 'Internship' as const : 'Job' as const,
      })) || [],
      cgpa: parsedResume.cgpa || 0,
      college: parsedResume.education?.[0]?.institution,
      gradYear: parsedResume.education?.[0]?.year,
    };

    console.log('✅ Candidate profile built:');
    console.log(`   - Total skills: ${candidateProfile.skills.length}`);
    console.log(`   - User type: ${candidateProfile.userType}`);
    console.log(`   - Experience: ${candidateProfile.experienceMonths} months`);
    console.log(`   - Projects: ${candidateProfile.projectsCount}`);

    if (allSkills.length > 0) {
      console.log(`   - Top skills: ${allSkills.slice(0, 10).join(', ')}${allSkills.length > 10 ? '...' : ''}`);
    }

    // ========================================
    // STEP 4: INITIALIZE ML SERVICE
    // ========================================
    console.log('\n[STEP 4] Initializing ML service...');
    await ShortlistProbabilityService.initialize();
    
    if (!ShortlistProbabilityService.isReady()) {
      console.error('❌ ML service not ready. Cannot run predictions.');
      console.error('Please ensure placement_random_forest_model.pkl is present.');
      process.exit(1);
    }
    
    console.log('✅ ML service initialized successfully');

    // ========================================
    // STEP 5: FETCH ALL JOBS
    // ========================================
    console.log('\n[STEP 5] Fetching jobs from database...');
    const jobs = await storage.getJobs();
    
    console.log(`✅ Found ${jobs.length} jobs in database`);
    
    if (jobs.length === 0) {
      console.warn('⚠️  No jobs found in database. Cannot run predictions.');
      process.exit(0);
    }

    // ========================================
    // STEP 6: RUN PREDICTIONS FOR EACH JOB
    // ========================================
    console.log('\n[STEP 6] Running predictions for each job...');
    console.log('(This may take a while for large job sets)\n');

    const results: TestResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const progress = `[${i + 1}/${jobs.length}]`;
      
      try {
        console.log(`${progress} Predicting for: ${job.title} at ${job.company}...`);
        
        // Get job data
        const jobData = await ShortlistProbabilityService['fetchJob'](job.id);
        
        // Run predictions
        const candidateStrength = await ShortlistProbabilityService['predictCandidateStrength'](candidateProfile);
        const jobMatch = await ShortlistProbabilityService['predictJobMatch'](
          candidateProfile.skills.map(s => s.name),
          jobData
        );
        
        // Calculate final probability
        const rawProbability = (0.4 * candidateStrength.score) + (0.6 * jobMatch.score);
        const shortlistProbability = Math.max(0.05, Math.min(0.95, rawProbability));
        
        results.push({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          shortlistProbability: Math.round(shortlistProbability * 100),
          candidateStrength: Math.round(candidateStrength.score * 100),
          jobMatchScore: Math.round(jobMatch.score * 100),
          matchedSkills: jobMatch.matchedSkills || [],
          missingSkills: jobMatch.missingSkills || [],
        });
        
        successCount++;
        console.log(`   ✅ Probability: ${Math.round(shortlistProbability * 100)}% (Strength: ${Math.round(candidateStrength.score * 100)}%, Match: ${Math.round(jobMatch.score * 100)}%)`);
      } catch (error) {
        failureCount++;
        console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // ========================================
    // STEP 7: DISPLAY RESULTS
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 PREDICTION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total jobs: ${jobs.length}`);
    console.log(`Successful predictions: ${successCount}`);
    console.log(`Failed predictions: ${failureCount}`);
    console.log('='.repeat(80) + '\n');

    if (results.length === 0) {
      console.warn('⚠️  No successful predictions to display.');
      process.exit(0);
    }

    // Sort by probability (descending)
    results.sort((a, b) => b.shortlistProbability - a.shortlistProbability);

    // Display top 20 jobs
    const displayCount = Math.min(20, results.length);
    console.log(`🏆 TOP ${displayCount} JOBS BY SHORTLIST PROBABILITY:\n`);
    
    console.log('Rank | Probability | Strength | Match | Job Title & Company');
    console.log('-'.repeat(80));
    
    for (let i = 0; i < displayCount; i++) {
      const result = results[i];
      const rank = `${i + 1}`.padStart(4);
      const prob = `${result.shortlistProbability}%`.padStart(11);
      const strength = `${result.candidateStrength}%`.padStart(8);
      const match = `${result.jobMatchScore}%`.padStart(5);
      const jobInfo = `${result.jobTitle} @ ${result.company}`.substring(0, 48);
      
      console.log(`${rank} | ${prob} | ${strength} | ${match} | ${jobInfo}`);
    }

    // Display detailed breakdown for top 3
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DETAILED BREAKDOWN (TOP 3 JOBS)');
    console.log('='.repeat(80) + '\n');

    for (let i = 0; i < Math.min(3, results.length); i++) {
      const result = results[i];
      
      console.log(`[${i + 1}] ${result.jobTitle} @ ${result.company}`);
      console.log('-'.repeat(80));
      console.log(`  Shortlist Probability: ${result.shortlistProbability}%`);
      console.log(`  Candidate Strength:    ${result.candidateStrength}%`);
      console.log(`  Job Match Score:       ${result.jobMatchScore}%`);
      console.log();
      console.log(`  ✅ Matched Skills (${result.matchedSkills.length}):`);
      if (result.matchedSkills.length > 0) {
        console.log(`     ${result.matchedSkills.join(', ')}`);
      } else {
        console.log(`     (None)`);
      }
      console.log();
      console.log(`  ❌ Missing Skills (${result.missingSkills.length}):`);
      if (result.missingSkills.length > 0) {
        console.log(`     ${result.missingSkills.slice(0, 10).join(', ')}${result.missingSkills.length > 10 ? '...' : ''}`);
      } else {
        console.log(`     (None)`);
      }
      console.log('\n');
    }

    // Display statistics
    console.log('='.repeat(80));
    console.log('📈 STATISTICS');
    console.log('='.repeat(80));
    
    const avgProbability = results.reduce((sum, r) => sum + r.shortlistProbability, 0) / results.length;
    const avgStrength = results.reduce((sum, r) => sum + r.candidateStrength, 0) / results.length;
    const avgMatch = results.reduce((sum, r) => sum + r.jobMatchScore, 0) / results.length;
    const maxProbability = Math.max(...results.map(r => r.shortlistProbability));
    const minProbability = Math.min(...results.map(r => r.shortlistProbability));
    
    console.log(`Average Shortlist Probability: ${avgProbability.toFixed(1)}%`);
    console.log(`Average Candidate Strength:    ${avgStrength.toFixed(1)}%`);
    console.log(`Average Job Match Score:       ${avgMatch.toFixed(1)}%`);
    console.log(`Max Shortlist Probability:     ${maxProbability}%`);
    console.log(`Min Shortlist Probability:     ${minProbability}%`);
    console.log(`Range:                         ${maxProbability - minProbability}%`);
    
    // Distribution
    const excellent = results.filter(r => r.shortlistProbability >= 70).length;
    const good = results.filter(r => r.shortlistProbability >= 50 && r.shortlistProbability < 70).length;
    const fair = results.filter(r => r.shortlistProbability >= 30 && r.shortlistProbability < 50).length;
    const weak = results.filter(r => r.shortlistProbability < 30).length;
    
    console.log('\nDistribution:');
    console.log(`  Excellent (≥70%): ${excellent} jobs (${(excellent / results.length * 100).toFixed(1)}%)`);
    console.log(`  Good (50-69%):    ${good} jobs (${(good / results.length * 100).toFixed(1)}%)`);
    console.log(`  Fair (30-49%):    ${fair} jobs (${(fair / results.length * 100).toFixed(1)}%)`);
    console.log(`  Weak (<30%):      ${weak} jobs (${(weak / results.length * 100).toFixed(1)}%)`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80) + '\n');

    // Save results to file
    const outputFile = `test-results-${Date.now()}.json`;
    fs.writeFileSync(
      outputFile,
      JSON.stringify({
        resumePath: RESUME_PATH,
        parsedResume: {
          skills: allSkills,
          experience_months: parsedResume.experience_months_total,
          projects_count: parsedResume.projects?.length || 0,
          completeness_score: parsedResume.resume_completeness_score,
        },
        results,
        statistics: {
          avgProbability,
          avgStrength,
          avgMatch,
          maxProbability,
          minProbability,
          distribution: { excellent, good, fair, weak },
        },
      }, null, 2)
    );
    
    console.log(`📄 Full results saved to: ${outputFile}\n`);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
