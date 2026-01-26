# What-If Simulator - Visual Architecture Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Dashboard / Jobs Page                                     │   │
│  │                                                             │   │
│  │  [Job Card] - Backend Engineer                             │   │
│  │  Company: Acme Corp | Match: 45%                           │   │
│  │  ┌──────────────────────────────────────┐                  │   │
│  │  │ [Analyze My Chances Button] ← Clicked │                  │   │
│  │  └──────────────────────────────────────┘                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Analysis Modal Opens                                      │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │  📊 Shortlist Score: 45%                                   │   │
│  │                                                             │   │
│  │  Score Breakdown:                                          │   │
│  │  ┌─────────┬─────────┬─────────┬─────────┐               │   │
│  │  │Profile  │ Skill   │Market   │Company  │               │   │
│  │  │  55%    │  40%    │  50%    │  40%    │               │   │
│  │  └─────────┴─────────┴─────────┴─────────┘               │   │
│  │                                                             │   │
│  │  🎯 Improve Your Chances:                                  │   │
│  │  ┌──────────────────────────────────────┐                 │   │
│  │  │  JobWhatIfSimulator Component        │ ← NEW!           │   │
│  │  ├──────────────────────────────────────┤                 │   │
│  │  │                                      │                 │   │
│  │  │  [Skill Card] Docker                 │                 │   │
│  │  │  45% → 56% (+11%)                    │                 │   │
│  │  │  Time: 3-4 weeks                     │                 │   │
│  │  │  Why: Essential for containers...    │                 │   │
│  │  │                                      │                 │   │
│  │  │  [Skill Card] System Design          │                 │   │
│  │  │  45% → 54% (+9%)                     │                 │   │
│  │  │  Time: 6-8 weeks                     │                 │   │
│  │  │  Why: Critical for architecture...   │                 │   │
│  │  │                                      │                 │   │
│  │  │  [Chat Input] "What if I learn X?"   │                 │   │
│  │  │  [Send Button]                       │                 │   │
│  │  │                                      │                 │   │
│  │  └──────────────────────────────────────┘                 │   │
│  │                                                             │   │
│  │  💡 Recommendations to Improve                             │   │
│  │                                                             │   │
│  │  [Apply Now] [Close]                                       │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ API Call
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Node.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  routes.ts                                                 │   │
│  │                                                             │   │
│  │  POST /api/ai/simulate-for-job                             │   │
│  │  ├─ Verify authentication                                  │   │
│  │  ├─ Extract: jobTitle, jobDescription, jobRequirements    │   │
│  │  ├─ Fetch from DB:                                        │   │
│  │  │  ├─ User profile                                        │   │
│  │  │  ├─ User skills                                         │   │
│  │  │  ├─ User projects                                       │   │
│  │  │  ├─ User experiences                                    │   │
│  │  │  └─ Resume text (if uploaded)                           │   │
│  │  └─ Call: JobWhatIfSimulator.simulateForJob()             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  job-what-if-simulator.ts                                  │   │
│  │  (JobWhatIfSimulator Service)                              │   │
│  │                                                             │   │
│  │  simulateForJob()                                          │   │
│  │  ├─ Validate inputs                                        │   │
│  │  ├─ Build AI prompt with:                                  │   │
│  │  │  ├─ Job description & requirements                      │   │
│  │  │  ├─ User profile (skills, projects, experience)        │   │
│  │  │  ├─ Instructions for analysis                           │   │
│  │  │  └─ Output format specification                         │   │
│  │  ├─ Call Gemini API if API key available                   │   │
│  │  ├─ Parse JSON response                                    │   │
│  │  ├─ Return: JobSimulationResponse                          │   │
│  │  └─ If Gemini fails: Return getMockResponse()             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Google Gemini 1.5 Flash API                               │   │
│  │                                                             │   │
│  │  Input:                                                    │   │
│  │  ├─ Job: Backend Engineer                                  │   │
│  │  ├─ Requirements: [Docker, System Design, ...]             │   │
│  │  ├─ User Skills: [Python, Git, basics]                    │   │
│  │  ├─ User Projects: [REST API, CLI app]                    │   │
│  │  ├─ User Experience: [2 years junior dev]                 │   │
│  │  └─ Query: "What skills should I add?"                    │   │
│  │                                                             │   │
│  │  Processing:                                               │   │
│  │  ├─ Analyze job requirements                               │   │
│  │  ├─ Compare to user profile                                │   │
│  │  ├─ Identify skill gaps                                    │   │
│  │  ├─ Calculate impact for each skill                        │   │
│  │  └─ Generate explanations                                  │   │
│  │                                                             │   │
│  │  Output (JSON):                                            │   │
│  │  {                                                          │   │
│  │    "skillImpacts": [                                       │   │
│  │      {                                                      │   │
│  │        "skill": "Docker",                                  │   │
│  │        "currentProbability": 45,                           │   │
│  │        "newProbability": 56,                               │   │
│  │        "percentageIncrease": 11,                           │   │
│  │        "timeToLearn": "3-4 weeks",                         │   │
│  │        "reasoning": "Docker is essential..."               │   │
│  │      }                                                      │   │
│  │    ],                                                       │   │
│  │    "roi": "High",                                          │   │
│  │    "recommendedNextSteps": [...]                           │   │
│  │  }                                                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Response returned to client                               │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ JSON Response
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BROWSER - Display Response                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  JobWhatIfSimulator Component receives response                     │
│                                                                     │
│  Renders:                                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  [Skill Card] Docker                                       │   │
│  │  ✅ Current: 45% → New: 56% (+11%)                         │   │
│  │  ⏱️  Learn in: 3-4 weeks                                    │   │
│  │  💡 Why: "Essential for containerized deployments..."      │   │
│  │                                                             │   │
│  │  [Skill Card] System Design                                │   │
│  │  ✅ Current: 45% → New: 54% (+9%)                          │   │
│  │  ⏱️  Learn in: 6-8 weeks                                    │   │
│  │  💡 Why: "Critical for senior-level roles..."              │   │
│  │                                                             │   │
│  │  🎯 Job Focus Areas: Container Orchestration, System...   │   │
│  │  ⚡ ROI Assessment: HIGH ✅                                 │   │
│  │  📝 Recommended Next Steps:                                │   │
│  │     1. Start with Docker                                   │   │
│  │     2. Build containerization project                      │   │
│  │     3. Learn Kubernetes                                    │   │
│  │                                                             │   │
│  │  [Input] "What if I learn Kubernetes?"                     │   │
│  │  [Send Button]                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User can ask follow-up → Repeat process ↻                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
START
  │
  ├─→ User clicks "Analyze My Chances"
  │
  ├─→ analysis-modal.tsx loads
  │
  ├─→ Modal displays:
  │    ├─ Shortlist Score
  │    ├─ Score Breakdown
  │    └─ Imports JobWhatIfSimulator
  │
  ├─→ JobWhatIfSimulator mounts
  │
  ├─→ useEffect: AUTO-RUN analysis
  │    │
  │    ├─→ POST /api/ai/simulate-for-job
  │    │    │
  │    │    └─→ { 
  │    │         jobTitle: "Backend Engineer",
  │    │         jobDescription: "...",
  │    │         jobRequirements: ["Docker", "..."],
  │    │         query: "What skills should I add?"
  │    │       }
  │    │
  │    ├─→ Server receives request
  │    │    │
  │    │    ├─→ Verify authentication
  │    │    ├─→ Fetch user profile from DB
  │    │    ├─→ Call JobWhatIfSimulator.simulateForJob()
  │    │    │    │
  │    │    │    ├─→ Build AI prompt
  │    │    │    ├─→ Call Gemini API
  │    │    │    │    └─→ Analyze job + profile
  │    │    │    │    └─→ Calculate impacts
  │    │    │    │    └─→ Generate explanations
  │    │    │    ├─→ Parse response
  │    │    │    └─→ Return JobSimulationResponse
  │    │    │       OR
  │    │    │       Return getMockResponse() (if fails)
  │    │    │
  │    │    └─→ Send JSON response to client
  │    │
  │    └─→ Frontend receives response
  │         │
  │         └─→ Render skill cards with impacts
  │
  ├─→ USER INTERACTION LOOP:
  │    │
  │    ├─→ User types follow-up question
  │    │    │
  │    │    └─→ POST /api/ai/simulate-for-job
  │    │         (with new query)
  │    │         │
  │    │         └─→ Same process, different question
  │    │
  │    └─→ Response displayed in chat
  │
  └─→ User closes modal
     │
     └─→ END
```

---

## 📦 Component Structure

```
analysis-modal.tsx
├── Imports
│   ├── Dialog, ScrollArea, Button (UI)
│   ├── motion, AnimatePresence (animations)
│   ├── JobWhatIfSimulator (NEW!)
│   └── useProfile hook
│
├── AnalysisModal Component
│   ├── State
│   │   ├── stage: "analyzing" | "complete"
│   │   └── profile: User profile
│   │
│   ├── Effects
│   │   └── Set stage to "complete" after 2.5s
│   │
│   ├── Render
│   │   ├── Dialog wrapper
│   │   ├── Stage 1: "Analyzing" spinner
│   │   └── Stage 2: "Complete" content
│   │       ├── Header (job info)
│   │       ├── ScrollArea with content
│   │       │   ├── Shortlist Score card
│   │       │   ├── Score Breakdown (4 cards)
│   │       │   ├── JobWhatIfSimulator (NEW!)
│   │       │   │   └── Automatically loaded
│   │       │   │   └── Shows skill recommendations
│   │       │   │   └── Interactive chat
│   │       │   └── Recommendations section
│   │       └── Footer (Close, Apply Now buttons)
│   │
│   └── Card sub-component (for score display)
```

---

## 🔗 Integration Points

```
Browser
   │
   ├─→ analysis-modal.tsx
   │   │
   │   └─→ Renders at full screen when job clicked
   │       │
   │       ├─→ Score display section
   │       │
   │       ├─→ NEW: JobWhatIfSimulator section
   │       │   │
   │       │   └─→ JobWhatIfSimulator.tsx
   │       │       │
   │       │       ├─→ Loads useProfile hook
   │       │       ├─→ Auto-calls API on mount
   │       │       └─→ Manages chat history
   │       │           │
   │       │           └─→ API: POST /api/ai/simulate-for-job
   │       │               │
   │       │               ├─→ routes.ts endpoint
   │       │               ├─→ Fetches user data
   │       │               ├─→ Calls service
   │       │               │
   │       │               └─→ JobWhatIfSimulator service
   │       │                   │
   │       │                   ├─→ Builds prompt
   │       │                   ├─→ Calls Gemini API
   │       │                   └─→ Returns analysis
   │       │
   │       └─→ Recommendations section
   │
   └─→ Other pages (unchanged)
```

---

## 🎯 Request/Response Flow

```
REQUEST from Frontend:
┌────────────────────────────────────────┐
│ POST /api/ai/simulate-for-job          │
├────────────────────────────────────────┤
│ Headers:                               │
│   Authorization: Bearer [token]        │
│   Content-Type: application/json       │
│                                        │
│ Body:                                  │
│ {                                      │
│   "jobTitle": "Backend Engineer",      │
│   "jobDescription": "Acme Corp is...",│
│   "jobRequirements": [                 │
│     "Docker",                          │
│     "System Design",                   │
│     "Node.js"                          │
│   ],                                   │
│   "query": "What skills...?" // opt   │
│ }                                      │
└────────────────────────────────────────┘
                │
                ▼
RESPONSE from Backend:
┌────────────────────────────────────────┐
│ 200 OK                                 │
├────────────────────────────────────────┤
│ {                                      │
│   "whatYouSimulate": "Adding...",     │
│   "skillImpacts": [                    │
│     {                                  │
│       "skill": "Docker",               │
│       "currentProbability": 45,        │
│       "newProbability": 56,            │
│       "percentageIncrease": 11,        │
│       "timeToLearn": "3-4 weeks",      │
│       "reasoning": "..."               │
│     },                                 │
│     {                                  │
│       "skill": "System Design",        │
│       "currentProbability": 45,        │
│       "newProbability": 54,            │
│       "percentageIncrease": 9,         │
│       "timeToLearn": "6-8 weeks",      │
│       "reasoning": "..."               │
│     }                                  │
│   ],                                   │
│   "overallExplanation": "...",        │
│   "roi": "High",                       │
│   "recommendedNextSteps": [            │
│     "Start with Docker",               │
│     "Build a project",                 │
│     "Learn Kubernetes"                 │
│   ],                                   │
│   "jobFocusAreas": [                   │
│     "Container Orchestration",         │
│     "System Architecture"               │
│   ]                                    │
│ }                                      │
└────────────────────────────────────────┘
```

---

## 📱 User Interaction Timeline

```
TIME    USER ACTION              SYSTEM RESPONSE              DISPLAY
────────────────────────────────────────────────────────────────────
0s      Click job card           Open modal
        
1s                               Show spinner               Analyzing...

2.5s                             Load main content          Shortlist Score
                                                            Score Breakdown

3s                               Auto-run simulator         [Loading...]

4-5s                             Get Gemini response        Skill Cards appear
                                                            • Docker: +11%
                                                            • System Design: +9%
                                                            Chat input ready

5s+     Type: "What if X?"       Send to API               [Processing...]

6-7s                             Get response              New analysis appears
                                                            Chat history updated

7s+     Can ask more questions   Same process             Adds to chat history
        or close modal           Repeat loop              or closes modal

```

---

## 🛡️ Error Handling Flow

```
Try to call Gemini API
    │
    ├─ Success: Parse & return response
    │
    └─ Failure:
        │
        ├─ Log error
        ├─ Check API key exists
        ├─ Call getMockResponse()
        │   │
        │   ├─ If "Backend" job:
        │   │   └─ Return Docker + System Design skills
        │   │
        │   ├─ If "Frontend" job:
        │   │   └─ Return React + TypeScript skills
        │   │
        │   ├─ If "Data" job:
        │   │   └─ Return SQL + ML skills
        │   │
        │   └─ Else: Generic skills
        │
        └─ Return mock data to user
```

---

## 🔐 Security Flow

```
Request arrives
    │
    ├─ Check authentication
    │   ├─ Valid token? → Continue
    │   └─ Invalid? → Return 401
    │
    ├─ Validate request body
    │   ├─ Has jobTitle? → Continue
    │   └─ Missing? → Return 400
    │
    ├─ Fetch user profile
    │   ├─ User exists? → Continue
    │   └─ Doesn't exist? → Return 404
    │
    ├─ Sanitize inputs
    │   └─ No SQL injection, XSS, etc.
    │
    └─ Process and return result
```

---

This visual guide shows how all components work together to provide a seamless, robust user experience!
