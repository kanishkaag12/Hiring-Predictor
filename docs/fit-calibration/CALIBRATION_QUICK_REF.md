# FIT SCORE CALIBRATION - QUICK REFERENCE

## What It Does
Normalizes fit percentages based on user career stage so strong entry-level resumes show motivating scores instead of harsh lows.

## Example
```
Strong ML student with good skills
Before: ML Engineer role = 28% ❌ (discouraging)
After:  ML Engineer role = 65% ✅ (encouraging & appropriate)
```

## Key Methods

### `calibrateFitScores(predictions, input)`
**Purpose**: Normalizes raw semantic scores based on user context
**Input**: Array of predictions + user context (level, quality, experience)
**Output**: Predictions with calibrated probability & explanation
**Algorithm**:
- Entry-level benchmark (0.15 student, 0.20 fresher, 0.25 pro)
- Normalize to 40-90% for students, accurate for pros
- Add quality bonuses (+10% for strong resumes)
- Set confidence bands (high≥65%, medium 40-65%, low<40%)

### `generateCalibratedExplanation(prediction, score, input, percentage)`
**Purpose**: Creates motivating, context-aware explanation
**Examples**:
- 70%+: "Strong {%}% fit. Your skills align well."
- 45-70%: "Good {%}% match. Achievable with focused development."
- <45%: "Potential {%}% fit. Worth exploring."

## User Context Fields
```typescript
{
  userLevel: 'student'|'fresher'|'junior'|'mid'|'senior'
  resumeQualityScore: 0-1  // Completeness/quality (0.5 default)
  experienceMonths: number // 0-12 months = early-career boost
  projectsCount: number    // For quality bonus calculation
  educationDegree: string  // Bachelor, Master, etc.
}
```

## Integration Points

### Adding User Context (in routes)
```typescript
mlRolePredictions = predictor.predictRoles({
  skills: resumeSkills,
  // ... other fields ...
  userLevel: user.userType || 'fresher',
  resumeQualityScore: user.resumeCompletenessScore / 100,
  projectsCount: projects.length,
  educationDegree: user.resumeEducation?.[0]?.degree
});
```

### Reading Results (in dashboard)
```typescript
// Calibrated score (0-1, display as percentage)
const fitPercentage = Math.round(prediction.probability * 100);

// Confidence level
const confidence = prediction.confidence; // 'high'|'medium'|'low'

// Context-aware explanation
const explanation = prediction.explanation;

// Internal raw similarity (for analytics/debugging)
const rawSimilarity = prediction.rawSimilarity;
```

## Score Ranges by User Type

### Students (0 months experience)
- Benchmark: 0.15 (very forgiving)
- Entry roles: **60-75%** (strong fit)
- Growth roles: **45-60%** (achievable)
- Advanced roles: **30-45%** (potential)

### Freshers (1-12 months)
- Benchmark: 0.20 (forgiving)
- Entry roles: **55-70%** (good fit)
- Growth roles: **40-55%** (achievable)
- Advanced roles: **25-40%** (exploratory)

### Professionals (>12 months)
- Benchmark: 0.25 (standard)
- Matched roles: **80-95%** (excellent)
- Related roles: **70-85%** (very good)
- New domains: **50-65%** (growth)

## Common Use Cases

### Testing Score Calibration
```typescript
const result = predictor.predictRoles({
  skills: ['Python', 'ML', 'TensorFlow'],
  userLevel: 'student',
  resumeQualityScore: 0.75,
  experienceMonths: 3,
  projectsCount: 2
});

// ML Engineer should show ~65-75% (not 28%)
const mlScore = result.topRoles.find(r => r.roleTitle === 'Machine Learning Engineer');
console.assert(mlScore?.probability >= 0.65, 'Student ML fit should be 65%+');
```

### Quality Bonus Conditions
```typescript
// +10% bonus applies when ALL conditions met:
resumeQualityScore > 0.6 &&  // Good quality
skillCount >= 5 &&           // Sufficient skills  
projectsCount > 0            // Has projects
```

### Debugging Low Scores
1. Check `userLevel` - is it appropriate?
2. Check `resumeQualityScore` - too low?
3. Check skill match - any matched skills?
4. Look at `rawSimilarity` - is it genuinely low?
5. Verify benchmark - is benchmark appropriate for level?

## Model Versions
- **1.0.0-semantic**: Original (no calibration)
- **1.0.0-calibrated**: Current (with context-aware calibration)

## Testing Checklist
- [ ] Student with ML skills → ML Engineer 65%+
- [ ] Professional → 85%+ for matched roles
- [ ] Fresher → 40-55% for achievable paths
- [ ] Explanations are motivating
- [ ] Confidence bands match percentages
- [ ] Quality bonus applied correctly

## Troubleshooting

**Q: Scores still seem low**
A: Check if calibration is called. Verify userLevel is set correctly.

**Q: Professional scores artificially boosted**
A: This shouldn't happen - pros use raw similarity. Check quality bonus conditions.

**Q: Explanations not context-aware**
A: Ensure generateCalibratedExplanation() is called instead of old generateExplanation().

**Q: TypeScript errors**
A: Run `npx tsc server/services/ml/role-predictor.service.ts --noEmit` to check.

## File Locations
- Core logic: `server/services/ml/role-predictor.service.ts`
- Route integration: `server/routes.ts` line 556-576
- Documentation: `FIT_SCORE_CALIBRATION.md`
- Full reference: `IMPLEMENTATION_COMPLETE_CALIBRATION.md`
