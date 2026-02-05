# 🚀 STANDALONE RESUME TESTING - QUICK START

## What You Get

A **standalone testing script** that predicts shortlist probability for any resume against all jobs in your database - **NO SERVER NEEDED**.

## Files Created

1. **`test-resume-predictions-standalone.ts`** - Main test script
2. **`quick-test-resume.ts`** - Simple wrapper for easier usage
3. **`RESUME_TESTING_GUIDE.md`** - Full documentation
4. **`package.json`** - Updated with new npm script

## Installation (One Time)

```bash
npm run build
```

That's it! No server to start, no dependencies to install.

## Usage

### Test Your Resume (Simple)

```bash
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
```

### Test With Custom User ID

```bash
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf my-user-123
```

### Test Multiple Resumes

```bash
# First resume
npm run test:resume:standalone ./resume1.pdf

# Wait for results...

# Second resume
npm run test:resume:standalone ./resume2.pdf
```

## What Happens

```
🚀 Running predictions for 45 jobs...

[1/45] Predicting for: Senior Engineer @ Google... ✅ 85%
[2/45] Predicting for: Python Dev @ Microsoft... ✅ 72%
[3/45] Predicting for: React Dev @ Amazon... ✅ 68%
...

✅ Successfully predicted: 45/45

📊 RESULTS SUMMARY

🎯 TOP 3 OPPORTUNITIES:

1. Senior Engineer @ Google
   📊 Shortlist Probability: 85%
   🎯 Job Match Score: 88%
   💪 Candidate Strength: 79%
   ✅ Matched Skills: Python, React, SQL
   ❌ Missing Skills: Docker, Kubernetes

2. Python Developer @ Microsoft
   ...

📈 STATISTICS

Average Shortlist Probability: 68.3%
Highest: 85%
Lowest: 28%
Range: 57%

Strong Matches (70%+): 12 jobs
Moderate Matches (50-69%): 18 jobs
Weak Matches (<50%): 15 jobs

💾 Results exported to: test-results-1707107334123.csv
```

## Output Explained

| Metric | Meaning |
|--------|---------|
| Shortlist Probability | Final chance of being shortlisted (0-100%) |
| Job Match Score | How well your skills match job requirements |
| Candidate Strength | Overall profile strength (experience + skills + projects) |
| Matched Skills | Skills you have that the job needs |
| Missing Skills | Skills the job needs that you don't have |

## CSV Export

Automatically saved as `test-results-{timestamp}.csv`:

```
Job Title,Company,Shortlist %,Match %,Strength %,Matched Skills,Missing Skills
"Senior Engineer","Google",85,88,79,"Python; React; SQL","Docker; Kubernetes"
"Python Dev","Microsoft",72,75,68,"Python; SQL","React; Node.js"
...
```

**Use for:**
- Share with team/stakeholders
- Compare with other candidates
- Analysis in Excel/Sheets
- Track improvements over time

## Common Commands

### Test your uploaded resume
```bash
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
```

### Test a local resume file
```bash
npm run test:resume:standalone ./Downloads/my-resume.pdf
```

### Test with specific user (updates their profile)
```bash
npm run test:resume:standalone uploads/my-resume.pdf candidate-123
```

### Quick help
```bash
npm run test:resume:standalone --help
```

## How It Works

1. ✅ **Parse Resume** - Extracts skills, experience, education from PDF
2. ✅ **Store Data** - Saves extracted data to user profile
3. ✅ **Initialize ML** - Loads trained models
4. ✅ **Predict** - Runs shortlist prediction for each job
5. ✅ **Display Results** - Shows formatted table and statistics
6. ✅ **Export** - Saves results to CSV

Total time: 2-10 minutes (depending on number of jobs)

## Tips

### Tip 1: Build Once, Run Many Times
```bash
npm run build     # One time
npm run test:resume:standalone ./resume1.pdf
npm run test:resume:standalone ./resume2.pdf
npm run test:resume:standalone ./resume3.pdf
```

### Tip 2: Use Same User ID to Update Profile
```bash
# First test
npm run test:resume:standalone ./resume1.pdf john

# Update same user with new resume
npm run test:resume:standalone ./resume2.pdf john  # Updates john's profile
```

### Tip 3: Compare Results
- Save CSV files: `test-results-1.csv`, `test-results-2.csv`
- Open both in Excel/Sheets
- Compare side-by-side

### Tip 4: Find Your Best Matches
- Look at the table sorted by probability
- Focus on 70%+ matches
- Check what skills would unlock more jobs

## Troubleshooting

### "Build failed" or "TypeScript errors"
```bash
npm run build
```

If errors persist, check:
- Node version: `node --version` (should be 16+)
- Dependencies: `npm install`

### "No jobs in database"
Need to ingest jobs first:
```bash
npm run test:ingest
```

### "Resume parsing failed"
- Ensure it's a valid PDF
- Try a different PDF
- Check file permissions

### Very slow (takes 10+ minutes)
- This is normal for large job databases (100+ jobs)
- Each prediction takes 2-5 seconds
- Let it run in background

## Next Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test your resume:**
   ```bash
   npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
   ```

3. **Review results:**
   - Check console output
   - Open `test-results-*.csv`
   - Identify top matches and gaps

4. **Take action:**
   - Learn top missing skills
   - Apply to top matching jobs
   - Re-test after upskilling

## Files Reference

- **Main script:** `test-resume-predictions-standalone.ts`
- **Helper:** `quick-test-resume.ts`
- **Guide:** `RESUME_TESTING_GUIDE.md`
- **Config:** `package.json` (added npm script)

---

**You're all set! Run the test and get instant predictions! 🚀**

```bash
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
```
