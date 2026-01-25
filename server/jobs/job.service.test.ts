/**
 * REGRESSION TEST: Market Aggregation Functions
 * 
 * PURPOSE: Ensure market data aggregation layer doesn't get silently deleted.
 * If this test fails, it means aggregateMarketStats or its dependencies were removed.
 * 
 * This file must be run as part of CI/CD pipeline before deployment.
 * Command: npm run test -- job.service.test.ts
 */

import { aggregateMarketStats } from './job.service';
import type { Job } from './job.types';

describe('Market Data Aggregation - CRITICAL FUNCTIONS', () => {
  
  test('aggregateMarketStats function exists and is callable', () => {
    expect(typeof aggregateMarketStats).toBe('function');
  });

  test('aggregateMarketStats processes empty job list gracefully', () => {
    const result = aggregateMarketStats([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('aggregateMarketStats normalizes role categories correctly', () => {
    const jobs: Job[] = [
      {
        id: '1',
        source: 'remotive',
        title: 'Frontend Engineer',
        company: 'TechCorp',
        location: 'Remote',
        description: 'Build web apps',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job1',
        applicants: 50,
      },
      {
        id: '2',
        source: 'remotive',
        title: 'React Developer',
        company: 'WebSystems',
        location: 'Remote',
        description: 'Frontend position',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job2',
        applicants: 45,
      },
      {
        id: '3',
        source: 'remotive',
        title: 'Data Scientist',
        company: 'DataCo',
        location: 'Remote',
        description: 'ML position',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job3',
        applicants: 30,
      },
    ];

    const result = aggregateMarketStats(jobs);
    
    // Should group Frontend Engineer and React Developer
    expect(result.length).toBe(2); // Frontend Developer + Data Scientist
    
    // Find Frontend Developer category
    const frontendStats = result.find(s => s.roleCategory === 'Frontend Developer');
    expect(frontendStats).toBeDefined();
    expect(frontendStats?.totalActiveJobs).toBe(2);
    expect(frontendStats?.averageApplicantsPerJob).toBeGreaterThan(0);
    
    // Find Data Scientist category
    const dataStats = result.find(s => s.roleCategory === 'Data Scientist');
    expect(dataStats).toBeDefined();
    expect(dataStats?.totalActiveJobs).toBe(1);
  });

  test('aggregateMarketStats computes demand scores between 0 and 1', () => {
    const jobs: Job[] = Array.from({ length: 10 }, (_, i) => ({
      id: `job-${i}`,
      source: 'remotive',
      title: 'Backend Developer',
      company: `Company${i}`,
      location: 'Remote',
      description: 'Test job',
      postedAt: new Date(Date.now() - i * 1000000).toISOString(),
      url: `https://example.com/job${i}`,
      applicants: 20 + i * 5,
    }));

    const result = aggregateMarketStats(jobs);
    
    expect(result.length).toBeGreaterThan(0);
    result.forEach(stat => {
      expect(stat.marketDemandScore).toBeGreaterThanOrEqual(0);
      expect(stat.marketDemandScore).toBeLessThanOrEqual(1);
      expect(stat.competitionScore).toBeGreaterThanOrEqual(0);
      expect(stat.competitionScore).toBeLessThanOrEqual(1);
    });
  });

  test('aggregateMarketStats includes required output fields', () => {
    const jobs: Job[] = [
      {
        id: '1',
        source: 'remotive',
        title: 'Product Manager',
        company: 'StartupInc',
        location: 'New York',
        description: 'PM role',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job1',
        applicants: 100,
      },
    ];

    const result = aggregateMarketStats(jobs);
    const stat = result[0];

    // Verify all required fields exist
    expect(stat).toHaveProperty('roleCategory');
    expect(stat).toHaveProperty('totalActiveJobs');
    expect(stat).toHaveProperty('averageApplicantsPerJob');
    expect(stat).toHaveProperty('demandTrend');
    expect(stat).toHaveProperty('marketDemandScore');
    expect(stat).toHaveProperty('competitionScore');
    expect(stat).toHaveProperty('sampleCompanies');

    // Verify demand trend is valid
    expect(['rising', 'stable', 'falling']).toContain(stat.demandTrend);
    
    // Verify sample companies is populated
    expect(Array.isArray(stat.sampleCompanies)).toBe(true);
    expect(stat.sampleCompanies.length).toBeGreaterThan(0);
  });

  test('aggregateMarketStats correctly handles missing applicants', () => {
    const jobs: Job[] = [
      {
        id: '1',
        source: 'remotive',
        title: 'QA Engineer',
        company: 'TestCorp',
        location: 'Remote',
        description: 'QA role',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job1',
        // Missing applicants field
      },
      {
        id: '2',
        source: 'remotive',
        title: 'QA Engineer',
        company: 'BugHunters',
        location: 'Remote',
        description: 'QA position',
        postedAt: new Date().toISOString(),
        url: 'https://example.com/job2',
        applicants: 25,
      },
    ] as Job[];

    const result = aggregateMarketStats(jobs);
    const qaStats = result[0];

    expect(qaStats).toBeDefined();
    expect(qaStats.totalActiveJobs).toBe(2);
    expect(typeof qaStats.averageApplicantsPerJob).toBe('number');
    expect(qaStats.averageApplicantsPerJob).toBeGreaterThanOrEqual(0);
  });
});
