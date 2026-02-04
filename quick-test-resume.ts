#!/usr/bin/env node

/**
 * 🚀 QUICK TEST RUNNER
 * 
 * Simple wrapper to run the standalone test with better UX
 * 
 * Usage:
 *   npx ts-node quick-test-resume.ts <resume_file> [user_id]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🧪 QUICK RESUME TESTING RUNNER                      ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  npm run test:resume:standalone <resume_file> [user_id]

EXAMPLES:
  # Test the uploaded resume
  npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf

  # Test a local file
  npm run test:resume:standalone ./my-resume.pdf

  # Test with specific user ID
  npm run test:resume:standalone ./my-resume.pdf john-doe-123

WHAT IT DOES:
  ✅ Parses your resume PDF
  ✅ Extracts skills, experience, education
  ✅ Predicts shortlist % for ALL jobs in database
  ✅ Shows results in formatted table
  ✅ Exports to CSV for further analysis
  ✅ No server needed!

OUTPUT:
  📊 Console table with rankings
  🏆 Top 3 matches
  ⚠️  Bottom 3 (needs work)
  📈 Statistics
  💾 CSV file for later review

TIPS:
  • First run: npm run build (to compile)
  • Then: npm run test:resume:standalone <file>
  • Check test-results-*.csv for detailed results
  • Run multiple times to test different resumes

  `);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

const resumeFile = args[0];

// Check if file exists
if (!fs.existsSync(resumeFile)) {
  const absolutePath = path.isAbsolute(resumeFile) 
    ? resumeFile 
    : path.join(process.cwd(), resumeFile);
    
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${resumeFile}`);
    console.error(`   Tried: ${absolutePath}`);
    process.exit(1);
  }
}

console.log(`\n🧪 Starting resume prediction test...\n`);

try {
  const cmd = `npx tsx test-resume-predictions-standalone.ts ${args.join(' ')}`;
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Test failed');
  process.exit(1);
}
