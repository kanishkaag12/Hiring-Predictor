# ML Integration Fix Guide - Shortlist Probability

## 🎯 OBJECTIVE
Ensure that **ALL** shortlist probability predictions come from trained ML models with **NO fallback** to old/cached/hardcoded values.

## ✅ CHANGES IMPLEMENTED

### 1. Python ML Predictor (`python/ml_predictor.py`)
**NEW FILE** - Loads and uses trained models via Python subprocess

**Features:**
- Loads `placement_random_forest_model.pkl` (Random Forest model)
- Loads `job_embeddings.pkl` (pre-computed job embeddings)
- Loads `job_texts.pkl` (job descriptions)
- Provides `predict` command for candidate strength
- Provides `batch_predict` for multiple predictions
- **NO FALLBACK** - Returns explicit errors if models unavailable

**Usage:**
```bash
# Load models
python python/ml_predictor.py load models

# Single prediction (via stdin)
echo '{"features": [...], "job_id": "123"}' | python python/ml_predictor.py predict models
```

### 2. Updated Service (`server/services/ml/shortlist-probability.service.ts`)

**Critical Changes:**
- ❌ **REMOVED:** Fallback model logic
- ❌ **REMOVED:** Mock job data
- ✅ **ADDED:** Python subprocess integration for model loading
- ✅ **ADDED:** Explicit error throwing if models not loaded
- ✅ **ADDED:** Comprehensive logging at every step
- ✅ **ADDED:** Real database queries for job data

**Key Methods:**
```typescript
// Initialize - MUST succeed or throw
static async initialize(): Promise<void>
  - Finds Python executable
  - Verifies model files exist
  - Loads models via Python
  - Throws error if any step fails

// Predict candidate strength - NO FALLBACK
static async predictCandidateStrength(profile)
  - Extracts features
  - Calls Python subprocess for RF prediction
  - Throws error if model not loaded

// Fetch job - REAL DATABASE
static async fetchJob(jobId)
  - Queries database for job
  - Throws error if not found
  - NO mock data

// Predict - FRESH COMPUTATION
static async predict(userId, jobId)
  - Fetches FRESH user profile
  - Fetches FRESH job data
  - Runs ML predictions
  - NO caching, NO fallback
```

### 3. Updated API Routes (`server/api/shortlist-probability.routes.ts`)

**Enhanced Logging:**
```
[API] ⚡ Analyze My Chances triggered: user=X, job=Y
[API] ✓ ML service ready - running fresh prediction
[ML Prediction] Starting fresh prediction...
[ML Prediction] ✓ Fetched user profile with N skills
[ML Prediction] ✓ Candidate strength from RandomForest: X
[ML Prediction] ✓ Job match from SBERT: Y
[ML Prediction] ✓ Final probability: Z%
[API] ✅ Prediction complete: Z%
```

**Error Handling:**
- Returns 503 if ML service not initialized
- Returns 500 with detailed error message if prediction fails
- NO silent fallbacks

### 4. What-If Simulator (Already Correct)
- ✅ Already recomputes predictions for scenarios
- ✅ Applies skill changes to profile
- ✅ Re-runs both RandomForest and embedding similarity
- ✅ NO static deltas or UI-only adjustments

## 📁 FILE LOCATIONS

```
Hiring-Predictor/
├── placement_random_forest_model.pkl    ← MUST EXIST HERE
├── job_embeddings.pkl                   ← MUST EXIST HERE
├── job_texts.pkl                        ← MUST EXIST HERE
├── python/
│   ├── ml_predictor.py                  ← NEW: Python ML interface
│   └── test_ml_models.py                ← NEW: Verification script
└── server/
    ├── services/ml/
    │   ├── shortlist-probability.service.ts  ← UPDATED
    │   ├── candidate-features.service.ts     ← OK (fixed earlier)
    │   ├── job-embedding.service.ts          ← OK
    │   └── what-if-simulator.service.ts      ← OK
    └── api/
        └── shortlist-probability.routes.ts   ← UPDATED
```

## 🔍 VERIFICATION STEPS

### Step 1: Test Python ML Loader
```bash
# Activate virtual environment
.venv\Scripts\Activate.ps1

# Test model loading
python python/test_ml_models.py
```

**Expected Output:**
```
✅ SUCCESS: Models loaded correctly
   - RF Model Type: RandomForestClassifier
   - Job Embeddings: XXX entries
   - Job Texts: XXX entries

✅ SUCCESS: Full prediction complete
   - Shortlist Probability: 0.XXX (XX.X%)
   - Using Real Model: True
```

### Step 2: Check Server Logs
Start the server and watch for:
```
✓ Using Python: C:\...\python.exe
✓ Found model file: ...\placement_random_forest_model.pkl
✓ Placement model loaded successfully
✓ Model type: RandomForestClassifier
✅ Shortlist Probability Service initialized successfully
✓ Using RandomForest for candidate strength predictions
✓ Using SBERT embeddings for job match scores
```

**If you see these, it's WORKING! ✅**

**If you see these, it's BROKEN! ❌**
```
❌ CRITICAL: placement_random_forest_model.pkl not found
⚠️  Could not load pickle model, using fallback
⚠️  Pickle loading not available
```

### Step 3: Test API Endpoint
```bash
# Test prediction endpoint
curl -X POST http://localhost:3000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID", "jobId": "YOUR_JOB_ID"}'
```

**Expected Response:**
```json
{
  "prediction": {
    "shortlistProbability": 72,
    "candidateStrength": 85,
    "jobMatchScore": 85,
    "matchedSkills": [...],
    "missingSkills": [...],
    "timestamp": "2026-02-02T..."
  }
}
```

**Check Server Logs:**
```
[API] ⚡ Analyze My Chances triggered: user=X, job=Y
[API] ✓ ML service ready - running fresh prediction
[ML Prediction] Starting fresh prediction for user=X, job=Y
[ML Prediction] ✓ Fetched user profile with N skills
[ML Prediction] ✓ Candidate strength from RandomForest: 0.850
[ML Prediction] ✓ Job match from SBERT: 0.850
[ML Prediction] ✓ Final probability: 72.3%
[API] ✅ Prediction complete: 72%
```

### Step 4: Test What-If Simulator
```bash
curl -X POST http://localhost:3000/api/shortlist/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "jobId": "YOUR_JOB_ID",
    "scenario": {
      "jobId": "YOUR_JOB_ID",
      "addedSkills": ["Kubernetes", "Docker"]
    }
  }'
```

**Expected Server Logs:**
```
[API] 🔄 What-If simulation triggered: user=X, job=Y
[API] Scenario changes: {"added":["Kubernetes","Docker"]}
[API] ✓ Running What-If with FRESH model predictions
[ML Prediction] Starting fresh prediction... (baseline)
[ML Prediction] Starting fresh prediction... (projected)
[API] ✅ What-If complete: 72% → 88% (Δ+16%)
```

## 🚨 TROUBLESHOOTING

### Problem: "Model file not found"
**Solution:**
```bash
# Check if model exists
ls placement_random_forest_model.pkl

# If not, you need to train/download the model
# Model should be in project root directory
```

### Problem: "Failed to spawn Python process"
**Solution:**
```bash
# Verify Python path
which python  # Unix
where python  # Windows

# Verify virtual environment is activated
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # Unix

# Test Python script manually
python python/ml_predictor.py load models
```

### Problem: "ML service not ready"
**Solution:**
- Check server startup logs for initialization errors
- Ensure models are in correct location
- Ensure Python dependencies are installed:
  ```bash
  pip install numpy scikit-learn
  ```

### Problem: "Still seeing fallback predictions"
**Solution:**
- This should be IMPOSSIBLE now - the service will FAIL if models aren't loaded
- Check server logs for initialization errors
- If service initialized successfully but predictions seem wrong, verify:
  1. Model file is correct version
  2. Features are extracted correctly
  3. Job data is coming from database (not mock)

## 📊 EXPECTED BEHAVIOR

### ✅ CORRECT Behavior
1. **"Analyze My Chances" button:**
   - Triggers API call to `/api/shortlist/predict`
   - Server fetches FRESH user profile from database
   - Server fetches FRESH job data from database
   - Server runs RandomForest prediction via Python
   - Server computes embedding similarity
   - Returns: `candidate_strength × job_match_score`
   - **Probability changes** when user updates profile/resume

2. **What-If Simulator:**
   - Applies skill changes to profile
   - Re-runs FULL prediction pipeline
   - Shows baseline vs projected with delta
   - **Probability updates in real time** based on changes

3. **No caching:**
   - Every prediction is computed fresh
   - No stored probabilities
   - No hardcoded percentages
   - All values from trained models

### ❌ INCORRECT Behavior (Should NOT happen)
- Seeing same probability for different jobs
- Probability doesn't change when profile updated
- Seeing logs like "using fallback" or "mock data"
- Getting 503 errors (means ML service failed to initialize)
- What-If simulator showing static deltas

## 🎯 SUCCESS CRITERIA

**You know it's working when:**
1. ✅ Server logs show: `✅ Shortlist Probability Service initialized successfully`
2. ✅ Server logs show: `✓ Using RandomForest for candidate strength predictions`
3. ✅ Every API call shows: `[ML Prediction] ✓ Candidate strength from RandomForest: X.XXX`
4. ✅ Every API call shows: `[ML Prediction] ✓ Job match from SBERT: X.XXX`
5. ✅ Probabilities change when user profile changes
6. ✅ What-If scenarios show different probabilities
7. ✅ No "fallback" or "mock" in logs
8. ✅ Test script passes all checks: `python python/test_ml_models.py`

## 📝 SUMMARY

**What was fixed:**
- ❌ Removed all fallback logic
- ❌ Removed all mock data
- ✅ Added Python subprocess integration
- ✅ Added explicit error throwing
- ✅ Added comprehensive logging
- ✅ Added real database queries
- ✅ Added verification test script

**Prediction flow:**
```
User Profile (DB) + Job Data (DB)
  ↓
Feature Extraction (13 features)
  ↓
placement_random_forest_model.pkl → candidate_strength
  ↓
job_embeddings.pkl → job_match_score (cosine similarity)
  ↓
shortlist_probability = candidate_strength × job_match_score
  ↓
Return to frontend (NO CACHING)
```

**Single source of truth:** Trained ML models ONLY ✅
