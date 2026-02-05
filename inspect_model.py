#!/usr/bin/env python3
"""
Inspect RandomForest model to see how many features it was trained on
"""

import pickle
from pathlib import Path

model_path = Path(__file__).parent / 'placement_random_forest_model.pkl'

print(f"[Debug] Loading model from: {model_path}")
print(f"[Debug] Model exists: {model_path.exists()}")

if model_path.exists():
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"\n[Debug] Model type: {type(model)}")
    print(f"[Debug] Model class name: {model.__class__.__name__}")
    
    if hasattr(model, 'n_features_in_'):
        print(f"\n✅ CRITICAL: Model expects EXACTLY {model.n_features_in_} features")
        print(f"    This is how many features the model was trained on")
        print(f"    TypeScript must send EXACTLY {model.n_features_in_} features")
    else:
        print("\n❌ Model does not have n_features_in_ attribute")
        print("    Cannot determine feature count from model")
    
    if hasattr(model, 'n_classes_'):
        print(f"\n[Debug] Number of classes: {model.n_classes_}")
    
    if hasattr(model, 'classes_'):
        print(f"[Debug] Classes: {model.classes_}")
    
    print(f"\n[Debug] Model attributes:")
    for attr in dir(model):
        if not attr.startswith('_') and 'feature' in attr.lower():
            try:
                val = getattr(model, attr)
                if not callable(val):
                    print(f"    {attr}: {val}")
            except:
                pass
else:
    print("❌ Model file not found!")
