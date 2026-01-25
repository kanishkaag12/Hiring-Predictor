"""
Unit tests for the Resume Parser module.
Run with: python -m pytest test_resume_parser.py -v
"""

import json
import tempfile
from pathlib import Path
from resume_parser import ResumeParser, parse_resume


class TestResumeParser:
    """Test suite for Resume Parser."""

    def test_skill_extraction(self):
        """Test skill extraction from resume text."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = """
        Professional Skills:
        - Python, JavaScript, TypeScript
        - React, Angular, Vue.js
        - AWS, Docker, Kubernetes
        - PostgreSQL, MongoDB
        - Machine Learning with TensorFlow
        """
        parser.lines = parser.text.strip().split('\n')
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        skills = parser.extract_skills()

        assert 'Python' in skills
        assert 'JavaScript' in skills
        assert 'React' in skills
        assert 'AWS' in skills
        assert 'Docker' in skills
        assert len(skills) > 0

    def test_education_extraction(self):
        """Test education information extraction."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = """
        Education:
        Bachelor of Science in Computer Science
        Stanford University, 2020
        
        Master of Science in Machine Learning
        MIT, 2022
        """
        parser.lines = [line.strip() for line in parser.text.split('\n') if line.strip()]  # Strip properly
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        print(f"[DEBUG] Sections: {list(parser.sections.keys())}")
        print(f"[DEBUG] Education section content: {repr(parser.sections.get('education', 'N/A')[:200])}")

        education = parser.extract_education()
        
        print(f"[DEBUG] Education found: {education}")

        assert len(education) >= 1
        assert any(e['degree'] == 'Bachelor' for e in education)

    def test_experience_calculation(self):
        """Test experience months calculation."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = """
        Senior Software Engineer
        Jan 2020 - Dec 2021
        Company A
        
        Software Engineer
        Mar 2018 - Dec 2019
        Company B
        """
        parser.lines = parser.text.strip().split('\n')
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        experience = parser.extract_experience_months()

        assert experience > 0
        assert experience <= 240  # Max 20 years

    def test_projects_count(self):
        """Test project count extraction."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = """
        Projects:
        - Built a real-time chat application with WebSockets
        - Developed a machine learning pipeline for image recognition
        - Created an e-commerce platform using React
        - Implemented a CI/CD pipeline with Jenkins
        """
        parser.lines = parser.text.strip().split('\n')
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        projects = parser.extract_projects_count()

        assert projects > 0

    def test_completeness_score(self):
        """Test resume completeness scoring."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = """
        John Doe
        john.doe@example.com
        +1-555-0123
        
        Experience:
        Senior Software Engineer at Tech Corp (2020-Present)
        
        Education:
        Bachelor of Science in Computer Science
        Stanford University, 2020
        
        Skills:
        Python, React, AWS, Docker, PostgreSQL
        
        Projects:
        - Built scalable microservices platform
        - Developed ML recommendation engine
        """
        parser.lines = parser.text.strip().split('\n')
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        score = parser.calculate_completeness_score()

        assert 0 <= score <= 1
        assert score > 0.5  # Should have decent score

    def test_keyword_matching(self):
        """Test keyword matching function."""
        parser = ResumeParser.__new__(ResumeParser)

        # Should match
        assert parser._keyword_in_text('python', 'I know python programming')
        assert parser._keyword_in_text('react', 'React and Angular experience')

        # Should not match
        assert not parser._keyword_in_text('java', 'javascript is different')

    def test_email_extraction(self):
        """Test email extraction for completeness score."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = "Contact: john.doe@example.com"
        parser.lines = parser.text.strip().split('\n')
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        score = parser.calculate_completeness_score()

        assert score > 0

    def test_empty_resume(self):
        """Test handling of empty resume."""
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = ""
        parser.lines = []
        parser.sections = {}  # Initialize sections
        parser.segment_by_layout_and_rules()  # Segment the text

        skills = parser.extract_skills()
        education = parser.extract_education()
        projects = parser.extract_projects_count()

        assert skills == []
        assert education == []
        assert projects == 0

    def test_result_format(self):
        """Test that result format matches specification."""
        # Create a temporary test file
        test_content = """Senior Engineer at TechCorp (2020-Present)
john@example.com

Skills: Python, React, AWS

Bachelor of Science, Stanford University, 2020

Projects: Built API, Developed dashboard
"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_path = f.name
        
        try:
            parser = ResumeParser(temp_path)
            result = parser.parse()

            # Check required fields
            assert 'skills' in result
            assert 'education' in result
            assert 'experience_months' in result
            assert 'projects_count' in result
            assert 'resume_completeness_score' in result

            # Check types
            assert isinstance(result['skills'], list)
            assert isinstance(result['education'], list)
            assert isinstance(result['experience_months'], int)
            assert isinstance(result['projects_count'], int)
            assert isinstance(result['resume_completeness_score'], float)
        finally:
            Path(temp_path).unlink()

    def test_json_serializable(self):
        """Test that result can be serialized to JSON."""
        # Create a temporary test file
        test_content = "Python developer with 5 years experience"
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_path = f.name
        
        try:
            parser = ResumeParser(temp_path)
            result = parser.parse()
            json_str = parser.to_json()

            # Should not raise exception
            parsed = json.loads(json_str)
            assert 'skills' in parsed
        finally:
            Path(temp_path).unlink()


if __name__ == "__main__":
    # Run tests manually
    test = TestResumeParser()
    
    print("Running Resume Parser Tests...\n")
    
    tests = [
        ("Skill Extraction", test.test_skill_extraction),
        ("Education Extraction", test.test_education_extraction),
        ("Experience Calculation", test.test_experience_calculation),
        ("Projects Counting", test.test_projects_count),
        ("Completeness Score", test.test_completeness_score),
        ("Keyword Matching", test.test_keyword_matching),
        ("Email Extraction", test.test_email_extraction),
        ("Empty Resume", test.test_empty_resume),
        ("Result Format", test.test_result_format),
        ("JSON Serializable", test.test_json_serializable),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            test_func()
            print(f"✓ {test_name}")
            passed += 1
        except AssertionError as e:
            print(f"✗ {test_name}: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test_name}: {type(e).__name__}: {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Tests passed: {passed}/{len(tests)}")
    if failed > 0:
        print(f"Tests failed: {failed}")
    print(f"{'='*50}")
