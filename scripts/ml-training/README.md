# ML Training Data Format

## CSV Structure

The training data CSV must contain the following columns:

### Features (all normalized 0-1):
- `skill_match_score`: How well user skills match role requirements
- `experience_gap_score`: Gap between user experience and role baseline (0 = meets/exceeds, 1 = no experience)
- `resume_completeness_score`: Resume quality and completeness
- `behavioral_intent_score`: User interest/intent signal (0 if not available)
- `market_demand_score`: Market demand for the role
- `competition_score`: Competition level for the role

### Target:
- `shortlist_label`: Binary label (0 = not shortlisted, 1 = shortlisted)

### Optional (for reference only, not used in training):
- `user_id`: User identifier
- `role_name`: Role name

## Example CSV

```csv
skill_match_score,experience_gap_score,resume_completeness_score,behavioral_intent_score,market_demand_score,competition_score,shortlist_label
0.85,0.2,0.9,0.8,0.7,0.5,1
0.3,0.9,0.6,0.0,0.7,0.5,0
0.65,0.4,0.8,0.6,0.8,0.6,1
0.2,0.95,0.5,0.0,0.6,0.7,0
```

## Usage

```bash
# Train logistic regression (default, explainable)
python scripts/ml-training/train_shortlist_model.py \
  --data training_data.csv \
  --model logistic \
  --output models/shortlist_model.pkl

# Train gradient boosting (for non-linear patterns)
python scripts/ml-training/train_shortlist_model.py \
  --data training_data.csv \
  --model gradient_boosting \
  --output models/shortlist_model_gb.pkl

# Custom test split and random seed
python scripts/ml-training/train_shortlist_model.py \
  --data training_data.csv \
  --model logistic \
  --test-size 0.25 \
  --random-seed 123
```

## Output

The script outputs:
1. **Evaluation metrics**: Accuracy, Precision, Recall, F1, ROC-AUC
2. **Confusion matrix**: True/false positives and negatives
3. **Feature importance**: Coefficients (logistic) or importances (gradient boosting)
4. **Saved model**: Serialized model with metadata for inference

## Loading the Model

```python
import joblib

# Load trained model
model_package = joblib.load('models/shortlist_model.pkl')
model = model_package['model']
feature_names = model_package['feature_names']
metadata = model_package['metadata']

# Make predictions
import numpy as np

# Example feature vector (6 features)
features = np.array([[0.75, 0.3, 0.85, 0.5, 0.7, 0.6]])
probability = model.predict_proba(features)[0, 1]

print(f"Shortlist probability: {probability:.2%}")
```

## Requirements

Install required packages:

```bash
pip install pandas numpy scikit-learn joblib
```

Or add to requirements.txt:
```
pandas>=1.5.0
numpy>=1.23.0
scikit-learn>=1.3.0
joblib>=1.3.0
```
