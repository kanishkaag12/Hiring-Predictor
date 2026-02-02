HIREPULSE SHORTLIST PROBABILITY FEATURE
========================================

## Overview

The Shortlist Probability feature is an ML-powered prediction system that estimates the likelihood of a user being shortlisted for a specific job or internship opportunity. It combines:

1. **Candidate Strength Score** - Derived from user profile, skills, education, and experience using a pre-trained Random Forest model
2. **Job Match Score** - Computed from semantic similarity between user skills and job requirements using embeddings
3. **Final Probability** - Product of the two scores: `probability = candidate_strength × job_match_score`

## Architecture

### Components

#### 1. **Feature Engineering** (`server/services/ml/candidate-features.service.ts`)
Converts user profile data into machine-readable features:
- **Skill Features**: Count, diversity, proficiency levels (Beginner/Intermediate/Advanced)
- **Experience Features**: Total months, internship count, job count
- **Education Features**: Education level (0-4 scale), qualifying education status
- **Project Features**: Count, complexity distribution, complexity score
- **Derived Metrics**: Overall strength score (0-1)

#### 2. **Job Embedding Service** (`server/services/ml/job-embedding.service.ts`)
Handles embedding generation and similarity computation:
- Loads pre-computed job embeddings from `job_embeddings.pkl`
- Falls back to TF-IDF based embedding if transformer models unavailable
- Computes cosine similarity between user skills and job embeddings
- Identifies matched, missing, and weak skills

#### 3. **Shortlist Probability Service** (`server/services/ml/shortlist-probability.service.ts`)
Core prediction orchestrator:
- Loads `placement_random_forest_model.pkl` for candidate strength prediction
- Orchestrates feature extraction and model inference
- Fetches candidate profiles from database
- Produces final shortlist predictions
- Supports batch predictions

#### 4. **What-If Simulator** (`server/services/ml/what-if-simulator.service.ts`)
Enables what-if scenario testing:
- Add/remove skills temporarily
- Modify skill levels
- Compare baseline vs projected probabilities
- Generate improvement recommendations
- Find optimal skill combinations

#### 5. **API Routes** (`server/api/shortlist-probability.routes.ts`)
REST endpoints:
- `POST /api/shortlist/predict` - Single prediction
- `POST /api/shortlist/batch` - Batch predictions
- `POST /api/shortlist/what-if` - Scenario simulation
- `GET /api/shortlist/recommendations/:jobId` - Improvement tips
- `POST /api/shortlist/multiple-scenarios` - Test multiple scenarios
- `GET /api/shortlist/optimal-skills/:jobId` - Find required skills

## ML Models & Artifacts

### Models Directory
All ML artifacts located in `models/`:

```
models/
├── placement_random_forest_model.pkl  (177 MB) - Random Forest classifier
├── job_embeddings.pkl                 (188 MB) - Pre-computed Sentence-BERT embeddings
└── job_texts.pkl                      (448 MB) - Job descriptions for embeddings
```

### Model Details

#### placement_random_forest_model.pkl
- **Type**: Random Forest Classifier
- **Input**: 13-dimensional feature vector from candidate profile
- **Output**: Probability (0-1) that candidate is strong
- **Features Used**:
  1. skillCount
  2. advancedSkillCount
  3. intermediateSkillCount
  4. skillDiversity
  5. totalExperienceMonths
  6. internshipCount
  7. jobCount
  8. hasRelevantExperience
  9. educationLevel
  10. hasQualifyingEducation
  11. projectCount
  12. highComplexityProjects
  13. projectComplexityScore

#### job_embeddings.pkl
- **Type**: Dictionary of Sentence-BERT embeddings
- **Dimension**: 384-dimensional vectors (all-MiniLM-L6-v2 model)
- **Format**: Map<jobId, number[]>
- **Purpose**: Semantic understanding of job requirements

#### job_texts.pkl
- **Type**: Dictionary of job descriptions
- **Format**: Map<jobId, string>
- **Purpose**: Source for embedding generation when needed

## Data Flow

### Single Job Prediction Flow

```
1. User Request: POST /api/shortlist/predict
   ↓
2. Fetch Candidate Profile
   - Query users table
   - Fetch skills, projects, experience
   - Parse resume data
   ↓
3. Extract Features
   - FeatureEngineer.extractFeatures(profile)
   - Returns 13-dimensional feature vector
   ↓
4. Predict Candidate Strength
   - RandomForest.predict(features)
   - Returns: 0-1 probability
   ↓
5. Fetch Job Data
   - Query jobs table
   - Get job description and required skills
   ↓
6. Compute Job Match
   - Generate/fetch job embedding
   - Compute cosine similarity(user_skills, job_embedding)
   - Identify matched/missing/weak skills
   ↓
7. Calculate Final Probability
   - shortlist_prob = candidate_strength × job_match_score
   ↓
8. Return Response
   {
     jobId, jobTitle,
     shortlistProbability (0-100%),
     candidateStrength (0-100%),
     jobMatchScore (0-100%),
     matchedSkills, missingSkills, weakSkills
   }
```

### What-If Simulation Flow

```
1. User Request: POST /api/shortlist/what-if
   ↓
2. Get Baseline Prediction
   - predict(userId, jobId)
   ↓
3. Apply Scenario Changes to Profile
   - Add/remove/modify skills
   - Create modified candidate profile
   ↓
4. Compute Projected Prediction
   - Extract features from modified profile
   - predict(modified_profile, job)
   ↓
5. Calculate Deltas
   - probabilityDelta = projected - baseline
   - strength Delta = projected_strength - baseline
   - matchDelta = projected_match - baseline
   ↓
6. Return Comparison
   {
     baselineShortlistProbability,
     projectedShortlistProbability,
     probabilityDelta,
     ... (all metrics)
   }
```

## Database Schema Integration

### Users Table
```sql
users:
  - resumeParsedSkills (jsonb[]) - Skills extracted from resume
  - resumeEducation (jsonb[]) - Education details
  - resumeExperienceMonths (int) - Work experience duration
  - resumeProjectsCount (int) - Number of projects
  - userType (text) - Career stage ('Student', 'Fresher', etc.)
```

### Skills Table
```sql
skills:
  - userId (text FK)
  - name (text)
  - level (text) - 'Beginner', 'Intermediate', 'Advanced'
```

### Projects Table
```sql
projects:
  - userId (text FK)
  - title (text)
  - techStack (jsonb[])
  - description (text)
  - complexity (text) - 'Low', 'Medium', 'High'
```

### Experience Table
```sql
experience:
  - userId (text FK)
  - company (text)
  - role (text)
  - duration (text)
  - type (text) - 'Job' or 'Internship'
```

### Jobs Table
```sql
jobs:
  - id (text PK)
  - title (text)
  - description (text) / jobDescription (text)
  - skills (jsonb[]) - Required skills
  - experienceLevel (text) - 'Student', 'Fresher', 'Junior', 'Mid', 'Senior'
  - ...
```

## API Endpoints

### 1. Single Prediction

**Request**
```bash
POST /api/shortlist/predict
Content-Type: application/json

{
  "jobId": "job_123",
  "userId": "user_456"
}
```

**Response** (200 OK)
```json
{
  "prediction": {
    "jobId": "job_123",
    "jobTitle": "Senior Software Engineer",
    "shortlistProbability": 72,
    "candidateStrength": 85,
    "jobMatchScore": 85,
    "matchedSkills": ["Python", "React", "AWS"],
    "missingSkills": ["Kubernetes"],
    "weakSkills": ["Docker"],
    "timestamp": "2026-02-01T12:00:00Z"
  }
}
```

### 2. Batch Predictions

**Request**
```bash
POST /api/shortlist/batch
Content-Type: application/json

{
  "userId": "user_456",
  "jobIds": ["job_123", "job_124", "job_125"]
}
```

**Response** (200 OK)
```json
{
  "predictions": [
    { /* prediction 1 */ },
    { /* prediction 2 */ },
    { /* prediction 3 */ }
  ]
}
```

### 3. What-If Simulation

**Request**
```bash
POST /api/shortlist/what-if
Content-Type: application/json

{
  "userId": "user_456",
  "jobId": "job_123",
  "scenario": {
    "jobId": "job_123",
    "addedSkills": ["Kubernetes", "Docker"],
    "removedSkills": ["CSS"],
    "modifiedSkills": [
      { "name": "Python", "level": "Advanced" }
    ]
  }
}
```

**Response** (200 OK)
```json
{
  "result": {
    "baselineShortlistProbability": 72,
    "baselineCandidateStrength": 85,
    "baselineJobMatchScore": 85,
    "projectedShortlistProbability": 88,
    "projectedCandidateStrength": 90,
    "projectedJobMatchScore": 98,
    "probabilityDelta": 16,
    "candidateStrengthDelta": 5,
    "jobMatchDelta": 13,
    "scenario": { /* scenario */ },
    "timestamp": "2026-02-01T12:00:00Z"
  }
}
```

### 4. Get Recommendations

**Request**
```bash
GET /api/shortlist/recommendations/job_123?userId=user_456
```

**Response** (200 OK)
```json
{
  "topSkillsToLearn": ["Kubernetes", "Docker", "Terraform"],
  "skillsToImprove": ["Python", "AWS"],
  "estimatedImpact": 15
}
```

### 5. Multiple Scenarios

**Request**
```bash
POST /api/shortlist/multiple-scenarios
Content-Type: application/json

{
  "userId": "user_456",
  "jobId": "job_123",
  "scenarios": [
    { "addedSkills": ["Kubernetes"] },
    { "addedSkills": ["Kubernetes", "Docker"] },
    { "addedSkills": ["Kubernetes", "Docker", "Terraform"] }
  ]
}
```

**Response** (200 OK)
```json
{
  "results": [
    { /* WhatIfResult 1 */ },
    { /* WhatIfResult 2 */ },
    { /* WhatIfResult 3 */ }
  ]
}
```

### 6. Optimal Skills

**Request**
```bash
GET /api/shortlist/optimal-skills/job_123?userId=user_456&targetProbability=80
```

**Response** (200 OK)
```json
{
  "requiredSkills": ["Kubernetes", "Docker", "Terraform"],
  "requiredLevel": "Intermediate",
  "estimatedTimeMonths": 6
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Description of what went wrong"
}
```

### Status Codes
- **400 Bad Request**: Missing or invalid parameters
- **404 Not Found**: User or job not found
- **500 Internal Server Error**: Prediction failed
- **503 Service Unavailable**: ML service not initialized

## Deployment Considerations

### ML Model Loading
- Models are loaded on server startup in `ShortlistProbabilityService.initialize()`
- If pickle loading fails, service falls back to heuristic predictions
- Embeddings are cached in memory for performance

### Performance
- Single prediction: ~100-200ms (includes database queries)
- Batch prediction (10 jobs): ~1-2 seconds
- What-If simulation: ~150-300ms

### Memory Requirements
- job_embeddings.pkl: ~188 MB in memory
- Embedding cache: ~1-10 MB for typical usage
- Total: ~200-300 MB

### Scaling
- Predictions are I/O bound (database queries)
- Can be improved with caching layer (Redis)
- Consider async job processing for batch predictions >100 jobs

## Testing

### Test Candidates
```python
# Test with different profiles
- Student with 0 projects: candidate_strength ~20%
- Junior with 2 years exp + 3 projects: ~60%
- Senior with 8 years exp + 10 projects: ~90%
```

### Test Scenarios
```python
# Test What-If scenarios
1. Add single skill: expect 5-10% improvement
2. Add multiple skills: expect 15-25% improvement
3. Improve skill level: expect 5-8% improvement
4. Remove critical skill: expect 10-15% degradation
```

## Future Enhancements

1. **Fine-tuning**: Retrain RF model with additional data
2. **Additional Models**: Add neural network ensemble
3. **Explainability**: SHAP values for feature importance
4. **Personalization**: User-specific prediction models
5. **Feedback Loop**: Track actual placements vs predictions
6. **Recommendations**: Smart skill learning path generation
7. **A/B Testing**: Test different prediction algorithms
8. **Caching**: Redis cache for repeated predictions

## Troubleshooting

### "ML service not ready"
- Check if models are in `models/` directory
- Check server logs for model loading errors
- Ensure Python environment has scikit-learn, pandas, numpy

### Predictions seem off
- Verify user profile is complete in database
- Check if skills are properly categorized by level
- Run test predictions with known good data

### Slow predictions
- Check database query performance
- Consider enabling caching
- Monitor memory usage for embedding cache

### Pickle loading fails
- Ensure pickle files are not corrupted
- Check Python version compatibility
- Verify file permissions

## References

- [Feature Engineering Guide](./docs/implementation-guides/shortlist-probability-features.md)
- [Model Training Guide](./docs/implementation-guides/shortlist-probability-training.md)
- [API Integration Guide](./docs/implementation-guides/shortlist-probability-integration.md)
