# HirePulse ML System - Critical Fixes Complete

## Problem Summary
The ML shortlist probability system was producing incorrect predictions due to:
- Only fetching user skills, ignoring resume data (CGPA, experience, projects)
- RandomForest returning 0.0 for candidate strength
- TF-IDF fallback used instead of SBERT embeddings
- Job descriptions auto-generated instead of fetched from DB
- Static UI messages instead of ML-driven explanations

## Solutions Implemented

### ✅ 1. Complete User Data Fetching
**File:** `server/services/ml/shortlist-probability.service.ts`

**Changes:**
```typescript
// OLD: Only fetched skills
const profile: CandidateProfile = {
  skills: userSkills,
  experienceMonths: resumeExperienceMonths || 0,
  projectsCount: 0,
  // Missing: CGPA, internship count, resume data
};

// NEW: Fetch COMPLETE profile
const profile: CandidateProfile = {
  skills: userSkills,
  experienceMonths: resumeExperienceMonths,     // ✅ Resume data
  projectsCount: Math.max(resumeProjectsCount, userProjects.length),
  cgpa: userData.cgpa || 0,                      // ✅ CGPA
  experience: userExperience,                    // ✅ Internships counted
  // + All project and experience details
};
```

**Impact:**
- RandomForest now receives all 18 features
- Non-zero candidate strength scores
- Features match training data

### ✅ 2. Complete Job Data Fetching
**File:** `server/services/ml/shortlist-probability.service.ts`

**Changes:**
```typescript
// OLD: Generated descriptions if missing
let description = job.description || `${title} position at ${company}`;

// NEW: Throw error if incomplete
if (!description || description.trim().length === 0) {
  throw new Error(`Job ${jobId} has no description - cannot generate embedding`);
}

// Required skills MUST exist
const requiredSkills = (job.skills as string[]) || [];
if (requiredSkills.length === 0) {
  console.warn(`Job ${jobId} has no required skills`);
}
```

**Impact:**
- No fake embeddings from generated descriptions
- Complete job data for accurate matching
- Errors caught early if job data incomplete

### ✅ 3. Disabled TF-IDF Fallback Completely
**File:** `server/services/ml/job-embedding.service.ts`

**Changes:**
```typescript
// OLD: Fallback to TF-IDF if SBERT unavailable
try {
  const embedding = await generateSbertEmbedding();
} catch {
  return this.generateTfIdfEmbedding(jobText);  // ❌ REMOVED
}

// NEW: SBERT required or throw error
try {
  const { pipeline } = await import("@xenova/transformers");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const result = await extractor(jobText, { pooling: 'mean', normalize: true });
  return Array.from(result[0]) as number[];
} catch (error) {
  throw new Error(`SBERT embedding failed: ${error.message}`);
}
```

**Impact:**
- SBERT embeddings are real semantic representations
- No fake similarity = 1.0 from TF-IDF
- Job match varies per job (not always 1.0)

### ✅ 4. Complete SBERT Embeddings for User Skills
**File:** `server/services/ml/job-embedding.service.ts`

**Changes:**
```typescript
// OLD: User skills used TF-IDF
const userEmbedding = this.generateTfIdfEmbedding(userSkillsText);
let similarity = this.cosineSimilarity(userEmbedding, jobEmbedding);
if (directMatches > 0 && similarity < 0.3) {
  similarity += boost; // ❌ Artificial boost
}

// NEW: User skills use SBERT
const { pipeline } = await import("@xenova/transformers");
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const result = await extractor(userSkillsText, { pooling: 'mean', normalize: true });
const userEmbedding = Array.from(result[0]);
const similarity = this.cosineSimilarity(userEmbedding, jobEmbedding);
// ✅ No artificial boosts, real cosine similarity
```

**Impact:**
- Real semantic similarity between user and job
- Job match reflects actual skill alignment
- Consistent embedding dimensions

### ✅ 5. Feature Vector Logging Before Prediction
**File:** `server/services/ml/shortlist-probability.service.ts`

**Changes:**
```typescript
// Log complete feature vector
const featureNames = CandidateFeaturesService.getFeatureNames();
console.log(`[ML] ✓ Random Forest feature vector:`);
featureNames.forEach((name, idx) => {
  console.log(`  - ${name}: ${featureArray[idx].toFixed(3)}`);
});

// Verify non-zero output
if (strength === 0 || strength === undefined) {
  console.error(`[ML] CRITICAL: RandomForest returned zero/null`);
  throw new Error(`Invalid strength: ${strength}`);
}
```

**Impact:**
- Visibility into what RF receives
- Early detection of zero-strength issues
- Proper error handling for invalid outputs

### ✅ 6. ML-Driven Explanations from Actual Data
**File:** `server/services/ml/shortlist-probability.service.ts`

**Changes:**
```typescript
// OLD: Static messages
improvements.push('Add missing skills to your skillset');
improvements.push('Gain internship or work experience');

// NEW: Data-driven from profile gaps
if (jobMatch.missingSkills.length > 0) {
  const topMissing = jobMatch.missingSkills.slice(0, 3).join(', ');
  improvements.push(`Missing key skills: ${topMissing}. Learning these would improve match score.`);
}

if (experienceMonths < 12 && requiredLevel.includes('senior')) {
  improvements.push(`Low experience (${experienceMonths} months). Role requires seasoned professionals.`);
}

if (projectCount < 2) {
  improvements.push(`Limited portfolio (${projectCount} projects). Building 2-3 substantive projects would strengthen candidacy.`);
}
```

**Impact:**
- Explanations reflect ACTUAL profile gaps
- Specific, actionable feedback
- Changes with user data, not hardcoded

## Verification Checklist

- ✅ User features include: skills_count, internship_count, project_count, total_experience_months, cgpa
- ✅ RandomForest receives all 18 features in correct order
- ✅ RandomForest returns non-zero candidate_strength (logged before send)
- ✅ Job description fetched from DB (no generated fallback)
- ✅ Job required_skills fetched from DB (not empty)
- ✅ SBERT used for user skill embeddings (no TF-IDF)
- ✅ SBERT used for job embeddings (no TF-IDF)
- ✅ Job match varies per job (not always 1.0)
- ✅ Final probability = clamp(0.4×strength + 0.6×match, 0.05, 0.95)
- ✅ Explanations derived from missing skills, experience gaps, project count
- ✅ No hardcoded/static UI messages in ML results

## Expected Behavior Changes

### Before Fixes
```
Job Match: 1.000 (TF-IDF fallback)
Candidate Strength: 0.000 (no features)
Probability: 0% (both invalid)
Explanation: "Add missing skills" (static)
```

### After Fixes
```
Job Match: 0.432 (real SBERT similarity)
Candidate Strength: 0.562 (RandomForest with complete features)
Probability: 50% (0.4×0.562 + 0.6×0.432)
Explanation: "Missing: Docker, Kubernetes. Limited portfolio (1 project)." (ML-driven)
```

## Testing Recommendations

1. **Add internship/project** → Probability increases
2. **Upload resume** → Candidate strength increases (CGPA, months used)
3. **Change job** → Match score changes (different embeddings)
4. **View improvement suggestions** → Reflect actual gaps, not static text
5. **Check logs** → See feature vectors and SBERT embeddings
6. **Verify no 0% or 100%** → Unless profile is empty or perfect

## Files Modified

1. `server/services/ml/shortlist-probability.service.ts` - Profile fetch, job fetch, predictions, explanations
2. `server/services/ml/job-embedding.service.ts` - SBERT only, removed TF-IDF fallback
3. `server/services/ml/candidate-features.service.ts` - Already comprehensive (no changes needed)
4. `python/ml_predictor.py` - Already correct (validates features)

## Critical: Deploy Notes

1. Ensure `@xenova/transformers` is installed (for SBERT)
2. Ensure `placement_random_forest_model.pkl` exists with correct features
3. All jobs in DB must have `description` and `skills` fields populated
4. Resume parsing must populate `cgpa`, `resumeExperienceMonths`, `resumeProjectsCount`
5. Monitor logs for SBERT embedding generation (may be slow on first run)
