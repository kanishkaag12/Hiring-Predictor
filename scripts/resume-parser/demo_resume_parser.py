"""
Demo: Resume Parser - Complete Working Examples
This script demonstrates all features of the resume parser.
"""

import json
from io import StringIO
from resume_parser import ResumeParser, parse_resume


def demo_1_basic_parsing():
    """Demo 1: Basic resume parsing."""
    print("\n" + "="*70)
    print("DEMO 1: BASIC RESUME PARSING")
    print("="*70)

    # Sample resume text
    resume_text = """
    JOHN DOE
    john.doe@example.com | +1-555-0123 | linkedin.com/in/johndoe
    
    PROFESSIONAL SUMMARY
    Experienced Full Stack Developer with 5+ years in building scalable web applications.
    Proficient in Python, JavaScript, React, and AWS.
    
    EXPERIENCE
    Senior Software Engineer
    Tech Corp (Jan 2021 - Present)
    - Built microservices using Python and FastAPI
    - Developed React components for dashboard
    - Deployed applications on AWS using Docker and Kubernetes
    - Led team of 3 developers
    
    Software Engineer
    StartupXYZ (Mar 2018 - Dec 2020)
    - Developed full-stack applications using Django and React
    - Managed PostgreSQL databases
    - Implemented CI/CD pipelines with GitLab CI
    
    Junior Developer
    Web Solutions Inc (Jun 2016 - Feb 2018)
    - Maintained PHP/Laravel codebase
    - Built RESTful APIs
    
    EDUCATION
    Bachelor of Science in Computer Science
    Stanford University, 2016
    
    SKILLS
    Languages: Python, JavaScript, TypeScript, SQL
    Frameworks: React, Django, FastAPI, Express.js
    Tools: Docker, Kubernetes, Git, AWS, PostgreSQL, MongoDB
    
    PROJECTS
    - E-commerce Platform: Built full-stack e-commerce with React and Django (2021)
    - Real-time Chat App: Developed WebSocket-based chat using Node.js (2020)
    - ML Pipeline: Created machine learning pipeline for image recognition (2019)
    """

    # Parse using the ResumeParser class
    parser = ResumeParser.__new__(ResumeParser)
    parser.text = resume_text
    parser.lines = [line.strip() for line in resume_text.split('\n') if line.strip()]

    print("\n📄 EXTRACTED RESUME DATA:\n")

    # Skills
    skills = parser.extract_skills()
    print("🛠️  SKILLS:")
    for i, skill in enumerate(skills[:10], 1):
        print(f"   {i:2d}. {skill}")
    if len(skills) > 10:
        print(f"   ... and {len(skills) - 10} more")
    print(f"   Total: {len(skills)} skills")

    # Education
    education = parser.extract_education()
    print("\n🎓 EDUCATION:")
    for edu in education:
        print(f"   • {edu['degree']}")
        if edu['institution']:
            print(f"     Institution: {edu['institution']}")
        if edu['year']:
            print(f"     Year: {edu['year']}")

    # Experience
    experience = parser.extract_experience_months()
    print(f"\n💼 EXPERIENCE: {experience} months (~{experience/12:.1f} years)")

    # Projects
    projects = parser.extract_projects_count()
    print(f"\n📦 PROJECTS: {projects}")

    # Completeness
    completeness = parser.calculate_completeness_score()
    print(f"\n✅ COMPLETENESS: {completeness:.0%}")

    return parser.parse()


def demo_2_skill_extraction():
    """Demo 2: Detailed skill extraction."""
    print("\n" + "="*70)
    print("DEMO 2: SKILL EXTRACTION - RECOGNIZED CATEGORIES")
    print("="*70)

    resume_text = """
    I'm proficient in:
    - Python, Java, C++, Go, Rust
    - React, Vue, Angular, Next.js
    - PostgreSQL, MongoDB, Redis, Elasticsearch
    - AWS, Azure, Docker, Kubernetes
    - TensorFlow, PyTorch, Pandas, Scikit-learn
    - Git, Jenkins, CircleCI, Terraform
    """

    parser = ResumeParser.__new__(ResumeParser)
    parser.text = resume_text
    parser.lines = resume_text.split('\n')

    skills = parser.extract_skills()

    categories = {
        'Programming Languages': parser.PROGRAMMING_LANGUAGES,
        'Web Frameworks': parser.WEB_FRAMEWORKS,
        'Databases': parser.DATABASES,
        'Tools & Platforms': parser.TOOLS_PLATFORMS,
        'Data Science': parser.DATA_SCIENCE
    }

    print("\n")
    for category, keyword_list in categories.items():
        found = [skill for skill in skills if any(kw.lower() in skill.lower() for kw in keyword_list)]
        if found:
            print(f"{category}:")
            for skill in found:
                print(f"  ✓ {skill}")


def demo_3_experience_calculation():
    """Demo 3: Experience calculation from various date formats."""
    print("\n" + "="*70)
    print("DEMO 3: EXPERIENCE CALCULATION")
    print("="*70)

    test_cases = [
        {
            'name': 'Multiple positions',
            'text': """
            Senior Engineer: Jan 2020 - Present
            Mid-level Engineer: Mar 2018 - Dec 2019
            Junior Engineer: Jun 2016 - Feb 2018
            """
        },
        {
            'name': 'Date with months',
            'text': 'Worked from January 2019 to December 2021'
        },
        {
            'name': 'Year only',
            'text': 'Experience: 2018 - 2023'
        }
    ]

    for test in test_cases:
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = test['text']
        parser.lines = test['text'].split('\n')
        
        months = parser.extract_experience_months()
        years = months / 12 if months > 0 else 0
        
        print(f"\n{test['name']}:")
        print(f"  Calculated: {months} months (~{years:.1f} years)")


def demo_4_completeness_scoring():
    """Demo 4: Completeness scoring breakdown."""
    print("\n" + "="*70)
    print("DEMO 4: RESUME COMPLETENESS SCORING")
    print("="*70)

    test_cases = [
        {
            'name': 'Complete Professional Resume',
            'text': """
            JOHN DOE
            john.doe@example.com | +1-555-0123
            
            EXPERIENCE
            Senior Engineer at TechCorp (2020-Present)
            - Led development of microservices
            - Managed team of 5
            
            EDUCATION
            BS Computer Science, MIT, 2020
            
            SKILLS
            Python, React, AWS, Docker, PostgreSQL
            
            PROJECTS
            - Built scalable platform
            - Developed ML pipeline
            
            Contributed to open source projects.
            """
        },
        {
            'name': 'Minimal Resume',
            'text': 'John Doe, john@email.com, Python developer'
        },
        {
            'name': 'Well-organized Resume',
            'text': """
            JANE SMITH
            jane@company.com
            
            PROFESSIONAL EXPERIENCE
            Software Engineer, 2020-2023
            
            EDUCATION
            University of California, 2020
            
            TECHNICAL SKILLS
            Java, Spring Boot, AWS, MySQL
            """
        }
    ]

    print("\n")
    for test in test_cases:
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = test['text']
        parser.lines = [line.strip() for line in test['text'].split('\n') if line.strip()]
        
        score = parser.calculate_completeness_score()
        rating = "Excellent" if score >= 0.9 else "Good" if score >= 0.75 else "Average" if score >= 0.6 else "Needs Improvement"
        
        print(f"{test['name']}:")
        print(f"  Score: {score:.0%} ({rating})")


def demo_5_json_output():
    """Demo 5: JSON output format."""
    print("\n" + "="*70)
    print("DEMO 5: JSON OUTPUT FORMAT")
    print("="*70)

    resume_text = """
    ALICE JOHNSON
    alice.johnson@email.com | +1-555-9876
    
    EXPERIENCE
    Principal Engineer, Company ABC (Jan 2021 - Present)
    Staff Engineer, StartUp XYZ (Jun 2018 - Dec 2020)
    
    EDUCATION
    PhD in Computer Science, Stanford University, 2018
    
    SKILLS
    Python, Scala, Spark, Kafka, Docker, Kubernetes, AWS
    
    PROJECTS
    Developed data pipeline project
    Created ML service
    """

    parser = ResumeParser.__new__(ResumeParser)
    parser.text = resume_text
    parser.lines = [line.strip() for line in resume_text.split('\n') if line.strip()]

    result = parser.parse()

    print("\nJSON Output:")
    print(json.dumps(result, indent=2))


def demo_6_edge_cases():
    """Demo 6: Handling edge cases."""
    print("\n" + "="*70)
    print("DEMO 6: EDGE CASES")
    print("="*70)

    cases = [
        {
            'name': 'Empty Resume',
            'text': ''
        },
        {
            'name': 'Only Contact Info',
            'text': 'john@example.com, +1-555-0000'
        },
        {
            'name': 'Multiple Education Entries',
            'text': """
            BS Computer Science, Stanford, 2020
            MS Data Science, MIT, 2022
            Bootcamp: Web Development, 2023
            """
        },
        {
            'name': 'Unusual Date Formats',
            'text': 'Worked from 01/15/2020 to 12/31/2021'
        }
    ]

    for case in cases:
        print(f"\n{case['name']}:")
        parser = ResumeParser.__new__(ResumeParser)
        parser.text = case['text']
        parser.lines = [line.strip() for line in case['text'].split('\n') if line.strip()]
        
        try:
            skills = parser.extract_skills()
            education = parser.extract_education()
            experience = parser.extract_experience_months()
            completeness = parser.calculate_completeness_score()
            
            print(f"  Skills found: {len(skills)}")
            print(f"  Education entries: {len(education)}")
            print(f"  Experience: {experience} months")
            print(f"  Completeness: {completeness:.0%}")
        except Exception as e:
            print(f"  Error: {e}")


def demo_7_validation():
    """Demo 7: Data validation and quality checks."""
    print("\n" + "="*70)
    print("DEMO 7: DATA VALIDATION & QUALITY CHECKS")
    print("="*70)

    resume_text = """
    MICHAEL CHEN
    michael.chen@email.com | +1-555-1234 | linkedin.com/in/mchen
    
    SUMMARY
    Full-stack developer with 7 years of experience building production systems.
    
    EXPERIENCE
    CTO, Innovation Labs (Mar 2022 - Present)
    Lead Engineer, Tech Startup (Jan 2020 - Feb 2022)
    Senior Developer, WebCorp (Jun 2017 - Dec 2019)
    Junior Developer, StartApp (Aug 2016 - May 2017)
    
    EDUCATION
    Bachelor of Science in Computer Engineering
    California Institute of Technology, 2016
    
    CERTIFICATIONS
    AWS Certified Solutions Architect
    Google Cloud Professional
    
    TECHNICAL SKILLS
    Backend: Python, Node.js, Java, Go
    Frontend: React, TypeScript, Vue
    Infrastructure: AWS, GCP, Docker, Kubernetes
    Databases: PostgreSQL, MongoDB, Redis
    Tools: Git, Jenkins, Terraform
    
    PROJECTS
    Platform Scaling: Redesigned architecture, 10x throughput increase
    Real-time Analytics: Built streaming pipeline with Kafka
    Mobile App Backend: Created REST API serving 1M+ users
    DevOps Automation: Implemented CI/CD reducing deploy time by 75%
    
    ACHIEVEMENTS
    - Speaking: React Conference 2023, NodeConf 2022
    - Open Source: 5K+ GitHub stars
    - Mentoring: Guided 10+ junior engineers
    """

    parser = ResumeParser.__new__(ResumeParser)
    parser.text = resume_text
    parser.lines = [line.strip() for line in resume_text.split('\n') if line.strip()]

    result = parser.parse()

    print("\n📊 QUALITY ASSESSMENT:\n")

    checks = [
        ('Contact Information', bool(parser.text.find('@') >= 0)),
        ('Education Details', len(result['education']) > 0),
        ('Work Experience', result['experience_months'] > 0),
        ('Technical Skills', len(result['skills']) > 0),
        ('Projects/Achievements', result['projects_count'] > 0),
        ('Professional Summary', len(parser.text) > 500),
        ('High Completeness', result['resume_completeness_score'] > 0.7)
    ]

    for check_name, passed in checks:
        status = "✓" if passed else "✗"
        print(f"  {status} {check_name}")

    print(f"\n📈 OVERALL SCORE: {result['resume_completeness_score']:.0%}")
    print(f"   Skills: {len(result['skills'])}")
    print(f"   Education: {len(result['education'])} degree(s)")
    print(f"   Experience: {result['experience_months']} months ({result['experience_months']/12:.1f} years)")
    print(f"   Projects: {result['projects_count']}")


def main():
    """Run all demos."""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "  RESUME PARSER - COMPLETE DEMONSTRATION".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")

    demos = [
        demo_1_basic_parsing,
        demo_2_skill_extraction,
        demo_3_experience_calculation,
        demo_4_completeness_scoring,
        demo_5_json_output,
        demo_6_edge_cases,
        demo_7_validation,
    ]

    for demo in demos:
        try:
            demo()
        except Exception as e:
            print(f"\n⚠️  Error in demo: {e}")

    print("\n" + "="*70)
    print("DEMO COMPLETE!")
    print("="*70)
    print("\n✅ All demos completed successfully!")
    print("\nNext steps:")
    print("  1. Review RESUME_PARSER_README.md for full documentation")
    print("  2. Run: python resume_parser.py <resume_file.pdf>")
    print("  3. Check resume_parser_examples.py for more usage patterns")
    print("  4. Review INTEGRATION_GUIDE.md for backend integration")
    print("\n")


if __name__ == "__main__":
    main()
