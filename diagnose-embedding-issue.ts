/**
 * DIAGNOSTIC SCRIPT: Check why all jobs get 100% match
 * 
 * This script will:
 * 1. Fetch 3 different jobs from DB
 * 2. Print their JD text to verify they're different
 * 3. Generate embeddings for each
 * 4. Compare embeddings to see if they're identical
 * 5. Check user skills vs job required skills
 */

import { storage } from './server/storage';
import { JobEmbeddingService } from './server/services/ml/job-embedding.service';

async function diagnoseEmbeddingIssue() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSTIC: Why are all jobs getting 100% match?');
  console.log('='.repeat(80) + '\n');
  
  try {
    // Get jobs from DB
    const allJobs = await storage.getJobs();
    if (allJobs.length < 2) {
      console.error('❌ Need at least 2 jobs to compare');
      return;
    }
    
    const testJobs = allJobs.slice(0, 3); // Test first 3 jobs
    
    console.log(`📋 Testing ${testJobs.length} jobs:\n`);
    
    // Step 1: Print job descriptions
    console.log('STEP 1: Verify job descriptions are DIFFERENT\n');
    console.log('─'.repeat(80));
    
    for (let i = 0; i < testJobs.length; i++) {
      const job = testJobs[i];
      const jd = job.jobDescription || job.description || '';
      
      console.log(`\nJob ${i + 1}: ${job.title}`);
      console.log(`ID: ${job.id}`);
      console.log(`Company: ${job.company}`);
      console.log(`Skills: ${(job.skills as string[])?.join(', ') || 'None'}`);
      console.log(`JD Length: ${jd.length} chars`);
      console.log(`JD Text (first 300 chars):`);
      console.log(`"${jd.substring(0, 300)}..."`);
      console.log('─'.repeat(80));
    }
    
    // Step 2: Check if JDs are actually different
    console.log('\n\nSTEP 2: Check if JD texts are identical\n');
    const jdTexts = testJobs.map(j => (j.jobDescription || j.description || '').trim());
    
    for (let i = 0; i < jdTexts.length; i++) {
      for (let j = i + 1; j < jdTexts.length; j++) {
        const same = jdTexts[i] === jdTexts[j];
        console.log(`Job ${i + 1} vs Job ${j + 1}: ${same ? '❌ IDENTICAL' : '✅ Different'}`);
        if (same) {
          console.log(`  🚨 CRITICAL: Jobs have IDENTICAL descriptions!`);
          console.log(`  This will cause identical embeddings and 100% match for all`);
        }
      }
    }
    
    // Step 3: Generate embeddings
    console.log('\n\nSTEP 3: Generate embeddings for each job\n');
    console.log('─'.repeat(80));
    
    // Clear cache to force fresh generation
    JobEmbeddingService.clearCache();
    JobEmbeddingService.initialize();
    
    const embeddings: number[][] = [];
    
    for (let i = 0; i < testJobs.length; i++) {
      const job = testJobs[i];
      const jd = job.jobDescription || job.description || '';
      
      console.log(`\nGenerating embedding for Job ${i + 1}: ${job.title}`);
      
      try {
        const embedding = await JobEmbeddingService.embedJobDescription(job.id, jd);
        embeddings.push(embedding);
        
        const mean = embedding.reduce((s, v) => s + v, 0) / embedding.length;
        const std = Math.sqrt(embedding.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / embedding.length);
        
        console.log(`✅ Embedding generated:`);
        console.log(`   Dimensions: ${embedding.length}`);
        console.log(`   Mean: ${mean.toFixed(6)}`);
        console.log(`   Std: ${std.toFixed(6)}`);
        console.log(`   First 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}]`);
      } catch (error) {
        console.error(`❌ Error generating embedding:`, error);
      }
      
      console.log('─'.repeat(80));
    }
    
    // Step 4: Compare embeddings
    console.log('\n\nSTEP 4: Compare embeddings (cosine similarity)\n');
    
    function cosineSimilarity(vec1: number[], vec2: number[]): number {
      const minLength = Math.min(vec1.length, vec2.length);
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (let i = 0; i < minLength; i++) {
        dotProduct += vec1[i] * vec2[i];
        magnitude1 += vec1[i] * vec1[i];
        magnitude2 += vec2[i] * vec2[i];
      }

      magnitude1 = Math.sqrt(magnitude1);
      magnitude2 = Math.sqrt(magnitude2);

      if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
      }

      return dotProduct / (magnitude1 * magnitude2);
    }
    
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
        const job1 = testJobs[i].title;
        const job2 = testJobs[j].title;
        
        console.log(`\nJob ${i + 1} vs Job ${j + 1}:`);
        console.log(`  "${job1}" vs "${job2}"`);
        console.log(`  Cosine Similarity: ${(similarity * 100).toFixed(4)}%`);
        
        if (similarity > 0.999) {
          console.log(`  🚨 CRITICAL: Embeddings are IDENTICAL!`);
          console.log(`  This will cause both jobs to have same match score`);
        } else if (similarity > 0.95) {
          console.log(`  ⚠️  WARNING: Embeddings are very similar`);
        } else {
          console.log(`  ✅ Embeddings are different (good)`);
        }
      }
    }
    
    // Step 5: Check user skills (if provided)
    const testUserId = process.env.TEST_USER_ID || process.argv[2];
    if (testUserId) {
      console.log('\n\nSTEP 5: Check user skills vs job requirements\n');
      console.log('─'.repeat(80));
      
      const user = await storage.getUser(testUserId);
      if (user) {
        const userSkills = await storage.getSkills(testUserId);
        const userSkillNames = userSkills.map(s => s.name);
        
        console.log(`\nUser: ${user.username}`);
        console.log(`Skills: ${userSkillNames.join(', ')}`);
        console.log(`Total: ${userSkillNames.length} skills\n`);
        
        for (let i = 0; i < testJobs.length; i++) {
          const job = testJobs[i];
          const requiredSkills = (job.skills as string[]) || [];
          
          const matched = requiredSkills.filter(s => 
            userSkillNames.some(us => us.toLowerCase() === s.toLowerCase())
          );
          
          const matchPercent = requiredSkills.length > 0 
            ? (matched.length / requiredSkills.length * 100).toFixed(1)
            : '0';
          
          console.log(`Job ${i + 1}: ${job.title}`);
          console.log(`  Required: ${requiredSkills.join(', ')}`);
          console.log(`  Matched: ${matched.join(', ') || 'None'}`);
          console.log(`  Match Rate: ${matchPercent}%`);
          
          if (matched.length === requiredSkills.length && requiredSkills.length > 0) {
            console.log(`  ⚠️  User has ALL required skills (explains 100% match)`);
          }
          console.log('');
        }
      }
    } else {
      console.log('\n\nSTEP 5: Skipped (no user ID provided)');
      console.log('Run with: node dist/diagnose-embedding-issue.js <user_id>');
    }
    
    // Final diagnosis
    console.log('\n' + '='.repeat(80));
    console.log('🔬 DIAGNOSIS SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    // Check if JDs are identical
    const jdsIdentical = jdTexts.every(jd => jd === jdTexts[0]);
    
    // Check if embeddings are identical
    let embeddingsIdentical = true;
    if (embeddings.length >= 2) {
      for (let i = 1; i < embeddings.length; i++) {
        const similarity = cosineSimilarity(embeddings[0], embeddings[i]);
        if (similarity < 0.999) {
          embeddingsIdentical = false;
          break;
        }
      }
    }
    
    if (jdsIdentical) {
      console.log('🚨 ROOT CAUSE FOUND: Job descriptions are IDENTICAL');
      console.log('   ↳ All jobs have the same JD text in database');
      console.log('   ↳ This causes identical embeddings → identical match scores');
      console.log('   ↳ FIX: Update jobs in DB with unique descriptions');
    } else if (embeddingsIdentical) {
      console.log('🚨 ROOT CAUSE FOUND: Embeddings are IDENTICAL despite different JDs');
      console.log('   ↳ Job descriptions are different but embeddings are same');
      console.log('   ↳ Check if SBERT is falling back to TF-IDF');
      console.log('   ↳ Check logs above for "FALLING BACK TO TF-IDF"');
    } else {
      console.log('✅ Job descriptions are different');
      console.log('✅ Embeddings are different');
      console.log('❓ Issue might be in match score calculation or user skills');
      console.log('   ↳ Check if user has ALL skills for all jobs');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseEmbeddingIssue().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
