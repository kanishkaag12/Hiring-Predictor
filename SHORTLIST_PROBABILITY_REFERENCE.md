# 📚 Shortlist Probability - Developer Reference Card

## Formula & Math

### Shortlist Probability Calculation
```
shortlist_probability = clamp(
  0.4 × candidate_strength + 0.6 × job_match_score,
  min = 0.05,
  max = 0.95
)
```

### Feature Vector (18 elements)
```
[skill_count, adv_skills, int_skills, beg_skills, skill_div,
 exp_months, internships, jobs, has_exp, avg_duration,
 edu_level, qual_edu, cgpa,
 projects, high_complex, med_complex, complexity_score,
 overall_strength]
```

### Cosine Similarity
```
similarity = dot_product(vec1, vec2) / (norm(vec1) × norm(vec2))
Result: [0, 1]
```

---

## Database Queries

### Get User's Prediction History
```sql
SELECT * FROM shortlist_predictions
WHERE user_id = 'user_id'
ORDER BY created_at DESC
LIMIT 20;
```

### Get Analytics
```sql
SELECT
  AVG(shortlist_probability) as avg_prob,
  MAX(shortlist_probability) as best,
  MIN(shortlist_probability) as worst,
  COUNT(*) as total
FROM shortlist_predictions
WHERE user_id = 'user_id';
```

### Get Most Common Missing Skills
```sql
SELECT 
  JSON_EXTRACT(missing_skills, '$[0]') as skill,
  COUNT(*) as count
FROM shortlist_predictions
GROUP BY skill
ORDER BY count DESC
LIMIT 10;
```

### Get What-If Impact
```sql
SELECT 
  AVG(probability_delta) as avg_impact,
  MAX(probability_delta) as max_impact,
  COUNT(*) as total_sims
FROM what_if_simulations
WHERE user_id = 'user_id';
```

---

## API Quick Reference

### POST /api/shortlist/predict
```bash
curl -X POST http://localhost:5000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job_123",
    "userId": "user_456"
  }'
```
**Response:** `{ prediction: ShortlistPrediction }`

### POST /api/shortlist/what-if
```bash
curl -X POST http://localhost:5000/api/shortlist/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "jobId": "job_123",
    "scenario": {
      "jobId": "job_123",
      "addedSkills": ["Docker", "Kubernetes"]
    }
  }'
```
**Response:** `{ result: WhatIfResult }`

### GET /api/shortlist/history/:userId
```bash
curl http://localhost:5000/api/shortlist/history/user_456?limit=20
```
**Response:** `{ predictions: ShortlistPrediction[] }`

### GET /api/shortlist/analytics/:userId
```bash
curl http://localhost:5000/api/shortlist/analytics/user_456
```
**Response:** `{ analytics: {...} }`

---

## React Component Props

### ShortlistProbabilityModal
```typescript
<ShortlistProbabilityModal
  jobId="job_123"
  jobTitle="Senior Engineer"
  isOpen={true}
  onClose={() => {}}
/>
```

### ShortlistScoreBreakdown
```typescript
<ShortlistScoreBreakdown
  prediction={prediction}
/>
```

### ShortlistMissingSkills
```typescript
<ShortlistMissingSkills
  matchedSkills={[...]}
  missingSkills={[...]}
  weakSkills={[...]}
/>
```

### ShortlistWhatIfSimulator
```typescript
<ShortlistWhatIfSimulator
  jobId="job_123"
  currentPrediction={prediction}
/>
```

---

## React Hooks

### useShortlistPrediction
```typescript
const { prediction, isLoading, error, predict, reset } = useShortlistPrediction();

// Trigger prediction
await predict(jobId);

// Reset state
reset();
```

### useWhatIfSimulator
```typescript
const { result, isLoading, error, simulate, reset } = useWhatIfSimulator();

// Run simulation
const result = await simulate(jobId, scenario);
```

### useShortlistRecommendations
```typescript
const { getRecommendations, isLoading, error } = useShortlistRecommendations();

// Get suggestions
const recs = await getRecommendations(jobId);
```

---

## Python ML Functions

### Load Models
```python
from python.ml_predictor import MLPredictor

predictor = MLPredictor('models')
result = predictor.load_models()
# Returns: { success, rf_model_type, embeddings_count, job_texts_count }
```

### Get Prediction
```python
features = [2.5, 3, 4, ...]  # 18-element array
prediction = predictor.predict_shortlist_probability(
    features=features,
    job_id='job_123',
    user_embedding=[...],
    job_embedding=[...]
)
# Returns: { success, shortlist_probability, candidate_strength, job_match_score }
```

---

## TypeScript Service Methods

### ShortlistProbabilityService
```typescript
// Main prediction
await ShortlistProbabilityService.predict(userId, jobId)
// → ShortlistPrediction

// Batch prediction
await ShortlistProbabilityService.predictBatch(userId, jobIds)
// → ShortlistPrediction[]

// Check status
ShortlistProbabilityService.isReady()
// → boolean

// Initialize
await ShortlistProbabilityService.initialize()
```

### WhatIfSimulatorService
```typescript
// Run simulation
await WhatIfSimulatorService.simulate(userId, jobId, scenario)
// → WhatIfResult

// Get recommendations
await WhatIfSimulatorService.getRecommendations(userId, jobId)
// → { topSkillsToLearn, skillsToImprove, estimatedImpact }

// Multiple scenarios
await WhatIfSimulatorService.simulateMultiple(userId, jobId, scenarios)
// → WhatIfResult[]

// Find optimal skills
await WhatIfSimulatorService.findOptimalSkills(userId, jobId, targetProb)
// → { requiredSkills, requiredLevel, estimatedTimeMonths }
```

### ShortlistPredictionStorage
```typescript
// Store prediction
await ShortlistPredictionStorage.storePrediction(userId, prediction)

// Get history
await ShortlistPredictionStorage.getPredictionHistory(userId, limit)
// → StoredPrediction[]

// Get latest
await ShortlistPredictionStorage.getLatestPrediction(userId, jobId)
// → StoredPrediction | null

// Store what-if
await ShortlistPredictionStorage.storeWhatIfResult(userId, result)

// Get analytics
await ShortlistPredictionStorage.getAnalytics(userId)
// → { totalPredictions, averageProbability, ... }
```

---

## Common Patterns

### Check if ML Service is Ready
```typescript
if (!ShortlistProbabilityService.isReady()) {
  return res.status(503).json({ error: 'ML service not available' });
}
```

### Fetch Prediction with Error Handling
```typescript
try {
  const prediction = await ShortlistProbabilityService.predict(userId, jobId);
  await ShortlistPredictionStorage.storePrediction(userId, prediction);
  return res.json({ prediction });
} catch (error) {
  console.error('Prediction failed:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Run What-If and Store
```typescript
const result = await WhatIfSimulatorService.simulate(userId, jobId, scenario);
await ShortlistPredictionStorage.storeWhatIfResult(userId, result);
return res.json({ result });
```

### Conditional What-If UI
```typescript
{result ? (
  <WhatIfResults baseline={prediction} projected={result} />
) : (
  <ScenarioBuilder onSimulate={simulate} isLoading={isLoading} />
)}
```

---

## Logging & Debugging

### Server-Side Logging
```typescript
// Prediction start
console.log(`[ML Prediction] Starting: user=${userId}, job=${jobId}`);

// Model status
console.log('[ML Prediction] ✓ Models loaded');

// Prediction result
console.log(`[ML Prediction] ✅ Complete: ${prob}%`);

// Error
console.error('[ML Prediction] ❌ Error:', error);
```

### Client-Side Logging
```typescript
// In React component
console.log('[UI] Prediction loaded:', prediction);
console.log('[UI] What-If result:', result);

// Network monitoring
// Open DevTools → Network tab
// Look for /api/shortlist/* requests
```

---

## Performance Tips

### Optimize Predictions
- Use batch endpoint for multiple jobs
- Parallel processing built-in
- Each job ~100-200ms after model load

### Optimize What-If
- Don't run too many scenarios in sequence
- Limit to 5-10 per user session
- Cache baseline prediction

### Database Queries
- Always use index on (user_id, created_at)
- Limit result sets with LIMIT clause
- Use aggregation functions for analytics

### Frontend
- Lazy load ShortlistProbabilityModal
- Cache prediction results in React state
- Debounce what-if inputs

---

## Error Codes & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 503 | ML service not ready | Load models: check placement_random_forest_model.pkl |
| 400 | Missing jobId/userId | Provide both parameters in request |
| 404 | Job/user not found | Verify job and user exist in database |
| 500 | Prediction computation | Check Python logs, feature extraction |
| 422 | Invalid scenario | Verify skills and job data |

---

## File Navigation

| Goal | File |
|------|------|
| Understand ML formula | `python/ml_predictor.py` |
| Feature extraction | `server/services/ml/candidate-features.service.ts` |
| Main prediction | `server/services/ml/shortlist-probability.service.ts` |
| What-If logic | `server/services/ml/what-if-simulator.service.ts` |
| Database layer | `server/services/ml/shortlist-prediction-storage.service.ts` |
| API endpoints | `server/api/shortlist-probability.routes.ts` |
| React hooks | `client/src/hooks/useShortlistProbability.ts` |
| Main UI modal | `client/src/components/ShortlistProbabilityModal.tsx` |
| Type definitions | `shared/shortlist-types.ts` |
| Full documentation | `project-docs/SHORTLIST_PROBABILITY_COMPLETE.md` |

---

## Useful Commands

```bash
# Test prediction endpoint
curl -X POST http://localhost:5000/api/shortlist/predict \
  -H "Content-Type: application/json" \
  -d '{"jobId":"job_1","userId":"user_1"}'

# Check migrations
npm run db:migrate

# Monitor ML service
tail -f server.log | grep "ML"

# Test Python directly
python python/ml_predictor.py load models

# Query database
mysql -u root -p < query.sql
```

---

## Type Cheat Sheet

```typescript
// Main types
type Probability = number; // 0-100
type Score = number; // 0-100
type Delta = number; // -100 to 100

// Skill levels
type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Response format
interface APIResponse<T> {
  data?: T;
  error?: string;
  timestamp: Date;
}

// Prediction result
interface ShortlistPrediction {
  jobId: string;
  shortlistProbability: Probability;
  candidateStrength: Score;
  jobMatchScore: Score;
  matchedSkills: string[];
  missingSkills: string[];
  weakSkills: string[];
  improvements?: string[];
  timestamp: Date;
}
```

---

## Quick Troubleshooting Tree

```
❌ Not getting predictions?
├─ Is ML service ready?
│  ├─ Check: ShortlistProbabilityService.isReady()
│  └─ Fix: Ensure placement_random_forest_model.pkl exists
├─ Is user data complete?
│  ├─ Check: User has skills, experience, projects
│  └─ Fix: Complete user profile first
└─ Is job data complete?
   ├─ Check: Job has description and required skills
   └─ Fix: Ensure job data is in database

❌ What-If shows no change?
├─ Are skills matching job requirements?
│  └─ Fix: Use skills from "Missing Skills" section
├─ Is skill name correct?
│  └─ Fix: Skills are case-sensitive
└─ Are other factors unchanged?
   └─ Fix: Test with multiple skills

❌ Database errors?
├─ Did migrations run?
│  └─ Fix: npm run migrate
├─ Check table structure
│  └─ Fix: DESCRIBE shortlist_predictions;
└─ Check indexes
   └─ Fix: SHOW INDEX FROM shortlist_predictions;
```

---

**Last Updated:** February 3, 2026
**Version:** 1.0.0 (Complete & Production-Ready)
