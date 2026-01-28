# ML Shortlist Inference Endpoint - Crash Fix

## Problem
The `/api/ml/shortlist` endpoint was crashing silently with no response (Status: ERROR, 0B), indicating the Express route was not sending any JSON response.

## Root Causes
1. **Missing feature validation**: String numbers and null/undefined values were not being converted before Python inference
2. **Uncaught Python process errors**: Process crashes or stderr output wasn't being handled properly
3. **Multiple response attempts**: Python process handlers could try to send multiple responses (race condition)
4. **No safeguards for invalid output**: Python output wasn't validated before parsing
5. **Missing model file checks**: Model availability wasn't verified before spawning Python
6. **Inadequate logging**: No visibility into feature vectors or Python stderr on failure

## Solution Implemented

### 1. Defensive Feature Validation (Lines ~1510-1540)
```typescript
// Convert string numbers to float
if (typeof value === "string") {
  value = parseFloat(value);
}

// Replace undefined/null/NaN with safe default
if (value === null || value === undefined || isNaN(value)) {
  value = 0.0;
}

// Clamp to [0, 1] range
if (typeof value === "number") {
  value = Math.max(0, Math.min(1, value));
}
```
- All features are now guaranteed to be floats in [0, 1]
- String numbers are explicitly converted
- Null/undefined default to 0.0
- Out-of-range values are clamped

### 2. Model Availability Check (Lines ~1444-1452)
```typescript
const shortlistModelPath = process.env.SHORTLIST_MODEL_PATH || 
  path.join(process.cwd(), "models", "shortlist_model.pkl");

if (!fs.existsSync(shortlistModelPath)) {
  console.error(`[ML] Model file missing at: ${shortlistModelPath}`);
  return res.status(500).json({
    shortlist_probability: null,
    status: "error",
    message: "ML inference failed – see server logs",
  });
}
```
- Model existence checked BEFORE spawning Python
- Clear error response returned immediately if missing

### 3. Safe Python Execution (Lines ~1566-1650)
```typescript
let hasResponded = false; // Guard against multiple responses

py.on("error", (err) => {
  // Handle process-level errors
  if (!hasResponded) {
    hasResponded = true;
    return res.status(500).json({ ... });
  }
});

py.on("close", (code) => {
  if (hasResponded) return; // Already sent response
  
  if (code !== 0) {
    // Non-zero exit code handling
    console.error(`[ML] stderr: ${stderr}`);
    return res.status(500).json({ ... });
  }
  // ... rest of handling
});
```
- `hasResponded` flag prevents multiple response attempts
- Both process-level errors and non-zero exit codes are handled
- Stdout and stderr are always captured and logged
- Python process never leaves request hanging

### 4. Comprehensive Logging (Lines ~1544-1551, ~1591-1607)
```typescript
console.log(`[ML] Feature vector for role '${roleCategory}':`, {
  features: featureArray,
  feature_names: featureNames,
  user_id: userId,
  model_path: shortlistModelPath,
});

// On failure:
console.error(`[ML] Python process exited with code ${code}`);
console.error(`[ML] stderr: ${stderr}`);
console.error(`[ML] stdout: ${stdout}`);
```
- Feature vectors logged for debugging
- Model path logged to verify correct file is used
- All Python output (stderr/stdout) logged on failure
- Tagged with `[ML]` prefix for easy filtering

### 5. Robust Output Validation (Lines ~1620-1637)
```typescript
if (!stdout) {
  console.error(`[ML] Python script produced no output`);
  return res.status(500).json({ ... });
}

const result = JSON.parse(stdout);

if (result.error) {
  console.error(`[ML] Python inference error: ${result.error}`);
  return res.status(500).json({ ... });
}

const prob = result.shortlist_probability ?? null;
if (typeof prob !== "number" || prob < 0 || prob > 1) {
  console.error(`[ML] Invalid probability returned: ${prob}`);
  return res.status(500).json({ ... });
}
```
- Empty stdout treated as error
- Python errors in JSON response detected and reported
- Probability validated to be a number in [0, 1]

### 6. Consistent Error Response
All error paths now return:
```json
{
  "shortlist_probability": null,
  "status": "error",
  "message": "ML inference failed – see server logs"
}
```
- Consistent response format
- Always includes `status` field
- Never crashes or hangs the request

## Endpoints Fixed
- **POST /api/ml/shortlist** - Main inference endpoint (production)
- **GET /api/ml/shortlist-test/:role_category** - Test endpoint (development)

Both endpoints now have:
- Same defensive validation
- Same error handling
- Same logging infrastructure
- Same crash prevention

## Feature Order Consistency
Ensured feature order matches training:
```typescript
const featureNames = [
  "skill_match_score",
  "experience_gap_score",
  "resume_completeness_score",
  "behavioral_intent_score",
  "market_demand_score",
  "competition_score",
];
```

## Testing
To verify the fix works:

1. **Model exists** - Normal successful inference should return probability
2. **Model missing** - Should return error JSON (no crash)
3. **Invalid role** - Should return error JSON (no crash)
4. **Feature values out of range** - Should be clamped and proceed (no crash)
5. **Python process fails** - Should catch error and return JSON (no crash)

## Security & Privacy
- No raw ML weights exposed
- No internal Python errors exposed to client (logged server-side only)
- Process never crashes or exits
- Always responds with JSON

## Files Modified
- [server/routes.ts](server/routes.ts#L1432) - `/api/ml/shortlist` endpoint
- [server/routes.ts](server/routes.ts#L1067) - `/api/ml/shortlist-test` endpoint
