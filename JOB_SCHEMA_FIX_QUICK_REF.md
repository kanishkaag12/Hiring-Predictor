# Job Schema Fix - Quick Reference

## What Was Fixed
✅ ML service now properly fetches job data from n8n database schema
✅ Job description uses `job_description` (n8n primary) OR `description` (fallback)
✅ Location built from `job_city`, `job_state`, `job_country`, `job_is_remote` 
✅ Skills extracted from description if NULL, then persisted to DB
✅ Comprehensive logging shows which schema fields are used

## Files Changed
1. **server/services/ml/shortlist-probability.service.ts** - Fixed job fetching logic
2. **migrations/0013_add_n8n_job_fields.sql** - Ensures all n8n columns exist
3. **server/test-job-schema-alignment.ts** - Test script to verify alignment

## Quick Test
```bash
# Test schema alignment
tsx server/test-job-schema-alignment.ts

# Run migration
npm run db:migrate

# Start server and check logs
npm run dev
```

## Expected Logs (Success)
```
[ML] ✓ Job fetched from DB
[ML] DB Schema fields present: { hasJobDescription: true, hasSkills: true, ... }
[ML] ✓ Job description source: job_description (n8n)
[ML] ✓ Job description length: 1847 chars
[ML] Skills in DB: Python, Django, PostgreSQL, Docker
[ML] ✓ Skills source: DB
[ML] Location: San Francisco, CA, USA
[ML] Is Remote: Yes
```

## Job Description Priority
1. `job.jobDescription` (n8n primary field)
2. `job.description` (fallback)
3. Constructed from `title + skills + experience_level`

## Location Resolution Priority
1. Check `job.jobIsRemote === 1` → "Remote"
2. Use `job.jobCity, job.jobState, job.jobCountry` (n8n fields)
3. Fallback to `job.jobLocation`
4. Fallback to legacy `job.city, job.state, job.country`

## Skills Handling
1. Load from DB: `job.skills` (clean empty values)
2. If empty: Extract from `job_description` using keyword matching
3. Persist extracted skills back to DB via `storage.updateJob()`
4. Log: `[ML] ✓ Skills source: DB | extracted from description`

## Troubleshooting

### No description found
**Check:** Does job have `job_description` OR `description` field?
**Test:** `tsx server/test-job-schema-alignment.ts`
**Log:** Look for `hasJobDescription: false, hasDescription: false`

### Skills always NULL
**Check:** Are skills being extracted and persisted?
**Log:** Look for `[ML] ✓ Job skills persisted to database`
**Query:** `SELECT skills FROM jobs WHERE id = 'JOB_ID';`

### Same score for all jobs
**Check:** Are descriptions and skills different?
**Log:** Compare `[ML] Description length` and `[ML] Required skills` across jobs
**Fix:** Run skill extraction on all jobs

## Database Schema (n8n fields)
```sql
-- Core n8n fields in jobs table
job_description       -- Primary description source
description           -- Fallback description
job_city              -- City from n8n
job_state             -- State from n8n
job_country           -- Country from n8n
job_is_remote         -- 0=not remote, 1=remote
job_location          -- Location string from n8n
skills                -- JSONB array (extracted or from n8n)
experience_level      -- Junior, Mid, Senior, etc.
is_internship         -- 0=job, 1=internship
apply_link            -- Unique link (dedupe key)
job_posted_at         -- Posted date from n8n
publisher             -- Source (Google, LinkedIn, etc.)
```

## Full Documentation
See: [JOB_SCHEMA_ALIGNMENT_FIX_COMPLETE.md](JOB_SCHEMA_ALIGNMENT_FIX_COMPLETE.md)
