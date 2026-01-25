import pytest
from resume_parser import ResumeParser
import os

def test_parse_resume_another_format():
    # Create a mock resume file with a different format
    resume_content = """
    Jane Smith
    Data Scientist

    jane.smith@email.com | (987) 654-3210 | linkedin.com/in/janesmith

    ========================================
    PROFESSIONAL SUMMARY
    ========================================
    Highly analytical and detail-oriented Data Scientist with 3+ years of experience.

    ========================================
    TECHNICAL SKILLS
    ========================================
    - Languages: Python, R, SQL
    - Libraries: Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch
    - Tools: Jupyter, Git, Docker

    ========================================
    WORK EXPERIENCE
    ========================================
    - Data Scientist, ABC Corp (2021-Present)
    - Data Analyst, XYZ Inc (2019-2021)

    ========================================
    EDUCATION
    ========================================
    - M.S. in Data Science, Another University
    """
    resume_path = "test_resume_another_format.txt"
    with open(resume_path, "w") as f:
        f.write(resume_content)

    # Parse the resume
    parser = ResumeParser(resume_path)
    parsed_data = parser.parse()

    # Check if skills are extracted correctly
    expected_skills = ["python", "r", "sql", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "jupyter", "git", "docker"]
    assert "skills" in parsed_data
    assert all(skill.lower() in [s.lower() for s in parsed_data["skills"]] for skill in expected_skills)

    # Clean up the mock file
    os.remove(resume_path)
    