
import json
import tempfile
from pathlib import Path
import pytest
from resume_parser import ResumeParser

@pytest.fixture
def create_resume_file():
    def _create_resume_file(content):
        temp_file = tempfile.NamedTemporaryFile(delete=False, mode='w', suffix=".txt")
        temp_file.write(content)
        temp_file.close()
        return temp_file.name
    return _create_resume_file

class TestResumeParserNew:
    """Test suite for the refactored Resume Parser."""

    def test_section_segmentation(self, create_resume_file):
        """Test the resume segmentation logic."""
        resume_content = """
John Doe
john.doe@example.com

Education
BS in Computer Science, University of Example (2020)

Experience
Software Engineer at Tech Corp (2020 - Present)
- Developed and maintained web applications.

Skills
Python, JavaScript, React
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        parser.extract_text()
        parser.segment_by_layout_and_rules()

        assert 'education' in parser.sections
        assert 'experience' in parser.sections
        assert 'skills' in parser.sections
        assert 'BS in Computer Science' in parser.sections['education']
        assert 'Software Engineer' in parser.sections['experience']
        assert 'Python' in parser.sections['skills']

    def test_skill_extraction_from_section(self, create_resume_file):
        """Test that skills are extracted correctly from the 'skills' section."""
        resume_content = """
Experience
I have experience with Python and Java.

Skills
JavaScript, React, Angular
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        result = parser.parse()

        assert 'JavaScript' in result['skills']
        assert 'React' in result['skills']
        assert 'Angular' in result['skills']
        assert 'Python' not in result['skills'] # Should not be extracted from the experience section
        assert 'Java' not in result['skills']

    def test_experience_extraction_from_section(self, create_resume_file):
        """Test that experience is extracted correctly from the 'experience' section."""
        resume_content = """
Education
I have a degree.

Experience
Software Engineer, Jan 2020 - Dec 2021
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        result = parser.parse()

        assert result['experience_months'] == 23

    def test_education_extraction_from_section(self, create_resume_file):
        """Test that education is extracted correctly from the 'education' section."""
        resume_content = """
Skills
I have many skills.

Education
Master of Science, Example University, 2022
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        result = parser.parse()

        assert len(result['education']) == 1
        assert result['education'][0]['degree'] == 'Master'
        assert result['education'][0]['institution'] == 'Example University'
        assert result['education'][0]['year'] == 2022

    def test_fallback_parsing(self, create_resume_file):
        """Test the fallback mechanism when no sections are found."""
        resume_content = """
This resume has no sections.
I have skills in Python and experience as a developer.
I went to the University of Nowhere.
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        result = parser.parse()

        assert 'Python' in result['skills']
        assert result['experience_months'] > 0
        assert len(result['education']) > 0

    def test_two_column_layout(self, create_resume_file):
        """Test parsing of a two-column resume."""
        resume_content = """
John Doe                 | Skills
john.doe@example.com     | Python, JavaScript, React
                         |
Education                | Experience
BS in CS, Example Uni    | Software Engineer at Tech Corp
        """
        resume_file = create_resume_file(resume_content)
        parser = ResumeParser(resume_file)
        result = parser.parse()

        assert 'Python' in result['skills']
        assert 'JavaScript' in result['skills']
        assert 'React' in result['skills']
        assert len(result['education']) > 0
        assert result['experience_months'] > 0
