import pytest
from resume_parser import ResumeParser
import os

def test_parse_resume_agnostic():
    # Create a mock resume file with a non-standard format
    resume_content = """
    John Doe
    Software Engineer

    Contact: john.doe@email.com | (123) 456-7890 | linkedin.com/in/johndoe

    **Summary**
    Innovative and results-driven Software Engineer with 5+ years of experience.

    **Core Competencies**
    - Python, Java, C++
    - JavaScript, React, Node.js
    - SQL, PostgreSQL, MongoDB

    **Work History**
    - Senior Software Engineer, Tech Company (2020-Present)
    - Software Engineer, Another Company (2018-2020)

    **Education**
    - B.S. in Computer Science, University of Example
    """
    resume_path = "test_resume_agnostic.txt"
    with open(resume_path, "w") as f:
        f.write(resume_content)

    # Parse the resume
    parser = ResumeParser(resume_path)
    parsed_data = parser.parse()

    # Check if skills are extracted correctly
    expected_skills = ["python", "java", "c++", "javascript", "react", "node.js", "sql", "postgresql", "mongodb"]
    assert "skills" in parsed_data
    assert all(skill.lower() in [s.lower() for s in parsed_data["skills"]] for skill in expected_skills)

    # Clean up the mock file
    os.remove(resume_path)
    