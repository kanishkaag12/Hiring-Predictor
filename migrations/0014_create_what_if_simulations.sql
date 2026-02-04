-- Migration: Create what_if_simulations table
-- Purpose: Track what-if scenarios tested by users for learning and analytics

CREATE TABLE IF NOT EXISTS what_if_simulations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  
  -- Baseline prediction (before changes)
  baseline_probability INT NOT NULL,
  baseline_candidate_strength INT NOT NULL,
  baseline_job_match INT NOT NULL,
  
  -- Projected prediction (after changes)
  projected_probability INT NOT NULL,
  projected_candidate_strength INT NOT NULL,
  projected_job_match INT NOT NULL,
  
  -- Deltas
  probability_delta INT NOT NULL,
  candidate_strength_delta INT NOT NULL,
  job_match_delta INT NOT NULL,
  
  -- Scenario details (JSON)
  scenario_added_skills TEXT,      -- JSON array
  scenario_removed_skills TEXT,    -- JSON array
  scenario_modified_skills TEXT,   -- JSON array of {name, level}
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Create indexes for queries
CREATE INDEX idx_what_if_user ON what_if_simulations(user_id, created_at DESC);
CREATE INDEX idx_what_if_job ON what_if_simulations(job_id);
