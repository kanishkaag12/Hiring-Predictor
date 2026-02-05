# HirePulse ML System - Data Flow & Implementation

## End-to-End ML Prediction Flow

```
USER TRIGGERS "ANALYZE MY CHANCES"
    ↓
API: POST /api/shortlist/predict?jobId=X&userId=Y
    ↓
ShortlistProbabilityService.predict(userId, jobId)
    ├─→ fetchCandidateProfile(userId)
    │   ├─ getUser(userId) → userData with cgpa, resumeEducation, etc.
    │   ├─ getSkills(userId) → skills with levels
    │   ├─ getExperiences(userId) → internships + jobs
    │   ├─ getProjects(userId) → project portfolio
    │   └─ BUILD COMPLETE PROFILE:
    │       {
    │         userId, userType,
    │         skills: [{name, level}],
    │         education: [...],
    │         experienceMonths: 24,          ✅ FROM RESUME
    │         internshipCount: 2,            ✅ FROM EXPERIENCE TABLE
    │         projectsCount: 3,              ✅ FROM RESUME OR DB
    │         cgpa: 7.8,                     ✅ FROM USER PROFILE
    │         experience: [{company, role, type}],
    │         projects: [{title, complexity}]
    │       }
    │
    ├─→ fetchJob(jobId)
    │   ├─ getJob(jobId) → job from database
    │   ├─ VALIDATE: description exists
    │   │   └─ IF NOT → THROW ERROR (no fallback)
    │   ├─ VALIDATE: skills array exists
    │   │   └─ IF EMPTY → WARN (but continue)
    │   └─ RETURN COMPLETE JOB:
    │       {
    │         id, title,
    │         description: "Full job description...",  ✅ FROM DB
    │         skills: ["Java", "Spring", "AWS"],       ✅ FROM DB
    │         experienceLevel: "2 years",
    │         company, location
    │       }
    │
    ├─→ predictCandidateStrength(profile)
    │   ├─ CandidateFeaturesService.extractFeatures(profile)
    │   │   └─ BUILD 18-FEATURE ARRAY:
    │   │       [skillCount, advancedCount, intermediateCount, beginnerCount,
    │   │        skillDiversity, totalExpMonths, internshipCount, jobCount,
    │   │        hasRelevantExp, avgExpDuration, educationLevel, hasQualifyingEd,
    │   │        cgpa, projectCount, highComplexity, mediumComplexity,
    │   │        projectComplexityScore, overallStrengthScore]
    │   │
    │   ├─ LOG FEATURES:
    │   │   [ML] ✓ Random Forest feature vector:
    │   │   - skillCount: 8.000
    │   │   - internshipCount: 2.000
    │   │   - cgpa: 7.800
    │   │   - totalExpMonths: 24.000
    │   │   [etc...]
    │   │
    │   ├─ SPAWN PYTHON SUBPROCESS:
    │   │   $ python ml_predictor.py predict <models_dir>
    │   │   STDIN: {features: [8, 4, 2, 2, 0.8, 24, 2, 1, 1, 12, 3, 1, 0.78, 3, 1, 1, 0.7, 0.62]}
    │   │
    │   └─ PYTHON RETURNS:
    │       {
    │         success: true,
    │         candidate_strength: 0.62,      ✅ NON-ZERO
    │         confidence: 0.95
    │       }
    │
    ├─→ predictJobMatch(userSkills, jobData)
    │   ├─ FOR USER SKILLS:
    │   │   ├─ userSkillsText = "Java Spring AWS Docker..."
    │   │   ├─ IMPORT @xenova/transformers
    │   │   ├─ LOAD Xenova/all-MiniLM-L6-v2 (SBERT)
    │   │   ├─ extractor(userSkillsText) → 384-dimensional embedding
    │   │   └─ userEmbedding: [0.12, 0.34, -0.21, ...] (384 dims)
    │   │
    │   ├─ FOR JOB DESCRIPTION:
    │   │   ├─ jobDescription = "We are looking for a Java developer..."
    │   │   ├─ LOAD Xenova/all-MiniLM-L6-v2 (SBERT)
    │   │   ├─ extractor(jobDescription) → 384-dimensional embedding
    │   │   └─ jobEmbedding: [0.15, 0.28, -0.19, ...] (384 dims)
    │   │
    │   ├─ COMPUTE COSINE SIMILARITY:
    │   │   ├─ dotProduct = userEmbed · jobEmbed = 123.45
    │   │   ├─ magnitude1 = sqrt(sum(userEmbed²)) = 45.2
    │   │   ├─ magnitude2 = sqrt(sum(jobEmbed²)) = 47.1
    │   │   ├─ similarity = dotProduct / (mag1 × mag2) = 0.572
    │   │   └─ CLAMP TO [0, 1] → 0.572
    │   │
    │   ├─ SKILL MATCHING (for explanation):
    │   │   ├─ matchedSkills: ["Java", "Spring", "AWS"] (3/5)
    │   │   └─ missingSkills: ["Kubernetes", "Docker"]
    │   │
    │   └─ RETURN JOB MATCH:
    │       {
    │         score: 0.572,                  ✅ REAL SBERT SIMILARITY
    │         matchedSkills: ["Java", "Spring", "AWS"],
    │         missingSkills: ["Kubernetes", "Docker"],
    │         weakSkills: []
    │       }
    │
    ├─→ COMBINE SCORES:
    │   ├─ rawProbability = 0.4 × 0.62 + 0.6 × 0.572
    │   │                 = 0.248 + 0.343
    │   │                 = 0.591
    │   │
    │   └─ shortlistProbability = CLAMP(0.591, 0.05, 0.95)
    │                           = 0.591 = 59%
    │
    ├─→ GENERATE ML-DRIVEN EXPLANATIONS:
    │   ├─ Missing skills: "Missing key skills: Kubernetes, Docker. Learning these..."
    │   ├─ Experience: Check if months < required level
    │   ├─ Projects: Check if count < 2
    │   └─ Strength: Check if score < 0.4
    │
    └─→ RETURN PREDICTION:
        {
          jobId: "job_123",
          jobTitle: "Senior Java Developer",
          shortlistProbability: 59,
          candidateStrength: 62,
          jobMatchScore: 57,
          matchedSkills: ["Java", "Spring", "AWS"],
          missingSkills: ["Kubernetes", "Docker"],
          improvements: [
            "Missing key skills: Kubernetes, Docker. Learning these would improve match score.",
            "Limited portfolio (3 projects). Building 2-3 substantive projects would strengthen candidacy."
          ]
        }
```

## Data Source Summary

| Data | Source | Used For |
|------|--------|----------|
| User skills | `skills` table | Feature: skillCount, advancedCount, etc. |
| Experience months | `resumeExperienceMonths` | Feature: totalExpMonths |
| Internships | `experience` table (type='Internship') | Feature: internshipCount |
| Projects | `resumeProjectsCount` or `projects` table | Feature: projectCount |
| CGPA | `users.cgpa` | Feature: cgpa (0-10 scale) |
| Education | `resumeEducation` | Feature: educationLevel |
| Job description | `jobs.description` | SBERT embedding |
| Job skills | `jobs.skills` | Skill matching, explanations |

## Key Validations

### Input Validation
```typescript
// User profile
if (!userData) throw "User not found"
if (!skills) → use empty array but log
if (cgpa) → normalize to 0-1 scale

// Job data
if (!jobDescription) throw "Job has no description"
if (!jobSkills) → log warning but continue
```

### Output Validation
```typescript
// RandomForest output
if (strength === 0 || strength === null) throw "Invalid strength"
if (!(strength >= 0 && strength <= 1)) throw "Strength out of range"

// SBERT embeddings
if (!userEmbedding || userEmbedding.length === 0) throw "Empty user embedding"
if (!jobEmbedding || jobEmbedding.length === 0) throw "Empty job embedding"

// Similarity
if (isNaN(similarity) || !isFinite(similarity)) return 0

// Final probability
clamp(probability, 0.05, 0.95)  // Never 0% or 100%
```

## Performance Implications

### What's Slow
- **SBERT loading**: ~2-3 seconds on first run (cached after)
- **User embedding**: ~500ms per prediction (real text processing)
- **Job embedding**: ~500ms per prediction (real text processing)
- **RandomForest**: ~10ms (model inference)
- **Database queries**: ~50-100ms (profile + job data)

### Total Per Prediction: ~1.5-2 seconds

### Optimization Opportunities (if needed)
1. Cache job embeddings after first generation
2. Batch user skill embeddings if predicting multiple jobs
3. Pre-generate job embeddings during job creation
4. Use Redis for embedding cache

## Logging Output Example

```
[ML Prediction] Starting prediction for user=user_123, job=job_456

[ML] User profile for user_123:
  - Skills: 8 (Java(Advanced), Spring(Advanced), AWS(Intermediate), ...)
  - Experience: 24 months (2 internships)
  - Projects: 3 from resume, 3 in DB
  - Education: 1 entries
  - CGPA: 7.8

[ML] Job data for job_456:
  - Title: Senior Java Developer
  - Description: 2450 chars
  - Required skills: Java, Spring, AWS, Docker, Kubernetes

[ML] ✓ Random Forest feature vector:
  - skillCount: 8.000
  - advancedSkillCount: 4.000
  - internshipCount: 2.000
  - projectCount: 3.000
  - cgpa: 0.780
  [... 13 more features ...]

[ML] Computing job match for job job_456
  - User skills: 8 (Java, Spring, AWS, Docker, ...)
  - Required skills: 5 (Java, Spring, AWS, Docker, Kubernetes)

[ML] ✓ SBERT embedding generated (384d)
[ML] ✓ User skills embedding: 384d
[ML] Job match cosine similarity: 57.2%

[ML] ✓ RandomForest candidate strength: 62.0%
[ML] ✓ Calculation: 0.4×0.620 + 0.6×0.572 = 0.591
[ML Prediction] ✓ Final probability (clamped): 59.1%

[ML Prediction] ✓ Generated 2 ML-driven improvements
```

## What Changed From Before

| Aspect | Before | After |
|--------|--------|-------|
| Candidate Strength | 0.0 (no features) | 0.62 (complete profile) |
| Job Match | 1.0 (TF-IDF fallback) | 0.572 (real SBERT) |
| Probability | Always 0% or invalid | Realistic 59% |
| Explanations | Static messages | ML-derived gaps |
| Job Description | Auto-generated | From database |
| User Features | Only skills | All 18 features |
| Internship Count | Unknown | Explicit from DB |
| CGPA Used | No | Yes |
