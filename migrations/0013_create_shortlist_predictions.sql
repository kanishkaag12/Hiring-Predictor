-- Migration: Create shortlist_predictions table
-- Purpose: Store ML-generated shortlist probability predictions for analytics and history

CREATE TABLE IF NOT EXISTS shortlist_predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  
  -- Prediction scores
  shortlist_probability INT NOT NULL,  -- 0-100
  candidate_strength INT NOT NULL,     -- 0-100 (RandomForest)
  job_match_score INT NOT NULL,        -- 0-100 (SBERT similarity)
  
  -- Skills analysis
  matched_skills TEXT,                 -- JSON array
  missing_skills TEXT,                 -- JSON array
  weak_skills TEXT,                    -- JSON array
  improvements TEXT,                   -- JSON array of improvement suggestions
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY user_job_unique (user_id, job_id)
);

-- Create index for fast lookup
CREATE INDEX idx_shortlist_user_created ON shortlist_predictions(user_id, created_at DESC);
CREATE INDEX idx_shortlist_job ON shortlist_predictions(job_id);
