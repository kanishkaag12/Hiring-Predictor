# Quick Deployment Guide - Canonical Parser Path

## What Changed?

Resume parser moved from `scripts/resume-parser/resume_parser.py` to `python/resume_parser.py`

## Deployment Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Verify File Exists
```bash
# On Windows
if exist python\resume_parser.py (echo OK) else (echo MISSING)

# On Linux/macOS
[ -f python/resume_parser.py ] && echo OK || echo MISSING
```

### 3. Start Server
```bash
npm run dev
```

### 4. Check Startup Logs
Look for one of these messages:

**✓ Success**:
```
[Resume Parser] ✓ Resume parser found at: /path/to/python/resume_parser.py
```

**⚠ Warning** (but server continues):
```
[Resume Parser] ⚠ Resume parser NOT found at: /path/to/python/resume_parser.py
[Resume Parser] Resume uploads will gracefully degrade to empty defaults
```

### 5. Test Resume Upload
1. Login to dashboard
2. Upload a resume
3. Check response:
   - If parser found: `"parsingStatus": "SUCCESS"` with parsed data
   - If parser missing: `"parsingStatus": "FAILED"` with empty defaults (graceful)

### 6. Verify No Breaking Changes
- ✓ Login works
- ✓ Dashboard loads
- ✓ ML inference works
- ✓ Resume upload works (with or without parser)

---

## What if Parser is Missing?

**No problem!** Server will:
1. Log warning at startup
2. Continue running normally
3. Resume uploads return empty defaults instead of crashing
4. Authentication NOT affected
5. Dashboard NOT blocked

---

## File Structure

```
project-root/
├── python/
│   └── resume_parser.py  ← CANONICAL LOCATION
├── scripts/
│   └── resume-parser/    ← OLD LOCATION (can be removed)
│       └── resume_parser.py
├── server/
├── client/
└── package.json
```

---

## Environment-Independent

The path resolution works on:
- ✅ Windows (C:\path\to\python\resume_parser.py)
- ✅ Linux (/path/to/python/resume_parser.py)
- ✅ macOS (/path/to/python/resume_parser.py)
- ✅ Docker (/app/python/resume_parser.py)
- ✅ GitHub Actions (/home/runner/work/.../python/resume_parser.py)

No hardcoded paths, no environment-specific logic.

---

## Troubleshooting

### Parser not found in production?
1. Verify `/python/resume_parser.py` exists on server
2. Check file permissions (should be readable)
3. Restart server
4. Check logs for exact path

### Resume upload returns empty defaults?
1. Check if parser file exists
2. Check if Python is installed
3. Check server logs for error details (dev mode only)

### Port 3001 already in use?
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3001 | xargs kill -9
```

---

## Production Ready ✓

- ✅ TypeScript type-safe
- ✅ Comprehensive error handling
- ✅ Graceful degradation
- ✅ Non-blocking architecture
- ✅ Clear logging
- ✅ Environment-independent
