"""
Example usage of the Resume Parser module.
"""

import json
from resume_parser import parse_resume, ResumeParser


def example_parse_single_file():
    """Example: Parse a single resume file."""
    print("=" * 60)
    print("EXAMPLE 1: Parse Single Resume File")
    print("=" * 60)

    # Parse a resume file
    resume_path = "path/to/resume.pdf"  # or .docx

    try:
        result = parse_resume(resume_path)
        print(json.dumps(result, indent=2))
    except FileNotFoundError:
        print(f"File not found: {resume_path}")
        print("Please provide a valid resume file path.")


def example_parse_with_details():
    """Example: Parse with detailed extraction."""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Parse with Detailed Information")
    print("=" * 60)

    resume_path = "path/to/resume.docx"

    try:
        parser = ResumeParser(resume_path)
        
        # Extract text first
        text = parser.extract_text()
        print(f"Extracted {len(text)} characters from resume\n")

        # Extract each component
        print("SKILLS:")
        skills = parser.extract_skills()
        for i, skill in enumerate(skills, 1):
            print(f"  {i}. {skill}")

        print("\nEDUCATION:")
        education = parser.extract_education()
        for edu in education:
            print(f"  - {edu['degree']}")
            if edu['institution']:
                print(f"    Institution: {edu['institution']}")
            if edu['year']:
                print(f"    Year: {edu['year']}")

        print(f"\nEXPERIENCE: {parser.extract_experience_months()} months")
        print(f"PROJECTS: {parser.extract_projects_count()} projects")
        print(f"COMPLETENESS: {parser.calculate_completeness_score():.1%}")

    except FileNotFoundError:
        print(f"File not found: {resume_path}")
    except ImportError as e:
        print(f"Import error: {e}")


def example_batch_parse():
    """Example: Parse multiple resume files."""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Batch Parse Multiple Resumes")
    print("=" * 60)

    import os
    from pathlib import Path

    # Directory containing resumes
    resume_dir = "path/to/resume_directory"

    if not os.path.isdir(resume_dir):
        print(f"Directory not found: {resume_dir}")
        print("Create a directory with resume files (.pdf or .docx)")
        return

    results = {}
    resume_files = list(Path(resume_dir).glob("*.pdf")) + list(Path(resume_dir).glob("*.docx"))

    if not resume_files:
        print("No resume files found in directory.")
        return

    print(f"Found {len(resume_files)} resume files\n")

    for file_path in resume_files:
        print(f"Parsing {file_path.name}...", end=" ")
        try:
            result = parse_resume(str(file_path))
            results[file_path.name] = result
            print("✓")
        except Exception as e:
            print(f"✗ ({e})")

    # Print summary
    print("\n" + "-" * 60)
    print("SUMMARY:")
    print("-" * 60)

    for filename, data in results.items():
        print(f"\n{filename}:")
        print(f"  Skills: {len(data['skills'])} found")
        print(f"  Education: {len(data['education'])} degree(s)")
        print(f"  Experience: {data['experience_months']} months")
        print(f"  Projects: {data['projects_count']}")
        print(f"  Completeness: {data['resume_completeness_score']:.1%}")


def example_filter_by_criteria():
    """Example: Filter resumes by criteria."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Filter Resumes by Criteria")
    print("=" * 60)

    import os
    from pathlib import Path

    resume_dir = "path/to/resume_directory"
    
    # Criteria
    required_skills = ['python', 'react', 'aws']
    min_experience_months = 24
    min_completeness = 0.7

    if not os.path.isdir(resume_dir):
        print(f"Directory not found: {resume_dir}")
        return

    qualified = []
    resume_files = list(Path(resume_dir).glob("*.pdf")) + list(Path(resume_dir).glob("*.docx"))

    for file_path in resume_files:
        try:
            result = parse_resume(str(file_path))
            
            # Check criteria
            skills_match = any(
                req_skill.lower() in skill.lower() 
                for skill in result['skills'] 
                for req_skill in required_skills
            )
            
            exp_match = result['experience_months'] >= min_experience_months
            complete_match = result['resume_completeness_score'] >= min_completeness

            if skills_match and exp_match and complete_match:
                qualified.append({
                    'file': file_path.name,
                    'data': result
                })
        except Exception:
            pass

    # Results
    print(f"\nCriteria:")
    print(f"  Required skills: {', '.join(required_skills)}")
    print(f"  Min experience: {min_experience_months} months")
    print(f"  Min completeness: {min_completeness:.0%}")
    print(f"\nQualified candidates: {len(qualified)}")

    for item in qualified:
        print(f"\n  {item['file']}:")
        print(f"    Skills: {', '.join(item['data']['skills'][:3])}...")
        print(f"    Experience: {item['data']['experience_months']} months")


if __name__ == "__main__":
    # Run examples
    # Uncomment the example you want to run

    # example_parse_single_file()
    # example_parse_with_details()
    # example_batch_parse()
    # example_filter_by_criteria()

    print("=" * 60)
    print("RESUME PARSER - EXAMPLE USAGE")
    print("=" * 60)
    print("\nUse the functions in this file to parse resumes:")
    print("  1. example_parse_single_file() - Parse one resume")
    print("  2. example_parse_with_details() - Detailed extraction")
    print("  3. example_batch_parse() - Parse multiple files")
    print("  4. example_filter_by_criteria() - Filter by skills/experience")
    print("\nFrom command line:")
    print("  python resume_parser.py path/to/resume.pdf")
