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


class ResumeParser:
    """Extract structured data from resume files."""
    
    # Common skill keywords organized by category
    TECHNICAL_SKILLS = {
        'languages': [
            'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
            'kotlin', 'swift', 'typescript', 'scala', 'perl', 'r', 'matlab', 'sql',
            'html', 'css', 'xml', 'json', 'yaml', 'groovy', 'haskell', 'lisp'
        ],
        'frameworks': [
            'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'express', 'nodejs',
            'spring', 'hibernate', 'dotnet', 'asp.net', 'tensorflow', 'pytorch', 'keras',
            'sklearn', 'pandas', 'numpy', 'spark', 'hadoop', 'kafka', 'rabbitmq'
        ],
        'databases': [
            'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'cassandra', 'dynamodb', 'oracle', 'sqlserver', 'firestore', 'dynamodb',
            'mariadb', 'neo4j', 'couchdb', 'influxdb'
        ],
        'devops': [
            'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'git', 'aws',
            'azure', 'gcp', 'terraform', 'ansible', 'docker-compose', 'ci/cd',
            'linux', 'unix', 'bash', 'shell', 'nginx', 'apache'
        ],
        'tools': [
            'jira', 'confluence', 'slack', 'trello', 'asana', 'github', 'gitlab',
            'bitbucket', 'svn', 'maven', 'gradle', 'npm', 'pip', 'virtualenv'
        ],
        'ml': [
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'cv',
            'reinforcement learning', 'neural network', 'neural networks'
        ]
    }
    
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

    # Broader skill inventory for non-engineering resumes (business, ops, office, soft skills)
    GENERAL_SKILLS = [
        # Office/productivity
        'microsoft excel', 'excel', 'google sheets', 'spreadsheets', 'powerpoint', 'microsoft office',
        'word', 'ms office', 'presentation skills', 'data entry',
        # Business/analysis
        'business analysis', 'business analytics', 'market research', 'operations management',
        'supply chain', 'customer service', 'customer support', 'process improvement',
        'data analysis', 'analytics', 'reporting', 'documentation',
        # Project/program
        'project management', 'program management', 'agile', 'scrum', 'kanban',
        # Communication & collaboration
        'communication skills', 'team collaboration', 'stakeholder management', 'presentation',
        'public speaking', 'leadership', 'problem solving', 'analytical thinking',
        # Tools
        'jira', 'trello', 'asana', 'notion', 'confluence', 'slack',
    ]
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.text_content = ""
        self.raw_text = ""
        
    def extract_text(self) -> str:
        """Extract text from PDF or DOCX file."""
        try:
            if self.file_path.lower().endswith('.pdf'):
                return self._extract_from_pdf()
            elif self.file_path.lower().endswith(('.docx', '.doc')):
                return self._extract_from_docx()
            else:
                # Try both methods
                text = self._extract_from_pdf() or self._extract_from_docx()
                if text:
                    return text
                raise ValueError(f"Unsupported file format: {self.file_path}")
        except Exception as e:
            raise Exception(f"Failed to extract text from file: {str(e)}")
    
    def _extract_from_pdf(self) -> str:
        """Extract text from PDF."""
        if not HAS_PYPDF2:
            return ""
        
        try:
            text = ""
            with open(self.file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Warning: Could not extract from PDF: {e}", file=sys.stderr)
            return ""
    
    def _extract_from_docx(self) -> str:
        """Extract text from DOCX."""
        if not HAS_DOCX:
            return ""
        
        try:
            doc = Document(self.file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"Warning: Could not extract from DOCX: {e}", file=sys.stderr)
            return ""
    
    def extract_skills(self) -> List[str]:
        """Extract technical skills from resume text."""
        skills = set()
        text_lower = self.text_content.lower()
        
        # Look for "Skills" section and extract nearby words
        skills_section_pattern = r'skills?\s*:?\s*(.*?)(?:experience|education|projects|certification|$)'
        skills_matches = re.findall(skills_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if skills_matches:
            skills_text = " ".join(skills_matches)
        else:
            skills_text = text_lower

        # Normalize bullet artifacts that break word boundaries (e.g., (cid:127), •)
        skills_text = re.sub(r"\(cid:\d+\)", " ", skills_text)
        
        # Search for known skills (tech + general)
        known_skill_lists = list(self.TECHNICAL_SKILLS.values()) + [self.GENERAL_SKILLS]
        for skill_list in known_skill_lists:
            for skill in skill_list:
                pattern = r'\\b' + re.escape(skill) + r'\\b'
                if re.search(pattern, skills_text):
                    skills.add(skill.title())

        # Fallback: capture bullet/line items from the Skills section even if not in our dictionaries
        if not skills and skills_text:
            for line in skills_text.splitlines():
                cleaned_line = re.sub(r"\(cid:\d+\)", " ", line)
                cleaned_line = re.sub(r"^[^A-Za-z0-9]+", "", cleaned_line).strip()
                if not cleaned_line:
                    continue

                # Split on common delimiters inside the line
                for raw in re.split(r"[,;/|]", cleaned_line):
                    candidate = raw.strip().strip('.').strip()
                    if not candidate:
                        continue

                    words = candidate.split()
                    lead_stop = {"and", "with", "in", "for", "of", "to", "the", "a", "an", "skilled", "proficient"}
                    while words and (len(words[0]) <= 2 or words[0].lower() in lead_stop):
                        words = words[1:]

                    if len(words) == 0 or len(words) > 6:
                        continue

                    candidate_clean = " ".join(words)
                    lower = candidate_clean.lower()
                    if lower in {"skills", "skill", "experience", "internship", "projects", "education"}:
                        continue

                    normalized = re.sub(r"\s+", " ", candidate_clean).title()
                    skills.add(normalized)
        
        return sorted(list(skills))
    
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
            skills = self.extract_skills()
            education = self.extract_education()
            experience_months = self.extract_experience_months()
            projects = self.count_projects()
            completeness = self.calculate_completeness_score(skills, education, experience_months, projects)
            
            return {
                'skills': skills,
                'education': education,
                'experience_months': experience_months,
                'projects_count': projects,
                'resume_completeness_score': completeness
            }
        except Exception as e:
            raise Exception(f"Resume parsing failed: {str(e)}")


def main():
    """Main entry point for resume parser."""
    if len(sys.argv) != 2:
        print(json.dumps({
            'error': 'Usage: resume_parser.py <file_path>',
            'skills': [],
            'education': [],
            'experience_months': 0,
            'projects_count': 0,
            'resume_completeness_score': 0
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Validate file exists
    if not os.path.exists(file_path):
        print(json.dumps({
            'error': f'File not found: {file_path}',
            'skills': [],
            'education': [],
            'experience_months': 0,
            'projects_count': 0,
            'resume_completeness_score': 0
        }))
        sys.exit(1)
    
    try:
        parser = ResumeParser(file_path)
        result = parser.parse()
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'skills': [],
            'education': [],
            'experience_months': 0,
            'projects_count': 0,
            'resume_completeness_score': 0
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
