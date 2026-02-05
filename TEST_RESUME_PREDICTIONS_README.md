# Resume Shortlist Prediction Test

## Quick Start

Run the test script to see shortlist probabilities for the uploaded resume across all jobs:

```bash
npx tsx test-resume-predictions.ts
```

## What It Does

1. ✅ Parses the resume: `uploads/resume-1769407134942-931026016.pdf`
2. ✅ Extracts skills, experience, projects, education
3. ✅ Builds a candidate profile
4. ✅ Initializes ML models (RandomForest + SBERT)
5. ✅ Fetches all jobs from database
6. ✅ Runs predictions for each job
7. ✅ Shows results sorted by probability

## Output

The script displays:
- **Top 20 Jobs** ranked by shortlist probability
- **Detailed Breakdown** for top 3 jobs (matched/missing skills)
- **Statistics** (averages, distribution, range)
- **JSON File** with complete results

## Example Output

```
🏆 TOP 20 JOBS BY SHORTLIST PROBABILITY:

Rank | Probability | Strength | Match | Job Title & Company
--------------------------------------------------------------------------------
   1 |        78% |     68% |  85% | Backend Developer @ TechCorp
   2 |        72% |     68% |  75% | Full Stack Engineer @ StartupXYZ
   3 |        65% |     68% |  63% | Python Developer @ DataCo
...

📈 STATISTICS
Average Shortlist Probability: 52.3%
Average Candidate Strength:    68.5%
Average Job Match Score:       45.2%
Max Shortlist Probability:     78%
Min Shortlist Probability:     15%
Range:                         63%

Distribution:
  Excellent (≥70%): 5 jobs (8.3%)
  Good (50-69%):    18 jobs (30.0%)
  Fair (30-49%):    25 jobs (41.7%)
  Weak (<30%):      12 jobs (20.0%)
```

## Requirements

- Database connection configured (DATABASE_URL in .env)
- ML models loaded (placement_random_forest_model.pkl)
- Jobs in database
- Resume file exists at specified path

## Notes

- No user authentication required (testing mode)
- Creates temporary test user ID
- Results saved to `test-results-{timestamp}.json`
- Safe to run multiple times
