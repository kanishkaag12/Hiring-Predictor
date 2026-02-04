# HirePulse ML System - Implementation Checklist

## Pre-Deployment Setup

### Database Requirements
- [ ] All jobs have `description` field populated (minimum 100 chars)
- [ ] All jobs have `skills` array with required skills listed
- [ ] User profiles have `cgpa` field (0-10 scale)
- [ ] Resume parsing populates `resumeExperienceMonths`, `resumeProjectsCount`
- [ ] Experience table has `type` field (Job/Internship)

### Dependencies
- [ ] `@xenova/transformers` installed (for SBERT)
  ```bash
  npm install @xenova/transformers
  ```
- [ ] Python 3.8+ available with pickle support
- [ ] `placement_random_forest_model.pkl` exists in project root
- [ ] Model trained with exactly 18 features in correct order

### Environment
- [ ] Node.js 16+ (for async/await)
- [ ] Python in PATH or configured in resume-parser.service.ts
- [ ] At least 2GB RAM (for SBERT model on first load)
- [ ] ~500MB disk space for SBERT model cache

## Deployment Steps

### 1. Verify Database Schema
```sql
-- Check jobs table
SELECT id, description, skills FROM jobs LIMIT 1;
-- Should have non-null description (text) and skills (array/json)

-- Check users table
SELECT id, cgpa, resumeExperienceMonths, resumeProjectsCount FROM users LIMIT 1;
-- Should have these fields populated

-- Check experience table
SELECT id, type FROM experiences LIMIT 1;
-- Should have 'Internship' or 'Job' values
```

### 2. Verify Model Files
```bash
# RandomForest model
ls -la placement_random_forest_model.pkl
# Should exist, size > 1MB

# Python script
ls -la python/ml_predictor.py
# Should exist, have load/predict commands
```

### 3. Test Initialization
```bash
# Start server in development mode
npm run dev

# Check logs for:
# [ML] Initializing Shortlist Probability Service...
# ✓ Using Python: /path/to/python
# ✓ Found model file: placement_random_forest_model.pkl
# ✓ Found Python script: python/ml_predictor.py
# ✓ Placement model loaded successfully
# ✅ Shortlist Probability Service initialized successfully
```

### 4. Test Single Prediction
```bash
curl -X POST http://localhost:5000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "jobId": "test_job_id"
  }'
```

**Expected Response:**
```json
{
  "jobId": "test_job_id",
  "jobTitle": "Senior Java Developer",
  "shortlistProbability": 59,
  "candidateStrength": 62,
  "jobMatchScore": 57,
  "matchedSkills": ["Java", "Spring"],
  "missingSkills": ["Docker", "Kubernetes"],
  "improvements": [
    "Missing key skills: Docker, Kubernetes. Learning these would improve match score.",
    "Limited portfolio (1 project). Building 2-3 substantive projects would strengthen candidacy."
  ]
}
```

### 5. Verify Logs for CRITICAL Issues

**Good Logs:**
```
[ML] User profile for user_123:
  - Skills: 8 (Java(Advanced), ...)
  - Experience: 24 months (2 internships)
  - Projects: 3
  - CGPA: 7.8

[ML] ✓ Random Forest feature vector:
  - skillCount: 8.000
  - internshipCount: 2.000
  - cgpa: 0.780
  [... more features ...]

[ML] ✓ SBERT embedding generated (384d)
[ML] Job match cosine similarity: 57.2%
[ML] ✓ RandomForest candidate strength: 62.0%
[ML Prediction] ✓ Final probability (clamped): 59.1%
```

**BAD Logs (Fix Immediately):**
```
❌ CRITICAL: RandomForest returned zero/null strength: 0.000
   → Check: User has complete profile data? Model has 18 features?
   
❌ Job job_456 has NO description in database
   → Check: Update job record with proper description
   
❌ Sentence-BERT embedding failed
   → Check: @xenova/transformers installed? Internet connection?
   
⚠️ Job job_456 has no required skills
   → Not critical, but update job.skills for better matching
```

## Post-Deployment Testing

### Test 1: Complete Profile Impact
1. Create user with minimal profile (0 projects, 0 internships)
2. Get shortlist probability
3. Add internship via experience table
4. Get shortlist probability again
5. **Verify:** Probability INCREASED

### Test 2: Resume Upload Impact
1. Get shortlist probability for user without resume
2. Upload and parse resume
3. Get shortlist probability again
4. **Verify:** Candidate strength INCREASED

### Test 3: Different Jobs Different Match
1. Get probability for Job A (description: "Java developer")
2. Get probability for Job B (description: "Python developer")
3. **Verify:** Match scores are DIFFERENT (not both 1.0)

### Test 4: Missing Skills Feedback
1. Create user with skills: Python, JavaScript
2. Get probability for job requiring: Java, Spring, Docker
3. **Verify:** improvements includes "Missing key skills: Java, Spring, Docker"

### Test 5: No Zero Probability
1. Create user with empty profile
2. Get probability
3. **Verify:** Probability is 5% (minimum clamp), not 0%

### Test 6: ML Explanations
1. Check any prediction response
2. **Verify:** Improvements describe ACTUAL gaps
   - ✅ "Missing: Docker, Kubernetes"
   - ✅ "Limited portfolio (1 project)"
   - ✅ "Only 6 months experience"
   - ❌ NOT static: "Add missing skills to your skillset"

## Troubleshooting

### RandomForest Returns 0.0
```
Issue: Features incomplete or model mismatch

Check:
1. [ML] log shows all 18 features? If not, profile incomplete
2. User has cgpa set? experienceMonths set?
3. Model trained with same feature order?

Fix:
- Add resume parsing for CGPA
- Add experience data to user profile
- Retrain model if feature count changed
```

### SBERT Embedding Fails
```
Issue: @xenova/transformers not available

Check:
1. npm ls @xenova/transformers → should show version
2. Internet connection available? (first load downloads model)
3. RAM available? (model is ~500MB)

Fix:
npm install @xenova/transformers
Restart server
Check internet connection
```

### Job Match Always 1.0
```
Issue: Still using TF-IDF fallback

Check:
1. [ML] log shows "SBERT embedding generated"?
2. If shows "TF-IDF embedding", code not updated

Fix:
- Verify job-embedding.service.ts updated (removed TF-IDF)
- Restart server
- Check for stale build/cache
```

### Job Description Missing Error
```
Issue: Jobs don't have descriptions in DB

Check:
1. SELECT description FROM jobs WHERE id='job_id'
2. If NULL or empty, need to populate

Fix:
- Update job postings with full descriptions
- OR modify jobs during creation to populate description
```

## Performance Monitoring

### Metrics to Track
```typescript
// In predictCandidateStrength:
const startTime = Date.now();
// ... predictions ...
const duration = Date.now() - startTime;
console.log(`[Perf] RandomForest prediction: ${duration}ms`);

// Expected times:
// RandomForest: 10-50ms
// SBERT embedding: 500-1500ms (first run slower)
// Database queries: 50-150ms
// Total: 600-1700ms
```

### Alert Thresholds
- [ ] Single prediction > 5s → Investigate SBERT hang
- [ ] Zero strength returned → Validate features
- [ ] SBERT embedding repeatedly fails → Check @xenova dependency

## Rollback Plan

If ML predictions have issues:

1. **Immediate:** Keep API backward compatible
   - Add try/catch returning error response
   - Frontend shows "Prediction unavailable - try again later"

2. **Temporary Fallback:** Use rule-based scoring (24hrs max)
   - Read shortlist_predictions table for recent predictions
   - Interpolate based on similar profiles
   - Log: "[ML Fallback] Using cached prediction"

3. **Full Rollback:** Disable feature entirely
   - Remove /api/shortlist/predict endpoint
   - Remove "Analyze Chances" button from UI
   - Keep database tables for later analysis

## Success Criteria

After deployment, EVERY prediction should show:

✅ Non-zero candidate strength (5-95%)
✅ Realistic job match (0-100%, varies per job)
✅ Probability between 5-95% (never 0 or 100)
✅ ML-driven improvements (from actual gaps)
✅ Complete logs with feature vectors
✅ Processing time < 2 seconds

If ANY prediction shows:
- 0% probability
- 100% job match
- Generic explanations
- Missing logs

→ Investigation needed before full production rollout
