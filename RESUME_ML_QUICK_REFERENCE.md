# Resume → ML Pipeline Quick Reference

## 🚀 How It Works Now

### 1. Resume Parsing (Python)
```python
resume_parser.py
  ↓
Clean, structured output:
{
  "technical_skills": [...],      # ✅ Clean, no soft skills
  "programming_languages": [...],
  "frameworks_libraries": [...],
  "tools_platforms": [...],
  "databases": [...],
  "soft_skills": [...],          # ❌ Tracked separately, excluded from ML
  "experience_months": 24,        # ✅ Numeric
  "projects_count": 5,            # ✅ Numeric
  "cgpa": 8.5                     # ✅ Normalized 10-point scale
}
```

### 2. ML Feature Extraction (TypeScript)
```typescript
fetchCandidateProfile(userId)
  ↓
Extract from resume data (FIRST priority):
  - resumeTechnicalSkills → skillCount
  - resumeExperienceMonths → totalExperienceMonths
  - resumeProjectsCount → projectCount
  - resumeCGPA → normalized cgpa
  ↓
Merge with profile data (SECOND priority):
  - Deduplicate skills
  - Use max(resume, profile) for projects
  ↓
CandidateFeaturesService.extractFeatures()
  ↓
Hard Validations:
  ✅ skillCount > 0 or no resume skills
  ✅ totalExperienceMonths >= resumeMonths
  ✅ projectCount >= resumeProjects
  ↓
predictCandidateStrength() → RandomForest
```

---

## ✅ What Changed

### Resume Parser Output (OLD vs NEW)

**OLD (BROKEN)**
```python
{
  "skills": ["Hands-On", "Analytical Thinking", "Python", "React", 
             "Programming Languages : Python", "Libraries : React"]
}
```

**NEW (FIXED)**
```python
{
  "technical_skills": ["Python", "React"],
  "programming_languages": ["Python"],
  "frameworks_libraries": ["React"],
  "tools_platforms": [],
  "databases": [],
  "soft_skills": ["Analytical Thinking"],  # ← Separated
  "experience_months": 24,                  # ← NEW
  "projects_count": 5,                      # ← NEW
  "cgpa": 8.5                               # ← NEW
}
```

---

## 📋 Skill Categorization Rules

### Included (Technical)
```
technical_skills:
  - Any technical term not in other categories

programming_languages:
  - Python, Java, JavaScript, C++, Ruby, PHP, Go, Rust, TypeScript, Kotlin, Swift, ...

frameworks_libraries:
  - React, Angular, Vue, Django, Flask, FastAPI, Express, Spring, Keras, PyTorch, ...

tools_platforms:
  - Docker, Kubernetes, Git, GitHub, AWS, Azure, Jenkins, Terraform, Ansible, ...

databases:
  - PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB, ...
```

### Excluded (NOT Technical)
```
soft_skills:
  - Communication, Leadership, Problem-Solving, Teamwork, Time Management, ...

noise_phrases:
  - "Hands-On", "Co-Curricular Activities", "Analytical Thinking"
  - "Programming Languages :" (heading)
  - "Libraries :" (heading)
  - etc.
```

---

## 🔍 Debugging

### Check Resume Parser Output
```bash
# Test on a PDF
python python/resume_parser.py /path/to/resume.pdf

# Should output:
# {
#   "technical_skills": [...],
#   "programming_languages": [...],
#   ...
# }

# ❌ If you see:
# {
#   "skills": [...]
# }
# → Old parser format, not the fix
```

### Check ML Logs
```bash
npm run dev

# Look for:
[ML] 📄 RESUME DATA (CLEAN & STRUCTURED):
[ML]   Technical Skills: 12 [Python, JavaScript, ...]
[ML]   Soft Skills (excluded): 3
[ML]   Experience: 24 months
[ML] ✅ MERGED DATA (FOR ML PREDICTION):
[ML]   Total technical skills: 15 (7 from resume only)
[ML] ✅ ALL HARD VALIDATIONS PASSED - Resume data will drive ML

# ❌ If you see:
[ML] ⚠️  WARNING: No resume data found
# → Resume parsing didn't run or returned empty
```

### Check Database
```sql
-- View resume data for a user
SELECT 
  id,
  resume_parsed_skills,
  resume_experience_months,
  resume_projects_count
FROM users
WHERE id = 'your-user-id';

-- Should show:
-- resume_parsed_skills: {"technical_skills": [...], "programming_languages": [...]}
-- resume_experience_months: 24
-- resume_projects_count: 5

-- ❌ OLD format:
-- resume_parsed_skills: ["Python", "React", ...]  ← FLAT ARRAY, NOT STRUCTURED
```

---

## 🧪 Test Cases

### Test 1: Soft Skills Excluded
```
Input: "Communication, Leadership, Python, React"
Expected Output:
  - technical_skills: ["Python", "React"]
  - soft_skills: ["Communication", "Leadership"]
Verify: skillCount should be 2, NOT 4
```

### Test 2: Grouped Skills Split
```
Input: "Programming Languages : Python, Java"
Expected Output:
  - programming_languages: ["Python", "Java"]
Verify: NO entry like "Programming Languages : Python"
```

### Test 3: Experience Extracted
```
Input: "3 years of experience"
Expected Output:
  - experience_months: 36
```

### Test 4: CGPA Normalized
```
Input: "GPA: 3.8/4.0"
Expected Output:
  - cgpa: 9.5  (3.8/4.0 * 10 = 9.5)
```

### Test 5: ML Validation Passes
```
Logs should show:
  ✅ Assert 1 PASSED: skillCount > 0
  ✅ Assert 2 PASSED: experienceMonths >= resumeMonths
  ✅ Assert 3 PASSED: projectCount >= resumeProjects
  ✅ ALL HARD VALIDATIONS PASSED
```

---

## ⚠️ Common Issues

### Issue: Resume data not being used
```
Check:
1. Did resume parser run?
   → Check resumeParsedSkills in DB (should be object, not array)

2. Are technical skills extracted?
   → Check logs: "Technical Skills: X"

3. Did validation pass?
   → Check logs: "ALL HARD VALIDATIONS PASSED"
```

### Issue: Soft skills inflating count
```
Check:
1. Is soft_skills separated in parser output?
   → Should have separate "soft_skills" field

2. Are soft skills excluded from technical count?
   → `skillCount = len(technical + programming + frameworks + tools + databases)`
   → Should NOT include soft_skills
```

### Issue: Experience not extracted
```
Check:
1. Does resume have experience section?
2. Is date format recognized? "2020-2023", "3 years", etc.
3. Check parser debug output for "Extracted X months"
```

---

## 🎯 Key Differences from Old System

| Aspect | Old | New |
|--------|-----|-----|
| Skill Output | Flat array `["Python", "React"]` | Structured `{technical_skills: [...], programming_languages: [...]}` |
| Soft Skills | Mixed with technical | Excluded from technical count |
| Experience | Estimated from keywords | Extracted from durations/dates |
| CGPA | Not extracted | Normalized to 10-point scale |
| Projects | Rough count | Detailed entries with tech stack |
| ML Signal | WEAK (noisy skills) | STRONG (clean, structured) |

---

## ✅ Validation Checklist for PRs

Before merging resume parser changes:

- [ ] Resume parser outputs structured format (not flat array)
- [ ] Soft skills are in separate "soft_skills" field
- [ ] Experience is numeric (`experience_months`)
- [ ] Projects include count AND details
- [ ] CGPA is normalized to 10-point scale
- [ ] ML logs show "CLEAN & STRUCTURED" resume data
- [ ] Hard validations pass
- [ ] No assertion errors in logs
- [ ] Shortlist probability increases for strong resumes
- [ ] Database stores structured resume data correctly

---

## 📚 Related Files

- `python/resume_parser.py` - Resume parsing logic
- `server/services/resume-parser.service.ts` - TypeScript wrapper
- `server/services/ml/shortlist-probability.service.ts` - ML integration
- `server/services/ml/candidate-features.service.ts` - Feature extraction
- `RESUME_ML_INTEGRATION_FIX_COMPLETE.md` - Full implementation details
