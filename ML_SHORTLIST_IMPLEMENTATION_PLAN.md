# ML-Driven Shortlist Probability - Complete Implementation Plan

## 🎯 GOAL
When a user uploads a resume:
1. ✅ Resume must be parsed correctly (DONE - python/resume_parser.py)
2. ⚠️ Parsed data must be stored in DB
3. ⚠️ ML models must use: Resume + Profile + Job Details
4. ⚠️ Final shortlist probability must be accurate

## 📋 IMPLEMENTATION CHECKLIST

### STEP 1: Resume Parsing ✅ COMPLETE
**File**: `python/resume_parser.py`
**Status**: Already implemented with strict validation

Output format:
```json
{
  "technical_skills": [],
  "programming_languages": [],
  "frameworks_libraries": [],
  "tools_platforms": [],
  "databases": [],
  "projects": [{"title": "", "description": "", "tools_methods_used": []}],
  "experience": [{"role": "", "duration_months": 30, "type": "full-time"}],
  "education": [{"degree": "", "field": "", "cgpa": "8.5/10"}],
  "experience_months_total": 42
}
```

### STEP 2: Persist Resume Data to Database ❌ TODO
**Files to Modify**:
- `server/services/resume-parser.service.ts` - Add DB persistence
- `server/db/index.ts` - Add resume data storage functions

**Required DB Operations**:
```typescript
// After parsing resume
async function persistResumeData(userId: number, parsedResume: any) {
  // 1. Store skills in skills table (source='resume')
  await db.insert(skills).values(
    parsedResume.technical_skills.map(skill => ({
      userId,
      skillName: skill,
      source: 'resume',
      createdAt: new Date()
    }))
  );
  
  // 2. Store projects
  await db.insert(projects).values(
    parsedResume.projects.map(project => ({
      userId,
      projectName: project.title,
      description: project.description,
      technologies: project.tools_methods_used,
      complexity: inferComplexity(project),
      source: 'resume'
    }))
  );
  
  // 3. Update user experience_months
  await db.update(users)
    .set({ 
      resumeExperienceMonths: parsedResume.experience_months_total,
      resumeParsedAt: new Date()
    })
    .where(eq(users.id, userId));
  
  // 4. Store education
  if (parsedResume.education.length > 0) {
    await db.insert(education).values({
      userId,
      degree: parsedResume.education[0].degree,
      field: parsedResume.education[0].field,
      cgpa: parseFloat(parsedResume.education[0].cgpa),
      source: 'resume'
    });
  }
  
  console.log('[DB] Resume data persisted successfully for user', userId);
}
```

### STEP 3: Build Unified User Profile ❌ TODO
**File**: `server/services/ml/shortlist-probability.service.ts`

**Function to Add**:
```typescript
async function buildUnifiedProfile(userId: number) {
  // 1. Get resume skills
  const resumeSkills = await db.select()
    .from(skills)
    .where(and(
      eq(skills.userId, userId),
      eq(skills.source, 'resume')
    ));
  
  // 2. Get profile skills
  const profileSkills = await db.select()
    .from(skills)
    .where(and(
      eq(skills.userId, userId),
      eq(skills.source, 'profile')
    ));
  
  // 3. Get user data
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  // 4. Get projects
  const projects = await db.select()
    .from(projects)
    .where(eq(projects.userId, userId));
  
  // 5. Build unified profile
  const unified = {
    skills: [...new Set([
      ...resumeSkills.map(s => s.skillName),
      ...profileSkills.map(s => s.skillName)
    ])],
    total_experience_months: (user.resumeExperienceMonths || 0) + (user.profileExperienceMonths || 0),
    internship_count: (user.resumeInternships || 0) + (user.profileInternships || 0),
    project_count: projects.length,
    education_level: calculateEducationLevel(user.degree),
    cgpa: user.cgpa || 7.0
  };
  
  console.log('[ML] Unified user profile built from DB (resume + profile)');
  return unified;
}
```

### STEP 4: Fetch Job Details ✅ PARTIALLY DONE
**Current**: Job fetching exists but needs skill extraction fallback

**Add to shortlist-probability.service.ts**:
```typescript
async function fetchJobWithSkills(jobId: string) {
  const job = await db.select()
    .from(jobs)
    .where(eq(jobs.id, parseInt(jobId)))
    .limit(1);
  
  if (!job || job.length === 0) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const jobData = job[0];
  
  // If job skills are NULL, extract from description
  if (!jobData.skills || jobData.skills.length === 0) {
    console.log('[ML] Job skills empty - extracting from description');
    const extractedSkills = await extractSkillsFromJobDescription(jobData.description);
    
    // Persist back to DB
    await db.update(jobs)
      .set({ skills: extractedSkills })
      .where(eq(jobs.id, jobData.id));
    
    jobData.skills = extractedSkills;
  }
  
  return jobData;
}
```

### STEP 5: ML Feature Extraction ❌ TODO
**File**: `server/services/ml/feature-extractor.service.ts` (CREATE NEW)

```typescript
export class FeatureExtractor {
  /**
   * Extract features for RandomForest model
   * MUST match training feature order exactly
   */
  static extractCandidateFeatures(profile: UnifiedProfile, job: JobData) {
    // Calculate features
    const skillCount = profile.skills.length;
    const skillDiversity = new Set(profile.skills.map(s => s.toLowerCase())).size;
    const matchingSkills = profile.skills.filter(s => 
      job.skills.some(js => js.toLowerCase() === s.toLowerCase())
    ).length;
    
    const projectComplexityScore = profile.projects.reduce((sum, p) => {
      return sum + (p.complexity === 'high' ? 3 : p.complexity === 'medium' ? 2 : 1);
    }, 0) / Math.max(profile.projects.length, 1);
    
    // Build feature vector (MUST match training order)
    const features = [
      skillCount,
      skillDiversity,
      matchingSkills,
      profile.total_experience_months,
      profile.internship_count,
      profile.project_count,
      projectComplexityScore,
      profile.education_level,
      profile.cgpa,
      // Add more features as needed to match training count
    ];
    
    // Validate feature count
    const EXPECTED_FEATURE_COUNT = 18; // Update based on trained model
    if (features.length !== EXPECTED_FEATURE_COUNT) {
      throw new Error(
        `Feature mismatch: got ${features.length}, expected ${EXPECTED_FEATURE_COUNT}`
      );
    }
    
    return features;
  }
}
```

### STEP 6: Candidate Strength (RandomForest) ⚠️ NEEDS UPDATE
**File**: `server/services/ml/shortlist-probability.service.ts`

**Update predict() method**:
```typescript
async predict(userId: string, jobId: string) {
  // 1. Build unified profile from DB
  const profile = await this.buildUnifiedProfile(parseInt(userId));
  
  // 2. Fetch job with skills
  const job = await this.fetchJobWithSkills(jobId);
  
  // 3. Extract features
  const features = FeatureExtractor.extractCandidateFeatures(profile, job);
  
  // 4. Call Python ML service
  const candidateStrength = await this.callPythonML('predict_strength', {
    features: features
  });
  
  // Validate result
  if (candidateStrength === 0 && profile.skills.length > 0) {
    throw new Error('RandomForest returned 0 for non-empty profile - feature mismatch');
  }
  
  // 5. Calculate job match using Sentence-BERT
  const jobMatchScore = await this.calculateJobMatch(profile, job);
  
  // 6. Calculate final probability
  const shortlistProbability = Math.max(0.05, Math.min(0.95,
    0.4 * candidateStrength + 0.6 * jobMatchScore
  ));
  
  return {
    shortlistProbability,
    candidateStrength,
    jobMatchScore,
    // ... explanations
  };
}
```

### STEP 7: Job Match (Sentence-BERT) ⚠️ NEEDS IMPLEMENTATION
**File**: `python/ml_service.py` (CREATE NEW)

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class MLService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
    def calculate_job_match(self, user_skills, user_text, job_description):
        # Embed user profile
        user_embedding = self.model.encode(
            f"{' '.join(user_skills)} {user_text}"
        )
        
        # Embed job description
        job_embedding = self.model.encode(job_description)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(
            [user_embedding],
            [job_embedding]
        )[0][0]
        
        return float(similarity)
```

### STEP 8: Final Shortlist Probability ✅ FORMULA CORRECT
Already implemented in shortlist-probability.service.ts

### STEP 9: Explanations ⚠️ NEEDS ENHANCEMENT
**Add to prediction response**:
```typescript
{
  missingSkills: job.skills.filter(s => 
    !profile.skills.some(ps => ps.toLowerCase() === s.toLowerCase())
  ),
  weakAreas: identifyWeakAreas(profile, job),
  suggestions: generateSuggestions(profile, job)
}
```

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Resume → DB Persistence (HIGH PRIORITY)
1. Create `persistResumeData()` function
2. Call it after resume parsing
3. Add logging: "[DB] Resume data persisted"
4. Test with sample resume

### Phase 2: Unified Profile Builder
1. Create `buildUnifiedProfile()` function
2. Merge resume + profile skills
3. Add logging: "[ML] Unified profile built"
4. Test profile merging

### Phase 3: Feature Extraction
1. Create FeatureExtractor class
2. Match training feature count
3. Add validation
4. Test feature vector

### Phase 4: ML Integration
1. Update predict() to use DB data
2. Remove frontend resume payload dependency
3. Test predictions change with different resumes
4. Verify different jobs show different probabilities

### Phase 5: Testing & Validation
1. Upload resume → check DB
2. Predict → verify uses resume data
3. Different jobs → different probabilities
4. Resume change → prediction change

## 📝 TESTING CHECKLIST

- [ ] Resume upload stores data in DB
- [ ] Skills table has resume skills (source='resume')
- [ ] Projects table has resume projects
- [ ] User experience_months updated
- [ ] ML prediction uses DB data (not frontend payload)
- [ ] Different resumes → different predictions
- [ ] Different jobs → different probabilities
- [ ] Feature count matches training
- [ ] Candidate strength > 0 for valid profiles
- [ ] Job match uses Sentence-BERT (not TF-IDF)

## 🔧 FILES TO MODIFY/CREATE

### Modify:
1. `server/services/resume-parser.service.ts` - Add DB persistence
2. `server/services/ml/shortlist-probability.service.ts` - Update predict()
3. `server/db/index.ts` - Add resume data functions

### Create:
1. `server/services/ml/feature-extractor.service.ts` - Feature extraction
2. `python/ml_service.py` - Python ML service for RandomForest + SBERT
3. `server/services/ml/unified-profile-builder.service.ts` - Profile builder

## ⚠️ CRITICAL VALIDATION POINTS

1. **Feature Count**: Must match training (e.g., 18 features)
2. **Feature Order**: Must match training order exactly
3. **Resume → DB**: All resume data must persist
4. **No Frontend Dependency**: ML must only use DB data
5. **No Silent Zeros**: candidateStrength = 0 for valid profile = ERROR

## 📊 SUCCESS CRITERIA

✅ Resume upload → data in DB
✅ ML prediction uses resume data from DB
✅ Different resumes → different predictions
✅ Different jobs → different probabilities
✅ Resume-only skills affect results
✅ Feature vector matches training
✅ Explanations show real ML deltas

---

**Next Action**: Start with Phase 1 - implement `persistResumeData()` function
