# Resume Parsing Quick Reference

## What Changed?

The resume upload API (`POST /api/profile/resume`) now automatically extracts and stores structured resume data.

## Key Points

### Extracted Data
After uploading a resume, these fields are automatically populated:

| Field | Type | Description |
|-------|------|-------------|
| `resumeParsedSkills` | `string[]` | Technical skills found in resume |
| `resumeEducation` | `Array<{degree, institution?, year?}>` | Education entries |
| `resumeExperienceMonths` | `number` | Total work experience in months |
| `resumeProjectsCount` | `number` | Number of projects mentioned |
| `resumeCompletenessScore` | `string` | Completeness score (0-1) |

### Response Format

```json
{
  "id": "user-id",
  "resumeUrl": "/uploads/resume.pdf",
  "resumeParsedSkills": ["Python", "React", "SQL"],
  "resumeEducation": [{"degree": "Bachelor", "institution": "MIT", "year": "2020"}],
  "resumeExperienceMonths": 24,
  "resumeProjectsCount": 3,
  "resumeCompletenessScore": "0.75",
  "parsedResume": {
    "skills": ["Python", "React", "SQL"],
    "education": [...],
    "experience_months": 24,
    "projects_count": 3,
    "resume_completeness_score": 0.75
  }
}
```

## How to Use

### Frontend
```typescript
const formData = new FormData();
formData.append('resume', resumeFile);

const response = await fetch('/api/profile/resume', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const data = await response.json();
console.log('Skills:', data.parsedResume.skills);
```

### Backend
```typescript
// Skills are now stored in user record
const user = await storage.getUser(userId);
console.log(user.resumeParsedSkills); // ["Python", "React", ...]

// Can be used for skill-to-role mapping
const roleMatches = calculateRoleMatches(user.resumeParsedSkills);
```

## How It Works

1. **File Upload** → Resume file saved to `/uploads` folder
2. **Parsing** → Python script extracts data from PDF/DOCX
3. **Storage** → Parsed data saved to database
4. **Response** → API returns both metadata and parsed data

## Error Handling

- ✅ If parsing fails → Returns empty values, keeps uploaded file
- ✅ If upload fails → Standard upload error
- ✅ If database fails → Existing error handling applies

## Database Fields

**New columns in `users` table:**
```sql
resume_parsed_skills (jsonb)          -- Array of skills
resume_education (jsonb)              -- Array of education entries
resume_experience_months (integer)    -- Months of experience
resume_projects_count (integer)       -- Number of projects
resume_completeness_score (text)      -- Completeness score
```

**Optional** - May not exist in older databases until migration is run

## Files Changed

| File | Changes |
|------|---------|
| `shared/schema.ts` | Added 5 new fields to users table |
| `server/routes.ts` | Enhanced POST /api/profile/resume |
| `server/services/resume-parser.service.ts` | NEW - Parsing wrapper |
| `migrations/0003_add_parsed_resume_fields.sql` | NEW - Database migration |

## Compatibility

✅ Preserves all existing functionality
✅ No breaking changes to API
✅ Graceful fallback if parsing fails
✅ Works with existing resume uploads

## Need Help?

- See full guide: [RESUME_PARSING_INTEGRATION.md](./RESUME_PARSING_INTEGRATION.md)
- Test files: `test_resume_parser.py`
- Example: `resume_parser_examples.py`
