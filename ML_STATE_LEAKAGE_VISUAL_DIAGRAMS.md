# ML State-Leakage Fix - Visual Architecture & Flow Diagrams

## System Architecture Comparison

### BEFORE FIX ❌ (Broken)

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Request                            │
│         User clicks Job A (Backend Engineer)                 │
└─────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ ShortlistProbabilityService      │
│ predict(userId, jobId="A")       │
├──────────────────────────────────┤
│ ✅ Fetch candidate profile       │
│ ✅ Fetch job A description       │
│ ✅ Generate embedding for A      │
│ ✅ Compute match score for A     │
│ ✅ Return probability_A = 72%    │
└──────────────────────────────────┘
         │
         ├─→ recentJobEmbeddings["A"] = [...] (stored)
         ├─→ jobEmbeddingsCache["A"] = [...] (cached)
         └─→ State PERSISTS in memory ⚠️

         ↓ [Same Session, Different Request]

┌─────────────────────────────────────────────────────────────┐
│                    Next Request                              │
│         User clicks Job B (Frontend Developer)               │
└─────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ ShortlistProbabilityService      │
│ predict(userId, jobId="B")       │
├──────────────────────────────────┤
│ ⚠️  recentJobEmbeddings has A!   │ ← STALE DATA!
│ ⚠️  jobEmbeddingsCache has A!    │ ← STALE DATA!
│ ⚠️  lastProcessedJobId = "A"     │ ← OLD JOB!
│ ❌ Try to generate for B but A   │
│    interferes with computation   │
│ ❌ Error or Freeze or Identical  │
│    Score returned                │
│ ❌ Request FAILS                 │
└──────────────────────────────────┘
```

**Problem**: State from Job A interferes with Job B's prediction

---

### AFTER FIX ✅ (Repaired)

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Request                            │
│         User clicks Job A (Backend Engineer)                 │
└─────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────┐
│ ShortlistProbabilityService                    │
│ predict(userId, jobId="A")                     │
├────────────────────────────────────────────────┤
│ 🆕 currentRequestJobId = "A"                   │
│ 🆕 previousJobId = null                        │
├────────────────────────────────────────────────┤
│ ✅ Fetch candidate profile                     │
│ ✅ Fetch job A description                     │
│ ✅ JobEmbeddingService.embedJobDescription("A")│
│    ├─ clearStaleEmbeddings("A")                │
│    │  └─ lastProcessedJobId = "A"              │
│    └─ Generate embedding for A                 │
│ ✅ Compute match score for A                   │
│ ✅ Return probability_A = 72%                  │
└────────────────────────────────────────────────┘
         │
         ├─→ recentJobEmbeddings["A"] = [...]
         ├─→ jobEmbeddingsCache["A"] = [...]
         ├─→ currentRequestJobId = "A"
         ├─→ previousJobId = null
         └─→ lastProcessedJobId = "A"

         ↓ [Same Session, Different Request]

┌─────────────────────────────────────────────────────────────┐
│                    Next Request                              │
│         User clicks Job B (Frontend Developer)               │
└─────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────┐
│ ShortlistProbabilityService                  │
│ predict(userId, jobId="B")                   │
├──────────────────────────────────────────────┤
│ 🆕 previousJobId = "A" ← Detected!           │
│ 🆕 currentRequestJobId = "B" ← New job!      │
├──────────────────────────────────────────────┤
│ ✅ Fetch candidate profile (fresh)            │
│ ✅ Fetch job B description (fresh)            │
│ ✅ JobEmbeddingService.embedJobDescription("B")
│    ├─ clearStaleEmbeddings("B")              │
│    │  ├─ Detect: lastProcessedJobId("A") ≠   │
│    │  │           currentJobId("B")          │
│    │  ├─ ACTION: recentJobEmbeddings.clear()│
│    │  │           ← DELETE OLD DATA! ✨      │
│    │  └─ lastProcessedJobId = "B"            │
│    └─ Generate embedding for B (FRESH!)     │
│ ✅ Compute match score for B                 │
│ ✅ Return probability_B = 45% (DIFFERENT!)  │
└──────────────────────────────────────────────┘
         │
         └─→ recentJobEmbeddings cleared, only has B
            currentRequestJobId = "B"
            previousJobId = "A"
            lastProcessedJobId = "B"

Result: ✅ Both jobs completed successfully!
        ✅ Different probabilities (72% vs 45%)
        ✅ No state leakage!
```

---

## State Transition Flow Diagram

### Request Sequence with State

```
Request 1: Job A
├─ currentRequestJobId: null → "A"  ← Update
├─ previousJobId: null → null
├─ lastProcessedJobId: null → "A"
├─ Probability: 72%
└─ Memory: {recentJobEmbeddings: {A: [...]}}

Request 2: Job B
├─ currentRequestJobId: "A" → "B"  ← CHANGED (detect!)
├─ previousJobId: null → "A"  ← CHANGED (detect!)
├─ clearStaleEmbeddings("B") triggered
│  └─ Detect: "A" ≠ "B" → CLEAR MEMORY
├─ lastProcessedJobId: "A" → "B"
├─ Probability: 45%
└─ Memory: {recentJobEmbeddings: {B: [...]}}

Request 3: Job C
├─ currentRequestJobId: "B" → "C"  ← CHANGED (detect!)
├─ previousJobId: "A" → "B"  ← CHANGED (detect!)
├─ clearStaleEmbeddings("C") triggered
│  └─ Detect: "B" ≠ "C" → CLEAR MEMORY
├─ lastProcessedJobId: "B" → "C"
├─ Probability: 58%
└─ Memory: {recentJobEmbeddings: {C: [...]}}
```

---

## Method Call Flow Diagram

### Before Fix ❌

```
Main Thread
    │
    ├─→ predict(userId, jobId="A")
    │   ├─ Fetch data
    │   ├─ predictJobMatch()
    │   │  └─ embedJobDescription("A")
    │   │     └─ Check cache & generate
    │   │        └─ recentJobEmbeddings["A"] = [...] (PERSISTS)
    │   └─ Return probability_A
    │
    ├─→ predict(userId, jobId="B")
    │   ├─ Fetch data
    │   ├─ predictJobMatch()
    │   │  └─ embedJobDescription("B")
    │   │     ├─ Check cache ← FINDS OLD "A"! ❌
    │   │     ├─ recentJobEmbeddings still has "A" ❌
    │   │     └─ ❌ ERROR / FREEZE / IDENTICAL SCORE
    │   └─ ❌ FAILED
    │
    └─ ❌ Second job fails!
```

### After Fix ✅

```
Main Thread
    │
    ├─→ predict(userId, jobId="A")
    │   ├─ currentRequestJobId = "A"
    │   ├─ Fetch data
    │   ├─ predictJobMatch()
    │   │  └─ embedJobDescription("A")
    │   │     ├─ clearStaleEmbeddings("A") [no-op, first time]
    │   │     ├─ Check cache & generate
    │   │     └─ recentJobEmbeddings["A"] = [...]
    │   └─ Return probability_A = 72%
    │
    ├─→ predict(userId, jobId="B")
    │   ├─ previousJobId = "A" ← DETECT!
    │   ├─ currentRequestJobId = "B" ← NEW!
    │   ├─ Fetch data
    │   ├─ predictJobMatch()
    │   │  └─ embedJobDescription("B")
    │   │     ├─ clearStaleEmbeddings("B")
    │   │     │  ├─ Detect "A" ≠ "B"
    │   │     │  └─ recentJobEmbeddings.clear() ← CLEAN!
    │   │     ├─ Check cache (now empty)
    │   │     ├─ Generate fresh embedding
    │   │     └─ recentJobEmbeddings["B"] = [...]
    │   └─ Return probability_B = 45% ✅ DIFFERENT!
    │
    └─ ✅ Both jobs succeed!
```

---

## Memory State Diagram

### Before Fix ❌ - Accumulation

```
Time 0 (Start)
Memory = {}

Time 1 (After Job A)
Memory = {
  recentJobEmbeddings: {
    "A": [0.123, 0.456, ...]
  },
  jobEmbeddingsCache: {
    "A": [0.123, 0.456, ...]
  }
}

Time 2 (Start Job B)
Memory still = {
  recentJobEmbeddings: {
    "A": [0.123, 0.456, ...]  ← STALE!
  },
  jobEmbeddingsCache: {
    "A": [0.123, 0.456, ...]  ← STALE!
  }
}

❌ Job A's data interferes with Job B
❌ Can cause error, freeze, or identical score
```

### After Fix ✅ - Clean Transitions

```
Time 0 (Start)
Memory = {}

Time 1 (After Job A)
Memory = {
  currentRequestJobId: "A",
  previousJobId: null,
  lastProcessedJobId: "A",
  recentJobEmbeddings: {
    "A": [0.123, 0.456, ...]
  },
  jobEmbeddingsCache: {
    "A": [0.123, 0.456, ...]
  }
}

Time 2 (Start Job B - Before Cleanup)
Memory = {
  currentRequestJobId: "A",  ← OLD
  previousJobId: null,       ← OLD
  lastProcessedJobId: "A",   ← OLD
  recentJobEmbeddings: {
    "A": [0.123, 0.456, ...]  ← WILL CLEAR
  },
  jobEmbeddingsCache: {
    "A": [0.123, 0.456, ...]  ← STAYS (keyed by job_id)
  }
}

Time 2.5 (After State Update & Cleanup)
Memory = {
  currentRequestJobId: "B",  ← UPDATED!
  previousJobId: "A",        ← UPDATED!
  lastProcessedJobId: "B",   ← UPDATED!
  recentJobEmbeddings: {}    ← CLEARED! ✨
  jobEmbeddingsCache: {
    "A": [...]               ← Still here (for cache hit)
  }
}

Time 3 (After Job B)
Memory = {
  currentRequestJobId: "B",
  previousJobId: "A",
  lastProcessedJobId: "B",
  recentJobEmbeddings: {
    "B": [0.234, 0.567, ...]  ← NEW DATA
  },
  jobEmbeddingsCache: {
    "A": [...],
    "B": [0.234, 0.567, ...]   ← NEW CACHED
  }
}

✅ Job A's recent data deleted
✅ Job B has clean slate
✅ Cache available for repeats
```

---

## Embedding Cache Evolution

```
Time 0:
jobEmbeddingsCache = {}

After Job A (ID: backend-001):
jobEmbeddingsCache = {
  "backend-001": [embedding_A]
}

After Job B (ID: frontend-002):
jobEmbeddingsCache = {
  "backend-001": [embedding_A],  ← Kept for cache hit
  "frontend-002": [embedding_B]   ← New entry
}

After Job A (ID: backend-001) again:
jobEmbeddingsCache = {
  "backend-001": [embedding_A],   ← Cache HIT! Returns in 1ms
  "frontend-002": [embedding_B]
}

Note: Cache is PER-JOB and keyed by job_id
      Old entries persist but don't interfere with new jobs
```

---

## Clear Stale Embeddings Flow

```
BEFORE: lastProcessedJobId = "A", recentJobEmbeddings = {"A": [...]}

clearStaleEmbeddings("B") called:

┌─ Condition Check
│  └─ if (lastProcessedJobId("A") !== currentJobId("B"))
│     └─ TRUE! Job changed!
│
├─ Cleanup Actions
│  ├─ Log: "Clearing stale embeddings from previous job: A"
│  ├─ currentRecent = recentJobEmbeddings.get("B")  [nil]
│  ├─ recentJobEmbeddings.clear()  ← REMOVES "A"!
│  └─ if (currentRecent) { ... }  [skipped]
│
└─ State Update
   └─ lastProcessedJobId = "B"

AFTER: lastProcessedJobId = "B", recentJobEmbeddings = {} (empty)

Next job generation will have clean state!
```

---

## Request-Response Cycle

### Single User, Sequential Jobs

```
User Session Started
    │
    ├─ Job Click: Backend (ID: BE-001)
    │  ├─ HTTP POST /api/shortlist/predict
    │  ├─ predict(userId, "BE-001")
    │  │  ├─ previousJobId = null
    │  │  ├─ currentRequestJobId = "BE-001"
    │  │  ├─ [... computation ...]
    │  │  └─ probability = 72%
    │  │
    │  └─ HTTP 200: {probability: 0.72, improvements: [...]}
    │     Display: "You have 72% chance of shortlist"
    │
    ├─ (User reads feedback)
    │
    ├─ Job Click: Frontend (ID: FE-002)
    │  ├─ HTTP POST /api/shortlist/predict
    │  ├─ predict(userId, "FE-002")
    │  │  ├─ previousJobId = "BE-001" ← NEW!
    │  │  ├─ currentRequestJobId = "FE-002" ← NEW!
    │  │  ├─ clearStaleEmbeddings("FE-002")
    │  │  │  └─ recentJobEmbeddings.clear()
    │  │  ├─ [... computation ...]
    │  │  └─ probability = 45%
    │  │
    │  └─ HTTP 200: {probability: 0.45, improvements: [...]}
    │     Display: "You have 45% chance of shortlist"
    │
    ├─ (User reads feedback)
    │
    ├─ Job Click: Data Science (ID: DS-003)
    │  ├─ HTTP POST /api/shortlist/predict
    │  ├─ predict(userId, "DS-003")
    │  │  ├─ previousJobId = "FE-002" ← NEW!
    │  │  ├─ currentRequestJobId = "DS-003" ← NEW!
    │  │  ├─ clearStaleEmbeddings("DS-003")
    │  │  │  └─ recentJobEmbeddings.clear()
    │  │  ├─ [... computation ...]
    │  │  └─ probability = 58%
    │  │
    │  └─ HTTP 200: {probability: 0.58, improvements: [...]}
    │     Display: "You have 58% chance of shortlist"
    │
    └─ User Session Ended

Result: ✅ All 3 jobs completed successfully
        ✅ Different probabilities for different jobs
        ✅ No errors or freezes
```

---

## Time Sequence Diagram

```
Job A Request        Job B Request        Job C Request
│                    │                    │
├─ t=0: START        │                    │
│ predict(A)         │                    │
│                    │                    │
├─ t=50: Fetch data  │                    │
│                    │                    │
├─ t=100: Generate   │                    │
│ embedding          │                    │
│                    │                    │
├─ t=200: Compute    │                    │
│ match              │                    │
│                    │                    │
├─ t=250: RETURN     │                    │
│ probability: 72%   │                    │
│                    ├─ t=300: START
│                    │ predict(B)
│                    │ previousJobId = "A" ← Detect!
│                    │ currentJobId = "B"  ← New!
│                    │
│                    ├─ t=350: Fetch data
│                    │
│                    ├─ t=380: clearStaleEmbeddings("B")
│                    │ [recentJobEmbeddings.clear()]
│                    │
│                    ├─ t=400: Generate
│                    │ embedding (FRESH!)
│                    │
│                    ├─ t=500: Compute
│                    │ match
│                    │
│                    ├─ t=550: RETURN
│                    │ probability: 45%
│                    │
│                    │                    ├─ t=600: START
│                    │                    │ predict(C)
│                    │                    │ previousJobId = "B"
│                    │                    │ currentJobId = "C"
│                    │                    │
│                    │                    ├─ t=650: Fetch
│                    │                    │
│                    │                    ├─ t=680: clearStaleEmbeddings("C")
│                    │                    │ [recentJobEmbeddings.clear()]
│                    │                    │
│                    │                    ├─ t=700: Generate
│                    │                    │ embedding (FRESH!)
│                    │                    │
│                    │                    ├─ t=800: Compute
│                    │                    │ match
│                    │                    │
│                    │                    └─ t=850: RETURN
│                    │                      probability: 58%

Note: Each request is independent!
      Each job has fresh state!
      No interference between requests!
```

---

## State Machine

```
STATE DIAGRAM: Job Processing State Machine

                    ┌─────────────┐
                    │   IDLE      │
                    │ No job in   │
                    │ progress    │
                    └──────┬──────┘
                           │ predict(jobId="A") called
                           ↓
                    ┌─────────────┐
                    │  PROCESSING │
                    │   JOB A     │
                    │ currentId=A │
                    │ previousId= │
                    └──────┬──────┘
                           │ Prediction complete
                           ↓
                    ┌─────────────┐
                    │  COMPLETED  │
                    │   JOB A     │
                    │ currentId=A │
                    │ previousId= │
                    └──────┬──────┘
                           │ predict(jobId="B") called
                           ↓
                    ┌─────────────┐
                    │  UPDATING   │
                    │  CONTEXT    │
                    │ currentId=B │
                    │ previousId=A│
                    └──────┬──────┘
                           │ clearStaleEmbeddings("B")
                           ├─ Detect: A ≠ B
                           ├─ recentJobEmbeddings.clear()
                           └─ lastProcessedJobId = "B"
                           ↓
                    ┌─────────────┐
                    │  PROCESSING │
                    │   JOB B     │
                    │ currentId=B │
                    │ previousId=A│
                    └──────┬──────┘
                           │ Prediction complete
                           ↓
                    ┌─────────────┐
                    │  COMPLETED  │
                    │   JOB B     │
                    │ currentId=B │
                    │ previousId=A│
                    └──────┬──────┘
                           │ predict(jobId="C") called
                           ↓
                          ...

Key Feature: Explicit state transitions enable cleanup!
             No hidden state → No surprises!
```

---

## Summary

| Aspect | Before ❌ | After ✅ |
|--------|----------|---------|
| **State Tracking** | Hidden, implicit | Explicit, logged |
| **Memory Cleanup** | Never | On job transition |
| **First Job** | ✅ Works | ✅ Works |
| **Second Job** | ❌ Fails | ✅ Works |
| **Visibility** | ❌ Black box | ✅ Transparent |
| **Reliability** | ❌ 1 job max | ✅ Unlimited jobs |

The fix transforms the ML pipeline from a **stateful, fragile system** to a **stateless, robust system** through explicit state tracking and cleanup! 🎯

