# Resume Parsing Integration Guide

## Overview

The resume upload endpoint has been enhanced to automatically extract and store structured resume data. When a user uploads a resume (PDF or DOCX), the system now:

1. Accepts the file upload
2. Parses it using the existing Python resume parser
3. Extracts structured data (skills, education, experience, projects, completeness score)
4. Stores the parsed data in the database
5. Returns the complete response including parsed data

## Changes Made

### 1. Database Schema Extensions (`shared/schema.ts`)

Added five new optional fields to the `users` table to store parsed resume data:

```typescript
// Parsed resume data (optional - columns may not exist in older databases yet)
resumeParsedSkills: jsonb("resume_parsed_skills").$type<string[]>(),
resumeEducation: jsonb("resume_education").$type<Array<{degree: string, institution?: string, year?: string}>>(),
resumeExperienceMonths: integer("resume_experience_months"),
resumeProjectsCount: integer("resume_projects_count"),
resumeCompletenessScore: text("resume_completeness_score"),
```

**Fields:**
- `resumeParsedSkills`: Array of extracted technical skills (e.g., ["Python", "React", "SQL"])
- `resumeEducation`: Array of education entries with degree, institution, and year
- `resumeExperienceMonths`: Total months of work experience extracted from resume
- `resumeProjectsCount`: Number of projects mentioned in the resume
- `resumeCompletenessScore`: Resume completeness score (0-1) based on content analysis

### 2. Resume Parser Service (`server/services/resume-parser.service.ts`)

Created a new TypeScript wrapper service that bridges Node.js and the Python resume parser:

**Key Functions:**

```typescript
parseResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResumeData>
```
- Calls the Python `resume_parser.py` script
- Handles file buffer → temporary file → parsing → cleanup
- Returns structured data or throws error

```typescript
parseResumeWithFallback(fileBuffer: Buffer, fileName: string): Promise<ParsedResumeData>
```
- Wrapper that prevents parsing failures from breaking the upload flow
- Returns default values if parsing fails
- Ensures uploaded resume is always saved even if parsing doesn't work

**Returned Data Structure:**
```typescript
interface ParsedResumeData {
  skills: string[];
  education: Array<{
    degree: string;
    institution?: string;
    year?: string;
  }>;
  experience_months: number;
  projects_count: number;
  resume_completeness_score: number;
}
```

### 3. Resume Upload Endpoint Updates (`server/routes.ts`)

Modified the `POST /api/profile/resume` route to:

**Before:**
```typescript
// Only saved metadata (URL, name, upload time, AI score)
const updated = await storage.updateUser(userId, {
  resumeUrl: `/uploads/${req.file.filename}`,
  resumeName: req.file.originalname,
  resumeUploadedAt: new Date(),
  resumeScore: resumeScore
});
res.json(updated);
```

**After:**
```typescript
// Parse resume and save both metadata and extracted data
const parsedResume = await parseResumeWithFallback(
  req.file.buffer,
  req.file.originalname
);

const updated = await storage.updateUser(userId, {
  resumeUrl: `/uploads/${req.file.filename}`,
  resumeName: req.file.originalname,
  resumeUploadedAt: new Date(),
  resumeScore: resumeScore,
  // Add parsed resume data
  resumeParsedSkills: parsedResume.skills,
  resumeEducation: parsedResume.education,
  resumeExperienceMonths: parsedResume.experience_months,
  resumeProjectsCount: parsedResume.projects_count,
  resumeCompletenessScore: String(parsedResume.resume_completeness_score),
});

// Return response with parsed data
res.json({
  ...updated,
  parsedResume: {
    skills: parsedResume.skills,
    education: parsedResume.education,
    experience_months: parsedResume.experience_months,
    projects_count: parsedResume.projects_count,
    resume_completeness_score: parsedResume.resume_completeness_score,
  },
});
```

### 4. Database Migration (`migrations/0003_add_parsed_resume_fields.sql`)

Created migration to add new columns to the users table:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_parsed_skills" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_education" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_experience_months" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_projects_count" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_completeness_score" text DEFAULT '0';
```

## API Response Example

**Request:**
```bash
POST /api/profile/resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=@resume.pdf
```

**Response (200 OK):**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "resumeUrl": "/uploads/resume_123456.pdf",
  "resumeName": "resume.pdf",
  "resumeUploadedAt": "2026-01-24T22:30:00Z",
  "resumeScore": 85,
  "resumeParsedSkills": ["Python", "React", "SQL", "Docker", "AWS"],
  "resumeEducation": [
    {
      "degree": "Bachelor",
      "institution": "Stanford University",
      "year": "2020"
    }
  ],
  "resumeExperienceMonths": 36,
  "resumeProjectsCount": 5,
  "resumeCompletenessScore": "0.85",
  "parsedResume": {
    "skills": ["Python", "React", "SQL", "Docker", "AWS"],
    "education": [
      {
        "degree": "Bachelor",
        "institution": "Stanford University",
        "year": "2020"
      }
    ],
    "experience_months": 36,
    "projects_count": 5,
    "resume_completeness_score": 0.85
  }
}
```

## Error Handling

The implementation includes robust error handling:

1. **Parsing Failures**: If the resume parser fails, the system:
   - Logs the error
   - Returns empty/default values
   - Still completes the upload (resume file is saved)
   - Response includes empty arrays and zero counts

2. **Upload Failures**: Traditional upload errors still throw:
   - No file uploaded
   - Invalid file type
   - File too large

3. **Database Failures**: Handled by existing storage layer error handling

## Requirements

### Python Dependencies

The Python resume parser requires:
- `pdfplumber` - for PDF parsing
- `python-docx` - for DOCX parsing

Install with:
```bash
pip install pdfplumber python-docx
```

### Node.js/TypeScript

- Node.js 16+ (for `spawn` and async/await)
- Python executable in system PATH

## Database Deployment

When deploying to a new environment with an existing database:

1. **Option A: Manual Migration**
   ```bash
   npm run db:push
   ```

2. **Option B: Manual SQL**
   Apply the migration SQL from `migrations/0003_add_parsed_resume_fields.sql`

3. **Backward Compatibility**
   - New fields are optional/nullable
   - Old resumes (before this change) will have empty/zero values for parsed data
   - The system won't break if columns don't exist yet

## Usage Flow

### For Frontend Developers

The response now includes parsed resume data:

```typescript
const response = await fetch('/api/profile/resume', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData // contains resume file
});

const data = await response.json();

// Access extracted data
console.log(data.parsedResume.skills);           // ["Python", "React", ...]
console.log(data.parsedResume.education);         // [{ degree, institution, year }]
console.log(data.parsedResume.experience_months); // 36
console.log(data.parsedResume.projects_count);    // 5
console.log(data.parsedResume.resume_completeness_score); // 0.85
```

### For Backend Integration

The skill-to-role mapping system can now use parsed skills:

```typescript
import { SkillRoleMappingService } from './services/skill-role-mapping.service';

// Get user with parsed resume data
const user = await storage.getUser(userId);

// Use extracted skills for role analysis
const roleMatches = SkillRoleMappingService.calculateAllRoleMatches(
  user.resumeParsedSkills // Array of extracted skills
);
```

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Upload a test resume via the web interface or API

3. Check the response includes:
   - `resumeParsedSkills` array
   - `resumeEducation` array
   - `resumeExperienceMonths` number
   - `resumeProjectsCount` number
   - `resumeCompletenessScore` string

4. Verify in database:
   ```sql
   SELECT 
     id, 
     resume_name,
     resume_parsed_skills,
     resume_experience_months,
     resume_projects_count
   FROM users
   WHERE resume_url IS NOT NULL;
   ```

### Automated Testing

The resume parser already has tests in `test_resume_parser.py`:

```bash
python test_resume_parser.py
```

## Important Notes

### Constraints Met

✅ **Do NOT remove or break the existing resume upload functionality**
- Original upload, metadata storage, and AI scoring all preserved
- Parsing runs as an additional step after upload

✅ **Do NOT use hardcoded or dummy values**
- All data extracted from actual resume content via Python parser
- Fallback returns empty values, never dummy data

✅ **Do NOT introduce ML models**
- Uses pattern matching and keyword detection (existing Python parser)
- No ML models required

✅ **Resume parsing must run only after a successful file upload**
- Parsing triggered after `req.file` validation
- File already saved to disk before parsing

✅ **If parsing fails, return a safe fallback response but still keep the uploaded resume**
- Fallback returns empty/zero values
- Uploaded file remains in uploads directory
- User can still see their resume URL and metadata

## Files Modified

1. **shared/schema.ts** - Added 5 new optional fields to users table
2. **server/services/resume-parser.service.ts** - Created new service (NEW FILE)
3. **server/routes.ts** - Enhanced POST /api/profile/resume endpoint
4. **migrations/0003_add_parsed_resume_fields.sql** - Database migration (NEW FILE)

## Future Enhancements

Possible improvements:
1. Add caching to avoid re-parsing on every request
2. Support for additional resume formats (RTF, plain text, Google Docs)
3. Real-time parsing progress indicator
4. Batch resume parsing for recruiting
5. Skill confidence scores along with skill extraction
6. Link extracted skills to skill-to-role mapping system
7. Auto-populate skills form from extracted data
