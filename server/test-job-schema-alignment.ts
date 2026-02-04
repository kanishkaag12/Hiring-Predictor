/**
 * Test script to verify job schema alignment between database and backend
 * This ensures n8n job data is properly accessible by the ML service
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { jobs, type Job } from '@shared/schema';

const { Pool } = pg;

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testJobSchema() {
  console.log('========================================');
  console.log('JOB SCHEMA ALIGNMENT TEST');
  console.log('========================================\n');

  try {
    // Test 1: Check if we can query jobs table
    console.log('✓ Test 1: Querying jobs table...');
    const allJobs = await db.select().from(jobs).limit(1);
    
    if (allJobs.length === 0) {
      console.warn('⚠️  No jobs found in database. Please ingest some jobs via n8n first.\n');
      return;
    }

    const job = allJobs[0];
    console.log(`✓ Found ${allJobs.length} job(s)\n`);

    // Test 2: Check n8n schema fields
    console.log('Test 2: Checking n8n schema fields in first job:');
    console.log('─'.repeat(50));
    
    const schemaChecks = {
      'id': job.id,
      'title': job.title,
      'company': job.company,
      'description': job.description ? `${job.description.substring(0, 50)}...` : 'NULL',
      'job_description': job.jobDescription ? `${job.jobDescription.substring(0, 50)}...` : 'NULL',
      'skills': Array.isArray(job.skills) ? `${job.skills.length} skills` : 'NULL',
      'experience_level': job.experienceLevel || 'NULL',
      'employment_type': job.employmentType || 'NULL',
      'is_internship': job.isInternship !== undefined ? job.isInternship : 'NULL',
      'job_is_remote': job.jobIsRemote !== undefined ? job.jobIsRemote : 'NULL',
      'job_city': job.jobCity || 'NULL',
      'job_state': job.jobState || 'NULL',
      'job_country': job.jobCountry || 'NULL',
      'job_location': job.jobLocation || 'NULL',
      'apply_link': job.applyLink ? 'Present' : 'NULL',
      'posted_at': job.postedAt || 'NULL',
      'job_posted_at': job.jobPostedAt || 'NULL',
      'publisher': job.publisher || 'NULL',
      'company_website': job.companyWebsite || 'NULL',
      'hiring_platform': job.hiringPlatform || 'NULL',
    };

    for (const [field, value] of Object.entries(schemaChecks)) {
      const status = value !== 'NULL' && value !== undefined ? '✓' : '⚠️ ';
      console.log(`${status} ${field}: ${value}`);
    }

    // Test 3: Check critical fields for ML
    console.log('\n─'.repeat(50));
    console.log('Test 3: Critical ML fields validation:');
    console.log('─'.repeat(50));
    
    const hasDescription = job.jobDescription || job.description;
    const hasSkills = job.skills && Array.isArray(job.skills) && job.skills.length > 0;
    const hasLocation = job.jobCity || job.jobState || job.jobCountry || job.jobLocation;
    const hasExperienceLevel = job.experienceLevel;
    
    console.log(`${hasDescription ? '✓' : '❌'} Description: ${hasDescription ? 'Present' : 'MISSING'}`);
    console.log(`${hasSkills ? '✓' : '⚠️ '} Skills: ${hasSkills ? `${job.skills.length} found` : 'Will be extracted from description'}`);
    console.log(`${hasLocation ? '✓' : '⚠️ '} Location: ${hasLocation ? 'Present' : 'Not specified'}`);
    console.log(`${hasExperienceLevel ? '✓' : '⚠️ '} Experience Level: ${hasExperienceLevel || 'Not specified'}`);

    // Test 4: Simulate ML service fetchJob behavior
    console.log('\n─'.repeat(50));
    console.log('Test 4: Simulating ML service job fetch:');
    console.log('─'.repeat(50));
    
    const description = job.jobDescription || job.description || '';
    const skills = (job.skills && Array.isArray(job.skills)) ? job.skills : [];
    
    let locationText = '';
    if (job.jobIsRemote === 1) {
      locationText = 'Remote';
    } else if (job.jobCity || job.jobState || job.jobCountry) {
      locationText = [job.jobCity, job.jobState, job.jobCountry].filter(Boolean).join(', ');
    } else if (job.jobLocation) {
      locationText = job.jobLocation;
    } else {
      locationText = 'Location not specified';
    }

    console.log('ML Service would receive:');
    console.log(`  - Description: ${description.length} chars`);
    console.log(`  - Skills: ${skills.length} skills`);
    console.log(`  - Location: ${locationText}`);
    console.log(`  - Experience: ${job.experienceLevel || 'Not specified'}`);
    console.log(`  - Remote: ${job.jobIsRemote === 1 ? 'Yes' : 'No'}`);
    console.log(`  - Internship: ${job.isInternship === 1 ? 'Yes' : 'No'}`);

    if (description.length === 0) {
      console.error('\n❌ CRITICAL: No description available - ML service will fail!');
    } else {
      console.log('\n✓ All critical data available for ML prediction');
    }

    // Test 5: Count jobs with missing critical fields
    console.log('\n─'.repeat(50));
    console.log('Test 5: Database-wide statistics:');
    console.log('─'.repeat(50));
    
    const allJobsForStats = await db.select().from(jobs);
    const stats = {
      total: allJobsForStats.length,
      withDescription: 0,
      withJobDescription: 0,
      withSkills: 0,
      withLocation: 0,
      remote: 0,
      internships: 0,
    };

    allJobsForStats.forEach((j: Job) => {
      if (j.description) stats.withDescription++;
      if (j.jobDescription) stats.withJobDescription++;
      if (j.skills && Array.isArray(j.skills) && j.skills.length > 0) stats.withSkills++;
      if (j.jobCity || j.jobState || j.jobCountry || j.jobLocation) stats.withLocation++;
      if (j.jobIsRemote === 1) stats.remote++;
      if (j.isInternship === 1) stats.internships++;
    });

    console.log(`Total jobs: ${stats.total}`);
    console.log(`With description field: ${stats.withDescription} (${((stats.withDescription/stats.total)*100).toFixed(1)}%)`);
    console.log(`With job_description field: ${stats.withJobDescription} (${((stats.withJobDescription/stats.total)*100).toFixed(1)}%)`);
    console.log(`With skills: ${stats.withSkills} (${((stats.withSkills/stats.total)*100).toFixed(1)}%)`);
    console.log(`With location: ${stats.withLocation} (${((stats.withLocation/stats.total)*100).toFixed(1)}%)`);
    console.log(`Remote jobs: ${stats.remote} (${((stats.remote/stats.total)*100).toFixed(1)}%)`);
    console.log(`Internships: ${stats.internships} (${((stats.internships/stats.total)*100).toFixed(1)}%)`);

    const needsSkillExtraction = stats.total - stats.withSkills;
    if (needsSkillExtraction > 0) {
      console.log(`\n⚠️  ${needsSkillExtraction} jobs need skill extraction from description`);
    }

    console.log('\n========================================');
    console.log('✓ SCHEMA ALIGNMENT TEST COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run the test
testJobSchema()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
