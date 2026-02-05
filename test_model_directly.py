#!/usr/bin/env python3
"""
Test the RandomForest model with our new feature mapping
"""

import sys
import json
import pickle
from pathlib import Path

model_path = Path(__file__).parent / 'placement_random_forest_model.pkl'

print("[Test] Loading RandomForest model...")
with open(model_path, 'rb') as f:
    model = pickle.load(f)

print(f"[Test] Model expects {model.n_features_in_} features")

# Test with our mapped features
# Mapping: [Age, CGPA, Internships, Projects, Coding_Skills, Communication_Skills, 
#           Aptitude_Test_Score, Soft_Skills_Rating, Certifications, Backlogs,
#           Gender_Male, Degree_B.Tech, Degree_BCA, Degree_MCA, Branch_Civil, Branch_ECE, Branch_IT, Branch_ME]

test_features = [
    25.0,   # Age (estimated from experience)
    7.5,    # CGPA (75/100 = 7.5/10)
    2.0,    # Internships
    3.0,    # Projects
    8.0,    # Coding_Skills (8 skills)
    3.5,    # Communication_Skills (from skill diversity)
    65.0,   # Aptitude_Test_Score (use overallStrengthScore * 100)
    3.5,    # Soft_Skills_Rating
    1.0,    # Certifications (use high complexity projects)
    0.0,    # Backlogs
    0.5,    # Gender_Male (neutral)
    1.0,    # Degree_B.Tech
    0.0,    # Degree_BCA
    0.0,    # Degree_MCA
    0.0,    # Branch_Civil
    0.0,    # Branch_ECE
    1.0,    # Branch_IT
    0.0     # Branch_ME
]

import numpy as np

print(f"[Test] Testing with {len(test_features)} features: {test_features}")

# Reshape to (1, 18)
features_array = np.array(test_features).reshape(1, -1)
print(f"[Test] Features shape: {features_array.shape}")

try:
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(features_array)
        print(f"[Test] Probabilities: {proba}")
        prediction = proba[0][1] if len(proba[0]) > 1 else proba[0][0]
        print(f"✅ SUCCESS: Model returned prediction: {prediction:.4f}")
    else:
        pred = model.predict(features_array)
        print(f"[Test] Raw prediction: {pred}")
        print(f"✅ SUCCESS: Model returned prediction: {pred[0]:.4f}")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
