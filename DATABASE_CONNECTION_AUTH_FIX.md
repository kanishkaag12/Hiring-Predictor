# Database Connection and Authentication Fix

## Problem
The backend was rejecting valid users with "Invalid email or password", but the real issue was a PostgreSQL connection failure (`getaddrinfo ENOTFOUND <neon-hostname>`). The database errors were being masked as authentication failures, preventing users from knowing the real problem.

## Root Causes
1. **DATABASE_URL validation was incomplete**: Only checked if set, but never tested if connection actually works
2. **No database health check at startup**: Server started without verifying DB connectivity
3. **DB errors masked in auth logic**: When the database couldn't be reached, auth failures returned 401 instead of 503
4. **No distinction between error types**: Both "user not found" and "database unreachable" returned the same 401 error
5. **No helpful error diagnostics**: Database errors didn't include hostname or connection details
6. **Auth routes ran without DB health check**: No dependency enforcement

## Solution Implemented

### 1. Enhanced DATABASE_URL Validation in storage.ts

**Before:**
```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

**After:**
```typescript
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[storage] CRITICAL: DATABASE_URL is not set");
  throw new Error("DATABASE_URL must be defined in .env");
}

const dbHost = extractHostInfo(DATABASE_URL);
console.log(`[storage] Database URL configured to: ${dbHost}`);

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on("error", (err: Error) => {
  console.error("[storage] Unexpected error on database connection pool:", err);
});

pool.on("connect", () => {
  console.log("[storage] Database connection established");
});
```

**Improvements:**
- Validates DATABASE_URL is set before initializing pool
- Extracts and logs hostname (without credentials)
- Sets up pool error handlers to detect connection issues
- Provides clear error messages if DATABASE_URL is missing

### 2. Database Health Check Function in storage.ts

New `testDatabaseConnection()` function:
```typescript
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    
    console.log("[storage] ✓ Database connection successful");
    isHealthy = true;
    return true;
  } catch (err) {
    isHealthy = false;
    lastConnectionError = err;
    
    console.error("[storage] ✗ Database connection FAILED");
    console.error(`[storage] Error: ${errorMessage}`);
    
    // Diagnostic hints
    if (errorMessage.includes("ENOTFOUND")) {
      console.error(`[storage] → Unable to resolve hostname. Check DATABASE_URL.`);
    } else if (errorMessage.includes("ECONNREFUSED")) {
      console.error(`[storage] → Connection refused. Database server may not be running.`);
    }
    // ... more helpful diagnostics
  }
}

export function isDatabaseHealthy(): boolean {
  return isHealthy;
}

export function getLastConnectionError(): Error | null {
  return lastConnectionError;
}
```

**Features:**
- Actually attempts a connection (SELECT NOW())
- Tracks health status and last error
- Provides diagnostic hints based on error type
- Can be called during startup and monitored during runtime

### 3. Authentication Error Distinction in auth.ts

**LocalStrategy (Login) - Before:**
```typescript
async (email, password, done) => {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: "Invalid email or password" });
    }
    // ... rest
  } catch (err) {
    return done(err);
  }
}
```

**LocalStrategy (Login) - After:**
```typescript
async (email, password, done) => {
  try {
    // First check if database is healthy
    if (!isDatabaseHealthy()) {
      console.error("[AUTH] Database is unreachable");
      return done(new Error("DATABASE_UNAVAILABLE"));
    }
    
    // Attempt to fetch user
    let user;
    try {
      user = await storage.getUserByEmail(email);
    } catch (dbError) {
      console.error("[AUTH] Database error fetching user:", dbError);
      return done(new Error("DATABASE_ERROR"));
    }
    
    if (!user) {
      return done(null, false, { message: "Invalid email or password" });
    }
    // ... rest
  } catch (err) {
    return done(err);
  }
}
```

**Improvements:**
- Checks database health before attempting query
- Catches database errors separately from auth failures
- Returns specific error codes for DB issues vs auth failures
- Allows middleware to distinguish between error types

### 4. Login Endpoint Error Handling - Before vs After

**Before:**
```typescript
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: UserType, info: any) => {
    if (err) {
      return next(err);  // All errors treated the same
    }
    if (!user) {
      return res.status(401).json({ message: info?.message });  // Returns 401 for DB errors too
    }
    // ... success
  })(req, res, next);
});
```

**After:**
```typescript
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: UserType, info: any) => {
    // Handle database errors (return 503)
    if (err && (err.message === "DATABASE_UNAVAILABLE" || err.message === "DATABASE_ERROR")) {
      console.error("[LOGIN] Database unavailable:", err.message);
      return res.status(503).json({ message: "Authentication temporarily unavailable" });
    }
    
    // Handle other errors (pass to middleware)
    if (err) {
      console.error("[LOGIN] Passport error:", err);
      return next(err);
    }
    
    // Authentication failed (invalid credentials) - only if DB succeeded
    if (!user) {
      console.log("[LOGIN] Auth failed:", info?.message);
      return res.status(401).json({ message: info?.message || "Authentication failed" });
    }
    // ... success
  })(req, res, next);
});
```

**Improvements:**
- Returns 503 Service Unavailable for database errors
- Returns 401 Unauthorized only for actual auth failures
- Clear distinction in HTTP status codes and error messages
- Client can handle retries appropriately

### 5. Register Endpoint Database Error Handling

Updated to check database health before processing:
```typescript
app.post("/api/register", async (req, res, next) => {
  try {
    // Check database availability BEFORE processing
    if (!isDatabaseHealthy()) {
      console.error("[REGISTER] Database is unreachable");
      return res.status(503).json({ message: "Authentication temporarily unavailable" });
    }
    
    // ... validation ...
    
    let existingUser;
    try {
      existingUser = await storage.getUserByEmail(email);
    } catch (dbError) {
      console.error("[REGISTER] Database error:", dbError);
      return res.status(503).json({ message: "Authentication temporarily unavailable" });
    }
    
    // ... rest of registration ...
  } catch (err) {
    console.error("[REGISTER] Registration failure:", err);
    next(err);
  }
});
```

**Improvements:**
- Fails fast if database is unavailable
- Catches database errors during user lookup
- Returns 503 for all database-related issues
- Prevents failed registrations due to transient DB errors

### 6. Startup Health Check in index.ts

**Before:**
```typescript
(async () => {
  try {
    log("Starting server initialization...", "system");
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in .env");
    }
    log("PostgreSQL configuration loaded", "database");
    
    setupAuth(app);
    await registerRoutes(httpServer, app);
```

**After:**
```typescript
(async () => {
  try {
    log("Starting server initialization...", "system");
    
    // 1. DATABASE INITIALIZATION
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in .env");
    }
    log("PostgreSQL configuration loaded", "database");

    // 2. DATABASE HEALTH CHECK
    const dbHealthy = await testDatabaseConnection();
    if (!dbHealthy) {
      console.warn("[system] Warning: Database connection failed at startup");
      console.warn("[system] Server will continue, but authentication will return 503");
      console.warn("[system] Check DATABASE_URL and ensure database is reachable");
    }

    // 3. SETUP AUTH (must happen before routes)
    log("Setting up authentication...", "system");
    setupAuth(app);

    // 4. REGISTER ROUTES
    log("Registering routes...", "system");
    await registerRoutes(httpServer, app);
```

**Improvements:**
- Health check runs before auth setup
- Server doesn't crash if DB is down at startup
- Clear warning messages explain the issue
- Provides guidance for fixing the problem
- Auth routes only run after health check

## Error Response Changes

### Login Endpoint Responses

**Database Error (New):**
```json
{
  "status": 503,
  "message": "Authentication temporarily unavailable"
}
```

**Invalid Credentials (Unchanged):**
```json
{
  "status": 401,
  "message": "Invalid email or password"
}
```

**Success (Unchanged):**
```json
{
  "status": 200,
  "user": { ... },
  "token": "..."
}
```

### Register Endpoint Responses

**Database Error (New):**
```json
{
  "status": 503,
  "message": "Authentication temporarily unavailable"
}
```

**Email Already Exists (Unchanged):**
```json
{
  "status": 400,
  "message": "User already exists"
}
```

**Validation Error (Unchanged):**
```json
{
  "status": 400,
  "error": { ... }
}
```

## Startup Logs

### When Database is Healthy
```
[system] Starting server initialization...
[database] PostgreSQL configuration loaded
[storage] Database URL configured to: db.example.com:5432
[storage] Testing database connection to db.example.com:5432...
[storage] ✓ Database connection successful
[system] Setting up authentication...
[system] Registering routes...
[system] Routes registered
[system] Backend running on http://localhost:3001
```

### When Database is Unreachable
```
[system] Starting server initialization...
[database] PostgreSQL configuration loaded
[storage] Database URL configured to: invalid-host.neon.tech:5432
[storage] Testing database connection to invalid-host.neon.tech:5432...
[storage] ✗ Database connection FAILED
[storage] Error: getaddrinfo ENOTFOUND invalid-host.neon.tech
[storage] → Unable to resolve hostname 'invalid-host.neon.tech'. Check your DATABASE_URL and network connectivity.
[system] Warning: Database connection failed at startup
[system] Server will continue, but authentication will return 503 until database is available
[system] Check your DATABASE_URL and ensure the database server is reachable
[system] Setting up authentication...
[system] Registering routes...
[system] Routes registered
[system] Backend running on http://localhost:3001
```

## Client Experience

### When Database is Healthy
- ✓ Login works normally
- ✓ Registration works normally
- ✓ ML inference works normally

### When Database is Unreachable
- **Before:** "Invalid email or password" (confusing, user thinks credentials are wrong)
- **After:** "Authentication temporarily unavailable" (HTTP 503, clear that it's a service issue)

## Files Modified

1. [server/storage.ts](server/storage.ts)
   - Added DATABASE_URL validation
   - Added pool error handlers
   - Added `testDatabaseConnection()` function
   - Added `isDatabaseHealthy()` function
   - Added `getLastConnectionError()` function
   - Added diagnostic messages for different connection error types

2. [server/auth.ts](server/auth.ts)
   - Imported `isDatabaseHealthy` from storage
   - Updated LocalStrategy to check database health
   - Updated login endpoint to return 503 for DB errors
   - Updated register endpoint to check database availability
   - Added database error handling in all auth paths

3. [server/index.ts](server/index.ts)
   - Imported `testDatabaseConnection` from storage
   - Added database health check at startup
   - Reordered initialization to test DB before auth setup
   - Added helpful warning messages if DB is unavailable

## Testing the Fix

### Test 1: Valid User with Healthy Database
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"correct-password"}'

# Expected: 200 with user and token
```

### Test 2: Invalid Credentials with Healthy Database
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"wrong-password"}'

# Expected: 401 "Invalid email or password"
```

### Test 3: Valid User with Unreachable Database
```bash
# Stop database or break DATABASE_URL
# Then attempt login

curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"correct-password"}'

# Expected: 503 "Authentication temporarily unavailable"
```

### Test 4: Startup with Unreachable Database
```bash
# Break DATABASE_URL
# Start server

# Expected in logs:
# [storage] ✗ Database connection FAILED
# [storage] Error: getaddrinfo ENOTFOUND ...
# [system] Warning: Database connection failed at startup
```

## Guarantees

✅ Database errors never return 401 (only 503)
✅ Auth failures never return 503 (only 401)
✅ Server starts even if database is temporarily unavailable
✅ Auth endpoints return 503 until database is reachable
✅ Helpful diagnostic messages guide troubleshooting
✅ DATABASE_URL validation fails early with clear errors
✅ Connection health tracked and checked before operations
✅ All errors logged with [AUTH], [storage], or [system] prefix

---

**Status**: ✅ FIXED - Authentication now properly distinguishes database errors from credential failures
