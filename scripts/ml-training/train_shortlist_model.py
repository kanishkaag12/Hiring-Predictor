"""
ML Training Script for Role Shortlisting Model

Trains a supervised classifier to predict whether a (user, role) pair
should be shortlisted based on engineered feature vectors from Prompt 5.

Usage:
    python train_shortlist_model.py --data training_data.csv --model logistic

Features (all normalized 0-1):
    - skill_match_score
    - experience_gap_score
    - resume_completeness_score
    - behavioral_intent_score
    - market_demand_score
    - competition_score

Target:
    - shortlist_label (0 or 1)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import joblib
import argparse
import sys
from pathlib import Path
from datetime import datetime

# Feature names (must match Prompt 5 output)
FEATURE_COLUMNS = [
    "skill_match_score",
    "experience_gap_score",
    "resume_completeness_score",
    "behavioral_intent_score",
    "market_demand_score",
    "competition_score",
]

TARGET_COLUMN = "shortlist_label"


def load_and_validate_data(csv_path: str) -> pd.DataFrame:
    """
    Load training data from CSV and validate schema.
    
    Args:
        csv_path: Path to CSV file with training data
        
    Returns:
        Validated DataFrame
        
    Raises:
        ValueError: If required columns are missing or data is invalid
    """
    print(f"Loading data from {csv_path}...")
    
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"Training data file not found: {csv_path}")
    
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} samples")
    
    # Validate required columns
    required_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing_cols = set(required_cols) - set(df.columns)
    
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    # Validate feature ranges (should be 0-1)
    for col in FEATURE_COLUMNS:
        if df[col].min() < 0 or df[col].max() > 1:
            print(f"WARNING: Feature '{col}' has values outside [0, 1] range")
            print(f"  Min: {df[col].min()}, Max: {df[col].max()}")
    
    # Validate target (should be 0 or 1)
    unique_labels = df[TARGET_COLUMN].unique()
    if not set(unique_labels).issubset({0, 1}):
        raise ValueError(f"Target column must contain only 0 or 1. Found: {unique_labels}")
    
    # Check class balance
    label_counts = df[TARGET_COLUMN].value_counts()
    print(f"\nClass distribution:")
    print(f"  Not shortlisted (0): {label_counts.get(0, 0)} ({label_counts.get(0, 0)/len(df)*100:.1f}%)")
    print(f"  Shortlisted (1): {label_counts.get(1, 0)} ({label_counts.get(1, 0)/len(df)*100:.1f}%)")
    
    if label_counts.get(0, 0) == 0 or label_counts.get(1, 0) == 0:
        raise ValueError("Training data must contain both positive and negative examples")
    
    # Check for missing values
    missing = df[required_cols].isnull().sum()
    if missing.any():
        print("\nWARNING: Missing values detected:")
        print(missing[missing > 0])
        print("Rows with missing values will be dropped.")
        df = df.dropna(subset=required_cols)
        print(f"Remaining samples after dropping: {len(df)}")
    
    return df


def train_model(X_train, y_train, model_type: str = "logistic", random_state: int = 42):
    """
    Train the classification model.
    
    Args:
        X_train: Training features
        y_train: Training labels
        model_type: "logistic" or "gradient_boosting"
        random_state: Random seed for reproducibility
        
    Returns:
        Trained model
    """
    print(f"\nTraining {model_type} model...")
    
    if model_type == "logistic":
        # Logistic Regression: Simple, fast, explainable coefficients
        model = LogisticRegression(
            random_state=random_state,
            max_iter=1000,
            solver='lbfgs',
            class_weight='balanced'  # Handle class imbalance
        )
    elif model_type == "gradient_boosting":
        # Gradient Boosting: Better for non-linear patterns
        model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            random_state=random_state
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    model.fit(X_train, y_train)
    print("Training completed.")
    
    return model


def evaluate_model(model, X_test, y_test, feature_names):
    """
    Evaluate model performance and show feature importance.
    
    Args:
        model: Trained model
        X_test: Test features
        y_test: Test labels
        feature_names: List of feature names
        
    Returns:
        Dict of evaluation metrics
    """
    print("\n" + "="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]  # Probability of class 1
    
    # Metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_pred_proba),
    }
    
    print(f"\nAccuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1']:.4f}")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Not Shortlisted", "Shortlisted"]))
    
    # Feature importance/coefficients
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE")
    print("="*60)
    
    if hasattr(model, 'coef_'):
        # Logistic Regression coefficients
        coefficients = model.coef_[0]
        feature_importance = pd.DataFrame({
            'feature': feature_names,
            'coefficient': coefficients,
            'abs_coefficient': np.abs(coefficients)
        }).sort_values('abs_coefficient', ascending=False)
        
        print("\nLogistic Regression Coefficients:")
        print("(Positive = increases shortlist probability)")
        print(feature_importance[['feature', 'coefficient']].to_string(index=False))
        
    elif hasattr(model, 'feature_importances_'):
        # Gradient Boosting feature importances
        importances = model.feature_importances_
        feature_importance = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print("\nGradient Boosting Feature Importances:")
        print(feature_importance.to_string(index=False))
    
    return metrics


def save_model(model, output_path: str, metadata: dict):
    """
    Save trained model and metadata to disk.
    
    Args:
        model: Trained model
        output_path: Path to save model
        metadata: Dict with training metadata
    """
    print(f"\nSaving model to {output_path}...")
    
    model_package = {
        'model': model,
        'feature_names': FEATURE_COLUMNS,
        'metadata': metadata
    }
    
    joblib.dump(model_package, output_path)
    print("Model saved successfully.")


def main():
    parser = argparse.ArgumentParser(description="Train role shortlisting ML model")
    parser.add_argument(
        "--data",
        type=str,
        required=True,
        help="Path to training data CSV file"
    )
    parser.add_argument(
        "--model",
        type=str,
        choices=["logistic", "gradient_boosting"],
        default="logistic",
        help="Model type to train (default: logistic)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="shortlist_model.pkl",
        help="Output path for trained model (default: shortlist_model.pkl)"
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Test set fraction (default: 0.2)"
    )
    parser.add_argument(
        "--random-seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)"
    )
    
    args = parser.parse_args()
    
    print("="*60)
    print("ROLE SHORTLISTING MODEL TRAINING")
    print("="*60)
    print(f"Data: {args.data}")
    print(f"Model: {args.model}")
    print(f"Output: {args.output}")
    print(f"Test size: {args.test_size}")
    print(f"Random seed: {args.random_seed}")
    print("="*60)
    
    try:
        # 1. Load and validate data
        df = load_and_validate_data(args.data)
        
        # 2. Split features and target
        X = df[FEATURE_COLUMNS].values
        y = df[TARGET_COLUMN].values
        
        print(f"\nFeature matrix shape: {X.shape}")
        print(f"Target vector shape: {y.shape}")
        
        # 3. Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=args.test_size,
            random_state=args.random_seed,
            stratify=y  # Maintain class distribution
        )
        
        print(f"\nTrain set: {len(X_train)} samples")
        print(f"Test set:  {len(X_test)} samples")
        
        # 4. Train model
        model = train_model(X_train, y_train, args.model, args.random_seed)
        
        # 5. Evaluate model
        metrics = evaluate_model(model, X_test, y_test, FEATURE_COLUMNS)
        
        # 6. Save model
        metadata = {
            'model_type': args.model,
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'test_metrics': metrics,
            'random_seed': args.random_seed,
            'feature_names': FEATURE_COLUMNS,
        }
        
        save_model(model, args.output, metadata)
        
        print("\n" + "="*60)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"\nModel saved to: {args.output}")
        print(f"ROC-AUC Score: {metrics['roc_auc']:.4f}")
        
        return 0
        
    except Exception as e:
        print(f"\nERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
