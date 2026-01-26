import json
import sys
from pathlib import Path
import joblib
import numpy as np

"""
Lightweight inference runner for the shortlist model.

Usage (stdin payload):
{
  "features": [f1, f2, f3, f4, f5, f6],
  "feature_names": ["skill_match_score", ...]
}

Returns JSON with:
- shortlist_probability
- model_type
- contributions: [{"feature": name, "impact": value}]
"""

MODEL_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("models/shortlist_model.pkl")

if not MODEL_PATH.exists():
    print(json.dumps({"error": f"Model file not found: {MODEL_PATH}"}), file=sys.stderr)
    sys.exit(2)

try:
    package = joblib.load(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {e}"}), file=sys.stderr)
    sys.exit(3)

model = package.get("model", package)
feature_names = package.get("feature_names")
model_type = package.get("metadata", {}).get("model_type", type(model).__name__)

payload = json.load(sys.stdin)
features = payload.get("features")
input_feature_names = payload.get("feature_names")

if features is None or input_feature_names is None:
    print(json.dumps({"error": "Missing features or feature_names in payload"}), file=sys.stderr)
    sys.exit(4)

features = np.array(features, dtype=float)
if features.ndim != 1:
    print(json.dumps({"error": "features must be a 1-D array"}), file=sys.stderr)
    sys.exit(5)

# Predict probability
try:
    prob = float(model.predict_proba(features.reshape(1, -1))[0, 1])
except Exception as e:
    print(json.dumps({"error": f"Inference failed: {e}"}), file=sys.stderr)
    sys.exit(6)

contributions = []
try:
    if hasattr(model, "coef_"):
        coefs = model.coef_[0]
        for name, val, coef in zip(input_feature_names, features, coefs):
            contributions.append({"feature": name, "impact": float(val * coef)})
    elif hasattr(model, "feature_importances_"):
        for name, imp in zip(input_feature_names, model.feature_importances_):
            contributions.append({"feature": name, "impact": float(imp)})
except Exception:
    # If contribution computation fails, fall back silently
    contributions = []

# Sort contributions by absolute impact descending
contributions = sorted(contributions, key=lambda x: abs(x.get("impact", 0.0)), reverse=True)

print(json.dumps({
    "shortlist_probability": prob,
    "model_type": model_type,
    "contributions": contributions,
}))
