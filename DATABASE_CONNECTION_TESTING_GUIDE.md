# Database Connection & Auth Fix - Testing Guide

## What Was Fixed

✅ **Database URL Validation**: Enhanced validation with host logging
✅ **Connection Health Check**: Added `testDatabaseConnection()` to test actual connectivity
✅ **Error Distinction**: Login/Register now return 503 for DB errors, 401 for auth failures
✅ **Startup Diagnostics**: Server logs connection status and provides helpful hints
✅ **Auth Middleware Order**: Database is checked before auth routes run
✅ **Graceful Degradation**: Server continues even if DB is down at startup

## Quick Test Checklist

### Test 1: Healthy Database - Valid Credentials ✓
```bash
# Prerequisite: Database is running and DATABASE_URL is correct
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct-password"}'
```
**Expected Response:**
- Status: 200
- Body: `{ "user": {...}, "token": "..." }`
- Server Log: `[AUTH] Login successful for: test@example.com`

---

### Test 2: Healthy Database - Invalid Credentials ✓
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong-password"}'
```
**Expected Response:**
- Status: 401
- Body: `{ "message": "Invalid email or password" }`
- Server Log: `[AUTH] Password mismatch for: test@example.com`

---

### Test 3: Healthy Database - Non-existent User ✓
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"any-password"}'
```
**Expected Response:**
- Status: 401
- Body: `{ "message": "Invalid email or password" }`
- Server Log: `[AUTH] User not found: nonexistent@example.com`

---

### Test 4: Database Unreachable (Simulate) ✓

**Step 1: Break the connection**
```bash
# Temporarily update DATABASE_URL to an invalid host
# Option A: Edit .env and set invalid hostname
DATABASE_URL="postgresql://user:pass@invalid-host-12345.com:5432/db"

# Option B: Or temporarily stop your database server
```

**Step 2: Restart server**
```bash
npm run dev
# Or start server
```

**Step 3: Check startup logs**
```
[system] Starting server initialization...
[database] PostgreSQL configuration loaded
[storage] Database URL configured to: invalid-host-12345.com:5432
[storage] Testing database connection to invalid-host-12345.com:5432...
[storage] ✗ Database connection FAILED
[storage] Error: getaddrinfo ENOTFOUND invalid-host-12345.com
[storage] → Unable to resolve hostname 'invalid-host-12345.com'. Check your DATABASE_URL and network connectivity.
[system] Warning: Database connection failed at startup
[system] Server will continue, but authentication will return 503 until database is available
[system] Check your DATABASE_URL and ensure the database server is reachable
[system] Setting up authentication...
```

**Step 4: Attempt login**
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"any-password"}'
```

**Expected Response:**
- Status: 503 (Service Unavailable)
- Body: `{ "message": "Authentication temporarily unavailable" }`
- Server Log: `[LOGIN] Database unavailable: DATABASE_UNAVAILABLE`

**🔑 KEY DIFFERENCE:** Returns **503** (service error) instead of **401** (auth error)

---

### Test 5: Register with Database Unreachable ✓

**With Database Unavailable:**
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123"}'
```

**Expected Response:**
- Status: 503 (Service Unavailable)
- Body: `{ "message": "Authentication temporarily unavailable" }`
- Server Log: `[REGISTER] Database is unreachable`

---

### Test 6: Register with Healthy Database - Valid Input ✓

**With Database Available:**
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123"}'
```

**Expected Response:**
- Status: 201 (Created)
- Body: `{ "user": {...}, "token": "..." }`
- Server Log: `[REGISTER] Success, returning user and token`

---

### Test 7: Database Connection Recovery ✓

**Step 1: Start with broken DATABASE_URL (from Test 4)**
```bash
# Server returns 503 for all auth requests
```

**Step 2: Fix DATABASE_URL**
```bash
# Update .env with correct DATABASE_URL
# Or restart database server
```

**Step 3: Server will automatically detect recovery**
```bash
# Server doesn't auto-detect, but next login attempt will trigger health check
# On next request that needs DB:
[storage] Testing database connection...
[storage] ✓ Database connection successful
```

**Step 4: Try login again**
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correct-password"}'
```

**Expected Response:**
- Status: 200 (back to normal)
- Body: `{ "user": {...}, "token": "..." }`

---

## Error Codes Reference

### HTTP 200 - Success
✓ Login successful with valid credentials
✓ Register successful with new valid user

### HTTP 201 - Created
✓ Registration completed, user created

### HTTP 400 - Bad Request
✗ Invalid input (validation error)
✗ Email already exists (registration)

### HTTP 401 - Unauthorized
✗ Invalid email or password
✗ User doesn't exist
✗ Password doesn't match

### HTTP 503 - Service Unavailable
✗ Database connection failed
✗ Database unreachable
✗ Database credentials invalid
✗ Database host not found

## Diagnostic Hints

When you see `[storage] ✗ Database connection FAILED`, the error message will include helpful hints:

| Error | Hint |
|-------|------|
| `ENOTFOUND` | "Unable to resolve hostname. Check DATABASE_URL." |
| `ECONNREFUSED` | "Connection refused. Database server may not be running." |
| `ETIMEDOUT` | "Connection timed out. Database may be unresponsive." |
| `authentication failed` | "Database authentication failed. Check username/password." |

## Log Prefixes

All enhanced logs use clear prefixes:

- `[storage]` - Database connection and health check
- `[AUTH]` - Authentication strategy (LocalStrategy)
- `[LOGIN]` - Login endpoint
- `[REGISTER]` - Registration endpoint
- `[system]` - Server initialization

## Key Files

- [server/storage.ts](server/storage.ts#L50) - Database initialization & health check
- [server/auth.ts](server/auth.ts#L1) - Authentication with error distinction
- [server/index.ts](server/index.ts#L60) - Startup initialization order

## Before vs After

| Scenario | Before | After |
|----------|--------|-------|
| **Valid creds, DB up** | ✓ Login works | ✓ Login works |
| **Invalid creds, DB up** | 401 "Invalid email..." | 401 "Invalid email..." |
| **Valid creds, DB down** | 401 "Invalid email..." ❌ CONFUSING | 503 "Auth temporarily unavailable" ✓ CLEAR |
| **Register, DB down** | 500 Error or crash ❌ | 503 "Auth temporarily unavailable" ✓ SAFE |
| **Server startup, DB down** | Crash or proceed unclear ❌ | Continues with warnings ✓ GRACEFUL |

---

**Status**: ✅ Ready for testing - all fixes implemented and type-safe
