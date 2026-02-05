# Shortlist Probability System - Complete Implementation Guide

## Overview

The **Shortlist Probability** system is an ML-driven feature in HirePulse that predicts a candidate's chance of getting shortlisted before applying to a specific job or internship. It combines:

1. **Candidate Strength** - RandomForest classifier predicting profile quality (40% weight)
2. **Job Match Score** - Sentence-BERT semantic similarity between candidate and job (60% weight)
3. **Weighted Combination** - Final probability clamped to [5%, 95%] to prevent zero collapse
4. **Explainability** - ML-driven explanations of what's missing and how to improve
5. **What-If Simulator** - Real ML recomputation showing impact of adding skills/projects

---

## System Architecture

### 1. ML Models (Python)

**File:** `python/ml_predictor.py`

#### Load Models
```python
python ml_predictor.py load <models_dir>
```
Returns JSON with model status:
```json
{
  "success": true,
  "rf_model_type": "RandomForestClassifier",
  "embeddings_count": 1250,
  "job_texts_count": 1250
}
```

#### Predict Shortlist Probability
```python
python ml_predictor.py predict <models_dir>
```

Input (stdin):
```json
{
  "features": [2.5, 3, 4, 1, 0.8, ...],  // 18-element feature vector
  "job_id": "job_123",
  "user_embedding": [0.1, 0.2, ...],     // Optional: user skills embedding
  "job_embedding": [0.15, 0.25, ...]     // Optional: job description embedding
}
```

Output:
```json
{
  "success": true,
  "shortlist_probability": 0.68,    // 0-1 value
  "candidate_strength": 0.75,        // RandomForest probability
  "job_match_score": 0.62,           // Cosine similarity
  "raw_probability": 0.665,          // Before clamping
  "formula": "0.4 × candidate_strength + 0.6 × job_match (clamped 0.05-0.95)",
  "using_real_model": true
}
```

### 2. Feature Engineering (TypeScript)

**File:** `server/services/ml/candidate-features.service.ts`

Extracts 18 features from user profile:

```typescript
interface CandidateFeatures {
  // Skills (5 features)
  skillCount: number;
  advancedSkillCount: number;
  intermediateSkillCount: number;
  beginnerSkillCount: number;
  skillDiversity: number;
  
  // Experience (5 features)
  totalExperienceMonths: number;
  internshipCount: number;
  jobCount: number;
  hasRelevantExperience: number;
  avgExperienceDuration: number;
  
  // Education (3 features)
  educationLevel: number;
  hasQualifyingEducation: number;
  cgpa: number;
  
  // Projects (4 features)
  projectCount: number;
  highComplexityProjects: number;
  mediumComplexityProjects: number;
  projectComplexityScore: number;
  
  // Overall
  overallStrengthScore: number;
}
```

### 3. Job Embedding Service (TypeScript)

**File:** `server/services/ml/job-embedding.service.ts`

- Loads pre-trained Sentence-BERT embeddings from `job_embeddings.pkl`
- Falls back to TF-IDF if transformer unavailable
- Computes cosine similarity between user skills and job requirements

### 4. Main Prediction Service (TypeScript)

**File:** `server/services/ml/shortlist-probability.service.ts`

```typescript
// Main prediction orchestrator
async predict(userId: string, jobId: string): Promise<ShortlistPrediction>
```

Flow:
1. Fetch user profile and resume data
2. Fetch job description and requirements
3. Extract candidate features (18-element vector)
4. Run RandomForest prediction → `candidate_strength`
5. Compute job embedding and user skill embedding
6. Compute cosine similarity → `job_match_score`
7. Combine: `0.4 × strength + 0.6 × match`, clamp to [0.05, 0.95]
8. Identify missing/weak skills
9. Generate improvement suggestions
10. Return `ShortlistPrediction` object

### 5. What-If Simulator (TypeScript)

**File:** `server/services/ml/what-if-simulator.service.ts`

Allows testing scenarios:
- Add new skills
- Improve skill levels
- Remove skills

For each scenario:
1. Get baseline prediction
2. Apply scenario changes to profile
3. Rerun ALL ML models with modified profile
4. Return baseline vs projected comparison

**Important:** No hardcoded "+10%" boosts - only real ML recomputation.

### 6. Data Persistence (TypeScript)

**File:** `server/services/ml/shortlist-prediction-storage.service.ts`

Stores predictions and what-if results for:
- User analytics and history
- Tracking improvement over time
- Learning insights

**Database Tables:**
- `shortlist_predictions` - Individual predictions with all scores and skills
- `what_if_simulations` - Scenario tests with baseline→projected deltas

---

## API Endpoints

### Predictions

**POST /api/shortlist/predict**
```bash
curl -X POST http://localhost:5000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job_123", "userId": "user_456"}'
```

Response:
```json
{
  "prediction": {
    "jobId": "job_123",
    "jobTitle": "Senior Backend Engineer",
    "shortlistProbability": 68,
    "candidateStrength": 75,
    "jobMatchScore": 62,
    "matchedSkills": ["Python", "PostgreSQL", "Docker"],
    "missingSkills": ["Kubernetes", "gRPC"],
    "weakSkills": ["System Design"],
    "improvements": [
      "Add Kubernetes to your skillset",
      "Advance System Design from beginner to intermediate",
      "Build 1-2 backend projects showcasing distributed systems"
    ],
    "timestamp": "2024-02-03T10:30:00Z"
  }
}
```

**POST /api/shortlist/batch**
```bash
curl -X POST http://localhost:5000/api/shortlist/batch \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_456", "jobIds": ["job_1", "job_2", "job_3"]}'
```

Response: `{ predictions: ShortlistPrediction[] }`

### What-If Simulation

**POST /api/shortlist/what-if**
```bash
curl -X POST http://localhost:5000/api/shortlist/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "jobId": "job_123",
    "scenario": {
      "jobId": "job_123",
      "addedSkills": ["Kubernetes", "Docker Compose"],
      "modifiedSkills": [
        {"name": "System Design", "level": "Intermediate"}
      ]
    }
  }'
```

Response:
```json
{
  "result": {
    "baselineShortlistProbability": 68,
    "baselineCandidateStrength": 75,
    "baselineJobMatchScore": 62,
    "projectedShortlistProbability": 82,
    "projectedCandidateStrength": 78,
    "projectedJobMatchScore": 85,
    "probabilityDelta": 14,
    "candidateStrengthDelta": 3,
    "jobMatchDelta": 23,
    "scenario": { ... },
    "timestamp": "2024-02-03T10:35:00Z"
  }
}
```

### Recommendations

**GET /api/shortlist/recommendations/:jobId?userId=user_456**
```json
{
  "topSkillsToLearn": ["Kubernetes", "gRPC", "Protocol Buffers"],
  "skillsToImprove": ["System Design", "Database Optimization"],
  "estimatedImpact": 18
}
```

### History & Analytics

**GET /api/shortlist/history/:userId?limit=20**
```json
{
  "predictions": [
    { /* ShortlistPrediction */ },
    { /* ShortlistPrediction */ }
  ]
}
```

**GET /api/shortlist/analytics/:userId**
```json
{
  "analytics": {
    "totalPredictions": 45,
    "averageProbability": 62,
    "highestProbability": 89,
    "lowestProbability": 28,
    "averageCandidateStrength": 70,
    "averageJobMatch": 54
  }
}
```

---

## Frontend Components

### React Hooks

**`useShortlistPrediction()`** - Fetch and manage predictions
```typescript
const { prediction, isLoading, error, predict, reset } = useShortlistPrediction();

// Trigger prediction
await predict(jobId);

// Reset state
reset();
```

**`useWhatIfSimulator()`** - Run what-if simulations
```typescript
const { result, isLoading, error, simulate, reset } = useWhatIfSimulator();

// Run simulation
const result = await simulate(jobId, {
  jobId,
  addedSkills: ["Docker", "Kubernetes"]
});
```

**`useShortlistRecommendations()`** - Get improvement suggestions
```typescript
const { getRecommendations, isLoading, error } = useShortlistRecommendations();

const recommendations = await getRecommendations(jobId);
```

### React Components

**ShortlistProbabilityModal**
- Main modal dialog displaying all prediction results
- Tabs: Overview and What-If Simulator
- Animated probability gauge
- Score breakdown visualization
- Improvement roadmap

**ShortlistScoreBreakdown**
- Individual score cards with progress bars
- Visual chart comparing scores
- Formula explanation with clamping details

**ShortlistMissingSkills**
- Color-coded skill sections (matched, missing, weak)
- Quick-add suggestions for missing skills
- Improvement strategy recommendations

**ShortlistWhatIfSimulator**
- Skill input interface
- Pre-populated suggestions from missing skills
- Results display with deltas
- Interpretation guidance

### Integration Points

**Job Card** (`client/src/components/job-card.tsx`)
- "Analyze My Chances" button triggers analysis
- Calls existing `AnalysisModal` which uses the ML API

**Analysis Modal** (`client/src/components/analysis-modal.tsx`)
- Already integrated with `/api/shortlist/predict`
- Displays ML predictions when available
- Falls back to old analysis if ML fails

---

## Type Definitions

**File:** `shared/shortlist-types.ts`

```typescript
// Main prediction output
interface ShortlistPrediction {
  jobId: string;
  jobTitle: string;
  shortlistProbability: number;        // 0-100
  candidateStrength: number;           // 0-100
  jobMatchScore: number;               // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  improvements?: string[];
  timestamp: Date;
}

// What-If scenario input
interface WhatIfScenario {
  jobId: string;
  addedSkills?: string[];
  removedSkills?: string[];
  modifiedSkills?: Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }>;
}

// What-If result output
interface WhatIfResult {
  baselineShortlistProbability: number;
  baselineCandidateStrength: number;
  baselineJobMatchScore: number;
  projectedShortlistProbability: number;
  projectedCandidateStrength: number;
  projectedJobMatchScore: number;
  probabilityDelta: number;
  candidateStrengthDelta: number;
  jobMatchDelta: number;
  scenario: WhatIfScenario;
  timestamp: Date;
}
```

---

## Data Flow Diagram

```
User views job
       ↓
Clicks "Analyze My Chances"
       ↓
API: POST /api/shortlist/predict
       ↓
Load candidate profile (from DB)
Load job data (from DB)
       ↓
Extract 18 features from profile
       ↓
Run RandomForest model (Python)
       → candidate_strength [0, 1]
       ↓
Generate embeddings (Sentence-BERT)
       → user_skills_embedding
       → job_description_embedding
       ↓
Compute cosine similarity
       → job_match_score [0, 1]
       ↓
Combine scores:
  probability = clamp(
    0.4 × candidate_strength +
    0.6 × job_match_score,
    min=0.05, max=0.95
  )
       ↓
Identify missing/weak skills
       ↓
Generate improvement suggestions
       ↓
Store prediction in DB
       ↓
Return ShortlistPrediction JSON
       ↓
Display in UI:
  - Probability gauge
  - Score breakdown
  - Missing skills
  - Improvement roadmap
  - What-If simulator
```

---

## What-If Simulation Flow

```
User tests scenario: "Add Docker and Kubernetes"
       ↓
Create modified profile with new skills
       ↓
Rerun RandomForest with modified features
       → projected_candidate_strength
       ↓
Rerun SBERT similarity with new skills
       → projected_job_match
       ↓
Combine with same formula
       → projected_probability
       ↓
Calculate deltas:
  delta = projected - baseline
       ↓
Store what-if result in DB
       ↓
Return WhatIfResult with comparison
       ↓
Display results:
  68% → 82% (+14% delta)
  With breakdown of each component
```

---

## Database Schema

### shortlist_predictions
```sql
CREATE TABLE shortlist_predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  shortlist_probability INT,
  candidate_strength INT,
  job_match_score INT,
  matched_skills JSON,
  missing_skills JSON,
  weak_skills JSON,
  improvements JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, job_id)
);
```

### what_if_simulations
```sql
CREATE TABLE what_if_simulations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  baseline_probability INT,
  baseline_candidate_strength INT,
  baseline_job_match INT,
  projected_probability INT,
  projected_candidate_strength INT,
  projected_job_match INT,
  probability_delta INT,
  candidate_strength_delta INT,
  job_match_delta INT,
  scenario_added_skills JSON,
  scenario_removed_skills JSON,
  scenario_modified_skills JSON,
  created_at TIMESTAMP
);
```

---

## Key Features

### ✅ No Zero Collapse
The formula clamps probability to [5%, 95%], ensuring:
- Even weak candidates get meaningful signal (minimum 5%)
- Very strong matches aren't overconfident (maximum 95%)
- Always actionable feedback

### ✅ ML-Driven Explanations
Gap identification uses actual model signals:
- Missing skills = not in user's profile but in job requirements
- Weak skills = skills present but at beginner level
- Improvement suggestions based on feature importance

### ✅ Real What-If Recomputation
No hardcoded "+X%" boosts:
- Every scenario reruns ALL ML models
- Shows actual impact on both candidate strength and job match
- Teaches users real skill value

### ✅ Data Persistence
All predictions and simulations stored for:
- User learning and history
- Platform analytics
- Improving model training data

### ✅ Fresh Predictions Always
No caching or stale results:
- Every predict call runs fresh computation
- Detects profile changes immediately
- Always latest accuracy

---

## Testing the System

### 1. Verify Models Load
```bash
curl -X POST http://localhost:5000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{"jobId": "test_job", "userId": "test_user"}'
```

Expected: Should either return prediction or error about missing models (not 500 crash)

### 2. Test with Real Data
```bash
# Create test user and job with full data
# Call predict endpoint
# Check database for stored prediction
SELECT * FROM shortlist_predictions WHERE user_id = 'test_user';
```

### 3. Test What-If Simulation
```bash
curl -X POST http://localhost:5000/api/shortlist/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "jobId": "test_job",
    "scenario": {
      "jobId": "test_job",
      "addedSkills": ["NewSkill1", "NewSkill2"]
    }
  }'
```

Expected: Probability should change proportionally to skill match

---

## Troubleshooting

### Models Not Loading
```
Error: "ML service not initialized - trained models are not available"
```
**Solution:** Ensure `placement_random_forest_model.pkl` exists in project root and is readable

### Python Script Errors
```
Error: "Failed to spawn Python process"
```
**Solution:** 
- Check Python executable path is correct
- Verify `python/ml_predictor.py` exists
- Check Python dependencies: numpy, scikit-learn

### Zero Predictions
All scores showing 0 or very low:
**Solution:**
- Check user has profile data (skills, experience)
- Check job has description and required skills
- Verify feature extraction logic

### What-If Shows No Change
Probability delta is 0:
**Solution:**
- Verify skills are actually matching job requirements
- Check skill names match exactly (case-sensitive)
- Test with skills from "Missing Skills" section

---

## Performance Considerations

- **Prediction latency:** ~500ms-2s (depends on Python subprocess time)
- **What-If latency:** ~1-3s (reruns all models)
- **Batch predictions:** ~100ms per job (parallel execution)
- **Database:** Indexes on (user_id, created_at) and (job_id) for fast lookups

---

## Future Enhancements

1. **Model Improvements:**
   - Collect user feedback on predictions
   - Retrain models with new data
   - A/B test different weighting formulas

2. **Features:**
   - Skill recommendation engine (suggest specific courses)
   - Timeline estimation (how long to reach target probability)
   - Peer comparison (how you compare to average applicant)
   - Company-specific insights (what this company likes)

3. **UI/UX:**
   - Skill learning roadmap with timeline
   - Confidence intervals for predictions
   - Multi-job comparison view
   - Progress tracking dashboard

4. **ML:**
   - Fine-tune SBERT on job descriptions
   - Custom embeddings per job category
   - Incorporate hiring outcome data
   - Dynamic weighting based on job type

---

## Support & Questions

For issues or questions:
1. Check the API error responses - they're detailed
2. Review database entries for stored predictions
3. Test Python script directly: `python python/ml_predictor.py load models`
4. Check server logs for detailed ML execution traces
