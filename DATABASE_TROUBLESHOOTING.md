# Database Connection Troubleshooting Guide

## Issue: "Authentication temporarily unavailable" (HTTP 503)

This means the database is unreachable. Here's how to fix it:

### Step 1: Check DATABASE_URL

```bash
# Check if .env file exists
ls -la .env

# Check if DATABASE_URL is set
grep DATABASE_URL .env

# The URL should look like:
# postgresql://username:password@hostname:5432/database_name
```

### Step 2: Check Server Logs

Look for these patterns in server logs:

```
[storage] ✗ Database connection FAILED
[storage] Error: getaddrinfo ENOTFOUND hostname
```

This tells you the specific problem.

### Step 3: Diagnostic by Error Type

#### Error: `ENOTFOUND hostname`
**Problem:** Hostname cannot be resolved (DNS issue or wrong hostname)
**Fix:**
- Check DATABASE_URL hostname spelling
- Ensure you have internet connectivity
- Check if the database host is currently running
- Try pinging the hostname: `ping db.neon.tech`

```bash
# Example: If DATABASE_URL is wrong
# DATABASE_URL="postgresql://user:pass@invalid-host.neon.tech:5432/db"
# Fix: Update to correct hostname
DATABASE_URL="postgresql://user:pass@correct-host.neon.tech:5432/db"
```

#### Error: `ECONNREFUSED`
**Problem:** Connection refused (database server not running or not listening)
**Fix:**
- Check if database server is running
- Check if port 5432 (or specified port) is open
- Restart the database service

```bash
# If using local PostgreSQL
sudo systemctl restart postgresql

# If using Docker
docker-compose up -d  # or similar for your setup
```

#### Error: `ETIMEDOUT`
**Problem:** Connection timed out (firewall or database unresponsive)
**Fix:**
- Check firewall rules
- Check database server is responsive
- Increase connection timeout if needed
- Check network connectivity to database host

```bash
# Test connectivity
telnet hostname 5432

# Or on Windows
# Test-NetConnection -ComputerName hostname -Port 5432
```

#### Error: `authentication failed`
**Problem:** Wrong username or password in DATABASE_URL
**Fix:**
- Check credentials in DATABASE_URL
- Verify the database user exists
- Verify the user has permissions for the database

```bash
# DATABASE_URL format: postgresql://USERNAME:PASSWORD@HOST:PORT/DBNAME
# Make sure USERNAME and PASSWORD are correct
```

### Step 4: Verify Connection Works

Once you fix DATABASE_URL, test the connection:

```bash
# Method 1: Restart server and check logs
npm run dev

# Look for success message:
# [storage] ✓ Database connection successful

# Method 2: Try login (should return 200 or 401, not 503)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Step 5: Ongoing Monitoring

Check these logs regularly:

```bash
# Watch for [storage] prefix messages
tail -f server-log.txt | grep "\[storage\]"

# Or look for connection errors
tail -f server-log.txt | grep "connection\|FAILED\|Error"
```

---

## Issue: Still Getting Auth Errors After Fix?

### Check 1: Verify User Exists

```bash
# Check if the user exists in database
psql -U username -d database_name

# Then run:
SELECT * FROM users WHERE email = 'user@example.com';

# If no results, user needs to register first
```

### Check 2: Check Password is Correct

Passwords are hashed, so:
- Make sure you're using the exact password from registration
- Password is case-sensitive
- No leading/trailing spaces

### Check 3: Database Query Timing

Sometimes the database connection works at startup but fails during queries:
```bash
# Server log should show:
[AUTH] Attempting login for: user@example.com
[AUTH] Login successful for: user@example.com

# If you see an error here, database had a transient failure
```

### Check 4: Connection Pool Issues

If queries are timing out randomly:

```typescript
// In storage.ts, the pool is configured with:
// - Default connection timeout: network dependent
// - Pool size: default (usually 10)

// If you need to adjust, modify pool configuration:
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // 5s timeout for new connections
});
```

---

## Issue: Server Crashed on Startup

### If DATABASE_URL is Completely Missing

```bash
# Error you'll see:
# CRITICAL SERVER ERROR: Error: DATABASE_URL must be defined in .env

# Fix: Add DATABASE_URL to .env
echo 'DATABASE_URL="postgresql://user:password@host:5432/db"' >> .env
```

### If DATABASE_URL is Invalid Format

```bash
# Error you'll see:
# CRITICAL SERVER ERROR: Error: Invalid connection string

# Fix: Check format is correct
# Format: postgresql://USERNAME:PASSWORD@HOSTNAME:PORT/DATABASE
# Example: postgresql://admin:mysecret@db.neon.tech:5432/myapp
```

---

## Common DATABASE_URL Mistakes

| Mistake | Example | Fix |
|---------|---------|-----|
| Missing protocol | `user:pass@host/db` | `postgresql://user:pass@host/db` |
| Wrong protocol | `mysql://user:pass@host/db` | Use `postgresql://` |
| Missing port | `postgresql://user:pass@host/db` | `postgresql://user:pass@host:5432/db` |
| Special chars in password | `postgresql://user:p@ss@host/db` | URL-encode: `p%40ss` → `postgresql://user:p%40ss@host/db` |
| Wrong hostname | `postgresql://user:pass@localhost/db` | Use actual Neon hostname, e.g., `db.neon.tech` |
| Trailing slash | `postgresql://user:pass@host/db/` | Remove trailing slash |

---

## Checking Database Availability

### If you have access to database:

```bash
# Connect to database
psql postgresql://username:password@hostname:5432/dbname

# Simple test query
SELECT NOW();

# Check users table
SELECT COUNT(*) FROM users;

# Check if users table exists
\dt users
```

### From your application:

```bash
# Check server log for connection messages
[storage] Testing database connection to hostname:5432...
[storage] ✓ Database connection successful

# Or check with curl
curl http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# If you get 503, database is down
# If you get 401, database is up but auth failed (expected)
```

---

## When Database Comes Back Online

The server automatically detects when the database comes back:

```bash
# Sequence:
1. Database is down → All auth returns 503
2. You fix DATABASE_URL
3. Next login attempt triggers health check
4. Server detects database is healthy
5. Auth proceeds normally → Returns 200 or 401
```

No server restart needed!

---

## For Neon Database Specifically

If using Neon (serverless PostgreSQL):

```bash
# Get connection string from Neon dashboard:
# 1. Go to Neon console
# 2. Select your project
# 3. Click "Connection string"
# 4. Copy the PostgreSQL connection string
# 5. Add to .env: DATABASE_URL="postgresql://..."

# Common Neon issues:
# - FREE TIER: Goes to sleep after 30 minutes of inactivity
#   → Causes first request to be slow
# - COLD START: First connection may take 1-2 seconds
#   → Increase connection timeout if needed
# - CONNECTION LIMIT: Free tier has connection limits
#   → May see "too many connections" errors
```

---

## Health Check Endpoint

You can manually trigger a health check:

```bash
# In future versions, consider adding a health check endpoint:
curl http://localhost:3001/api/health

# Should return something like:
# { "status": "ok", "database": "connected", "uptime": "12.5s" }
```

Currently, database health is only checked at startup and during auth operations.

---

## Getting Help

When reporting database issues, include:

1. **Error message from server logs** - Look for [storage] messages
2. **DATABASE_URL** - Just the hostname and port, not credentials
3. **Steps to reproduce** - What you did before the error
4. **Server startup logs** - Full output when server started
5. **When it started** - Was it after deployment, config change, etc.

Example:
```
Error: getaddrinfo ENOTFOUND db.neon.tech
DATABASE_URL points to: db.neon.tech:5432
Issue started after: Updated .env yesterday
```

---

**Last Updated:** January 26, 2026
**Applies to:** Database Connection & Authentication Fix
