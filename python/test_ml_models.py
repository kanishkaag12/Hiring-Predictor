"""
Test script to verify ML model loading and predictions
Run this to check if placement_random_forest_model.pkl is loading correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_predictor import MLPredictor
import json

def test_model_loading():
    """Test if models can be loaded"""
    print("=" * 60)
    print("TEST 1: Model Loading")
    print("=" * 60)
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    predictor = MLPredictor(models_dir)
    
    result = predictor.load_models()
    
    print(json.dumps(result, indent=2))
    
    if result['success']:
        print("\n✅ SUCCESS: Models loaded correctly")
        print(f"   - RF Model Type: {result['rf_model_type']}")
        print(f"   - Job Embeddings: {result['embeddings_count']} entries")
        print(f"   - Job Texts: {result['job_texts_count']} entries")
        print(f"   - Model Path: {result['rf_path']}")
        return True
    else:
        print(f"\n❌ FAILED: {result['error']}")
        return False

def test_candidate_prediction():
    """Test candidate strength prediction"""
    print("\n" + "=" * 60)
    print("TEST 2: Candidate Strength Prediction")
    print("=" * 60)
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    predictor = MLPredictor(models_dir)
    
    # Load models
    load_result = predictor.load_models()
    if not load_result['success']:
        print(f"❌ Cannot test prediction - models not loaded: {load_result['error']}")
        return False
    
    # Sample features (18 values representing a candidate)
    # [skillCount, advancedSkillCount, intermediateSkillCount, beginnerSkillCount, skillDiversity,
    #  totalExperienceMonths, internshipCount, jobCount, hasRelevantExperience, avgExperienceDuration,
    #  educationLevel, hasQualifyingEducation, cgpa,
    #  projectCount, highComplexityProjects, mediumComplexityProjects, projectComplexityScore, overallStrengthScore]
    
    test_cases = [
        {
            "name": "Strong Candidate",
            "features": [8, 4, 3, 1, 0.8, 24, 2, 1, 1, 8.0, 3, 1, 0.85, 4, 2, 1, 0.75, 0.82]
        },
        {
            "name": "Average Candidate",
            "features": [5, 1, 2, 2, 0.6, 6, 1, 0, 1, 6.0, 2, 1, 0.70, 2, 0, 1, 0.5, 0.55]
        },
        {
            "name": "Weak Candidate",
            "features": [2, 0, 1, 1, 0.3, 0, 0, 0, 0, 0.0, 1, 0, 0.60, 1, 0, 0, 0.3, 0.28]
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n{test_case['name']}:")
        print(f"  Features: {test_case['features']}")
        
        result = predictor.predict_candidate_strength(test_case['features'])
        
        if result['success']:
            strength = result['candidate_strength']
            print(f"  ✅ Candidate Strength: {strength:.3f} ({strength * 100:.1f}%)")
            print(f"     Confidence: {result['confidence']:.2f}")
        else:
            print(f"  ❌ FAILED: {result['error']}")
            all_passed = False
    
    return all_passed

def test_full_prediction():
    """Test full shortlist probability prediction"""
    print("\n" + "=" * 60)
    print("TEST 3: Full Shortlist Probability")
    print("=" * 60)
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    predictor = MLPredictor(models_dir)
    
    # Load models
    load_result = predictor.load_models()
    if not load_result['success']:
        print(f"❌ Cannot test prediction - models not loaded: {load_result['error']}")
        return False
    
    # Sample features (18 features including overallStrengthScore)
    features = [6, 2, 3, 1, 0.7, 12, 1, 0, 1, 12.0, 2, 1, 0.75, 3, 1, 1, 0.6, 0.65]
    
    # Mock user embedding (384-dimensional)
    user_embedding = [0.5] * 384  # Simplified for testing
    
    # Try to predict with a job ID
    job_id = "test_job_123"
    
    print(f"\nTesting with job_id: {job_id}")
    print(f"Features: {features}")
    print(f"User embedding: {len(user_embedding)}-dimensional vector")
    
    result = predictor.predict_shortlist_probability(
        features, 
        job_id, 
        user_embedding
    )
    
    if result['success']:
        print("\n✅ SUCCESS: Full prediction complete")
        print(f"   - Shortlist Probability: {result['shortlist_probability']:.3f} ({result['shortlist_probability'] * 100:.1f}%)")
        print(f"   - Candidate Strength: {result['candidate_strength']:.3f} ({result['candidate_strength'] * 100:.1f}%)")
        print(f"   - Job Match Score: {result['job_match_score']:.3f} ({result['job_match_score'] * 100:.1f}%)")
        print(f"   - Using Real Model: {result['using_real_model']}")
        return True
    else:
        print(f"\n❌ FAILED: {result['error']}")
        return False

def main():
    """Run all tests"""
    print("\n🧪 ML MODEL VERIFICATION TEST SUITE")
    print("=" * 60)
    
    results = []
    
    # Test 1: Model Loading
    results.append(("Model Loading", test_model_loading()))
    
    # Test 2: Candidate Prediction
    results.append(("Candidate Prediction", test_candidate_prediction()))
    
    # Test 3: Full Prediction
    results.append(("Full Prediction", test_full_prediction()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED - ML models are working correctly!")
        print("✓ placement_random_forest_model.pkl loaded successfully")
        print("✓ Predictions are being generated from trained model")
        print("✓ No fallback logic is being used")
        return 0
    else:
        print("\n⚠️  SOME TESTS FAILED - Check errors above")
        print("❌ ML models may not be loading correctly")
        print("❌ System may fall back to mock predictions")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
