# 🧪 Standalone Resume Testing Script

## What It Does

This script lets you test resume predictions **without running the dev server**:

✅ Parses a resume PDF  
✅ Extracts skills, experience, education  
✅ Predicts shortlist probability for **ALL jobs in the database**  
✅ Shows results in a formatted table  
✅ Exports results to CSV  
✅ No need to run `npm run dev` repeatedly  

## Quick Start

### 1. Run the test with your resume

```bash
# Using the uploaded resume
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf

# Or with any other resume file
npm run test:resume:standalone ./my-resume.pdf

# Optional: Use a specific user ID (otherwise creates a temp user)
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf user-123
```

### 2. What You'll Get

**Console Output:**
```
📊 Shortlist Probability: 78%
🎯 Job Match Score: 82%
💪 Candidate Strength: 71%
✅ Matched Skills: Python, React, SQL
❌ Missing Skills: Docker, Kubernetes
```

**Results Table:**
```
┌─────┬──────────┬──────────────────┬──────────┬──────────┐
│ Rank│Shortlist │ Job Title        │ Match %  │Candidate│
├─────┼──────────┼──────────────────┼──────────┼──────────┤
│ 1   │ 85%      │ Senior Engineer  │ 88%      │  79%     │
│ 2   │ 72%      │ Python Developer │ 75%      │  68%     │
│ 3   │ 65%      │ React Dev        │ 70%      │  58%     │
└─────┴──────────┴──────────────────┴──────────┴──────────┘
```

**CSV Export:**
```
test-results-1707107334123.csv
↳ Contains all jobs with full details
```

## Usage Scenarios

### Scenario 1: Test single resume against all jobs
```bash
npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
```
✅ **Use when:** You want to see which jobs match this resume best

### Scenario 2: Test and compare multiple resumes
```bash
# First resume
npm run test:resume:standalone ./resume1.pdf

# Wait for results...

# Second resume (different user)
npm run test:resume:standalone ./resume2.pdf another-user-456
```
✅ **Use when:** You want to compare prediction results for different candidates

### Scenario 3: Use existing user profile
```bash
npm run test:resume:standalone uploads/my-resume.pdf my-user-id-123
```
✅ **Use when:** You want to test against an existing user's profile

## Output Explained

### Results Table Columns

| Column | Meaning |
|--------|---------|
| Rank | Position when sorted by shortlist probability |
| Shortlist | Final shortlist probability (0-100%) |
| Job Title | Position name |
| Match % | How well resume matches job requirements |
| Candidate | Candidate strength score |

### Statistics Section

```
Average Shortlist Probability: 65.3%
Highest: 85%
Lowest: 32%

Strong Matches (70%+): 12 jobs
Moderate Matches (50-69%): 18 jobs
Weak Matches (<50%): 20 jobs
```

This tells you:
- Overall how well this resume matches available jobs
- How many jobs are a good fit vs weak fit

### Top 3 Opportunities

Shows the jobs where the resume has the best match:
- Highest shortlist probability
- Best job match score
- Which skills are already present
- Which skills need to be learned

### Jobs Needing Work

Shows the jobs where resume is weakest:
- Lowest shortlist probability
- Most missing skills
- Biggest gaps to fill

## CSV Export

The script automatically saves results to `test-results-{timestamp}.csv`:

```
Job Title,Company,Shortlist %,Match %,Strength %,Matched Skills,Missing Skills
"Senior Engineer","Google",85,88,79,"Python; React; SQL","Docker; Kubernetes"
"Python Dev","Acme Corp",72,75,68,"Python; SQL","React; Node.js"
...
```

**Use for:**
- 📊 Creating comparison reports
- 📧 Sharing results with stakeholders
- 🔍 Analysis in Excel/Sheets
- 📈 Tracking improvements over time

## Common Issues

### Issue: "Resume file not found"
```
npm run test:resume:standalone ./my-resume.pdf
❌ Resume file not found: C:\path\to\my-resume.pdf
```

**Fix:**
- Use correct relative path from project root
- Or use absolute path: `C:\Users\dell\Desktop\my-resume.pdf`

### Issue: "ML service not initialized"
```
❌ ML service not ready
```

**Fix:**
- Make sure you've built the project: `npm run build`
- Ensure `placement_random_forest_model.pkl` exists

### Issue: Very slow / taking long time
- Script tests against ALL jobs (may be 50-100+ jobs)
- Each prediction takes 2-5 seconds
- Total time: 2-10 minutes for large job databases
- This is normal! ⏳

### Issue: "No jobs in database"
```
❌ No jobs in database
```

**Fix:**
- Ingest jobs first: `npm run test:ingest`
- Or manually add jobs to database

## Advanced Usage

### Testing Multiple Resumes Sequentially

```bash
# Test resume 1
npm run test:resume:standalone uploads/resume1.pdf user-1

# Wait for results...

# Test resume 2
npm run test:resume:standalone uploads/resume2.pdf user-2

# Wait for results...
```

Then compare the CSV files to see which candidate matches better!

### Batch Testing Script

Create `test-batch.sh`:
```bash
#!/bin/bash
npm run test:resume:standalone ./resume1.pdf user1
echo "---"
npm run test:resume:standalone ./resume2.pdf user2
echo "---"
npm run test:resume:standalone ./resume3.pdf user3
```

Then run:
```bash
bash test-batch.sh
```

### Debugging

If you want to see detailed logs, set debug flag:
```bash
DEBUG=ml:* npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
```

## What Gets Stored

When the script runs, it:
1. ✅ Parses your resume
2. ✅ Creates/updates a test user profile
3. ✅ Stores skills, experience, education in DB
4. ✅ Runs ML predictions
5. ✅ Shows results

**Data is persisted** - If you run again with the same user ID, it updates their profile.

## Files Generated

```
test-results-1707107334123.csv     ← Prediction results export
```

You can delete these safely - they're just exports for review.

## Tips & Tricks

### Tip 1: Keep the same user for multiple resumes
```bash
npm run test:resume:standalone ./resume1.pdf test-user-1
# ... run again later with same user ...
npm run test:resume:standalone ./resume2.pdf test-user-1  # Updates profile
```

### Tip 2: Check which skills help most
Look at the top matches' "Matched Skills" - these are your strong areas.

### Tip 3: Learn the missing skills
The "Missing Skills" columns show what would improve each position.

### Tip 4: Export and pivot
Open the CSV in Excel/Sheets and pivot by skill to find jobs needing specific technologies.

## Next Steps

1. **Run the test:** 
   ```bash
   npm run test:resume:standalone uploads/resume-1769407134942-931026016.pdf
   ```

2. **Review results:** Check shortlist probability and top matches

3. **See missing skills:** Identify what to learn next

4. **Share results:** Email the CSV to stakeholders

---

**No server needed! Just run the script and get instant results! 🚀**
