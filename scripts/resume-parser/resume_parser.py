
import json
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import sys

# Try to import PDF libraries
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("Warning: pdfplumber not installed. PDF parsing disabled.", file=sys.stderr)

# Try to import DOCX library
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not installed. DOCX parsing disabled.", file=sys.stderr)


class ResumeParser:
    """Parse resume files and extract structured data."""

    # Section keywords for semantic segmentation (ordered by priority)
    SECTION_KEYWORDS = {
        'skills': [
            'skills', 'technical skills', 'professional skills', 'core competencies',
            'competencies', 'expertise', 'proficiency', 'proficiencies',
            'technologies', 'technical expertise', 'key skills',
            'areas of expertise', 'technical proficiency', 'toolset'
        ],
        'education': [
            'education', 'academic background', 'academic', 'qualifications',
            'training', 'degrees', 'certifications', 'academic qualifications',
            'educational background', 'academic credentials'
        ],
        'experience': [
            'experience', 'work experience', 'professional experience',
            'employment', 'employment history', 'work history', 'career',
            'career history', 'professional background', 'work background',
            'positions', 'professional history'
        ],
        'projects': [
            'projects', 'selected projects', 'key projects', 'portfolio',
            'personal projects', 'side projects', 'project experience',
            'notable projects', 'project work'
        ],
    }

    # Comprehensive keyword lists for skill extraction
    PROGRAMMING_LANGUAGES = [
        'python', 'java', 'javascript', 'typescript', 'c#', 'c++', 'c',
        'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'objectivec',
        'scala', 'r', 'matlab', 'vb', 'groovy', 'dart',
        'elixir', 'clojure', 'haskell', 'lua', 'shell', 'bash'
    ]

    WEB_FRAMEWORKS = [
        'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt',
        'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
        'rails', 'laravel', 'asp.net', 'nestjs', 'fastify'
    ]

    DATABASES = [
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'oracle', 'sql server', 'sqlite',
        'firestore', 'couchdb', 'mariadb', 'neo4j', 'influxdb'
    ]

    TOOLS_PLATFORMS = [
        'git', 'github', 'gitlab', 'bitbucket', 'docker', 'kubernetes',
        'jenkins', 'circleci', 'travis', 'gitlab ci', 'aws', 'azure',
        'gcp', 'heroku', 'netlify', 'vercel', 'terraform', 'ansible',
        'prometheus', 'grafana', 'datadog', 'jira', 'confluence'
    ]

    DATA_SCIENCE = [
        'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
        'matplotlib', 'seaborn', 'jupyter', 'spark', 'hadoop',
        'kafka', 'airflow', 'dbt', 'looker', 'tableau', 'power bi'
    ]

    # Business, management, office, analytics, and soft skills
    BUSINESS_SOFT_SKILLS = [
        # Office & productivity
        'excel', 'ms excel', 'advanced excel', 'powerpoint', 'word', 'outlook', 'microsoft office',
        'google sheets', 'google docs', 'vba', 'vlookup', 'pivot tables', 'powerquery',
        # Analytics & BI
        'tableau', 'power bi', 'spss', 'sas', 'looker', 'qlik', 'excel macros',
        # Business domains
        'market research', 'marketing', 'digital marketing', 'seo', 'sem', 'social media',
        'content writing', 'copywriting', 'sales', 'business development', 'lead generation',
        'crm', 'salesforce', 'hubspot', 'customer success',
        'operations', 'operations management', 'supply chain', 'scm', 'procurement', 'logistics',
        'vendor management', 'inventory management', 'quality assurance', 'qa',
        'project management', 'pmo', 'agile', 'scrum', 'kanban', 'jira', 'confluence',
        'financial analysis', 'finance', 'accounting', 'tally', 'quickbooks',
        'erp', 'sap', 'oracle erp', 'oracle',
        # Soft skills
        'communication', 'communication skills', 'presentation', 'presentation skills',
        'interpersonal', 'leadership', 'teamwork', 'collaboration', 'problem solving',
        'analytical', 'critical thinking', 'time management', 'negotiation', 'stakeholder management'
    ]

    # Degree keywords
    DEGREE_KEYWORDS = {
        'bachelor': ['bachelor', 'b.s.', 'b.a.', 'bs', 'ba', 'undergraduate'],
        'master': ['master', 'm.s.', 'm.a.', 'ms', 'ma', 'mba', 'graduate'],
        'phd': ['phd', 'ph.d.', 'doctorate', 'doctor of philosophy'],
        'diploma': ['diploma', 'associate', 'a.s.', 'as'],
        'bootcamp': ['bootcamp', 'certification', 'certificate']
    }

    # Common education institutions for better extraction
    INSTITUTION_KEYWORDS = [
        'university', 'college', 'institute', 'school', 'academy',
        'polytechnic', 'technical', 'engineering'
    ]

    # Job role keywords to identify experience
    JOB_ROLE_KEYWORDS = [
        'engineer', 'developer', 'programmer', 'designer', 'analyst',
        'manager', 'director', 'lead', 'senior', 'junior', 'intern',
        'consultant', 'specialist', 'architect', 'scientist', 'administrator'
    ]

    # Generic words to filter out from skills (not actual skills)
    SKILL_BLOCKLIST = [
        'technical', 'knowledge', 'skills', 'skill', 'proficient', 'experience',
        'experienced', 'expertise', 'proficiency', 'ability', 'abilities',
        'strong', 'excellent', 'good', 'great', 'advanced', 'intermediate',
        'beginner', 'basic', 'familiar', 'understanding', 'working', 'hands',
        'on', 'and', 'or', 'the', 'with', 'in', 'of', 'for', 'to', 'a', 'an',
        'using', 'used', 'use', 'including', 'such', 'as', 'like', 'etc',
        'various', 'multiple', 'several', 'many', 'other', 'others', 'more',
        'technologies', 'technology', 'tools', 'tool', 'frameworks', 'framework',
        'languages', 'language', 'platforms', 'platform', 'systems', 'system',
        'software', 'hardware', 'applications', 'application', 'solutions',
        'development', 'programming', 'coding', 'building', 'creating',
        'developing', 'designing', 'implementing', 'managing', 'leading',
        'team', 'teams', 'project', 'projects', 'work', 'worked', 'working',
        'company', 'companies', 'organization', 'organizations', 'client',
        'clients', 'customer', 'customers', 'user', 'users', 'data', 'information',
        'problem', 'problems', 'solving', 'solution', 'analysis', 'design',
        'implementation', 'testing', 'deployment', 'maintenance', 'support',
        'communication', 'collaboration', 'leadership', 'management', 'time',
        'learning', 'quick', 'fast', 'efficient', 'effective', 'responsible',
        'responsibility', 'responsibilities', 'duties', 'duty', 'role', 'roles'
    ]

    # Words that indicate something is NOT an institution (false positives)
    INSTITUTION_BLOCKLIST = [
        'hackathon', 'competition', 'contest', 'event', 'conference', 'summit',
        'workshop', 'seminar', 'webinar', 'meetup', 'bootcamp', 'camp', 'fest',
        'festival', 'olympiad', 'challenge', 'award', 'prize', 'winner', 'won',
        'participated', 'participant', 'organized', 'organizer', 'hosted',
        'host', 'speaker', 'presented', 'presentation', 'talk', 'session',
        'track', 'category', 'level', 'round', 'stage', 'phase', 'final',
        'semifinal', 'quarterfinal', 'national', 'international', 'regional',
        'state', 'district', 'city', 'local', 'online', 'virtual', 'remote'
    ]

    def __init__(self, file_path: str):
        """Initialize parser with file path."""
        self.file_path = Path(file_path)
        self.text = ""
        self.lines = []
        self.sections: Dict[str, str] = {}

    def extract_text(self) -> str:
        """Extract text from PDF, DOCX, or TXT file."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found: {self.file_path}")

        file_suffix = self.file_path.suffix.lower()
        if file_suffix == '.pdf':
            if not PDF_AVAILABLE:
                raise ImportError("pdfplumber is required for PDF parsing. Install with: pip install pdfplumber")
            self.text = self._extract_pdf()
        elif file_suffix == '.docx':
            if not DOCX_AVAILABLE:
                raise ImportError("python-docx is required for DOCX parsing. Install with: pip install python-docx")
            self.text = self._extract_docx()
        elif file_suffix == '.txt':
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.text = f.read()
        else:
            raise ValueError(f"Unsupported file type: {file_suffix}")

        # Split into lines for easier processing
        self.lines = [line.strip() for line in self.text.split('\n') if line.strip()]
        return self.text

    def _extract_pdf(self) -> str:
        """Extract text from PDF file."""
        text = ""
        with pdfplumber.open(self.file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text(x_tolerance=2, y_tolerance=2) or ""
                text += "\n"
        return text

    def _extract_docx(self) -> str:
        """Extract text from DOCX file."""
        doc = Document(self.file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
        return text

    def segment_by_layout_and_rules(self):
        """Segment resume into sections using layout cues and keywords."""
        self.sections = {}
        current_section = 'header'  # Default section
        section_text = []
        lines = self.lines
        i = 0
        while i < len(lines):
            line = lines[i]
            line_lower = line.lower().strip()
            is_section_header = False

            # Check for "=====" or "-----" style separators
            if re.match(r'^[=\-—_*\s]+$', line) and i + 1 < len(lines):
                # The next line is likely the header
                header_line = lines[i+1]
                header_line_lower = header_line.lower().strip()
                for section_name, keywords in self.SECTION_KEYWORDS.items():
                    if any(kw in header_line_lower for kw in keywords):
                        if current_section:
                            self.sections[current_section] = '\n'.join(section_text)
                        
                        current_section = section_name
                        section_text = [header_line] # Keep the header
                        is_section_header = True
                        i += 1 # Skip the header line as well
                        break
            
            if not is_section_header:
                # Check if the line matches any section keyword (more flexible matching)
                # Sort by longest keyword first to prioritize more specific matches
                best_match = None
                best_match_length = 0
                
                for section_name, keywords in self.SECTION_KEYWORDS.items():
                    for kw in keywords:
                        if kw in line_lower:
                            # Ensure it looks like a header
                            # Must either:
                            # 1. End with colon (e.g., "Skills:" or "Professional Skills:")
                            # 2. Be a short standalone line (1-3 words) that IS the keyword
                            # 3. Match the keyword as a complete word/phrase at the start
                            is_header_like = False
                            
                            if line.strip().endswith(':'):
                                # Ends with colon - likely a header
                                is_header_like = True
                            elif len(line.split()) <= 3 and kw == line_lower:
                                # Short line that exactly matches the keyword
                                is_header_like = True
                            elif line_lower.startswith(kw + ' ') or line_lower.startswith(kw + ':') or line_lower == kw:
                                # Keyword at the start of line
                                is_header_like = True
                            
                            if is_header_like and len(kw) > best_match_length:
                                best_match = section_name
                                best_match_length = len(kw)
                
                if best_match:
                    if current_section:
                        self.sections[current_section] = '\n'.join(section_text)
                    
                    current_section = best_match
                    section_text = [line] # Keep the header
                    is_section_header = True
            
            if not is_section_header:
                section_text.append(line)

            i += 1

        # Add the last section
        if current_section and section_text:
            self.sections[current_section] = '\n'.join(section_text)

        # If no sections were found, treat the whole text as 'body'
        if not self.sections:
            self.sections['body'] = self.text

    def extract_skills(self) -> List[str]:
        """Extract skills (technical + business/soft) from anywhere in the resume."""
        skills_found = set()
        
        # Gather texts from all sections and the full resume
        section_texts = [
            self.sections.get('skills', ''),
            self.sections.get('experience', ''),
            self.sections.get('projects', ''),
            self.sections.get('education', ''),
        ]
        full_text = '\n'.join([t for t in section_texts if t]) + '\n' + self.text
        full_text_lower = full_text.lower()
        
        # Combine all skill lists (tech + business)
        all_skills = (
            self.PROGRAMMING_LANGUAGES
            + self.WEB_FRAMEWORKS
            + self.DATABASES
            + self.TOOLS_PLATFORMS
            + self.DATA_SCIENCE
            + self.BUSINESS_SOFT_SKILLS
        )
        
        # 1) Direct keyword spotting (whole-word matches anywhere)
        for skill in all_skills:
            if self._keyword_in_text(skill, full_text_lower):
                skills_found.add(skill.strip())
        
        # 2) Pattern-based extraction from bullets, labeled lists, and sentence forms
        skill_patterns = [
            r'^\s*[-•*]\s*(.+)',  # Bullet points
            r'(?:Languages|Libraries|Tools|Technologies|Frameworks|Databases|Skills|Expertise|Proficiencies):\s*(.+)',
            r'\b(?:proficient|experienced|skilled|expertise|expert|familiar)\s+(?:in|with)?\s+([a-zA-Z\s&/,\.\+\-]+?)(?:,| and |\.|;|\n)',
            r'\b(?:worked|work|experience|hands[-\s]*on|used|using|leveraged)\s+(?:on|with|in)?\s+([a-zA-Z\s&/,\.\+\-]+?)(?:,| and |\.|;|\n)',
        ]
        
        for pattern in skill_patterns:
            matches = re.finditer(pattern, full_text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                segment = match.group(1)
                # Split by common delimiters
                raw_items = re.split(r'[,/;\n]|\band\b', segment)
                for item in raw_items:
                    s = item.strip()
                    if not s:
                        continue
                    # Reduce noisy phrases (keep alphanumerics and spaces)
                    s_clean = re.sub(r'[^a-zA-Z0-9\s\+\.#-]', '', s)
                    if 2 <= len(s_clean) < 60 and not s_clean.isdigit():
                        skills_found.add(s_clean)
        
        return self._filter_skills(skills_found)

    def _filter_skills(self, skills_found: set) -> List[str]:
        """Filter out non-skill words and normalize skill names."""
        filtered_skills = []
        # Normalization map for common skill variations
        skill_normalization_map = {
            'js': 'JavaScript',
            'reactjs': 'React',
            'angularjs': 'Angular',
            'vuejs': 'Vue',
            'vue.js': 'Vue.js',
            'nextjs': 'Next.js',
            'nodejs': 'Node.js',
            'node.js': 'Node.js',
            'sql': 'SQL',
            'nosql': 'NoSQL',
            'c++': 'C++',
            'c#': 'C#',
            'aws': 'AWS',
            'gcp': 'GCP',
            'mongodb': 'MongoDB',
            'postgresql': 'PostgreSQL',
            'mysql': 'MySQL',
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'python': 'Python',
            'java': 'Java',
            'react': 'React',
            'angular': 'Angular',
            'vue': 'Vue',
            'docker': 'Docker',
            'kubernetes': 'Kubernetes',
            'tensorflow': 'TensorFlow',
            'pytorch': 'PyTorch',
            # Business & office normalization
            'ms excel': 'Excel',
            'advanced excel': 'Excel',
            'excel vlookup': 'Excel',
            'vlookup': 'Excel',
            'pivot tables': 'Excel',
            'powerquery': 'Excel',
            'excel macros': 'Excel',
            'microsoft office': 'Microsoft Office',
            'powerpoint': 'PowerPoint',
            'word': 'Word',
            'google sheets': 'Google Sheets',
            'google docs': 'Google Docs',
            'communication skills': 'Communication',
            'presentation skills': 'Presentation',
            'quality assurance': 'Quality Assurance',
            'qa': 'Quality Assurance',
            'operations management': 'Operations',
            'supply chain management': 'Supply Chain',
            'scm': 'Supply Chain',
            'stakeholder management': 'Stakeholder Management',
            'financial analysis': 'Financial Analysis',
            'market research': 'Market Research',
            'primary research': 'Market Research',
            'secondary research': 'Market Research',
            'jira': 'Jira',
            'confluence': 'Confluence',
            'crm': 'CRM',
            'salesforce': 'Salesforce',
            'hubspot': 'HubSpot',
            'erp': 'ERP',
            'oracle erp': 'Oracle',
            'oracle': 'Oracle',
            'tally': 'Tally',
            'quickbooks': 'QuickBooks',
        }

        for skill in skills_found:
            skill_lower = skill.lower().strip()
            
            # Skip blocklisted words
            if skill_lower in self.SKILL_BLOCKLIST or len(skill_lower) < 2 or skill_lower.isdigit():
                continue
            
            # Apply normalization
            if skill_lower in skill_normalization_map:
                skill = skill_normalization_map[skill_lower]
            else:
                skill = skill.title() # Default to title case
            
            # Prevent duplicates by adding to a set first
            filtered_skills.append(skill)
            
        return sorted(list(set(filtered_skills)))

    def _extract_institution(self, text: str) -> Optional[str]:
        """Extract institution name from a chunk of text."""
        # Find lines that contain institution keywords and are likely names
        for line in text.split('\n'):
            if any(keyword in line.lower() for keyword in self.INSTITUTION_KEYWORDS):
                # Filter out false positives
                if not any(blocked in line.lower() for blocked in self.INSTITUTION_BLOCKLIST):
                    # Extract only the institution name, not the whole line
                    match = re.search(r'([A-Z][a-zA-Z\s,]+(?:University|College|Institute|School|Academy))', line)
                    if match:
                        return match.group(1).strip().split(',')[0]
        
        # Fallback to regex if no direct match
        patterns = [
            r'([A-Z][a-zA-Z\s,]+(?:University|College|Institute|School|Academy))',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip().split(',')[0]

        return None

    def extract_education(self) -> List[Dict[str, Optional[str]]]:
        """Extract education information from resume, prioritizing the 'education' section."""
        education_list = []
        education_text = self.sections.get('education', self.text)
        
        # Split text into chunks that likely represent one institution
        # More flexible splitting: by empty lines or capital letter starts
        education_chunks = []
        current_chunk = []
        
        for line in education_text.split('\n'):
            line = line.strip()
            if not line:  # Empty line signals new chunk
                if current_chunk:
                    education_chunks.append('\n'.join(current_chunk))
                    current_chunk = []
            else:
                current_chunk.append(line)
        
        # Don't forget the last chunk
        if current_chunk:
            education_chunks.append('\n'.join(current_chunk))

        for chunk in education_chunks:
            if not chunk.strip():
                continue
                
            degree_info: Dict[str, Optional[Any]] = { 'degree': None, 'institution': None, 'year': None } 
            
            # Find degree
            for degree_type, keywords in self.DEGREE_KEYWORDS.items():
                for keyword in keywords:
                    if self._keyword_in_text(keyword, chunk.lower()):
                        degree_info['degree'] = degree_type.title()
                        break
                if degree_info['degree']:
                    break
            
            # Find institution
            institution = self._extract_institution(chunk)
            if institution:
                degree_info['institution'] = institution

            # Find year
            year = self._extract_year(chunk)
            if year:
                degree_info['year'] = self._normalize_year(year)
            
            if degree_info['degree'] and degree_info['institution']:
                education_list.append(degree_info)
            elif not self.sections.get('education') and degree_info['institution']:
                education_list.append(degree_info)


        return self._clean_education_entries(education_list)

    def extract_experience_months(self) -> int:
        """Calculate total months of experience from the 'experience' section."""
        experience_text = self.sections.get('experience', self.text)
        total_months = 0
        
        # Regex to find date ranges (more flexible)
        date_patterns = [
            r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\s*[-–—to\s]+\s*(present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{4})?',
            r'(\d{1,2})/(\d{4})\s*[-–—to\s]+\s*(\d{1,2})/(\d{4})',
            r'(\d{4})\s*[-–—to\s]+\s*(\d{4}|present|current)',
        ]
        
        durations = []

        for pattern in date_patterns:
            matches = re.finditer(pattern, experience_text, re.IGNORECASE)
            for match in matches:
                try:
                    groups = match.groups()
                    start_str = groups[0] + " " + groups[1]
                    if "present" in groups[2].lower() or "current" in groups[2].lower():
                        end_str = "present"
                    else:
                        end_str = groups[2] + " " + (groups[3] if groups[3] else "")

                    start_date = self._parse_flexible_date(start_str)
                    end_date = self._parse_flexible_date(end_str, is_end_date=True)

                    if start_date and end_date:
                        duration = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
                        if duration > 0:
                            durations.append(duration)
                except:
                    continue
        
        # Fallback for simple year calculation if no specific dates found
        if not durations:
            years = re.findall(r'\b(19|20)\d{2}\b', experience_text)
            if len(years) > 1:
                # A simple heuristic: difference between max and min year
                year_nums = [int(y) for y in years]
                total_months = (max(year_nums) - min(year_nums)) * 12
            elif any(role in experience_text.lower() for role in self.JOB_ROLE_KEYWORDS):
                # If no dates, but job roles are mentioned, estimate 1 year of experience
                total_months = 12

        return max(durations) if durations else total_months

    def _parse_flexible_date(self, date_str: str, is_end_date: bool = False) -> Optional[datetime]:
        """Parse various date formats into datetime objects."""
        date_str = date_str.lower().strip()
        
        if 'present' in date_str or 'current' in date_str:
            return datetime.now()

        # Format: "Mon YYYY" or "Month YYYY"
        match = re.search(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+)(\d{4})', date_str)
        if match:
            month_str, year = match.groups()
            month = self.get_month_from_str(month_str)
            return datetime(int(year), month, 1)

        # Format: "MM/YYYY"
        match = re.search(r'(\d{1,2})/(\d{4})', date_str)
        if match:
            month, year = match.groups()
            return datetime(int(year), int(month), 1)

        # Format: "YYYY"
        match = re.search(r'\b(19|20)\d{2}\b', date_str)
        if match:
            year = match.group(0)
            month = 12 if is_end_date else 1 # Assume end of year for end dates
            return datetime(int(year), month, 1)
            
        return None

    def get_month_from_str(self, month_str: str) -> int:
        """Convert month string to month number."""
        m = month_str.lower()[:3]
        months = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
        return months.get(m, 1)

    def extract_projects_count(self) -> int:
        """Count projects from the 'projects' section."""
        projects_text = self.sections.get('projects', self.text)
        
        # Count bullet points, numbered lists, or lines starting with a capital letter
        potential_projects = re.findall(r'(?:^|\n)\s*(?:[-•*]|\d+\.|\b[A-Z])', projects_text)
        
        return min(len(potential_projects), 20)

    def calculate_completeness_score(self) -> float:
        """Calculate resume completeness score (0-1) based on extracted data."""
        score = 0.0
        max_score = 10.0

        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', self.text):
            score += 1.5
        if re.search(r'(\+\d{1,2}\s?)?(\(?\d{3}\)?)?[\s.-]?\d{3}[\s.-]?\d{4}', self.text):
            score += 0.5

        if self.sections.get('skills'): score += 1.5
        if self.sections.get('education'): score += 1.5
        if self.sections.get('experience'): score += 1.5
        if self.sections.get('projects'): score += 0.5
        
        if self.extract_skills(): score += 1.0
        if self.extract_education(): score += 1.0
        if self.extract_experience_months() > 0: score += 1.0

        return round(min(score / max_score, 1.0), 2)

    def _keyword_in_text(self, keyword: str, text: str) -> bool:
        """Check if keyword appears in text as a whole word."""
        pattern = rf'\b{re.escape(keyword)}\b'
        return bool(re.search(pattern, text, re.IGNORECASE))

    def _extract_institution(self, text: str) -> Optional[str]:
        """Extract institution name from a chunk of text."""
        # Find lines that contain institution keywords and are likely names
        for line in text.split('\n'):
            if any(keyword in line.lower() for keyword in self.INSTITUTION_KEYWORDS):
                # Filter out false positives
                if not any(blocked in line.lower() for blocked in self.INSTITUTION_BLOCKLIST):
                    # Extract only the institution name, not the whole line
                    match = re.search(r'([A-Z][a-zA-Z\s,]+(?:University|College|Institute|School|Academy))', line)
                    if match:
                        return match.group(1).strip()
        
        # Fallback to regex if no direct match
        patterns = [
            r'([A-Z][a-zA-Z\s,]+(?:University|College|Institute|School|Academy))',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        return None

    def _extract_year(self, text: str) -> Optional[str]:
        """Extract the latest year from a text chunk."""
        years = re.findall(r'\b(19|20)\d{2}\b', text)
        return years[-1] if years else None

    def _normalize_year(self, year: Optional[str]) -> Optional[int]:
        """Normalize year string to a 4-digit integer."""
        if year and year.isdigit() and 1950 <= int(year) <= datetime.now().year + 5:
            return int(year)
        return None

    def _clean_education_entries(self, education_list: List[Dict]) -> List[Dict]:
        """Deduplicate and clean education entries."""
        seen = set()
        cleaned = []
        for entry in education_list:
            key = (entry['degree'], entry['institution'])
            if key not in seen:
                cleaned.append(entry)
                seen.add(key)
        return cleaned

    def parse(self) -> Dict:
        """Main function to parse the resume and return structured data."""
        try:
            self.extract_text()
        except Exception as e:
            print(f"[ERROR] Failed to extract text from resume: {e}", file=sys.stderr)
            return {
                'skills': [],
                'education': [],
                'experience_months': 0,
                'projects_count': 0,
                'resume_completeness_score': 0.0,
                'error': f"Text extraction failed: {str(e)}"
            }
        
        try:
            self.segment_by_layout_and_rules()
        except Exception as e:
            print(f"[ERROR] Failed to segment resume: {e}", file=sys.stderr)
            # Continue with empty sections - try to parse anyway
            self.sections = {'body': self.text}

        # Debug logging
        print(f"\n[DEBUG] Sections found: {list(self.sections.keys())}", file=sys.stderr)
        
        # Extract data with individual error handling for each component
        skills = []
        education = []
        experience_months = 0
        projects_count = 0
        completeness_score = 0.0
        
        try:
            skills = self.extract_skills()
        except Exception as e:
            print(f"[WARNING] Skill extraction failed: {e}", file=sys.stderr)
        
        try:
            education = self.extract_education()
        except Exception as e:
            print(f"[WARNING] Education extraction failed: {e}", file=sys.stderr)
        
        try:
            experience_months = self.extract_experience_months()
        except Exception as e:
            print(f"[WARNING] Experience extraction failed: {e}", file=sys.stderr)
        
        try:
            projects_count = self.extract_projects_count()
        except Exception as e:
            print(f"[WARNING] Projects extraction failed: {e}", file=sys.stderr)
        
        try:
            completeness_score = self.calculate_completeness_score()
        except Exception as e:
            print(f"[WARNING] Completeness calculation failed: {e}", file=sys.stderr)

        # Warn if parsing quality is low
        if not skills and not education and experience_months == 0:
            print("[WARNING] ⚠️  Low-quality parse. The resume might have an unusual format or be empty.", file=sys.stderr)
        
        if len(skills) < 3:
            print(f"[WARNING] Only {len(skills)} skills extracted. The resume might not have a clear skills section.", file=sys.stderr)

        return {
            'skills': skills,
            'education': education,
            'experience_months': experience_months,
            'projects_count': projects_count,
            'resume_completeness_score': completeness_score,
        }

    def to_json(self) -> str:
        """Return parsed data as a JSON string."""
        return json.dumps(self.parse(), indent=2)


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
        'resume_completeness_score': 0
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
                'resume_completeness_score': 0
            }))
        except:
            pass
        sys.exit(0)


if __name__ == '__main__':
    main()
