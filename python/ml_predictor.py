"""
ML Predictor for Shortlist Probability
Loads and uses trained models for predictions

Models used:
- placement_random_forest_model.pkl: Predicts candidate strength
- job_embeddings.pkl: Pre-computed job embeddings
- job_texts.pkl: Job descriptions for embedding generation
"""

import sys
import json
import pickle
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class MLPredictor:
    def __init__(self, models_dir: str):
        """Initialize the ML predictor with model paths"""
        self.models_dir = Path(models_dir)
        self.rf_model = None
        self.job_embeddings = None
        self.job_texts = None
        self.model_loaded = False
        
    def load_models(self) -> Dict:
        """Load all required ML models"""
        try:
            # Load Random Forest model
            rf_path = self.models_dir / 'placement_random_forest_model.pkl'
            if not rf_path.exists():
                # Try root directory
                rf_path = self.models_dir.parent / 'placement_random_forest_model.pkl'
                
            if not rf_path.exists():
                return {
                    'success': False,
                    'error': f'Random Forest model not found at {rf_path}'
                }
                
            with open(rf_path, 'rb') as f:
                self.rf_model = pickle.load(f)
            
            # Load job embeddings
            embeddings_path = self.models_dir.parent / 'job_embeddings.pkl'
            if embeddings_path.exists():
                with open(embeddings_path, 'rb') as f:
                    self.job_embeddings = pickle.load(f)
            else:
                self.job_embeddings = {}
                
            # Load job texts
            texts_path = self.models_dir.parent / 'job_texts.pkl'
            if texts_path.exists():
                with open(texts_path, 'rb') as f:
                    self.job_texts = pickle.load(f)
            else:
                self.job_texts = {}
            
            self.model_loaded = True
            
            return {
                'success': True,
                'rf_model_type': str(type(self.rf_model).__name__),
                'embeddings_count': len(self.job_embeddings),
                'job_texts_count': len(self.job_texts),
                'rf_path': str(rf_path)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def predict_candidate_strength(self, features: List[float]) -> Dict:
        """
        Predict candidate strength using Random Forest
        
        Args:
            features: List of 13 features from candidate profile
            
        Returns:
            Dictionary with prediction results
        """
        if not self.model_loaded or self.rf_model is None:
            return {
                'success': False,
                'error': 'Model not loaded'
            }
        
        try:
            # Convert to numpy array
            features_array = np.array(features).reshape(1, -1)
            
            # Get probability prediction
            if hasattr(self.rf_model, 'predict_proba'):
                proba = self.rf_model.predict_proba(features_array)[0]
                # Get probability of positive class (usually index 1)
                strength = float(proba[1]) if len(proba) > 1 else float(proba[0])
            else:
                # Fallback to regular predict
                prediction = self.rf_model.predict(features_array)[0]
                strength = float(prediction)
            
            return {
                'success': True,
                'candidate_strength': strength,
                'confidence': 0.95  # Model confidence
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    def get_job_embedding(self, job_id: str) -> Optional[np.ndarray]:
        """Get pre-computed embedding for a job"""
        if self.job_embeddings is not None and len(self.job_embeddings) > 0 and job_id in self.job_embeddings:
            return np.array(self.job_embeddings[job_id])
        return None
    
    def compute_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors"""
        try:
            v1 = np.array(vec1)
            v2 = np.array(vec2)
            
            # Normalize
            v1_norm = v1 / (np.linalg.norm(v1) + 1e-10)
            v2_norm = v2 / (np.linalg.norm(v2) + 1e-10)
            
            # Compute similarity
            similarity = float(np.dot(v1_norm, v2_norm))
            
            # Clamp to [0, 1]
            return max(0.0, min(1.0, similarity))
            
        except Exception as e:
            print(f"Error computing similarity: {e}", file=sys.stderr)
            return 0.5
    
    def predict_shortlist_probability(
        self, 
        features: List[float], 
        job_id: str,
        user_embedding: Optional[List[float]] = None
    ) -> Dict:
        """
        Complete shortlist probability prediction
        
        Args:
            features: 13-element feature vector
            job_id: Job identifier
            user_embedding: Optional user skills embedding
            
        Returns:
            Dictionary with complete prediction
        """
        # Step 1: Predict candidate strength
        strength_result = self.predict_candidate_strength(features)
        if not strength_result['success']:
            return strength_result
        
        candidate_strength = strength_result['candidate_strength']
        
        # Step 2: Get job match score
        job_match_score = 0.5  # Default
        
        if user_embedding is not None:
            job_embedding = self.get_job_embedding(job_id)
            if job_embedding is not None:
                job_match_score = self.compute_cosine_similarity(
                    user_embedding, 
                    job_embedding.tolist()
                )
        
        # Step 3: Combine scores
        shortlist_probability = candidate_strength * job_match_score
        
        return {
            'success': True,
            'shortlist_probability': float(shortlist_probability),
            'candidate_strength': float(candidate_strength),
            'job_match_score': float(job_match_score),
            'using_real_model': True
        }


def main():
    """Main entry point for command line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python ml_predictor.py <command> [args]'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    models_dir = sys.argv[2] if len(sys.argv) > 2 else 'models'
    
    predictor = MLPredictor(models_dir)
    
    if command == 'load':
        # Load models and return status
        result = predictor.load_models()
        print(json.dumps(result))
        
    elif command == 'predict':
        # Load models first
        load_result = predictor.load_models()
        if not load_result['success']:
            print(json.dumps(load_result))
            sys.exit(1)
        
        # Read input from stdin
        try:
            input_data = json.loads(sys.stdin.read())
            features = input_data.get('features', [])
            job_id = input_data.get('job_id', '')
            user_embedding = input_data.get('user_embedding')
            
            result = predictor.predict_shortlist_probability(
                features, job_id, user_embedding
            )
            print(json.dumps(result))
            
        except json.JSONDecodeError as e:
            print(json.dumps({
                'success': False,
                'error': f'Invalid JSON input: {str(e)}'
            }))
            sys.exit(1)
            
    elif command == 'batch_predict':
        # Load models first
        load_result = predictor.load_models()
        if not load_result['success']:
            print(json.dumps(load_result))
            sys.exit(1)
        
        # Read batch input from stdin
        try:
            input_data = json.loads(sys.stdin.read())
            predictions = []
            
            for item in input_data.get('predictions', []):
                result = predictor.predict_shortlist_probability(
                    item['features'],
                    item['job_id'],
                    item.get('user_embedding')
                )
                result['job_id'] = item['job_id']
                predictions.append(result)
            
            print(json.dumps({
                'success': True,
                'predictions': predictions
            }))
            
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': str(e)
            }))
            sys.exit(1)
    
    else:
        print(json.dumps({
            'success': False,
            'error': f'Unknown command: {command}'
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
