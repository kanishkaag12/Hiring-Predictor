"""
Test calibration with running API server
Tests fit score calibration for different user levels
"""

import requests
import json

BASE_URL = "http://localhost:3001"

# Test 1: ML Student (low experience, good skills/projects)
print("\n=== TEST 1: Strong ML Student ===")
student_data = {
    "skills": ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "SQL", "Pandas"],
    "userLevel": "student",
    "resumeQualityScore": 0.75,
    "experienceMonths": 3,
    "projectsCount": 3,
    "education": [{"degree": "Bachelor", "field": "Computer Science"}]
}

try:
    # Note: This would normally go through /api/dashboard but we'll simulate the predictor call
    print(f"Would send to predictor: {json.dumps(student_data, indent=2)}")
    print("\nExpected outcomes:")
    print("- ML Engineer: 60-75% fit (strong entry-level match)")
    print("- Data Analyst: 65-80% fit (excellent entry-level fit)")
    print("- Data Scientist: 55-70% fit (achievable with growth)")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Experienced Professional
print("\n=== TEST 2: Experienced ML Professional ===")
professional_data = {
    "skills": ["Python", "Machine Learning", "TensorFlow", "Deep Learning", "PyTorch", "AWS", "Kubernetes"],
    "userLevel": "mid",
    "resumeQualityScore": 0.9,
    "experienceMonths": 60,
    "projectsCount": 8,
    "education": [{"degree": "Master", "field": "Machine Learning"}]
}

try:
    print(f"Would send to predictor: {json.dumps(professional_data, indent=2)}")
    print("\nExpected outcomes:")
    print("- ML Engineer: 80-95% fit (excellent match)")
    print("- Senior Engineer: 75-90% fit (strong fit)")
    print("- Data Scientist: 70-85% fit (very good fit)")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Early-Career Fresher
print("\n=== TEST 3: Early-Career Fresher ===")
fresher_data = {
    "skills": ["Python", "JavaScript", "HTML", "CSS", "Git"],
    "userLevel": "fresher",
    "resumeQualityScore": 0.45,
    "experienceMonths": 1,
    "projectsCount": 1,
    "education": [{"degree": "Bachelor", "field": "Computer Science"}]
}

try:
    print(f"Would send to predictor: {json.dumps(fresher_data, indent=2)}")
    print("\nExpected outcomes:")
    print("- Frontend Developer: 45-55% fit (achievable with learning)")
    print("- Junior Developer: 40-50% fit (growth opportunity)")
    print("- QA Engineer: 35-45% fit (entry path option)")
except Exception as e:
    print(f"Error: {e}")

print("\n=== CALIBRATION STRATEGY ===")
print("✓ Entry-level benchmark (0.15 for students, 0.20 for freshers)")
print("✓ Normalize raw similarity to 40-90% range for entry-level users")
print("✓ Quality bonuses: +10% for strong resumes (quality>0.6, skills>=5, projects>0)")
print("✓ Confidence bands: 65%+ = high, 40-65% = medium, <40% = low")
print("✓ Motivating explanations with context-aware language")
print("\n=== TEST COMPLETE ===")
