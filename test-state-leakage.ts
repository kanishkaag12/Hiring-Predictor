/**
 * ML State Leakage Bug Test
 * 
 * Tests that ML pipeline correctly handles multiple sequential job predictions
 * without state leakage, freezing, or identical scores across different jobs.
 * 
 * Usage: npm run test:state-leakage [user_id] [resume_file]
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  jobId: string;
  jobTitle: string;
  probability: number;
  timestamp: Date;
  matchedSkills: number;
  missingSkills: number;
  success: boolean;
  error?: string;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  identicalScores: number;
  differentScores: number;
  averageProbability: number;
  results: TestResult[];
}

class MLStateLeakageTest {
  private api: AxiosInstance;
  private userId: string;
  private resumeFile: string;
  private jobsToTest: Array<{ id: string; title: string }> = [];
  private results: TestResult[] = [];

  constructor(userId: string, resumeFile: string, apiUrl: string = 'http://localhost:3000') {
    this.api = axios.create({
      baseURL: apiUrl,
      timeout: 120000, // 2 minutes timeout
      validateStatus: () => true, // Don't throw on any status
    });
    this.userId = userId;
    this.resumeFile = resumeFile;
  }

  /**
   * Load test jobs from database or hardcoded list
   */
  async loadTestJobs(): Promise<void> {
    try {
      console.log(`\n[TEST] 📋 Loading test jobs from database...`);
      const response = await this.api.get(`/api/jobs?limit=5`);
      
      if (response.data?.jobs && Array.isArray(response.data.jobs)) {
        this.jobsToTest = response.data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
        }));
        console.log(`[TEST] ✅ Loaded ${this.jobsToTest.length} jobs for testing`);
      } else {
        throw new Error('Could not fetch jobs');
      }
    } catch (error) {
      console.error(`[TEST] ⚠️  Could not load jobs from API:`, error);
      console.log(`[TEST] Using hardcoded test jobs instead...`);
      
      // Fallback: Use 5 different job types for testing
      this.jobsToTest = [
        { id: 'job-frontend-1', title: 'Senior Frontend Developer' },
        { id: 'job-backend-1', title: 'Backend Engineer (Python/Django)' },
        { id: 'job-fullstack-1', title: 'Full Stack Developer' },
        { id: 'job-devops-1', title: 'DevOps Engineer' },
        { id: 'job-data-1', title: 'Data Scientist' },
      ];
    }
  }

  /**
   * Test a single job prediction
   */
  async testSingleJob(jobId: string, jobTitle: string): Promise<TestResult> {
    const startTime = Date.now();
    
    console.log(`\n[TEST] 🔄 Testing job prediction: "${jobTitle}" (ID: ${jobId})`);
    console.log(`[TEST] Sending request to /api/shortlist/predict...`);

    try {
      const response = await this.api.post('/api/shortlist/predict', {
        userId: this.userId,
        jobId: jobId,
      });

      const elapsed = Date.now() - startTime;
      const { data, status } = response;

      if (status !== 200) {
        console.error(`[TEST] ❌ Request failed with status ${status}`);
        return {
          jobId,
          jobTitle,
          probability: 0,
          timestamp: new Date(),
          matchedSkills: 0,
          missingSkills: 0,
          success: false,
          error: `HTTP ${status}: ${data?.error || 'Unknown error'}`,
        };
      }

      if (!data?.shortlistProbability) {
        console.error(`[TEST] ❌ No probability in response:`, data);
        return {
          jobId,
          jobTitle,
          probability: 0,
          timestamp: new Date(),
          matchedSkills: 0,
          missingSkills: 0,
          success: false,
          error: 'No shortlistProbability in response',
        };
      }

      const probability = data.shortlistProbability;
      const matchedSkills = data.jobMatch?.matchedSkills?.length || 0;
      const missingSkills = data.jobMatch?.missingSkills?.length || 0;

      const result: TestResult = {
        jobId,
        jobTitle,
        probability,
        timestamp: new Date(),
        matchedSkills,
        missingSkills,
        success: true,
      };

      console.log(`[TEST] ✅ Job prediction SUCCESS`);
      console.log(`[TEST]    Probability: ${(probability * 100).toFixed(1)}%`);
      console.log(`[TEST]    Matched Skills: ${matchedSkills}`);
      console.log(`[TEST]    Missing Skills: ${missingSkills}`);
      console.log(`[TEST]    Response Time: ${elapsed}ms`);

      return result;
    } catch (error: any) {
      console.error(`[TEST] ❌ Job prediction FAILED:`, error.message);
      return {
        jobId,
        jobTitle,
        probability: 0,
        timestamp: new Date(),
        matchedSkills: 0,
        missingSkills: 0,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Run sequential job predictions (tests for state leakage)
   */
  async runSequentialTests(): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[TEST] 🚀 ML STATE LEAKAGE TEST - SEQUENTIAL JOB PREDICTIONS`);
    console.log(`${'='.repeat(70)}`);
    console.log(`[TEST] User ID: ${this.userId}`);
    console.log(`[TEST] Resume File: ${this.resumeFile}`);
    console.log(`[TEST] Number of Jobs to Test: ${this.jobsToTest.length}`);
    console.log(`${'='.repeat(70)}`);

    // Test each job sequentially
    for (let i = 0; i < this.jobsToTest.length; i++) {
      const { id, title } = this.jobsToTest[i];
      console.log(`\n[TEST] Running test ${i + 1}/${this.jobsToTest.length}...`);
      
      const result = await this.testSingleJob(id, title);
      this.results.push(result);

      // Wait 1 second between requests to avoid rate limiting
      if (i < this.jobsToTest.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.printTestSummary();
  }

  /**
   * Generate test summary and validation
   */
  private printTestSummary(): void {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[TEST] 📊 TEST SUMMARY`);
    console.log(`${'='.repeat(70)}`);

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log(`\n[SUMMARY] Total Requests: ${this.results.length}`);
    console.log(`[SUMMARY] ✅ Successful: ${successful.length}`);
    console.log(`[SUMMARY] ❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log(`\n[SUMMARY] ❌ Failed Jobs:`);
      failed.forEach(result => {
        console.log(`[SUMMARY]   - ${result.jobTitle}: ${result.error}`);
      });
    }

    // Check for identical scores
    console.log(`\n[SUMMARY] 🔍 Score Uniqueness Check:`);
    const probabilities = successful.map(r => Math.round(r.probability * 10000)); // Scale to 4 decimals
    const uniqueScores = new Set(probabilities).size;
    const allIdentical = uniqueScores === 1 && successful.length > 1;

    if (allIdentical) {
      console.log(`[SUMMARY] ❌ CRITICAL: All ${successful.length} jobs have IDENTICAL probability!`);
      console.log(`[SUMMARY]    This indicates job-specific matching is BROKEN`);
      successful.forEach(result => {
        console.log(`[SUMMARY]    - ${result.jobTitle}: ${(result.probability * 100).toFixed(2)}%`);
      });
    } else if (successful.length > 1) {
      console.log(`[SUMMARY] ✅ GOOD: Jobs have DIFFERENT probabilities (${uniqueScores}/${successful.length} unique)`);
      successful.forEach(result => {
        console.log(`[SUMMARY]    - ${result.jobTitle}: ${(result.probability * 100).toFixed(2)}%`);
      });
    }

    // Check response consistency
    console.log(`\n[SUMMARY] 📈 Probability Statistics:`);
    const probs = successful.map(r => r.probability);
    if (probs.length > 0) {
      const avg = probs.reduce((a, b) => a + b, 0) / probs.length;
      const min = Math.min(...probs);
      const max = Math.max(...probs);
      const range = max - min;

      console.log(`[SUMMARY]   Average: ${(avg * 100).toFixed(1)}%`);
      console.log(`[SUMMARY]   Min: ${(min * 100).toFixed(1)}%`);
      console.log(`[SUMMARY]   Max: ${(max * 100).toFixed(1)}%`);
      console.log(`[SUMMARY]   Range: ${(range * 100).toFixed(1)}%`);

      if (range === 0 && successful.length > 1) {
        console.log(`[SUMMARY] ⚠️  WARNING: No variance in probabilities - likely bug!`);
      } else if (range < 0.1 && successful.length > 1) {
        console.log(`[SUMMARY] ⚠️  WARNING: Very low variance (${(range * 100).toFixed(2)}%) - may indicate state leakage`);
      } else {
        console.log(`[SUMMARY] ✅ Good variance in probabilities`);
      }
    }

    // Final verdict
    console.log(`\n${'='.repeat(70)}`);
    if (failed.length === 0 && uniqueScores > 1) {
      console.log(`[TEST] ✅ PASS: All predictions succeeded with different scores!`);
      console.log(`[TEST] State leakage bug appears to be FIXED ✨`);
    } else if (failed.length > 0) {
      console.log(`[TEST] ❌ FAIL: ${failed.length} predictions failed (likely freeze/state leak)`);
      console.log(`[TEST] State leakage bug is still present ❌`);
    } else if (allIdentical) {
      console.log(`[TEST] ❌ FAIL: All jobs have identical scores (job-specific matching broken)`);
    } else {
      console.log(`[TEST] ⚠️  INCONCLUSIVE: Check logs for warnings`);
    }
    console.log(`${'='.repeat(70)}\n`);

    // Save results to JSON
    this.saveResultsToFile();
  }

  /**
   * Save test results to file for analysis
   */
  private saveResultsToFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ml-state-leakage-test-${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);

    const summary: TestSummary = {
      totalRequests: this.results.length,
      successfulRequests: this.results.filter(r => r.success).length,
      failedRequests: this.results.filter(r => !r.success).length,
      identicalScores: 0,
      differentScores: 0,
      averageProbability: 0,
      results: this.results,
    };

    // Calculate statistics
    const successful = this.results.filter(r => r.success);
    if (successful.length > 0) {
      summary.averageProbability = successful.reduce((sum, r) => sum + r.probability, 0) / successful.length;
      const probs = successful.map(r => Math.round(r.probability * 10000));
      const uniqueScores = new Set(probs).size;
      summary.differentScores = uniqueScores;
      summary.identicalScores = successful.length - uniqueScores;
    }

    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    console.log(`[TEST] 💾 Results saved to: ${filepath}`);
  }
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  const userId = args[0] || 'test-user-001';
  const resumeFile = args[1] || 'test-resume.pdf';

  const tester = new MLStateLeakageTest(userId, resumeFile);

  try {
    // Load test jobs
    await tester.loadTestJobs();

    // Run sequential tests
    await tester.runSequentialTests();
  } catch (error) {
    console.error(`[TEST] Fatal error:`, error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
