# AI Alignment Insights - Quick Reference

## What Was Built

Users now see detailed AI alignment feedback for their selected career interests on the dashboard, showing:
- **Alignment Status:** Strong Fit / Growing Fit / Early Stage
- **Matched Skills:** What they have (from resume)
- **Growth Areas:** What they need to learn
- **Constructive Guidance:** How to improve

## Key Methods

### `analyzeRoleAlignment(roleName, resumeInput)`
Analyzes how well user's skills align with a specific role.

**Returns:**
```typescript
{
  roleTitle: string;
  alignmentStatus: 'Strong Fit' | 'Growing Fit' | 'Early Stage';
  confidence: 'high' | 'medium' | 'low';
  probability: number;        // 0-1
  matchedSkills: string[];    // Top skills matched
  matchedKeywords: string[];  // Relevant keywords detected
  growthAreas: string[];      // Skills/areas to develop
  explanation: string;        // Why this alignment score
  constructiveGuidance: string; // How to improve
}
```

### `generateConstructiveGuidance(status, matchedSkills, growthAreas, roleTitle, isStudent)`
Creates motivating guidance based on alignment level.

**Tone Rules:**
- Strong Fit (70%+): "Excellent alignment! Deepen expertise."
- Growing Fit (45-70%): "On the right track! Focus on X to strengthen."
- Early Stage (<45%): "Great goal! Worth exploring as you build expertise."

## Integration Points

### Backend: server/routes.ts (lines 640-693)
```typescript
// For each user-selected role, call:
const analysis = predictor.analyzeRoleAlignment(roleName, {
  skills: resumeSkills,
  userLevel: user.userType,
  resumeQualityScore: user.resumeCompletenessScore / 100,
  projectsCount: projects.length,
  // ... other context
});

// Include in response as enriched ML predictions
mlRolePredictions.userSelectedRoles = [
  {
    roleTitle: roleName,
    isUserSelected: true,
    aiAlignment: analysis
  }
];
```

### Frontend: client/src/pages/dashboard.tsx (lines 330-460)
```typescript
// Display "Your Career Interests" section
const aiAlignment = data.mlRolePredictions?.userSelectedRoles?.find(
  r => r.roleTitle === roleName
)?.aiAlignment;

// Show:
// - Alignment Status badge (color-coded)
// - Your Strengths (matched skills with ✓)
// - Growth Areas (with → indicators)
// - AI Guidance (constructive text box)
```

## Alignment Scoring Logic

**Raw Similarity → Calibrated Score → Status**

For students/early-career:
```
Raw Score < 0.15 → 20-40% (Below threshold)
0.15-1.0 → normalized to 40-90% (Achievable range)
+ Quality bonus if strong resume → up to 85%
```

For professionals:
```
Raw Score normalized to 0-100%
+ Quality bonus if 8+ skills and good resume
```

**Confidence Bands:**
- `high`: 65%+
- `medium`: 40-65%
- `low`: <40%

## UI Components

### Alignment Status Badge
```typescript
// Color mapping:
- Strong Fit (70%+): bg-emerald-500/20 text-emerald-700
- Growing Fit (45-70%): bg-amber-500/20 text-amber-700  
- Early Stage (<45%): bg-slate-500/20 text-slate-700
```

### Matched Skills Badges
```typescript
// Green badges with ✓ prefix:
"✓ Python" (green-500/15 background)
```

### Growth Areas Display
```typescript
// Arrow indicators:
"→ System Design" (amber-500 arrow)
```

## Data Flow

```
User selects role "Software Engineer"
         ↓
Resume uploaded with skills parsed
         ↓
GET /api/dashboard called
         ↓
For each userInterestRole:
  - Call analyzeRoleAlignment()
  - Get: status, skills, gaps, guidance
         ↓
Response includes enriched:
  mlRolePredictions.userSelectedRoles[]
         ↓
Frontend renders:
  - "Your Career Interests" section
  - Each role with status + insights
         ↓
User sees:
  - "Growing Fit" badge
  - "Your Strengths: Python, Git, DSA"
  - "Growth Areas: System Design, Debugging"
  - "Guidance: You're on track! Focus on..."
```

## Common Modifications

### Adjusting Alignment Thresholds
**File:** `server/services/ml/role-predictor.service.ts` line 512-520

```typescript
if (displayPercentage >= 70) {
  alignmentStatus = 'Strong Fit';
} else if (displayPercentage >= 45 || (isStudent && matchedSkills.length >= 2)) {
  alignmentStatus = 'Growing Fit';
} else {
  alignmentStatus = 'Early Stage';
}
```

### Changing Growth Area Logic
**File:** `server/services/ml/role-predictor.service.ts` line 527-530

```typescript
// Currently: top missing skills + keywords
const topGrowthAreas = missingSkills.length > 0
  ? missingSkills.slice(0, 3)
  : missingKeywords.slice(0, 3);
```

### Updating Guidance Language
**File:** `server/services/ml/role-predictor.service.ts` line 536-560

See `generateConstructiveGuidance()` method for all status messages.

## Testing

### Test Case 1: Strong Fit
- User: Senior + 5 skills matching role
- Expected: Strong Fit (70%+), No growth areas, Encouraging message

### Test Case 2: Growing Fit
- User: Student + 2 relevant skills + projects
- Expected: Growing Fit (50-70%), 2-3 growth areas, "On right track" message

### Test Case 3: Early Stage
- User: Student + 0 relevant skills for role
- Expected: Early Stage (<45%), Multiple growth areas, "Great goal" message

### Test Case 4: Unknown Role
- User selects custom role not in corpus
- Expected: Analyzed via semantic similarity, graceful fallback message

## Performance Considerations

- `analyzeRoleAlignment()` is called once per user-selected role
- Typical user has 2-3 selected roles → minimal overhead
- Uses same embedding service as system recommendations
- Caching: API response is cached until resume/profile changes

## Constraints & Assumptions

- Respects user intent (analyzes ALL selected roles, even low-probability)
- No percentages displayed for user-selected roles (status + confidence only)
- Growth areas sourced from missing skills + keywords
- Does NOT override or hide user-selected roles
- Separate from system-recommended roles (different section)

## Related Files

- `server/services/ml/embedding.service.ts` - Semantic similarity calculation
- `server/services/ml/job-role-corpus.ts` - Role definitions and skills
- `client/src/components/ui/Card.tsx` - Card component for layout
- `client/src/components/ui/Badge.tsx` - Badge for status/skills

