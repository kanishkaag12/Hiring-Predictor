# Quick Test Guide - ML Integration

## ✅ Step-by-Step Verification

### Step 1: Verify Model Files Exist
```powershell
# Check if model files are in the project root
ls placement_random_forest_model.pkl
ls job_embeddings.pkl
ls job_texts.pkl
```

**Expected:** All 3 files should be found
**If missing:** Copy models to project root directory

### Step 2: Test Python ML Loader
```powershell
# Activate virtual environment
.venv\Scripts\Activate.ps1

# Install required packages
pip install numpy scikit-learn

# Run test script
python python\test_ml_models.py
```

**Expected Output:**
```
🧪 ML MODEL VERIFICATION TEST SUITE
============================================================
TEST 1: Model Loading
============================================================
✅ SUCCESS: Models loaded correctly
   - RF Model Type: RandomForestClassifier
   - Job Embeddings: XXX entries
   - Job Texts: XXX entries

TEST 2: Candidate Strength Prediction
============================================================
Strong Candidate:
  ✅ Candidate Strength: 0.XXX (XX.X%)
     Confidence: 0.95

TEST 3: Full Shortlist Probability
============================================================
✅ SUCCESS: Full prediction complete
   - Shortlist Probability: 0.XXX (XX.X%)
   - Candidate Strength: 0.XXX (XX.X%)
   - Job Match Score: 0.XXX (XX.X%)
   - Using Real Model: True

============================================================
TEST SUMMARY
============================================================
Model Loading: ✅ PASSED
Candidate Prediction: ✅ PASSED
Full Prediction: ✅ PASSED
============================================================

🎉 ALL TESTS PASSED - ML models are working correctly!
```

**If tests fail:** Check error messages and see troubleshooting section

### Step 3: Start the Server
```powershell
npm run dev
```

**Watch for these logs:**
```
📊 Initializing Shortlist Probability Service...
✓ Using Python: C:\...\python.exe
✓ Found model file: ...\placement_random_forest_model.pkl
✓ Found Python script: ...\python\ml_predictor.py
Loading models from: ...
✓ Placement model loaded successfully
✓ Model type: RandomForestClassifier
✓ Job embeddings: XXX entries
✓ Job texts: XXX entries
✅ Shortlist Probability Service initialized successfully
✓ Using RandomForest for candidate strength predictions
✓ Using SBERT embeddings for job match scores
```

**✅ If you see these logs → ML IS WORKING!**

**❌ If you see error logs:**
```
❌ CRITICAL: placement_random_forest_model.pkl not found
❌ FAILED to initialize Shortlist Probability Service
```
→ Models not found, check Step 1

### Step 4: Test Prediction API

#### Option A: Using cURL
```powershell
# Test single prediction
curl -X POST http://localhost:3000/api/shortlist/predict `
  -H "Content-Type: application/json" `
  -d '{"userId": "YOUR_USER_ID", "jobId": "YOUR_JOB_ID"}'
```

#### Option B: Using PowerShell
```powershell
$body = @{
    userId = "YOUR_USER_ID"
    jobId = "YOUR_JOB_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/shortlist/predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Expected Response:**
```json
{
  "prediction": {
    "jobId": "...",
    "jobTitle": "Software Engineer",
    "shortlistProbability": 72,
    "candidateStrength": 85,
    "jobMatchScore": 85,
    "matchedSkills": ["Python", "React", ...],
    "missingSkills": ["Kubernetes", ...],
    "weakSkills": ["Docker", ...],
    "timestamp": "2026-02-02T..."
  }
}
```

**Expected Server Logs:**
```
[API] ⚡ Analyze My Chances triggered: user=..., job=...
[API] ✓ ML service ready - running fresh prediction
[ML Prediction] Starting fresh prediction for user=..., job=...
[ML Prediction] ✓ Fetched user profile with 8 skills
[ML Prediction] ✓ Candidate strength from RandomForest: 0.850
[ML Prediction] ✓ Job match from SBERT: 0.850
[ML Prediction] ✓ Final probability: 72.3%
[API] ✅ Prediction complete: 72% (strength=85%, match=85%)
```

### Step 5: Test What-If Simulator

```powershell
$body = @{
    userId = "YOUR_USER_ID"
    jobId = "YOUR_JOB_ID"
    scenario = @{
        jobId = "YOUR_JOB_ID"
        addedSkills = @("Kubernetes", "Docker")
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/shortlist/what-if" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Expected Response:**
```json
{
  "result": {
    "baselineShortlistProbability": 72,
    "projectedShortlistProbability": 88,
    "probabilityDelta": 16,
    "baselineCandidateStrength": 85,
    "projectedCandidateStrength": 92,
    "candidateStrengthDelta": 7,
    "baselineJobMatchScore": 85,
    "projectedJobMatchScore": 95,
    "jobMatchDelta": 10,
    "scenario": { "addedSkills": ["Kubernetes", "Docker"] },
    "timestamp": "..."
  }
}
```

**Expected Server Logs:**
```
[API] 🔄 What-If simulation triggered: user=..., job=...
[API] Scenario changes: {"added":["Kubernetes","Docker"],"removed":null,"modified":null}
[API] ✓ Running What-If with FRESH model predictions
[ML Prediction] Starting fresh prediction... (for baseline)
[ML Prediction] Starting fresh prediction... (for projected)
[API] ✅ What-If complete: 72% → 88% (Δ+16%)
```

## 🎯 Success Checklist

Mark each as you verify:

- [ ] All 3 model files exist in project root
- [ ] Python test script passes all tests
- [ ] Server starts without ML initialization errors
- [ ] See ✅ logs during server startup
- [ ] Prediction API returns actual probabilities
- [ ] Server logs show "RandomForest" and "SBERT" mentions
- [ ] What-If API returns different probabilities
- [ ] Server logs show fresh predictions being computed
- [ ] NO logs containing "fallback" or "mock"
- [ ] Probabilities change when profile changes

## ❌ Common Issues

### Issue: "Model file not found"
**Solution:**
```powershell
# Copy models to correct location
cp /path/to/your/models/placement_random_forest_model.pkl .
cp /path/to/your/models/job_embeddings.pkl .
cp /path/to/your/models/job_texts.pkl .
```

### Issue: "Failed to spawn Python process"
**Solution:**
```powershell
# Verify Python is accessible
python --version

# Should see Python 3.x

# If not, activate venv
.venv\Scripts\Activate.ps1
```

### Issue: "Module not found: numpy"
**Solution:**
```powershell
pip install numpy scikit-learn
```

### Issue: "User not found" or "Job not found"
**Solution:**
```powershell
# Verify user and job IDs exist in database
# Use actual IDs from your database

# Or check your database:
# SELECT id FROM users LIMIT 5;
# SELECT id FROM jobs LIMIT 5;
```

### Issue: "Still seeing same probabilities"
**Solution:**
- Clear browser cache
- Check server logs for "fresh prediction" messages
- Verify user profile has been updated in database
- Try a different user/job combination

## 📞 Getting Help

If you're still having issues:

1. **Check server logs** - Look for ❌ error messages
2. **Run test script** - `python python/test_ml_models.py`
3. **Verify files** - Ensure all model files exist
4. **Check Python** - Ensure virtual environment is activated
5. **Read guide** - See ML_INTEGRATION_FIX_GUIDE.md for detailed docs

## 🚀 Ready for Production

Once all checks pass:
1. Commit changes to Git
2. Deploy to production
3. Verify models are deployed with the code
4. Test production API endpoints
5. Monitor logs for ML prediction success

Your ML integration is now using **REAL TRAINED MODELS** with **NO FALLBACK**! 🎉
