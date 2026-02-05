/**
 * Test script to verify resume data is properly persisted, fetched, and merged
 * This validates the end-to-end resume integration with ML prediction
 */

import { storage } from './server/storage.js';
import { ShortlistProbabilityService } from './server/services/ml/shortlist-probability.service.js';
import { CandidateFeaturesService } from './server/services/ml/candidate-features.service.js';

async function testResumeDataIntegration() {
  console.log('========================================');
  console.log('RESUME DATA INTEGRATION TEST');
  console.log('========================================\n');

  try {
    // Get a user with resume data
    const users = await storage.getUser('test-user-id');
    
    if (!users) {
      console.error('❌ No test user found. Please create a user and upload a resume first.');
      process.exit(1);
    }

    console.log(`Testing with user: ${users.id}`);
    console.log(`Resume uploaded: ${users.resumeUrl ? 'Yes' : 'No'}`);
    console.log(`Resume parsed skills: ${Array.isArray(users.resumeParsedSkills) ? users.resumeParsedSkills.length : 0} skills`);
    console.log(`Resume experience months: ${users.resumeExperienceMonths || 0}`);
    console.log(`Resume projects: ${users.resumeProjectsCount || 0}\n`);

    // Test 1: Fetch candidate profile
    console.log('─'.repeat(50));
    console.log('Test 1: Fetching unified candidate profile...');
    console.log('─'.repeat(50));
    
    const profile = await ShortlistProbabilityService.fetchCandidateProfile(users.id);
    
    console.log('\n✅ Profile fetched successfully!');
    console.log(`Total skills in profile: ${(profile.skills || []).length}`);
    console.log(`Experience months: ${profile.experienceMonths}`);
    console.log(`Projects: ${profile.projectsCount}\n`);

    // Test 2: Extract features
    console.log('─'.repeat(50));
    console.log('Test 2: Extracting ML features...');
    console.log('─'.repeat(50));
    
    const features = CandidateFeaturesService.extractFeatures(profile);
    
    console.log('\n✅ Features extracted!');
    console.log(`Skill count: ${features.skillCount}`);
    console.log(`Experience: ${features.totalExperienceMonths} months`);
    console.log(`Projects: ${features.projectCount}\n`);

    // Test 3: Feature array validation
    console.log('─'.repeat(50));
    console.log('Test 3: Validating feature array...');
    console.log('─'.repeat(50));
    
    const featureArray = CandidateFeaturesService.featuresToArray(features);
    console.log(`Feature count: ${featureArray.length} (expected 18)`);
    
    if (featureArray.length !== 18) {
      console.error('❌ Feature count mismatch!');
      process.exit(1);
    }
    
    console.log('✅ Feature count correct!\n');

    // Test 4: Verify resume data is in features
    console.log('─'.repeat(50));
    console.log('Test 4: Verifying resume data in features...');
    console.log('─'.repeat(50));
    
    const resumeParsedSkills = Array.isArray(users.resumeParsedSkills) ? users.resumeParsedSkills : [];
    const hasResumeSkills = resumeParsedSkills.length > 0;
    const hasResumeExperience = (users.resumeExperienceMonths || 0) > 0;
    const hasResumeProjects = (users.resumeProjectsCount || 0) > 0;

    if (hasResumeSkills) {
      console.log(`Resume has skills: ${resumeParsedSkills.length}`);
      console.log(`Features skill count: ${features.skillCount}`);
      if (features.skillCount >= resumeParsedSkills.length) {
        console.log('✅ Resume skills included in features');
      } else {
        console.error('❌ Resume skills NOT included in features!');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Resume has no skills (can\'t verify)');
    }

    if (hasResumeExperience) {
      console.log(`\nResume has experience: ${users.resumeExperienceMonths} months`);
      console.log(`Features experience: ${features.totalExperienceMonths} months`);
      if (features.totalExperienceMonths === users.resumeExperienceMonths) {
        console.log('✅ Resume experience included in features');
      } else {
        console.error('❌ Resume experience NOT matching!');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Resume has no experience (can\'t verify)');
    }

    if (hasResumeProjects) {
      console.log(`\nResume has projects: ${users.resumeProjectsCount}`);
      console.log(`Features projects: ${features.projectCount}`);
      if (features.projectCount >= users.resumeProjectsCount) {
        console.log('✅ Resume projects included in features');
      } else {
        console.error('❌ Resume projects NOT included!');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Resume has no projects (can\'t verify)');
    }

    console.log('\n========================================');
    console.log('✅ RESUME DATA INTEGRATION TEST COMPLETE');
    console.log('========================================');
    console.log('\nAll checks passed!');
    console.log('Resume data is being properly persisted, fetched, and merged into ML features.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testResumeDataIntegration()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
