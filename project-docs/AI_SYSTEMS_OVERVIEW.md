# 🤖 AI Systems in HirePulse - Complete Overview

## Summary
HirePulse uses **3 major AI/ML systems** working together to provide career intelligence:

1. **Intelligence Service** - Role readiness calculation
2. **AI Service** - Gemini-powered profile analysis
3. **Prediction Model** - ML-based job match prediction

---

## 1. Intelligence Service 🎯
**File**: [server/services/intelligence.service.ts](server/services/intelligence.service.ts)

### Purpose
Calculates how "ready" a user is for specific job roles by analyzing skills, projects, and experience.

### Key Features
- **Role-Based Scoring**: Each role has different requirements
- **Context-Aware Weighting**: Different formulas for Students vs. Professionals vs. Career Switchers
- **Gap Detection**: Identifies what's missing (skills, projects, experience)
- **Strength Detection**: Highlights user's strong areas

### Scoring Algorithm
```
Final Score = (Skill Match × weight) + (Project Depth × weight) + 
              (Experience × weight) + (Resume Quality × weight)
```

**Weights vary by user type:**
- **Students/Freshers**: Skills 45%, Projects 30%, Experience 5%, Resume 20%
- **Working Professionals**: Skills 30%, Projects 10%, Experience 40%, Resume 20%
- **Career Switchers**: Skills 40%, Projects 40%, Experience 10%, Resume 10%

### Where It's Used
| Location | Usage |
|----------|-------|
| **Backend**: `server/routes.ts:282` | Called in `/api/dashboard` endpoint |
| **Backend**: `server/routes.ts:359` | Called in `/api/what-if-simulator` endpoint |
| **Frontend**: `client/src/pages/dashboard.tsx` | Displays "Target Role Readiness" section |
| **Frontend**: `client/src/components/dashboard/RoleReadinessOverview.tsx` | Renders role scores |
| **Frontend**: `client/src/components/dashboard/WhatIfSimulator.tsx` | Shows impact of improvements |

### Output Example
```json
{
  "roleName": "Frontend Engineer",
  "score": 78,
  "status": "Strong",
  "gaps": ["Need 2+ portfolio projects"],
  "strengths": ["Strong React skills", "TypeScript proficiency"]
}
```

---

## 2. AI Service (Gemini-Powered) 🧠
**File**: [server/services/ai.service.ts](server/services/ai.service.ts)

### Purpose
Uses Google's Gemini API to generate human-readable career insights and recommendations.

### Key Features
- **Profile Analysis**: Analyzes user's overall profile (resume, skills, projects, experience)
- **Role Readiness Explanation**: Provides conversational explanation of role-specific readiness scores
- **Gemini Model**: Uses `gemini-1.5-flash` for cost-effective, fast analysis
- **Fallback to Mock**: Uses mock data if API key is missing or API fails

### Methods

#### 1. **analyzeProfile(user, skills, projects, experiences)**
Generates a complete profile analysis with:
- Professional summary
- Key strengths (3 items)
- Areas for improvement (3 items)
- Career recommendations (3 actionable steps)

**Where It's Used:**
- **Backend**: `server/routes.ts:378-379` - `/api/profile/ai-insights` endpoint
- **Frontend**: `client/src/pages/profile.tsx:63` - Profile page fetches and displays insights

#### 2. **explainRoleReadiness(roleResult, user, marketDemand, competitionLevel, peerInsights)**
Provides explanation for why a user has a specific readiness score for a role.

**Where It's Used:**
- **Backend**: `server/routes.ts:286` - `/api/dashboard` endpoint
- **Frontend**: `client/src/components/dashboard/RoleReadinessOverview.tsx` - Shows explanations on hover

### API Integration
```typescript
// Using Google Gemini API
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent(prompt);
```

**Environment Variable Required**: `GEMINI_API_KEY`

### Output Example
```json
{
  "summary": "You have strong full-stack foundations with good frontend depth. Consider adding more backend experience.",
  "strengths": ["React/TypeScript expertise", "Project portfolio", "Quick learner"],
  "improvements": ["Backend depth needed", "Cloud infrastructure gaps", "System design experience"],
  "recommendations": ["Build a backend project", "Learn Docker/K8s", "Study system design"]
}
```

---

## 3. Prediction Model (ML-Based) 🎲
**File**: [server/ml/prediction-model.ts](server/ml/prediction-model.ts)

### Purpose
Predicts the probability of a user getting hired for a specific job using machine learning.

### Key Features
- **Logistic Regression**: Uses weighted linear combination + sigmoid activation
- **Feature Engineering**: Extracts relevant features from job and user profile
- **Apply Signal**: Generates actionable recommendation (GOOD, SOON, WAIT)
- **Explainability**: Provides reasoning and factor breakdown

### Prediction Algorithm
```
Logit = (days_since_posted × 3.5) + (skill_overlap × 4.0) + 
        (experience_match × 2.0) + (competition × 2.5) - 4.5

Probability = 1 / (1 + e^(-logit))  // Sigmoid

Apply Signal:
- GOOD: probability ≥ 70%
- SOON: probability ≥ 45%
- WAIT: probability < 45%
```

### Feature Engineering (Feature Engineering Service)
**File**: [server/ml/feature-engineering.ts](server/ml/feature-engineering.ts)

Extracts these features from job + user data:
1. **days_since_posted** (0-1): Job freshness (newer = better)
2. **skill_overlap_score** (0-1): Jaccard index of job skills vs user skills
3. **experience_match** (0 or 1): Whether user level matches job level
4. **role_competition_score** (0-1): Inverse of competition (fewer applicants = better)
5. **is_remote_match** (0 or 1): Always 1 for this remote-first platform

### Where It's Used
| Location | Usage |
|----------|-------|
| **Backend**: `server/jobs/job.analysis.ts:44` | Predicts match for each job in job list |
| **Frontend**: `client/src/pages/jobs.tsx` | Shows "Your Chances" % on each job card |
| **Frontend**: `client/src/components/probability-gauge.tsx` | Renders probability visual |
| **Frontend**: `client/src/pages/job-details.tsx` | Shows detailed prediction & explanation |

### Output Example
```json
{
  "probability": 72,
  "applySignal": "GOOD",
  "reasoning": "Job is very new. Strong skill match. Early applicant advantage.",
  "factors": {
    "Freshness": "+High",
    "Skills": "+Strong",
    "Competition": "+Low"
  }
}
```

---

## AI System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Dashboard Page          Profile Page         Jobs Page    │
│        │                      │                    │        │
│        └──────────────────────┴────────────────────┘        │
│                         │                                    │
└────────────────────────┼────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API ENDPOINTS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET /api/dashboard ────► [Intelligence Service]            │
│                           [AI Service]                       │
│                                                              │
│  GET /api/profile/ai-insights ──► [AI Service]              │
│                                                              │
│  GET /api/what-if-simulator ──► [Intelligence Service]      │
│                                                              │
│  GET /api/jobs/:id ──► [Prediction Model]                   │
│                        [Feature Engineer]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐      ┌──────────┐    ┌──────────┐
   │Intelligence  │ AI Service│   │Prediction│
   │ Service    │ (Gemini)   │   │  Model   │
   └─────────┘      └──────────┘    └──────────┘
        │                │                │
        ├─ Calculates    ├─ Analyzes     ├─ Extracts features
        │  role readiness│  profile      │  from job + user
        │               │  with LLM     │
        ├─ Detects      ├─ Explains     ├─ Runs logistic
        │  gaps         │  role scores  │  regression
        │               │               │
        └─ Generates    └─ Provides     └─ Predicts
           scores          recommendations   probability
                            & insights
```

---

## Data Flow Examples

### Example 1: User Views Dashboard
```
1. Frontend: GET /api/dashboard
2. Backend:
   a. Load user profile, skills, projects, experiences
   b. For each selected role:
      - IntelligenceService.calculateReadiness() → Score
      - AIService.explainRoleReadiness() → Text explanation
   c. Return readiness scores + explanations
3. Frontend: Render RoleReadinessOverview with scores
```

### Example 2: User Views Job Details
```
1. Frontend: GET /api/jobs/:id
2. Backend:
   a. Load job details
   b. FeatureEngineer.extract() → features from job + user
   c. PredictionModel.predict() → probability + signal
   d. Return job data + probability + explanation
3. Frontend: Display probability gauge + "GOOD/SOON/WAIT" signal
```

### Example 3: User Clicks "What If I Add Skills?"
```
1. Frontend: POST /api/what-if-simulator { action: "add_skill" }
2. Backend:
   a. Current score = IntelligenceService.calculateReadiness()
   b. Simulated score = IntelligenceService.simulateImprovement()
   c. Return score delta + impact
3. Frontend: Show before/after scores
```

---

## Configuration & Dependencies

### Environment Variables
```bash
GEMINI_API_KEY=sk-...  # Required for AI Service (Google Gemini)
```

### Node Modules Used
- `@google/generative-ai` - For Gemini API calls
- Standard TypeScript/Node.js

---

## AI Features by Page

### Landing Page
- Shows "Prediction Accuracy" metric (95% claim)
- References intelligence engine in marketing copy

### Profile Page
- **Fetch AI Insights** button → `/api/profile/ai-insights`
- Displays profile analysis (summary, strengths, improvements, recommendations)
- Affected by resume upload and skill additions

### Dashboard Page
- **Role Readiness Overview** section
  - Shows readiness score for each selected role
  - Powered by IntelligenceService
  - Includes AI-generated explanations
  
- **What-If Simulator** section
  - Shows impact of adding skills/projects
  - Uses IntelligenceService.simulateImprovement()

- **Peer Benchmarking** section
  - Shows how user compares to market
  - Uses market demand data

### Jobs Page
- **Your Chances** badge on each job card
  - Shows probability % (0-100)
  - Uses PredictionModel
  - Color-coded: Green (GOOD), Yellow (SOON), Red (WAIT)

### Job Details Page
- **Probability Gauge** - Visual display of match %
- **Apply Signal** - GOOD/SOON/WAIT recommendation
- **Factors** - Breakdown of what affects the score
  - Freshness of job posting
  - Skill match
  - Competition level
  - Experience match

---

## API Endpoints Summary

| Endpoint | Method | AI System | Purpose |
|----------|--------|-----------|---------|
| `/api/dashboard` | GET | Intelligence + AI | Role readiness + explanations |
| `/api/profile/ai-insights` | GET | AI | Full profile analysis |
| `/api/what-if-simulator` | POST | Intelligence | Score simulation |
| `/api/jobs/:id` | GET | Prediction | Job match probability |
| `/api/jobs` | GET | Prediction | All jobs with probability |

---

## Key Insights

### Strengths of Current Architecture
✅ **Modular Design**: 3 independent AI services working together
✅ **Explainability**: Every prediction includes reasoning
✅ **Graceful Degradation**: Works with mock data if API unavailable
✅ **Context-Aware**: Weights change based on user type
✅ **Real-time Calculation**: Scores recalculated immediately when profile changes

### Limitations
⚠️ **Mock User Profile**: Job prediction uses hardcoded mock profile, not actual user data
⚠️ **Limited Features**: Prediction model only uses 5 features (could be extended)
⚠️ **Fallback Data**: AI insights use fallback when API key missing (not production-ready)
⚠️ **No Training**: Models aren't trained on actual hiring data (ML model is static formula)

### Privacy & Ethics
🔒 **No Personal Data Sent**: Job analysis doesn't send actual user profile to external APIs
🔒 **Fallback System**: Works without Gemini key, ensuring no data leakage dependency
🔒 **Zero Assumptions**: Dashboard locked until explicit data provided (ethical AI principle)

---

## Future Enhancement Opportunities
1. **Real User Profile in Predictions**: Use actual user data instead of mock profile
2. **Model Training**: Train logistic regression on real hiring data for better accuracy
3. **Multi-Role Intelligence**: Track intelligence across all selected roles simultaneously
4. **Skill Recommendations**: Use AI to recommend which skills to learn next
5. **Resume Parsing**: Extract data from resume file instead of manual entry
6. **Interview Prep**: Use AI to generate interview questions based on role requirements
