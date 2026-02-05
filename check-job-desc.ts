import { storage } from './server/storage.js';

async function checkJobDescription() {
  const jobs = await storage.getJobs();
  const job = jobs[0];
  
  console.log('Job Title:', job.title);
  console.log('\nJob Description:');
  console.log('─'.repeat(80));
  console.log(job.jobDescription);
  console.log('─'.repeat(80));
  
  process.exit(0);
}

checkJobDescription();
