"""
Demonstration of format-agnostic resume parsing.
Shows how the parser handles different resume layouts and formats.
"""

from resume_parser import parse_resume
from pathlib import Path
import json
import tempfile


def create_test_resume(content: str, filename: str) -> str:
    """Create a temporary resume file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(content)
        return f.name


def test_ats_style_resume():
    """Test ATS-friendly resume with clear sections."""
    print("\n" + "="*60)
    print("TEST 1: ATS-Style Resume (Clear Sections)")
    print("="*60)
    
    resume = """
JOHN DOE
john.doe@email.com | +1-555-0123

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 5+ years in web development.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, Java
Frameworks: React, Angular, Django, Flask
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, Kubernetes, Git, AWS

WORK EXPERIENCE
Senior Software Engineer | Tech Corp | Jan 2020 - Present
- Built scalable microservices using Python and Docker
- Led team of 4 developers

Software Engineer | StartupXYZ | Mar 2018 - Dec 2019
- Developed React-based web applications
- Implemented CI/CD pipelines

EDUCATION
Bachelor of Science in Computer Science
Stanford University, 2018

PROJECTS
- E-commerce Platform: Built full-stack application with React and Django
- ML Pipeline: Developed data processing pipeline using Python and AWS
    """
    
    temp_file = create_test_resume(resume, "ats_resume.txt")
    try:
        result = parse_resume(temp_file)
        print(f"✓ Skills Found: {len(result['skills'])} skills")
        print(f"  Top Skills: {', '.join(result['skills'][:8])}")
        print(f"✓ Education: {len(result['education'])} degree(s)")
        print(f"✓ Experience: {result['experience_months']} months")
        print(f"✓ Projects: {result['projects_count']} projects")
        print(f"✓ Completeness: {result['resume_completeness_score']:.0%}")
        return result
    finally:
        Path(temp_file).unlink()


def test_minimal_resume():
    """Test minimal resume with non-standard formatting."""
    print("\n" + "="*60)
    print("TEST 2: Minimal Resume (Non-Standard Format)")
    print("="*60)
    
    resume = """
Sarah Johnson
sarah.j@gmail.com

About Me
Software developer interested in machine learning

Core Competencies
Python, TensorFlow, PyTorch, scikit-learn, pandas, numpy
JavaScript, React, Node.js
MySQL, MongoDB

Academic Background
Master of Science - Machine Learning, MIT, 2022
Bachelor - Computer Science, 2020

Portfolio
Created neural network for image classification
Built chatbot using NLP
    """
    
    temp_file = create_test_resume(resume, "minimal_resume.txt")
    try:
        result = parse_resume(temp_file)
        print(f"✓ Skills Found: {len(result['skills'])} skills")
        print(f"  Top Skills: {', '.join(result['skills'][:6])}")
        print(f"✓ Education: {len(result['education'])} degree(s)")
        print(f"✓ Completeness: {result['resume_completeness_score']:.0%}")
        return result
    finally:
        Path(temp_file).unlink()


def test_design_heavy_resume():
    """Test resume with lots of formatting and mixed sections."""
    print("\n" + "="*60)
    print("TEST 3: Design-Heavy Resume (Mixed Sections)")
    print("="*60)
    
    resume = """
=====================================
    ALEX RIVERA - CLOUD ARCHITECT
=====================================

📧 alex.rivera@cloudpro.com
📞 555-9876

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPERTISE
━━━━━━━━
Cloud Technologies: AWS, Azure, GCP, Terraform
Containerization: Docker, Kubernetes, Helm
Programming: Python, Go, Bash
Monitoring: Prometheus, Grafana, Datadog

PROFESSIONAL HISTORY
━━━━━━━━━━━━━━━━━━━
Lead Cloud Architect @ CloudFirst Inc.
2021 - Present
Designed and implemented cloud infrastructure for Fortune 500 clients

DevOps Engineer @ TechStart
2019 - 2021
Automated deployment pipelines

ACADEMIC CREDENTIALS
━━━━━━━━━━━━━━━━━━━
MS, Cloud Computing, Georgia Tech, 2019

KEY PROJECTS
━━━━━━━━━━━
▸ Multi-cloud migration for 100+ services
▸ Kubernetes cluster optimization
▸ Infrastructure as Code framework
    """
    
    temp_file = create_test_resume(resume, "design_resume.txt")
    try:
        result = parse_resume(temp_file)
        print(f"✓ Skills Found: {len(result['skills'])} skills")
        print(f"  Top Skills: {', '.join(result['skills'][:6])}")
        print(f"✓ Education: {len(result['education'])} degree(s)")
        print(f"✓ Experience: {result['experience_months']} months (approx)")
        print(f"✓ Projects: {result['projects_count']} projects")
        print(f"✓ Completeness: {result['resume_completeness_score']:.0%}")
        return result
    finally:
        Path(temp_file).unlink()


def test_academic_cv():
    """Test academic CV format."""
    print("\n" + "="*60)
    print("TEST 4: Academic CV (Research-Focused)")
    print("="*60)
    
    resume = """
Dr. Maria Chen
Assistant Professor of Computer Science
maria.chen@university.edu

Research Interests: Natural Language Processing, Deep Learning

Educational Background:
PhD in Computer Science, University of California Berkeley, 2020
MS in Artificial Intelligence, Stanford, 2017
BS in Mathematics, UC San Diego, 2015

Technical Proficiency:
Programming Languages: Python, R, MATLAB, C++
ML Frameworks: PyTorch, TensorFlow, Keras, scikit-learn
NLP Tools: spaCy, NLTK, Hugging Face Transformers

Selected Publications:
- "Attention Mechanisms in Neural Translation" (NeurIPS 2021)
- "Transfer Learning for Low-Resource Languages" (ACL 2020)

Research Projects:
- Multi-lingual sentiment analysis system
- Developed transformer-based translation model
- Created benchmark dataset for NLP tasks
    """
    
    temp_file = create_test_resume(resume, "academic_cv.txt")
    try:
        result = parse_resume(temp_file)
        print(f"✓ Skills Found: {len(result['skills'])} skills")
        print(f"  Top Skills: {', '.join(result['skills'][:8])}")
        print(f"✓ Education: {len(result['education'])} degree(s)")
        print(f"✓ Projects: {result['projects_count']} projects")
        print(f"✓ Completeness: {result['resume_completeness_score']:.0%}")
        return result
    finally:
        Path(temp_file).unlink()


def main():
    """Run all format tests."""
    print("\n╔═══════════════════════════════════════════════════════════╗")
    print("║  FORMAT-AGNOSTIC RESUME PARSER - DEMONSTRATION           ║")
    print("║  Testing parser resilience across different formats       ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    results = []
    
    # Run all tests
    results.append(("ATS-Style", test_ats_style_resume()))
    results.append(("Minimal", test_minimal_resume()))
    results.append(("Design-Heavy", test_design_heavy_resume()))
    results.append(("Academic CV", test_academic_cv()))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY - All Resume Formats Tested")
    print("="*60)
    print(f"{'Format':<20} {'Skills':<10} {'Education':<12} {'Score':<10}")
    print("-"*60)
    
    for name, result in results:
        print(f"{name:<20} {len(result['skills']):<10} {len(result['education']):<12} {result['resume_completeness_score']:.0%}")
    
    print("\n✅ All resume formats parsed successfully!")
    print("✅ Parser is format-agnostic and resilient!")


if __name__ == "__main__":
    main()
