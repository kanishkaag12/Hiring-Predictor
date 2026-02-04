/**
 * Quick test to verify ML service can fetch and use job data correctly
 */

import { ShortlistProbabilityService } from './server/services/ml/shortlist-probability.service.js';
import { storage } from './server/storage.js';

async function testMLJobFetch() {
  console.log('========================================');
  console.log('ML SERVICE JOB FETCH TEST');
  console.log('========================================\n');

  try {
    // Get a job from the database
    const jobs = await storage.getJobs();
    
    if (jobs.length === 0) {
      console.error('❌ No jobs found in database');
      process.exit(1);
    }

    const testJob = jobs[0];
    console.log(`Testing with job: ${testJob.id}`);
    console.log(`Title: ${testJob.title}`);
    console.log(`Company: ${testJob.company}\n`);

    // Test the ML service's fetchJob method
    console.log('─'.repeat(50));
    console.log('Calling ShortlistProbabilityService.fetchJob()...');
    console.log('─'.repeat(50));
    
    const jobData = await ShortlistProbabilityService.fetchJob(testJob.id);
    
    console.log('\n✅ Job data successfully fetched by ML service!');
    console.log('\nJob object received by ML:');
    console.log('─'.repeat(50));
    console.log('ID:', jobData.id);
    console.log('Title:', jobData.title);
    console.log('Company:', jobData.company);
    console.log('Description length:', jobData.description.length, 'chars');
    console.log('Skills:', jobData.skills.length, 'skills:', jobData.skills.join(', ') || 'None');
    console.log('Experience Level:', jobData.experienceLevel);
    console.log('Location:', jobData.location);
    console.log('Is Remote:', jobData.isRemote);
    console.log('Is Internship:', jobData.isInternship);

    // Check if skills were extracted and persisted
    console.log('\n─'.repeat(50));
    console.log('Checking if skills were persisted to database...');
    const updatedJob = await storage.getJob(testJob.id);
    
    if (updatedJob && updatedJob.skills && Array.isArray(updatedJob.skills) && updatedJob.skills.length > 0) {
      console.log('✅ Skills successfully extracted and persisted!');
      console.log('Skills in DB:', updatedJob.skills.join(', '));
    } else {
      console.log('⚠️  No skills were persisted (description may not contain tech keywords)');
    }

    console.log('\n========================================');
    console.log('✅ ML SERVICE JOB FETCH TEST COMPLETE');
    console.log('========================================');
    console.log('\nNext step: Run a full prediction with a user profile');
    console.log('Command: npm run dev (then use the UI to test predictions)');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testMLJobFetch()
  .then(() => {
    console.log('\nTest completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
