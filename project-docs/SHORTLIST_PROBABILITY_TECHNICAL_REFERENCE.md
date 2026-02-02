# Shortlist Probability - Technical Reference

## Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  ┌──────────────┬──────────────┬──────────────────────────┐  │
│  │   /predict   │    /batch    │   /what-if               │  │
│  │   (single)   │  (100 jobs)  │   (scenarios)            │  │
│  └──────┬───────┴───────┬──────┴────────────┬─────────────┘  │
└─────────┼────────────────┼──────────────────┼────────────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│ ShortlistProbability     │    │  WhatIfSimulator         │
│ Service                  │    │  Service                 │
│                          │    │                          │
│ • Load Models            │    │ • Apply scenario changes │
│ • Fetch Candidate        │    │ • Calculate deltas       │
│ • Fetch Job              │    │ • Generate recommendations
│ • Orchestrate Prediction │    │                          │
└────────┬────────┬────────┘    └──────┬──────────────────┘
         │        │                    │
    ┌────▼─┐  ┌───▼────────┐          │
    │      │  │            │          │
    ▼      ▼  ▼            ▼          │
┌──────────────────────────┐          │
│ CandidateFeatures        │          │
│ Service                  │          │
│                          │          │
│ Extract 13 features:     │          │
│ • skillCount             │          │
│ • advancedSkillCount     │          │
│ • skillDiversity         │          │
│ • experienceMonths       │          │
│ • educationLevel         │          │
│ • projectCount           │          │
│ • projectComplexity      │          │
│ • ... (7 more)           │          │
└────┬──────────┬──────────┘          │
     │          │                     │
┌────▼──┐   ┌───▼──────────┐   ┌─────▼──────────┐
│Random │   │Job Embedding │   │Database        │
│Forest │   │Service       │   │(storage)       │
│Model  │   │              │   │                │
│       │   │• Cosine Sim  │   │• User Profile  │
│Pred:  │   │• Skills Match│   │• Skills        │
│Score  │   │• Missing     │   │• Projects      │
└───┬───┘   │• Weak        │   │• Experience    │
    │       │              │   │• Jobs          │
    │       └───┬──────────┘   └────────────────┘
    │           │
    │       ┌───▼──────────────────┐
    │       │  Pre-trained Models  │
    │       │                      │
    │       │ • job_embeddings.pkl │
    │       │   (384-dim vectors)  │
    │       │ • job_texts.pkl      │
    │       │   (descriptions)     │
    │       └──────────────────────┘
    │
    └────────────────────┐
                         │
                    ┌────▼────────┐
                    │              │
            ┌───────▼────┬────────┐ │
            │ Final      │Delta   │ │
            │ Probability│ Calcs  │ │
            └────────────┴────────┘ │
                         │          │
                    ┌────▼──────────▼─┐
                    │ API Response     │
                    │                  │
                    │ • probability    │
                    │ • candidate str. │
                    │ • job match      │
                    │ • matched skills │
                    │ • missing skills │
                    │ • weak skills    │
                    └──────────────────┘
```

## Data Flow for Single Prediction

```
Request: { jobId, userId }
   │
   └─► Validate Input
        │
        ├─► Check jobId format
        ├─► Check userId format
        └─► Return 400 if invalid
             │
             ▼
      Fetch Candidate Profile
        │
        ├─► Get user from database
        ├─► Get skills (with levels)
        ├─► Get projects (with tech stack)
        ├─► Get experiences (job/internship)
        └─► Parse resume data
             │
             ▼
      Extract Features (13 dimensions)
        │
        ├─► skillCount
        ├─► advancedSkillCount
        ├─► intermediateSkillCount
        ├─► skillDiversity
        ├─► totalExperienceMonths
        ├─► internshipCount
        ├─► jobCount
        ├─► hasRelevantExperience
        ├─► educationLevel
        ├─► hasQualifyingEducation
        ├─► projectCount
        ├─► highComplexityProjects
        └─► projectComplexityScore
             │
             ▼
      Random Forest Model
        │
        └─► Predict Candidate Strength (0-1)
             │
             ▼
      Fetch Job Data
        │
        ├─► Get job from database
        ├─► Extract description
        ├─► Get required skills
        └─► Get experience level
             │
             ▼
      Generate Job Embedding
        │
        ├─► Check cache
        ├─► If cached: use it
        └─► If not: compute via TF-IDF
             │
             ▼
      Compute Job Match Score
        │
        ├─► Cosine similarity
        │   user_embedding ∙ job_embedding
        │   ─────────────────────────────────
        │   ║user║ × ║job║
        │
        ├─► Matched skills (set intersection)
        ├─► Missing skills (job - user)
        └─► Weak skills (in user but beginner)
             │
             ▼
      Calculate Final Probability
        │
        └─► shortlist_prob = 
            candidate_strength × job_match_score
             │
             ▼
      Format Response
        │
        ├─► shortlistProbability (0-100%)
        ├─► candidateStrength (0-100%)
        ├─► jobMatchScore (0-100%)
        ├─► matchedSkills []
        ├─► missingSkills []
        └─► weakSkills []
             │
             ▼
      Return 200 OK
```

## What-If Simulation Flow

```
Request: { userId, jobId, scenario }
   │
   └─► Get Baseline Prediction
        │
        ├─► predict(userId, jobId)
        ├─► Record baseline_strength
        ├─► Record baseline_match
        └─► Record baseline_probability
             │
             ▼
      Get Candidate Profile
        │
        └─► fetchCandidateProfile(userId)
             │
             ▼
      Apply Scenario Changes
        │
        ├─► Added Skills?
        │   └─► Add to profile.skills[]
        │       with level='Intermediate'
        │
        ├─► Removed Skills?
        │   └─► Remove from profile.skills[]
        │
        └─► Modified Skill Levels?
            └─► Update skill level in profile
                 │
                 ▼
      Create Modified Profile
        │
        └─► Deep copy with changes
             │
             ▼
      Get Job Data
        │
        └─► fetchJob(jobId)
             │
             ▼
      Predict Modified Scenario
        │
        ├─► Extract features(modified_profile)
        ├─► Predict strength(modified_features)
        ├─► Predict match(modified_skills, job)
        └─► Calculate probability
             │
             ▼
      Calculate Deltas
        │
        ├─► strengthDelta = 
        │   modified_strength - baseline_strength
        │
        ├─► matchDelta = 
        │   modified_match - baseline_match
        │
        └─► probabilityDelta = 
            modified_probability - baseline_probability
             │
             ▼
      Format Response
        │
        ├─► baselineShortlistProbability
        ├─► projectedShortlistProbability
        ├─► probabilityDelta
        ├─► baselineCandidateStrength
        ├─► projectedCandidateStrength
        ├─► candidateStrengthDelta
        ├─► baselineJobMatchScore
        ├─► projectedJobMatchScore
        ├─► jobMatchDelta
        └─► timestamp
             │
             ▼
      Return 200 OK
```

## Feature Extraction Details

### Skill Features
```typescript
skillCount: number
  ▼
  All unique skills from user profile
  Range: 0-50+ (typically)
  Normalized to [0-1]: min(count/10, 1.0)

advancedSkillCount: number
  ▼
  Skills with level='Advanced'
  Range: 0-20+ (typically)
  Normalized to [0-1]: min(count/5, 1.0)

intermediateSkillCount: number
  ▼
  Skills with level='Intermediate'
  Range: 0-30+ (typically)

skillDiversity: number [0-1]
  ▼
  Measures distribution of skills
  0 skills:   0.0
  1-2 skills: 0.3
  3-4 skills: 0.6
  5-9 skills: 0.8
  10+ skills: 1.0
```

### Experience Features
```typescript
totalExperienceMonths: number
  ▼
  Sum of all job/internship durations
  Range: 0-480 (40 years)
  Normalized to [0-1]: min(months/60, 1.0)

internshipCount: number
  ▼
  Count of internships
  Range: 0-10+

jobCount: number
  ▼
  Count of full-time jobs
  Range: 0-10+

hasRelevantExperience: 0 | 1
  ▼
  Binary: 1 if any experience, 0 otherwise
```

### Education Features
```typescript
educationLevel: number [0-4]
  ▼
  0: No education listed
  1: Diploma
  2: Bachelor's degree
  3: Master's degree
  4: PhD/Doctorate

hasQualifyingEducation: 0 | 1
  ▼
  Binary: 1 if Bachelor's or higher, 0 otherwise
```

### Project Features
```typescript
projectCount: number
  ▼
  Total personal/academic projects
  Range: 0-50+
  Normalized to [0-1]: min(count/5, 1.0)

highComplexityProjects: number
  ▼
  Projects marked as 'High' complexity
  Range: 0-10+

projectComplexityScore: number [0-1]
  ▼
  Average complexity score
  Low:    0.3
  Medium: 0.6
  High:   1.0
  Average across all projects
```

## Model Input Format

### Feature Array (13 elements)

```
[
  0: skillCount                  (number)
  1: advancedSkillCount          (number)
  2: intermediateSkillCount      (number)
  3: skillDiversity              (float 0-1)
  4: totalExperienceMonths       (number)
  5: internshipCount             (number)
  6: jobCount                    (number)
  7: hasRelevantExperience       (0 or 1)
  8: educationLevel              (0-4)
  9: hasQualifyingEducation      (0 or 1)
  10: projectCount               (number)
  11: highComplexityProjects     (number)
  12: projectComplexityScore     (float 0-1)
]
```

### Feature Scaling
All features already normalized or bounded:
- Counts are normalized to 0-1 range
- Binary features are 0 or 1
- Float features are already 0-1
- **No additional scaling needed for Random Forest**

## Cosine Similarity Calculation

```
For vectors u and v:

cosine_similarity = u · v / (║u║ × ║v║)

Where:
  u · v   = dot product (sum of element-wise products)
  ║u║     = magnitude of u = √(u₁² + u₂² + ... + uₙ²)
  ║v║     = magnitude of v = √(v₁² + v₂² + ... + vₙ²)

Result: number in range [0, 1]
  0   = completely different (orthogonal)
  0.5 = somewhat similar
  1   = identical direction

User Skills Embedding:
  • Text: "Python JavaScript React AWS"
  • TF-IDF vectorization
  • 384-dimensional vector

Job Embedding:
  • Pre-computed Sentence-BERT embedding
  • From job description text
  • 384-dimensional vector

Similarity = cosine(user_vector, job_vector)
```

## Skill Matching Algorithm

```
User Skills: ["Python", "React", "AWS", "SQL"]
Job Required: ["Python", "JavaScript", "React", "Kubernetes"]

Matched Skills:
  ▼
  Set intersection
  user_skills ∩ required_skills
  = ["Python", "React"]

Missing Skills:
  ▼
  Skills required but user doesn't have
  required_skills - user_skills
  = ["JavaScript", "Kubernetes"]

Weak Skills:
  ▼
  User has skill but only at Beginner level
  For each skill in user profile:
    if (required_skills contains skill) AND
       (user_level == "Beginner")
    then add to weak_skills

  Example:
  User: { name: "Docker", level: "Beginner" }
  Job: requires "Docker"
  = "Docker" is weak skill
```

## Fallback Model (When RF unavailable)

```typescript
// Simple weighted sum fallback
private static createFallbackModel(): any {
  return {
    predict: (features: number[]): number[] => {
      const weights = [
        0.10,  // skillCount
        0.15,  // advancedSkillCount
        0.12,  // intermediateSkillCount
        0.10,  // skillDiversity
        0.12,  // totalExperienceMonths
        0.08,  // internshipCount
        0.08,  // jobCount
        0.10,  // hasRelevantExperience
        0.08,  // educationLevel
        0.07,  // hasQualifyingEducation
        0.06,  // projectCount
        0.05,  // highComplexityProjects
        0.08   // projectComplexityScore
      ];

      // Weighted sum
      let score = 0;
      for (let i = 0; i < Math.min(features.length, weights.length); i++) {
        score += features[i] * weights[i];
      }

      // Sigmoid to get 0-1 probability
      const probability = 1 / (1 + Math.exp(-score + 0.5));
      return [probability];
    }
  };
}
```

## Error Handling Strategy

```
Level 1: Request Validation
  ├─► Check jobId exists
  ├─► Check userId exists
  ├─► Check data types
  └─► Return 400 Bad Request if invalid

Level 2: Data Fetching
  ├─► Fetch user profile
  ├─► Fetch job data
  ├─► Fetch related records
  └─► Return 404 Not Found if missing
  └─► Return 500 if DB error

Level 3: Model Loading
  ├─► Load Random Forest model
  ├─► Load embeddings if available
  └─► Use fallback if pickle unavailable

Level 4: Prediction Execution
  ├─► Extract features
  ├─► Call model.predict()
  ├─► Catch prediction errors
  └─► Return fallback if error

Level 5: Response Formatting
  ├─► Format numbers (0-100%)
  ├─► Serialize arrays
  ├─► Add timestamps
  └─► Return 200 OK

Level 6: Service Level
  ├─► Return 503 if service not initialized
  ├─► Log all errors
  └─► Monitor performance
```

## Caching Strategy

```
Embedding Cache (In-memory):
  ├─► Key: jobId
  ├─► Value: 384-dimensional number[]
  ├─► Size: ~1.5 KB per embedding
  ├─► Max: ~10,000 jobs = 15 MB
  └─► Lifespan: Server lifetime

API Response Caching (Frontend):
  ├─► Cache predictions for 5-10 minutes
  ├─► Key: jobId + userId
  ├─► Invalidate on profile update
  └─► Use React Query for management

Feature Vector Cache (Not implemented):
  ├─► Could cache user features
  ├─► Saves feature extraction time
  ├─► Invalidate on profile change
  └─► Would add ~50-100KB per user
```

## Performance Optimization Tips

### Server-side
1. **Batch Loading**: Pre-load job embeddings on startup
2. **Database Indexes**: Add indexes on userId, jobId
3. **Connection Pooling**: Use database connection pool
4. **Async Processing**: Use Promise.all() for parallel DB queries
5. **Response Caching**: Cache predictions (with TTL)
6. **Lazy Loading**: Load models on-demand if startup slow

### Client-side
1. **Debounce What-If**: Debounce input changes
2. **Request Batching**: Batch predictions (up to 100)
3. **Local Caching**: Use React Query with proper TTL
4. **Progressive Loading**: Load predictions asynchronously
5. **Memoization**: Memoize components with heavy logic
6. **Virtual Lists**: For large job lists, use virtualization

## Monitoring Metrics

```
Prediction Metrics:
  ├─► Average prediction time (ms)
  ├─► 95th percentile time (ms)
  ├─► Cache hit rate (%)
  ├─► Model success rate (%)
  └─► Fallback rate (%)

API Metrics:
  ├─► Requests per second
  ├─► Error rate (%)
  ├─► 4xx errors
  ├─► 5xx errors
  └─► Response time distribution

Data Quality:
  ├─► % users with complete profile
  ├─► % users with skills
  ├─► % jobs with embeddings
  └─► % predictions with matches

Business Metrics:
  ├─► Predictions per user
  ├─► What-If simulations per user
  ├─► Recommendation click-through rate
  └─► Shortlist accuracy (if tracking)
```

## Dependencies

**Runtime Dependencies**:
- None! Uses only Node.js built-ins and existing HirePulse packages

**Development Dependencies**:
- TypeScript (existing)
- Express (existing)
- Drizzle ORM (existing)
- PostgreSQL driver (existing)

**Optional for Enhancement**:
- `@xenova/transformers` - For Sentence-BERT embeddings
- `redis` - For distributed caching
- `python-shell` - For pickle loading
- `scikit-learn` (Python) - For model training

## Version Compatibility

```
Node.js:  18+
TypeScript: 4.5+
PostgreSQL: 12+
Express: 4.18+
```

## Testing Checklist

```
Unit Tests:
  ├─► Feature extraction correctness
  ├─► Cosine similarity calculation
  ├─► Skill matching logic
  ├─► Feature normalization
  └─► Fallback model predictions

Integration Tests:
  ├─► /api/shortlist/predict endpoint
  ├─► /api/shortlist/batch endpoint
  ├─► /api/shortlist/what-if endpoint
  ├─► /api/shortlist/recommendations endpoint
  ├─► Error handling (400, 404, 500, 503)
  ├─► Database integration
  └─► Model loading

E2E Tests:
  ├─► Complete prediction workflow
  ├─► What-If scenario workflow
  ├─► Batch prediction performance
  ├─► Error recovery
  └─► Concurrent request handling

Load Tests:
  ├─► 100 concurrent single predictions
  ├─► 10 concurrent batch predictions
  ├─► Memory usage over time
  └─► Embedding cache growth
```

---

**Last Updated**: February 1, 2026
**Version**: 1.0 (Production Ready)
