# Render Deployment Fix: table.sql ENOENT Error

## Problem
Login/registration fails with:
```
ENOENT: no such file or directory, open '/opt/render/project/src/dist/table.sql'
```

And database error:
```
error: relation "users" does not exist
```

## Root Causes

1. **`connect-pg-simple` was bundled by esbuild** - This package reads `table.sql` from disk for initialization, but bundling breaks its path resolution in production
2. **Migrations were not running before app startup** - Without migrations, the database schema was never created
3. **Missing `migrate` npm script** - Render couldn't execute migrations

## Fixes Applied

### 1. Removed `connect-pg-simple` from esbuild allowlist
**File:** `script/build.ts`

Removed `"connect-pg-simple"` from the allowlist so it stays external and can properly resolve its bundled resources (like `table.sql`).

```diff
const allowlist = [
  "@google/generative-ai",
  "axios",
- "connect-pg-simple",  // ← REMOVED (causes table.sql path issues when bundled)
  "cors",
  ...
]
```

### 2. Added `migrate` npm script
**File:** `package.json`

```json
{
  "scripts": {
    "migrate": "node run-all-migrations.js",
    "start": "cross-env NODE_ENV=production node dist/index.cjs"
  }
}
```

### 3. Configured PostgreSQL session store
**File:** `server/auth.ts`

```typescript
const pgStore = new PostgresSessionStore({
  pool,
  createTableIfMissing: true,     // Auto-create session table if missing
  ttl: 24 * 60 * 60,               // 24 hours
  tableName: "session",            // Explicit table name
});
```

## Deployment Steps for Render

### Step 1: Update Start Command
In your Render dashboard:
1. Go to **HirePulse Web Service**
2. Click **Settings**
3. Find **Start Command**
4. Change it to:
   ```
   npm run migrate && npm run start
   ```
5. Click **Save Changes**

### Step 2: Deploy
```bash
git add -A
git commit -m "Fix: Remove connect-pg-simple from bundle, add migrate script"
git push origin feature/render
```

Then trigger a redeploy on Render.

## How It Works

1. **Build Phase** (Render):
   ```
   npm install
   npm run build
   ```
   - Builds client with Vite
   - Bundles server with esbuild (connect-pg-simple stays external)
   - Creates `dist/index.cjs`

2. **Deploy Phase** (Render):
   ```
   npm run migrate && npm run start
   ```
   - `npm run migrate` → Runs all SQL files in `migrations/` folder
   - Creates all tables (users, jobs, skills, etc.)
   - Creates session table (via `connect-pg-simple` when first used)
   - `npm run start` → Starts the server

3. **Runtime**:
   - `connect-pg-simple` can find `table.sql` in node_modules correctly
   - Session store works with existing database
   - Login/registration works

## Verification

After deployment, check Render logs for:

```
✅ All migrations processed!
✅ Database is ready for registration!
[auth] Using PostgreSQL session store (production mode).
Server is running on port 5000
```

If you see:
```
❌ Migration failed: ...
```

Check the detailed error and the migration file that failed.

## Troubleshooting

### Still getting table.sql error?

1. Check build log - esbuild should show no bundling of `connect-pg-simple`:
   ```
   ✓ external:connect-pg-simple
   ```

2. Check start command is exactly:
   ```
   npm run migrate && npm run start
   ```

3. Check DATABASE_URL is set in Render environment variables

### Still getting "relation users does not exist"?

1. Migrations didn't run - check log for migration errors
2. Connection string is wrong - verify DATABASE_URL in Render dashboard
3. Database tables were created but in different schema - check with:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

### Migration timeout?

If migrations take >30 seconds on first run (Neon cold start), increase timeout:

**File:** `run-all-migrations.js`
```javascript
connectionTimeoutMillis: 120000, // 2 minutes
statement_timeout: 120000,
```

## Files Modified

- ✅ `script/build.ts` - Removed connect-pg-simple from allowlist
- ✅ `package.json` - Added migrate script
- ✅ `server/auth.ts` - Added tableName config (already done)

## Final Deployment Checklist

- [ ] Build succeeds locally: `npm run build`
- [ ] Migrations run locally: `npm run migrate`
- [ ] Server starts: `npm run start`
- [ ] Can login at http://localhost:5000
- [ ] Start Command on Render is: `npm run migrate && npm run start`
- [ ] DATABASE_URL is set in Render environment
- [ ] Redeploy on Render from dashboard
- [ ] Check logs for migration success
- [ ] Test login/registration in production

