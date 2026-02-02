SHORTLIST PROBABILITY - FRONTEND INTEGRATION GUIDE
===================================================

## Quick Start

### Installation

No new dependencies needed. Use your existing HTTP client (fetch, axios, etc.)

### Basic Usage

#### 1. Single Job Prediction

```typescript
// Get prediction for a single job
async function predictShortlist(jobId: string) {
  const response = await fetch('/api/shortlist/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId,
      userId: getCurrentUserId() // From auth context
    })
  });

  const { prediction } = await response.json();
  
  return {
    probability: prediction.shortlistProbability, // 0-100
    candidateStrength: prediction.candidateStrength,
    jobMatchScore: prediction.jobMatchScore,
    matchedSkills: prediction.matchedSkills,
    missingSkills: prediction.missingSkills,
    weakSkills: prediction.weakSkills
  };
}
```

#### 2. Display on Job Card

```jsx
import { ShortlistPrediction } from '@shared/shortlist-types';

function JobCard({ job, prediction }: { job: Job; prediction: ShortlistPrediction }) {
  const { shortlistProbability } = prediction;
  
  let probabilityLabel = 'Low Chance';
  let probabilityColor = 'text-red-500';
  
  if (shortlistProbability >= 75) {
    probabilityLabel = 'Excellent Fit';
    probabilityColor = 'text-green-500';
  } else if (shortlistProbability >= 50) {
    probabilityLabel = 'Good Fit';
    probabilityColor = 'text-blue-500';
  } else if (shortlistProbability >= 30) {
    probabilityLabel = 'Fair Fit';
    probabilityColor = 'text-yellow-500';
  }

  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>{job.company}</p>
      
      {/* Shortlist Probability Badge */}
      <div className="probability-badge">
        <span className={probabilityColor}>
          {shortlistProbability}% Chance
        </span>
        <span className="text-sm text-gray-500">{probabilityLabel}</span>
      </div>

      {/* Skills Breakdown */}
      <div className="skills-breakdown">
        <div className="matched-skills">
          <strong>Matched:</strong> {prediction.matchedSkills.join(', ')}
        </div>
        
        {prediction.missingSkills.length > 0 && (
          <div className="missing-skills">
            <strong>Missing:</strong> {prediction.missingSkills.join(', ')}
          </div>
        )}
        
        {prediction.weakSkills.length > 0 && (
          <div className="weak-skills">
            <strong>Need to Improve:</strong> {prediction.weakSkills.join(', ')}
          </div>
        )}
      </div>

      <button onClick={() => openWhatIfSimulator(job.id)}>
        What-If Analysis →
      </button>
    </div>
  );
}
```

#### 3. Batch Predictions

```typescript
// Get predictions for multiple jobs at once
async function getPredictionsForJobs(jobIds: string[]) {
  const response = await fetch('/api/shortlist/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      jobIds // Array of up to 100 job IDs
    })
  });

  const { predictions } = await response.json();
  return predictions;
}

// Usage in a jobs listing page
function JobsListingPage({ jobs }: { jobs: Job[] }) {
  const [predictions, setPredictions] = useState<ShortlistPrediction[]>([]);
  
  useEffect(() => {
    const jobIds = jobs.map(j => j.id);
    getPredictionsForJobs(jobIds).then(setPredictions);
  }, [jobs]);

  // Sort jobs by shortlist probability (highest first)
  const sortedJobs = jobs.sort((a, b) => {
    const predA = predictions.find(p => p.jobId === a.id)?.shortlistProbability ?? 0;
    const predB = predictions.find(p => p.jobId === b.id)?.shortlistProbability ?? 0;
    return predB - predA;
  });

  return (
    <div>
      {sortedJobs.map(job => {
        const prediction = predictions.find(p => p.jobId === job.id);
        return <JobCard key={job.id} job={job} prediction={prediction!} />;
      })}
    </div>
  );
}
```

## Advanced Features

### What-If Simulator

Allow users to see how adding skills would improve their chances:

```typescript
async function runWhatIfScenario(
  jobId: string,
  scenario: {
    addedSkills?: string[];
    removedSkills?: string[];
    modifiedSkills?: Array<{ name: string; level: string }>;
  }
) {
  const response = await fetch('/api/shortlist/what-if', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      jobId,
      scenario
    })
  });

  const { result } = await response.json();
  
  return {
    baseline: result.baselineShortlistProbability,
    projected: result.projectedShortlistProbability,
    delta: result.probabilityDelta, // Change in percentage points
    recommendation: getDeltaMessage(result.probabilityDelta)
  };
}

function WhatIfSimulator({ jobId }: { jobId: string }) {
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  async function handleApplyScenario() {
    const result = await runWhatIfScenario(jobId, {
      addedSkills
    });
    setResult(result);
  }

  return (
    <dialog>
      <h2>What If You Learned These Skills?</h2>
      
      <SkillSelector
        onSelect={(skill) => setAddedSkills([...addedSkills, skill])}
      />

      <button onClick={handleApplyScenario}>Calculate Impact</button>

      {result && (
        <div className="results">
          <div className="probability-comparison">
            <div className="baseline">
              <span className="label">Current Probability:</span>
              <span className="value">{result.baseline}%</span>
            </div>
            <div className="arrow">→</div>
            <div className="projected">
              <span className="label">With New Skills:</span>
              <span className="value">{result.projected}%</span>
            </div>
          </div>

          <div className="delta">
            <span className={result.delta > 0 ? 'positive' : 'negative'}>
              {result.delta > 0 ? '+' : ''}{result.delta}%
            </span>
            <p>{result.recommendation}</p>
          </div>

          <button className="learn-btn">
            Find Learning Resources →
          </button>
        </div>
      )}
    </dialog>
  );
}
```

### Get Recommendations

Show users what skills would help them most:

```typescript
async function getSkillRecommendations(jobId: string) {
  const response = await fetch(
    `/api/shortlist/recommendations/${jobId}?userId=${getCurrentUserId()}`
  );
  
  const { topSkillsToLearn, skillsToImprove, estimatedImpact } = 
    await response.json();
  
  return {
    topSkillsToLearn,      // High-impact skills to learn
    skillsToImprove,       // Existing skills to level up
    estimatedImpact        // % improvement if you learn top skill
  };
}

function RecommendationsCard({ jobId }: { jobId: string }) {
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    getSkillRecommendations(jobId).then(setRecommendations);
  }, [jobId]);

  if (!recommendations) return <Loading />;

  return (
    <div className="recommendations-card">
      <h3>How to Improve Your Chances</h3>
      
      <section>
        <h4>Top Skills to Learn</h4>
        <ul>
          {recommendations.topSkillsToLearn.map(skill => (
            <li key={skill}>
              <strong>{skill}</strong>
              <span className="impact">
                +{recommendations.estimatedImpact}%
              </span>
            </li>
          ))}
        </ul>
        <p className="subtext">
          Learn these high-impact skills to significantly improve your chances
        </p>
      </section>

      {recommendations.skillsToImprove.length > 0 && (
        <section>
          <h4>Skills to Improve</h4>
          <ul>
            {recommendations.skillsToImprove.map(skill => (
              <li key={skill}>
                <strong>{skill}</strong>
                <span className="status">Need to level up</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

### Optimal Skills Path

Find the best combination of skills to reach a target probability:

```typescript
async function getOptimalSkillsPath(
  jobId: string,
  targetProbability: number = 80
) {
  const response = await fetch(
    `/api/shortlist/optimal-skills/${jobId}?` +
    `userId=${getCurrentUserId()}&` +
    `targetProbability=${targetProbability}`
  );

  const { requiredSkills, requiredLevel, estimatedTimeMonths } = 
    await response.json();
  
  return {
    skills: requiredSkills,
    targetLevel: requiredLevel,
    estimatedMonths: estimatedTimeMonths
  };
}

function LearningPathWidget({ jobId }: { jobId: string }) {
  const [path, setPath] = useState(null);

  useEffect(() => {
    getOptimalSkillsPath(jobId).then(setPath);
  }, [jobId]);

  if (!path) return <Loading />;

  return (
    <div className="learning-path">
      <h3>Your Learning Path to 80% Chance</h3>
      
      <div className="timeline">
        {path.skills.map((skill, idx) => (
          <div key={skill} className="step">
            <div className="step-number">{idx + 1}</div>
            <div className="step-content">
              <h4>{skill}</h4>
              <p>Target Level: <strong>{path.targetLevel}</strong></p>
              <p className="timeline-estimate">
                Est. {Math.ceil(path.estimatedMonths / path.skills.length)} months per skill
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="total-estimate">
        <p>
          <strong>Total Time:</strong> ~{path.estimatedMonths} months
        </p>
        <button className="cta">
          Start Learning Path →
        </button>
      </div>
    </div>
  );
}
```

## State Management

### React Query Example

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Hook for single prediction
function useShortlistPrediction(jobId: string, userId: string) {
  return useQuery({
    queryKey: ['shortlist', jobId, userId],
    queryFn: async () => {
      const response = await fetch('/api/shortlist/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, userId })
      });
      const { prediction } = await response.json();
      return prediction;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for batch predictions
function useShortlistBatch(jobIds: string[], userId: string) {
  return useQuery({
    queryKey: ['shortlist-batch', jobIds, userId],
    queryFn: async () => {
      const response = await fetch('/api/shortlist/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, jobIds })
      });
      const { predictions } = await response.json();
      return predictions;
    },
    enabled: jobIds.length > 0,
  });
}

// Hook for What-If simulation
function useWhatIfSimulation(jobId: string, userId: string) {
  return useMutation({
    mutationFn: async (scenario) => {
      const response = await fetch('/api/shortlist/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, userId, scenario })
      });
      const { result } = await response.json();
      return result;
    }
  });
}

// Usage in component
function JobDetail({ jobId }: { jobId: string }) {
  const { data: prediction, isLoading } = useShortlistPrediction(
    jobId,
    getCurrentUserId()
  );
  const whatIfMutation = useWhatIfSimulation(jobId, getCurrentUserId());

  if (isLoading) return <Loading />;

  return (
    <div>
      <ShortlistProbabilityBadge prediction={prediction} />
      
      <button
        onClick={() => whatIfMutation.mutate({
          addedSkills: ['Kubernetes']
        })}
      >
        What-If Analysis
      </button>

      {whatIfMutation.data && (
        <WhatIfResults result={whatIfMutation.data} />
      )}
    </div>
  );
}
```

## CSS Styling

```css
/* Probability Badge */
.probability-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

.probability-badge.excellent {
  color: #10b981; /* Green */
}

.probability-badge.good {
  color: #3b82f6; /* Blue */
}

.probability-badge.fair {
  color: #f59e0b; /* Amber */
}

.probability-badge.low {
  color: #ef4444; /* Red */
}

/* Skills Breakdown */
.skills-breakdown {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.skills-breakdown strong {
  display: inline-block;
  min-width: 70px;
  color: #374151;
}

.matched-skills {
  color: #059669;
}

.missing-skills {
  color: #dc2626;
}

.weak-skills {
  color: #d97706;
}

/* Recommendations Card */
.recommendations-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.recommendations-card h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1f2937;
}

.recommendations-card section {
  margin-bottom: 16px;
}

.recommendations-card h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recommendations-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations-card li {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.impact {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
```

## Performance Tips

1. **Batch Predictions**: Use `/api/shortlist/batch` instead of individual predictions for multiple jobs
2. **Caching**: Store predictions for 5-10 minutes to avoid redundant API calls
3. **Lazy Loading**: Only fetch predictions when user scrolls to job card
4. **Debouncing**: Debounce What-If scenario changes to avoid excessive API calls
5. **Pagination**: For large job lists, paginate and fetch predictions per page

## Error Handling

```typescript
async function predictShortlistWithErrorHandling(jobId: string) {
  try {
    const response = await fetch('/api/shortlist/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        userId: getCurrentUserId()
      })
    });

    if (!response.ok) {
      if (response.status === 503) {
        // ML service not ready - show friendly message
        return {
          error: 'Predictions temporarily unavailable. Please try again later.',
          fallback: true
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const { prediction } = await response.json();
    return prediction;
  } catch (error) {
    console.error('Shortlist prediction failed:', error);
    // Show toast notification to user
    showErrorToast('Could not generate shortlist prediction');
    return null;
  }
}
```

## Next Steps

1. Integrate prediction badges into job listings
2. Add What-If simulator modal to job details page
3. Create skill recommendation widget on profile page
4. Build learning path visualizer
5. Add analytics tracking for prediction accuracy
