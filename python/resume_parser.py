#!/usr/bin/env python3
"""
Resume Parser Script
Extracts structured information from PDF/DOCX resumes using heuristics and regex.
"""

import sys
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Try to import PDF libraries, but don't fail if not available
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False


class ResumeParser:
    """Extract structured data from resume files."""
    
    # Flattened list of all known skills for easier extraction
    ALL_SKILLS = [
        # Programming languages
        'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
        'kotlin', 'swift', 'typescript', 'scala', 'perl', 'r', 'matlab', 'sql',
        'html', 'css', 'xml', 'json', 'yaml', 'groovy', 'haskell', 'lisp',
        # Frameworks & libraries
        'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'express', 'nodejs',
        'spring', 'hibernate', 'dotnet', 'asp.net', 'tensorflow', 'pytorch', 'keras',
        'sklearn', 'pandas', 'numpy', 'spark', 'hadoop', 'kafka', 'rabbitmq',
        # Databases
        'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'oracle', 'sqlserver', 'firestore',
        'mariadb', 'neo4j', 'couchdb', 'influxdb',
        # DevOps & cloud
        'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'git', 'aws',
        'azure', 'gcp', 'terraform', 'ansible', 'docker-compose', 'ci/cd',
        'linux', 'unix', 'bash', 'shell', 'nginx', 'apache',
        # Tools
        'jira', 'confluence', 'slack', 'trello', 'asana',
        'bitbucket', 'svn', 'maven', 'gradle', 'npm', 'pip', 'virtualenv',
        # ML & AI
        'machine learning', 'deep learning', 'nlp', 'computer vision', 'cv',
        'reinforcement learning', 'neural network', 'neural networks'
    ]
    
    # Education keywords
    EDUCATION_KEYWORDS = {
        'degree': [
            'bachelor', 'masters', 'phd', 'doctorate', 'diploma', 'certificate',
            'associate', 'b.s', 'b.a', 'm.s', 'm.a', 'm.b.a', 'mba', 'graduate'
        ],
        'field': [
            'computer science', 'computer engineering', 'software engineering',
            'information technology', 'it', 'data science', 'business', 'finance',
            'mathematics', 'physics', 'engineering', 'electrical', 'mechanical',
            'civil', 'chemistry', 'biology', 'economics', 'statistics'
        ]
    }
    
    # Experience keywords
    EXPERIENCE_KEYWORDS = [
        'experience', 'worked', 'employment', 'internship', 'project', 'developed',
        'managed', 'led', 'responsible', 'coordinated', 'supervise'
    ]
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.text_content = ""
        self.raw_text = ""
        
    def extract_text(self) -> str:
        """Extract text from PDF or DOCX file."""
        file_ext = self.file_path.lower()
        
        # Try PDF extraction first if it's a PDF
        if file_ext.endswith('.pdf'):
            # Try pdfplumber first (most reliable)
            if HAS_PDFPLUMBER:
                result = self._extract_from_pdf_pdfplumber()
                if result:
                    return result
            
            # Try PyPDF2 as fallback
            if HAS_PYPDF2:
                result = self._extract_from_pdf()
                if result:
                    return result
        
        # Try DOCX extraction if it's a docx file
        if file_ext.endswith(('.docx', '.doc')):
            result = self._extract_from_docx()
            if result:
                return result
        
        raise ValueError(f"Could not extract text from file: {self.file_path}")
    
    def _extract_from_pdf_pdfplumber(self) -> str:
        """Extract text from PDF using pdfplumber (most reliable)."""
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(self.file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Warning: pdfplumber extraction failed: {e}", file=sys.stderr)
            return ""
    
    def _extract_from_pdf(self) -> str:
        """Extract text from PDF using PyPDF2."""
        if not HAS_PYPDF2:
            return ""
        
        try:
            text = ""
            with open(self.file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Warning: PyPDF2 extraction failed: {e}", file=sys.stderr)
            return ""
    
    def _extract_from_docx(self) -> str:
        """Extract text from DOCX."""
        if not HAS_DOCX:
            return ""
        
        try:
            doc = Document(self.file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text if text else ""
        except Exception as e:
            print(f"Warning: DOCX extraction failed: {e}", file=sys.stderr)
            return ""
    
    def extract_skills(self) -> Tuple[List[str], bool]:
        """Extract skills using multi-strategy approach with warning flag."""
        return extract_skills_multi(self.text_content, self.ALL_SKILLS)
    
    def extract_education(self) -> List[Dict[str, str]]:
        """Extract education information from resume."""
        education_list = []
        text_lower = self.text_content.lower()
        
        # Find education section
        education_section_pattern = r'education\s*:?\s*(.*?)(?:experience|skills|projects|certification|$)'
        education_matches = re.findall(education_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if education_matches:
            education_text = " ".join(education_matches)
        else:
            education_text = text_lower
        
        # Look for degrees
        degree_pattern = r'(bachelor|masters|phd|doctorate|diploma|certificate|b\.s|b\.a|m\.s|m\.a|m\.b\.a|mba)\s*(?:of|in)?\s*([^,\n\.]*)'
        for match in re.finditer(degree_pattern, education_text, re.IGNORECASE):
            degree = match.group(1).title()
            field = match.group(2).strip().title() if match.group(2) else ""
            
            education_list.append({
                'degree': degree,
                'field': field if field else "",
                'institution': "",
                'year': ""
            })
        
        # Extract institution names (capitalized multi-word phrases)
        institution_pattern = r'(?:university|college|school|institute)\s+(?:of\s+)?([^,\n\.]+)'
        for match in re.finditer(institution_pattern, self.text_content, re.IGNORECASE):
            institution = match.group(1).strip()
            if len(institution) < 100:  # Sanity check
                # Add institution to last education entry if exists
                if education_list:
                    education_list[-1]['institution'] = institution
        
        # Extract years (4-digit numbers that look like years)
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, self.text_content)
        if years and education_list:
            education_list[-1]['year'] = years[-1]
        
        return education_list
    
    def extract_experience_months(self) -> int:
        """Estimate total work experience in months."""
        text_lower = self.text_content.lower()
        
        # Look for explicit experience duration mentions
        duration_pattern = r'(\d+)\+?\s*(?:years|yrs|years?)\s*(?:of\s+)?experience'
        matches = re.findall(duration_pattern, text_lower, re.IGNORECASE)
        
        if matches:
            total_years = sum(int(match) for match in matches)
            return min(total_years * 12, 600)  # Cap at 50 years
        
        # Count work-related keywords as proxy
        experience_keyword_count = sum(1 for keyword in self.EXPERIENCE_KEYWORDS 
                                       if keyword in text_lower)
        
        # Rough estimate: more keywords = more experience
        estimated_months = experience_keyword_count * 6
        return min(estimated_months, 300)  # Cap at 25 years
    
    def count_projects(self) -> int:
        """Count projects mentioned in resume."""
        text_lower = self.text_content.lower()
        
        # Look for projects section
        projects_section_pattern = r'projects?\s*:?\s*(.*?)(?:experience|skills|education|$)'
        projects_matches = re.findall(projects_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if projects_matches:
            projects_text = " ".join(projects_matches)
        else:
            projects_text = text_lower
        
        # Count project-like entries (bullet points, numbered items)
        project_count = 0
        
        # Count lines with common project indicators
        indicators = ['github', 'gitlab', 'project', 'built', 'developed', 'created', 'designed']
        lines = projects_text.split('\n')
        
        for line in lines:
            if any(indicator in line.lower() for indicator in indicators) and len(line) > 10:
                project_count += 1
        
        return max(0, project_count)
    
    def calculate_completeness_score(self, skills: List[str], education: List[Dict], 
                                     experience_months: int, projects: int) -> float:
        """Calculate resume completeness score (0-1)."""
        score = 0.0
        weights = {
            'skills': 0.25,
            'education': 0.25,
            'experience': 0.25,
            'projects': 0.25
        }
        
        # Skills component
        skills_score = min(len(skills) / 10, 1.0)
        score += weights['skills'] * skills_score
        
        # Education component
        education_score = 1.0 if len(education) > 0 else 0.0
        score += weights['education'] * education_score
        
        # Experience component
        experience_score = min(experience_months / 120, 1.0)  # 10 years = full score
        score += weights['experience'] * experience_score
        
        # Projects component
        projects_score = min(projects / 5, 1.0)  # 5 projects = full score
        score += weights['projects'] * projects_score
        
        return round(score, 2)
    
    def parse(self) -> Dict[str, Any]:
        """Parse resume and extract all information."""
        try:
            # Extract text
            self.raw_text = self.extract_text()
            if not self.raw_text:
                raise ValueError("Could not extract text from resume file")
            
            # Clean text
            self.text_content = self.raw_text.strip()
            
            # Extract components
            skills, skills_warning = self.extract_skills()
            education = self.extract_education()
            experience_months = self.extract_experience_months()
            projects = self.count_projects()
            completeness = self.calculate_completeness_score(skills, education, experience_months, projects)
            
            return {
                'skills': skills,
                'education': education,
                'experience_months': experience_months,
                'projects_count': projects,
                'resume_completeness_score': completeness,
                'skills_extraction_warning': skills_warning
            }
        except Exception as e:
            raise Exception(f"Resume parsing failed: {str(e)}")


def log_dev(msg: str):
    if os.getenv("NODE_ENV", "development") != "production":
        print(f"DEBUG: {msg}", file=sys.stderr)


def normalize_skill(skill: str) -> str:
    """Normalize a skill string."""
    return skill.strip().replace("\n", " ").strip().title()


def extract_skills_multi(text: str, all_skills: List[str]) -> Tuple[List[str], bool]:
    """
    Multi-strategy skill extraction with multiple fallback approaches.
    
    Strategies:
    a) Section-based: Find skills in dedicated sections
    b) Keyword matching: Search for known skills anywhere
    c) Sentence fallback: Last resort extraction from sentences
    """
    skills_found = set()
    warning = False
    lower_text = text.lower()
    
    section_headers = ["skills", "technical skills", "core competencies", "tools", "technologies", "expertise"]
    
    # a) Section-based parsing
    section_pattern = r"(?:^|\n)(?:" + "|".join([re.escape(h) for h in section_headers]) + r"):?[\t ]*(.*?)(?=\n\s*[A-Z][A-Za-z ]{2,}:|$)"
    sections = re.findall(section_pattern, text, flags=re.IGNORECASE | re.DOTALL)
    
    if sections:
        log_dev(f"Skill sections found: {len(sections)}")
        for sec in sections:
            # Split by bullets, dashes, commas, or newlines
            parts = re.split(r"[\n•\-*,;]", sec)
            for p in parts:
                p_clean = p.strip().lower()
                # Check if part contains any known skill
                for skill in all_skills:
                    if re.search(r"\b" + re.escape(skill.lower()) + r"\b", p_clean):
                        skills_found.add(normalize_skill(skill))
    
    # b) Direct keyword matching anywhere in text
    keyword_count = 0
    for skill in all_skills:
        if re.search(r"\b" + re.escape(skill.lower()) + r"\b", lower_text):
            skills_found.add(normalize_skill(skill))
            keyword_count += 1
    
    if keyword_count > 0:
        log_dev(f"Keywords found: {keyword_count}")
    
    # c) Sentence-based fallback (if nothing found yet)
    if not skills_found and len(text) > 100:
        log_dev("Using sentence-based fallback")
        sentences = re.split(r"[\.!?]", text)
        for sentence in sentences:
            for skill in all_skills:
                if re.search(r"\b" + re.escape(skill.lower()) + r"\b", sentence.lower()):
                    skills_found.add(normalize_skill(skill))
    
    # Convert set to sorted list
    skills_list = sorted(list(skills_found))
    
    # Set warning if no skills found
    if not skills_list:
        warning = True
    
    log_dev(f"Extracted {len(skills_list)} unique skills")
    return skills_list, warning


def main():
    """Main entry point for resume parser."""
    # ====================
    # DEFAULT RESPONSE (on any error)
    # ====================
    default_response = {
        'skills': [],
        'education': [],
        'experience_months': 0,
        'projects_count': 0,
        'resume_completeness_score': 0,
        'skills_extraction_warning': True
    }
    
    try:
        # Validate arguments
        if len(sys.argv) != 2:
            # Print to stderr for debugging, return default JSON to stdout
            print("ERROR: Usage: resume_parser.py <file_path>", file=sys.stderr)
            print(json.dumps(default_response))
            sys.exit(0)
        
        file_path = sys.argv[1]
        
        # Validate file exists
        if not os.path.exists(file_path):
            print(f"ERROR: File not found: {file_path}", file=sys.stderr)
            print(json.dumps(default_response))
            sys.exit(0)
        
        # Parse resume
        try:
            parser = ResumeParser(file_path)
            result = parser.parse()
            print(json.dumps(result))
            sys.exit(0)
        except Exception as parse_err:
            print(f"ERROR: Resume parsing failed: {str(parse_err)}", file=sys.stderr)
            print(json.dumps(default_response))
            sys.exit(0)
    
    except Exception as e:
        # Catch any unexpected errors and log to stderr
        print(f"CRITICAL ERROR: {str(e)}", file=sys.stderr)
        # Always return valid JSON to stdout, never crash
        try:
            print(json.dumps({
                'skills': [],
                'education': [],
                'experience_months': 0,
                'projects_count': 0,
                'resume_completeness_score': 0,
                'skills_extraction_warning': True
            }))
        except:
            pass
        sys.exit(0)


if __name__ == '__main__':
    main()
