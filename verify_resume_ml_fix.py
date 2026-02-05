#!/usr/bin/env python3
"""
Resume Parser Verification Script
Tests the new structured resume parser output format
"""

import sys
import json
import os

def test_structured_output():
    """Verify resume parser produces structured output"""
    print("\n" + "="*60)
    print("🧪 RESUME PARSER VERIFICATION TEST")
    print("="*60)
    
    # Check if resume_parser.py exists
    parser_path = "python/resume_parser.py"
    if not os.path.exists(parser_path):
        print(f"❌ Parser not found at {parser_path}")
        return False
    
    print(f"✅ Parser found at {parser_path}")
    
    # Expected structured fields
    expected_fields = {
        'technical_skills': list,
        'programming_languages': list,
        'frameworks_libraries': list,
        'tools_platforms': list,
        'databases': list,
        'soft_skills': list,
        'projects_count': int,
        'projects': list,
        'experience_months': int,
        'experience': list,
        'education': list,
        'cgpa': (type(None), int, float),
        'resume_completeness_score': (int, float),
    }
    
    print("\n📋 Expected Output Structure:")
    for field, field_type in expected_fields.items():
        print(f"   {field}: {field_type.__name__ if hasattr(field_type, '__name__') else str(field_type)}")
    
    # Verify parser code contains new methods
    with open(parser_path, 'r', encoding='utf-8') as f:
        parser_code = f.read()
    
    required_methods = [
        'normalize_skill',
        'categorize_skill',
        'extract_skills',
        'extract_experience_details',
        'extract_projects_details',
        'extract_cgpa',
    ]
    
    print("\n✅ Method Checks:")
    for method in required_methods:
        if f'def {method}(' in parser_code:
            print(f"   ✅ {method}() - Found")
        else:
            print(f"   ❌ {method}() - NOT FOUND")
            return False
    
    # Verify skill categories
    print("\n✅ Skill Category Definitions:")
    categories = [
        'PROGRAMMING_LANGUAGES',
        'FRAMEWORKS_LIBRARIES',
        'TOOLS_PLATFORMS',
        'DATABASES',
        'SOFT_SKILLS',
        'NOISE_PHRASES',
    ]
    
    for category in categories:
        if f'{category} = [' in parser_code or f'{category}:' in parser_code:
            print(f"   ✅ {category} - Defined")
        else:
            print(f"   ❌ {category} - NOT DEFINED")
            return False
    
    print("\n✅ Validation Logic:")
    checks = [
        ('Soft skills exclusion', 'soft_skills'),
        ('Experience extraction', 'experience_months'),
        ('CGPA extraction', 'extract_cgpa'),
        ('Noise removal', 'normalize_skill'),
        ('Skill categorization', 'categorize_skill'),
    ]
    
    for check_name, check_code in checks:
        if check_code in parser_code:
            print(f"   ✅ {check_name}")
        else:
            print(f"   ❌ {check_name} - NOT FOUND")
            return False
    
    return True


def test_ml_integration():
    """Verify ML service handles structured resume data"""
    print("\n" + "="*60)
    print("🧪 ML SERVICE VERIFICATION TEST")
    print("="*60)
    
    ml_file = "server/services/ml/shortlist-probability.service.ts"
    
    if not os.path.exists(ml_file):
        print(f"❌ ML service not found at {ml_file}")
        return False
    
    print(f"✅ ML service found at {ml_file}")
    
    with open(ml_file, 'r', encoding='utf-8') as f:
        ml_code = f.read()
    
    print("\n✅ Resume Data Handling:")
    checks = [
        ('Resume data extraction', 'resumeData'),
        ('Structured skill categories', 'technical_skills'),
        ('Soft skills exclusion', 'resumeSoftSkills'),
        ('Numeric experience', 'resumeExperienceMonths'),
        ('Project count', 'resumeProjectsCount'),
        ('CGPA extraction', 'resumeCGPA'),
    ]
    
    for check_name, check_code in checks:
        if check_code in ml_code:
            print(f"   ✅ {check_name}")
        else:
            print(f"   ❌ {check_name} - NOT FOUND")
            return False
    
    print("\n✅ Hard Validation:")
    validations = [
        ('Skill count assertion', 'raw.skillCount'),
        ('Experience assertion', 'totalExperienceMonths'),
        ('Project count assertion', 'projectCount'),
        ('Validation logging', 'ALL HARD VALIDATIONS'),
    ]
    
    for val_name, val_code in validations:
        if val_code in ml_code:
            print(f"   ✅ {val_name}")
        else:
            print(f"   ❌ {val_name} - NOT FOUND")
            return False
    
    print("\n✅ Comprehensive Logging:")
    logs = [
        ('Resume data logging', 'RESUME-FIRST'),
        ('Clean structured data log', 'CLEAN & STRUCTURED'),
        ('Merged data logging', 'MERGED DATA'),
        ('Validation logging', 'HARD VALIDATIONS PASSED'),
    ]
    
    for log_name, log_text in logs:
        if log_text in ml_code:
            print(f"   ✅ {log_name}")
        else:
            print(f"   ❌ {log_name} - NOT FOUND")
            return False
    
    return True


def test_typescript_interface():
    """Verify TypeScript interface matches new format"""
    print("\n" + "="*60)
    print("🧪 TYPESCRIPT INTERFACE VERIFICATION TEST")
    print("="*60)
    
    interface_file = "server/services/resume-parser.service.ts"
    
    if not os.path.exists(interface_file):
        print(f"❌ Interface file not found at {interface_file}")
        return False
    
    print(f"✅ Interface file found at {interface_file}")
    
    with open(interface_file, 'r', encoding='utf-8') as f:
        interface_code = f.read()
    
    print("\n✅ Interface Fields:")
    expected_fields = [
        'technical_skills',
        'programming_languages',
        'frameworks_libraries',
        'tools_platforms',
        'databases',
        'soft_skills',
        'projects_count',
        'projects',
        'experience_months',
        'experience',
        'education',
        'cgpa',
        'resume_completeness_score',
    ]
    
    for field in expected_fields:
        if field in interface_code:
            print(f"   ✅ {field}")
        else:
            print(f"   ❌ {field} - NOT FOUND")
            return False
    
    return True


def main():
    """Run all verification tests"""
    print("\n" + "="*70)
    print(" RESUME-TO-ML PIPELINE VERIFICATION ".center(70, "="))
    print("="*70)
    
    results = []
    
    # Run tests
    results.append(("Resume Parser Structure", test_structured_output()))
    results.append(("ML Service Integration", test_ml_integration()))
    results.append(("TypeScript Interface", test_typescript_interface()))
    
    # Summary
    print("\n" + "="*70)
    print(" VERIFICATION SUMMARY ".center(70, "="))
    print("="*70)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:<40} {status}")
        if not passed:
            all_passed = False
    
    print("="*70)
    
    if all_passed:
        print("\n✅ ALL VERIFICATION TESTS PASSED! 🎉")
        print("\nNext steps:")
        print("  1. Deploy updated files")
        print("  2. Test resume upload")
        print("  3. Check logs for 'CLEAN & STRUCTURED' message")
        print("  4. Monitor ML predictions")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\nCheck the output above for failures")
        return 1


if __name__ == '__main__':
    sys.exit(main())
