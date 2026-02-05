/**
 * 🧪 STANDALONE TESTING SCRIPT
 * 
 * Predict shortlist probability for a given resume across ALL jobs in DB
 * 
 * Usage:
 *   npm run test:resume <resume_file_path> [user_id]
 *   
 * Examples:
 *   npm run test:resume uploads/resume-1769407134942-931026016.pdf
 *   npm run test:resume ./my-resume.pdf my-user-123
 */

// NOTE: Environment variables are loaded by preload-env.cjs before this script runs

import * as fs from 'fs';
import { storage, pool } from './server/storage';
import { ShortlistProbabilityService } from './server/services/ml/shortlist-probability.service';
import { parseResume } from './server/services/resume-parser.service';
import type { CandidateProfile } from '@shared/shortlist-types';

interface TestResult {
  jobId: string;
  jobTitle: string;
  company: string;
  shortlistProbability: number;
  jobMatchScore: number;
  candidateStrength: number;
  matchedSkills: string[];
  missingSkills: string[];
}

async function testResumeOnAllJobs() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 RESUME SHORTLIST PREDICTION TEST');
  console.log('='.repeat(100) + '\n');
  
  try {
    // Get resume file from command line
    const resumeFile = process.argv[2];
    if (!resumeFile) {
      console.error('❌ Resume file path required');
      console.error('\nUsage: npm run test:resume <resume_file_path> [user_id]');
      console.error('\nExamples:');
      console.error('  npm run test:resume uploads/resume-1769407134942-931026016.pdf');
      console.error('  npm run test:resume ./my-resume.pdf my-user-123\n');
      process.exit(1);
    }
    
    // Resolve file path
    const absolutePath = path.isAbsolute(resumeFile) 
      ? resumeFile 
      : path.join(process.cwd(), resumeFile);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Resume file not found: ${absolutePath}`);
      process.exit(1);
    }
    
    console.log(`📄 Resume File: ${absolutePath}`);
    console.log(`📦 File Size: ${(fs.statSync(absolutePath).size / 1024).toFixed(2)} KB\n`);
    
    // Get or create test user
    let userId = process.argv[3];
    const resumeId = process.argv[4] || userId;
    let testUser;
    
    if (userId) {
      console.log(`👤 Using provided user ID: ${userId}`);
      testUser = await storage.getUser(userId);
      if (!testUser) {
        console.error(`❌ User not found: ${userId}`);
        process.exit(1);
      }
      console.log(`✅ User found: ${testUser.username}\n`);
    } else {
      // Create a temporary test user
      userId = `test-${Date.now()}`;
      console.log(`👤 Creating temporary test user: ${userId}\n`);
      
      testUser = await storage.createUser({
        username: `test_${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        password: 'test123',
        userType: 'Fresher'
      });
      
      userId = testUser.id;
      console.log(`✅ Test user created: ${testUser.username} (ID: ${testUser.id})\n`);
    }
    
    // Step 1: Parse resume
    console.log('=' .repeat(100));
    console.log('STEP 1: PARSE RESUME');
    console.log('=' .repeat(100) + '\n');
    
    console.log('🔍 Parsing resume...');
    const resumeBuffer = fs.readFileSync(absolutePath);
    const fileName = path.basename(absolutePath);
    const resumeData = await parseResume(resumeBuffer, fileName);
    
    console.log(`✅ Resume parsed successfully\n`);
    console.log(`📊 Extracted Data:`);
    
    // Collect all skills (technical + soft)
    const allSkills = [
      ...(resumeData.technical_skills || []),
      ...(resumeData.programming_languages || []),
      ...(resumeData.frameworks_libraries || []),
      ...(resumeData.tools_platforms || []),
      ...(resumeData.databases || []),
      ...(resumeData.soft_skills || [])
    ];
    
    console.log(`   Technical Skills: ${(resumeData.technical_skills || []).length}`);
    console.log(`   Programming Languages: ${(resumeData.programming_languages || []).length}`);
    console.log(`   Frameworks/Libraries: ${(resumeData.frameworks_libraries || []).length}`);
    console.log(`   Tools/Platforms: ${(resumeData.tools_platforms || []).length}`);
    console.log(`   Databases: ${(resumeData.databases || []).length}`);
    console.log(`   Soft Skills: ${(resumeData.soft_skills || []).length}`);
    console.log(`   Total Skills: ${allSkills.length} - ${allSkills.slice(0, 5).join(', ')}${allSkills.length > 5 ? '...' : ''}`);
    console.log(`   Experience: ${resumeData.experience?.length || 0} entries`);
    console.log(`   Education: ${resumeData.education?.length || 0} entries`);
    console.log(`   Experience Months: ${resumeData.experience_months_total || 0}\n`);
    
    // Step 2: Store resume data in user profile
    console.log('=' .repeat(100));
    console.log('STEP 2: STORE RESUME DATA IN USER PROFILE');
    console.log('=' .repeat(100) + '\n');
    
    console.log('💾 Storing resume data...');
    
    // Clear existing skills
    const existingSkills = await storage.getSkills(userId);
    for (const skill of existingSkills) {
      await storage.removeSkill(skill.id);
    }
    
    // Add skills from resume
    for (const skill of allSkills) {
      await storage.addSkill({
        userId,
        name: skill,
        level: 'Intermediate'
      });
    }
    
    // Update user experience months
    await storage.updateUser(userId, {
      resumeExperienceMonths: resumeData.experience_months_total || 0,
      resumeEducation: resumeData.education || []
    });
    
    // Add experience entries
    const existingExperience = await storage.getExperiences(userId);
    for (const exp of existingExperience) {
      await storage.deleteExperience(exp.id);
    }
    
    for (const exp of resumeData.experience || []) {
      await storage.addExperience({
        userId,
        company: exp.company || 'Unknown Company',
        role: exp.role || 'Unknown Role',
        duration: exp.duration || '0',
        type: exp.type || 'Job'
      });
    }
    
    console.log(`✅ Resume data stored\n`);
    console.log(`   Skills added: ${allSkills.length}`);
    console.log(`   Experience entries: ${(resumeData.experience || []).length}`);
    console.log(`   Education entries: ${(resumeData.education || []).length}\n`);
    
    // Step 3: Initialize ML service
    console.log('=' .repeat(100));
    console.log('STEP 3: INITIALIZE ML SERVICE');
    console.log('=' .repeat(100) + '\n');
    
    console.log('🤖 Initializing ML service...');
    await ShortlistProbabilityService.initialize();
    
    if (!ShortlistProbabilityService.isReady()) {
      console.error('❌ ML service not ready');
      process.exit(1);
    }
    
    console.log('✅ ML service initialized\n');
    
    // Step 4: Fetch all jobs
    console.log('=' .repeat(100));
    console.log('STEP 4: FETCH JOBS FROM DATABASE');
    console.log('=' .repeat(100) + '\n');
    
    console.log('📋 Fetching jobs from database...');
    const allJobs = await storage.getJobs();
    
    console.log(`✅ Found ${allJobs.length} jobs\n`);
    
    if (allJobs.length === 0) {
      console.error('❌ No jobs in database');
      process.exit(1);
    }
    
    // Step 5: Predict for each job
    console.log('=' .repeat(100));
    console.log('STEP 5: PREDICT SHORTLIST PROBABILITY FOR EACH JOB');
    console.log('=' .repeat(100) + '\n');
    
    console.log(`🚀 Running predictions for ${allJobs.length} jobs...\n`);
    
    const results: TestResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i];
      const progress = `[${i + 1}/${allJobs.length}]`;
      
      try {
        console.log(`${progress} Predicting for: ${job.title} @ ${job.company}...`);
        
        const prediction = await ShortlistProbabilityService.predict(userId, job.id, resumeId);
        
        results.push({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          shortlistProbability: prediction.shortlistProbability,
          jobMatchScore: prediction.jobMatchScore,
          candidateStrength: prediction.candidateStrength,
          matchedSkills: prediction.matchedSkills || [],
          missingSkills: prediction.missingSkills || []
        });
        
        console.log(`  ✅ ${prediction.shortlistProbability}% shortlist probability\n`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error: ${error}\n`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 6: Display results
    console.log('\n' + '='.repeat(100));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(100) + '\n');
    
    console.log(`✅ Successfully predicted: ${successCount}/${allJobs.length}`);
    if (errorCount > 0) {
      console.log(`❌ Failed predictions: ${errorCount}/${allJobs.length}`);
    }
    console.log('');
    
    // Sort by probability (descending)
    const sortedResults = [...results].sort((a, b) => b.shortlistProbability - a.shortlistProbability);
    
    // Display results table
    console.log('🎯 SORTED BY SHORTLIST PROBABILITY (Highest First):\n');
    console.log('┌─────┬──────────┬────────────────────────────────┬────────────┬──────────┬───────────┐');
    console.log('│ Rank│Shortlist │ Job Title                      │  Company   │ Match %  │ Candidate│');
    console.log('├─────┼──────────┼────────────────────────────────┼────────────┼──────────┼───────────┤');
    
    sortedResults.forEach((result, idx) => {
      const rank = (idx + 1).toString().padEnd(4);
      const shortlist = `${result.shortlistProbability}%`.padStart(8);
      const title = result.jobTitle.substring(0, 29).padEnd(30);
      const company = result.company.substring(0, 10).padEnd(11);
      const match = `${result.jobMatchScore}%`.padStart(8);
      const candidate = `${result.candidateStrength}%`.padStart(9);
      
      console.log(`│ ${rank} │ ${shortlist} │ ${title} │ ${company}│ ${match} │ ${candidate} │`);
    });
    
    console.log('└─────┴──────────┴────────────────────────────────┴────────────┴──────────┴───────────┘\n');
    
    // Display top 3 opportunities
    console.log('🏆 TOP 3 OPPORTUNITIES:\n');
    
    sortedResults.slice(0, 3).forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.jobTitle} @ ${result.company}`);
      console.log(`   📊 Shortlist Probability: ${result.shortlistProbability}%`);
      console.log(`   🎯 Job Match Score: ${result.jobMatchScore}%`);
      console.log(`   💪 Candidate Strength: ${result.candidateStrength}%`);
      console.log(`   ✅ Matched Skills: ${result.matchedSkills.length} - ${result.matchedSkills.slice(0, 3).join(', ')}${result.matchedSkills.length > 3 ? '...' : ''}`);
      console.log(`   ❌ Missing Skills: ${result.missingSkills.length} - ${result.missingSkills.slice(0, 3).join(', ')}${result.missingSkills.length > 3 ? '...' : ''}\n`);
    });
    
    // Display worst matches
    console.log('⚠️  JOBS WHERE YOU NEED THE MOST WORK:\n');
    
    sortedResults.slice(-3).reverse().forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.jobTitle} @ ${result.company}`);
      console.log(`   📊 Shortlist Probability: ${result.shortlistProbability}%`);
      console.log(`   ❌ Missing ${result.missingSkills.length} skills: ${result.missingSkills.slice(0, 5).join(', ')}${result.missingSkills.length > 5 ? '...' : ''}\n`);
    });
    
    // Statistics
    console.log('=' .repeat(100));
    console.log('📈 STATISTICS');
    console.log('=' .repeat(100) + '\n');
    
    const probabilities = results.map(r => r.shortlistProbability);
    const avgProbability = probabilities.reduce((a, b) => a + b, 0) / probabilities.length;
    const maxProbability = Math.max(...probabilities);
    const minProbability = Math.min(...probabilities);
    const strongMatches = probabilities.filter(p => p >= 70).length;
    const moderateMatches = probabilities.filter(p => p >= 50 && p < 70).length;
    const weakMatches = probabilities.filter(p => p < 50).length;
    
    console.log(`Average Shortlist Probability: ${avgProbability.toFixed(1)}%`);
    console.log(`Highest: ${maxProbability}%`);
    console.log(`Lowest: ${minProbability}%`);
    console.log(`Range: ${maxProbability - minProbability}%\n`);
    
    console.log(`Strong Matches (70%+): ${strongMatches} jobs`);
    console.log(`Moderate Matches (50-69%): ${moderateMatches} jobs`);
    console.log(`Weak Matches (<50%): ${weakMatches} jobs\n`);
    
    // Export results to CSV
    console.log('=' .repeat(100));
    console.log('💾 EXPORT RESULTS');
    console.log('=' .repeat(100) + '\n');
    
    const csvPath = `test-results-${Date.now()}.csv`;
    const csvContent = [
      ['Job Title', 'Company', 'Shortlist Probability %', 'Job Match %', 'Candidate Strength %', 'Matched Skills', 'Missing Skills'].join(','),
      ...results.map(r => [
        `"${r.jobTitle}"`,
        `"${r.company}"`,
        r.shortlistProbability,
        r.jobMatchScore,
        r.candidateStrength,
        `"${r.matchedSkills.join('; ')}"`,
        `"${r.missingSkills.join('; ')}"`
      ].join(','))
    ].join('\n');
    
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ Results exported to: ${csvPath}\n`);
    
    console.log('=' .repeat(100));
    console.log('✅ TEST COMPLETE');
    console.log('=' .repeat(100) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testResumeOnAllJobs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
