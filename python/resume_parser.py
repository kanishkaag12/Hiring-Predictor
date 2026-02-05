#!/usr/bin/env python3
"""
Resume Parser Script - STRUCTURED OUTPUT VERSION
Extracts structured information from PDF/DOCX resumes using heuristics and regex.
Returns clean, categorized data for ML feature extraction.
"""

import sys
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

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
    
    # ✅ STRUCTURED SKILL CATEGORIZATION
    PROGRAMMING_LANGUAGES = [
        'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust',
        'kotlin', 'swift', 'typescript', 'scala', 'perl', 'r', 'matlab', 'c',
        'objective-c', 'dart', 'elixir', 'clojure', 'haskell', 'lisp', 'julia',
        'fortran', 'cobol', 'assembly', 'vb', 'visual basic'
    ]
    
    FRAMEWORKS_LIBRARIES = [
        'html', 'css', 'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'express', 'nodejs',
        'node.js', 'spring', 'hibernate', 'dotnet', 'asp.net', 'tensorflow', 'pytorch',
        'keras', 'sklearn', 'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib',
        'seaborn', 'spark', 'hadoop', 'kafka', 'rabbitmq', 'redux', 'next.js', 'nextjs',
        'nest.js', 'nestjs', 'vue.js', 'react.js', 'angular.js', 'jquery', 'bootstrap',
        'tailwind', 'tailwindcss', 'material-ui', 'mui', 'chakra', 'fastify', 'koa',
        'laravel', 'rails', 'ruby on rails', 'spring boot', 'struts', 'asp.net core'
    ]
    
    TOOLS_PLATFORMS = [
        'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'git', 'aws',
        'azure', 'gcp', 'google cloud', 'terraform', 'ansible', 'docker-compose',
        'ci/cd', 'linux', 'unix', 'bash', 'shell', 'nginx', 'apache', 'jira',
        'confluence', 'slack', 'trello', 'asana', 'bitbucket', 'svn', 'maven',
        'gradle', 'npm', 'pip', 'virtualenv', 'conda', 'postman', 'insomnia',
        'heroku', 'render', 'vercel', 'netlify', 'digitalocean', 'linode',
        'vscode', 'visual studio', 'intellij', 'eclipse', 'pycharm', 'webstorm',
        # Embedded systems tools
        'gdb', 'trace32', 'logic analyzer', 'oscilloscope', 'uart debugger',
        'stm32', 'raspberry pi', 'arm', 'avr', 'stm32cubeide', 'keil uvision',
        'openocd', 'jtag', 'swd', 'jlink', 'cortex'
    ]
    
    DATABASES = [
        'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'oracle', 'sqlserver', 'sql server', 'firestore',
        'mariadb', 'neo4j', 'couchdb', 'influxdb', 'sqlite', 'cockroachdb',
        'timescaledb', 'clickhouse', 'memcached', 'rethinkdb'
    ]
    
    # ❌ SOFT SKILLS TO EXCLUDE FROM TECHNICAL SKILLS
    SOFT_SKILLS = [
        'communication', 'teamwork', 'leadership', 'problem-solving', 'critical thinking',
        'analytical thinking', 'adaptability', 'time management', 'collaboration',
        'creativity', 'emotional intelligence', 'work ethic', 'interpersonal',
        'presentation', 'negotiation', 'conflict resolution', 'decision making'
    ]
    
    # ❌ NOISE PHRASES TO REMOVE (NOT SKILLS)
    NOISE_PHRASES = [
        'hands-on', 'hands on', 'co-curricular activities', 'extra-curricular',
        'extra curricular', 'academic projects', 'professional experience',
        'work experience', 'technical skills', 'programming languages',
        'tools and technologies', 'core competencies', 'areas of expertise',
        'proficient in', 'familiar with', 'experienced in', 'knowledge of'
    ]

    # ✅ CANONICAL DISPLAY NAMES
    SKILL_CANONICAL = {
        'machine learning': 'Machine Learning',
        'deep learning': 'Deep Learning',
        'data visualization': 'Data Visualization',
        'data analysis': 'Data Analysis',
        'data handling': 'Data Handling',
        'model evaluation': 'Model Evaluation',
        'feature engineering': 'Feature Engineering',
        'regression': 'Regression',
        'classification': 'Classification',
        'clustering': 'Clustering',
        'nlp': 'NLP',
        'natural language processing': 'NLP',
        'tf-idf': 'TF-IDF',
        'cosine similarity': 'Cosine Similarity',
        'cnn': 'CNN',
        'rnn': 'RNN',
        'transformers': 'Transformers',
        'python': 'Python',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'java': 'Java',
        'c': 'C',
        'c++': 'C++',
        'c#': 'C#',
        'r': 'R',
        'go': 'Go',
        'php': 'PHP',
        'ruby': 'Ruby',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'sql': 'SQL',
        'nodejs': 'Node.js',
        'node.js': 'Node.js',
        'react': 'React',
        'react.js': 'React',
        'vue': 'Vue',
        'vue.js': 'Vue',
        'angular': 'Angular',
        'angular.js': 'Angular',
        'express': 'Express',
        'django': 'Django',
        'flask': 'Flask',
        'fastapi': 'FastAPI',
        'next.js': 'Next.js',
        'nextjs': 'Next.js',
        'nestjs': 'NestJS',
        'nest.js': 'NestJS',
        'tailwind': 'Tailwind CSS',
        'tailwindcss': 'Tailwind CSS',
        'bootstrap': 'Bootstrap',
        'jquery': 'jQuery',
        'pandas': 'Pandas',
        'numpy': 'NumPy',
        'scikit-learn': 'Scikit-learn',
        'sklearn': 'Scikit-learn',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'postgres': 'PostgreSQL',
        'postgresql': 'PostgreSQL',
        'mysql': 'MySQL',
        'mongodb': 'MongoDB',
        'redis': 'Redis',
        'sqlite': 'SQLite',
        'sql server': 'SQL Server',
        'sqlserver': 'SQL Server',
        'docker': 'Docker',
        'docker-compose': 'Docker Compose',
        'kubernetes': 'Kubernetes',
        'aws': 'AWS',
        'azure': 'Azure',
        'gcp': 'GCP',
        'google cloud': 'GCP',
        'git': 'Git',
        'github': 'GitHub',
        'gitlab': 'GitLab',
        'vercel': 'Vercel',
        'render': 'Render',
        'ci/cd': 'CI/CD',
        'vscode': 'VS Code',
        'visual studio': 'Visual Studio',
        'rtos': 'RTOS',
        'i2c': 'I2C',
        'i3c': 'I3C',
        'uart': 'UART',
        'gpio': 'GPIO',
        'stm32': 'STM32',
        'linux kernel': 'Linux kernel',
        'device drivers': 'Device drivers',
        'shell': 'Shell',
        'freertos': 'FreeRTOS',
        'zephyr': 'Zephyr',
    }
    
    # ✅ CANONICAL SKILL MAPPING (Post-processing)
    CANONICAL_MAPPING = {
        'Linux kernel': 'Device Drivers',
        'Linux Kernel': 'Device Drivers',
        'Kernel': 'Device Drivers',
        'Device drivers': 'Device Drivers',
        'Device Drivers': 'Device Drivers',
        'Device driver': 'Device Drivers',
        'Device Driver': 'Device Drivers',
        'Zephyr': 'RTOS',
        'FreeRTOS': 'RTOS',
        'Freertos': 'RTOS',
        'Linux Cli': 'Linux CLI',
        'Linux cli': 'Linux CLI',
        'Shell': 'Shell Scripting',
        'shell': 'Shell Scripting',
        'STM32': 'Microcontrollers',
        'Stm32': 'Microcontrollers',
        'Raspberry Pi': 'Microcontrollers',
        'Raspberry pi': 'Microcontrollers'
    }
    
    # ❌ VAGUE CONCEPTS TO REMOVE
    VAGUE_CONCEPTS = {
        'Analytics', 'Monitoring', 'Telemetry', 'Observability',
        'System Reliability', 'System reliability', 'analytics',
        'monitoring', 'telemetry', 'observability'
    }
    
    # ❌ INVALID SKILLS (Hard delete)
    INVALID_SKILLS = {'R'}  # Unless explicitly mentioned in programming languages

    SOFT_SKILL_CANONICAL = {
        'problem-solving': 'Problem-Solving',
        'critical thinking': 'Critical Thinking',
        'analytical thinking': 'Analytical Thinking',
        'time management': 'Time Management',
        'emotional intelligence': 'Emotional Intelligence',
        'conflict resolution': 'Conflict Resolution',
        'decision making': 'Decision Making',
    }

    TECHNICAL_CONCEPTS = [
        # CS Core Subjects (for students)
        'data structures', 'data structures and algorithms', 'dsa', 'algorithms',
        'operating systems', 'os', 'dbms', 'database management system',
        'computer networks', 'networking', 'cn', 'oops', 'object oriented programming',
        'oop', 'computer organization', 'computer architecture', 'coa',
        'software engineering', 'system design', 'compiler design',
        'theory of computation', 'toc', 'automata', 'discrete mathematics',
        # Web Development (for students/freshers) - HTML/CSS moved to frameworks list
        'web development', 'frontend', 'backend',
        'rest api', 'restful api', 'api development', 'responsive design',
        # ML/Data Science
        'machine learning', 'deep learning', 'data visualization', 'data analysis',
        'data handling', 'model evaluation', 'feature engineering', 'regression',
        'classification', 'clustering', 'nlp', 'natural language processing',
        'tf-idf', 'cosine similarity', 'cnn', 'rnn', 'transformers',
        'statistical modeling', 'predictive modeling', 'time series',
        # Embedded Systems
        'embedded systems', 'rtos', 'gpio', 'uart', 'i2c', 'i3c', 'spi', 'serial communication',
        'firmware', 'device driver', 'linux driver', 'kernel module', 'hardware-software interfacing',
        'microcontroller', 'microprocessor', 'interrupt handling', 'memory management',
        'bootloader', 'cross-compilation', 'embedded c', 'freertos', 'zephyr',
        'hsi2c', 'gdb debugger', 'logic analyzer', 'trace32', 'ioctl',
        # Systems/Infrastructure
        'linux internals', 'linux cli', 'shell scripting', 'bash', 'kernel',
        'observability', 'performance optimization', 'system reliability',
        'debugging', 'profiling', 'monitoring', 'telemetry',
        # Business/Operations
        'market research', 'analytics', 'business intelligence', 'operations',
        'project management', 'agile', 'scrum', 'kanban', 'waterfall',
        'requirements analysis', 'stakeholder management', 'documentation',
    ]
    
    # Education keywords
    EDUCATION_KEYWORDS = {
        'degree': [
            'bachelor', 'masters', 'master', 'phd', 'doctorate', 'diploma', 'certificate',
            'associate', 'b.s', 'b.a', 'b.tech', 'b.e', 'm.s', 'm.a', 'm.tech',
            'm.b.a', 'mba', 'graduate', 'bca', 'mca', 'bsc', 'msc'
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
        'experience', 'worked', 'employment', 'internship', 'intern', 'project',
        'developed', 'managed', 'led', 'responsible', 'coordinated', 'supervise',
        'engineer', 'developer', 'analyst', 'consultant', 'architect', 'manager'
    ]
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.text_content = ""
        self.raw_text = ""
        self._sections_cache: Dict[str, List[str]] = {}
    
    def _clean_text(self, text: str) -> str:
        """
        PRE-CLEANING: Remove PDF artifacts and normalize separators.
        Must be called before any extraction.
        """
        if not text:
            return ""
        
        # Remove bullet symbols and PDF artifacts
        bullets = ['\uf0b7', '•', '▪', '▫', '●', '○', '■', '□', '◆', '◇']
        for bullet in bullets:
            text = text.replace(bullet, '')
        # Remove common PDF artifacts
        text = text.replace('(cid:127)', '')
        text = text.replace('\ufffd', '')
        
        # Normalize separators (but preserve hyphens in dates)
        # Replace em-dash/en-dash and pipe with hyphen
        text = text.replace('—', '-')
        text = text.replace('–', '-')
        text = text.replace('|', '-')
        
        # Normalize line breaks and whitespace WITHOUT removing newlines
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        # Collapse multiple spaces/tabs but keep newlines
        text = re.sub(r'[ \t]+', ' ', text)
        # Collapse multiple blank lines
        text = re.sub(r'\n\s*\n+', '\n', text)
        # Trim spaces on each line
        text = '\n'.join(line.strip() for line in text.split('\n'))
        
        return text.strip()
    
    def _clean_string(self, s: str) -> str:
        """Clean individual strings (roles, company names, etc.)"""
        if not s:
            return ""
        
        # Remove leading/trailing bullets
        bullets = ['\uf0b7', '•', '▪', '▫', '●', '○', '■', '□', '◆', '◇', '-', '–', '—']
        s = s.strip()
        for bullet in bullets:
            s = s.lstrip(bullet).strip()
        # Normalize separators
        s = s.replace('—', '-').replace('–', '-')
        # Remove common PDF artifacts
        s = s.replace('(cid:127)', '').replace('\ufffd', '')
        
        return s.strip()

    def _detect_section_key(self, line: str) -> Optional[str]:
        """Detect section key based on a heading line."""
        if not line:
            return None
        # Heuristic: headings are short and not full sentences (relaxed)
        if len(line) > 100:
            return None
        # Allow commas in section headings (some resumes use "Skills, Tools & Technologies")
        if '.' in line and len(line.split('.')) > 2:  # Multiple sentences
            return None

        words = line.split()
        if len(words) > 8:  # Relaxed from 6 to 8
            return None

        normalized = re.sub(r'[^a-z ]', '', line.lower()).strip()
        if not normalized:
            return None

        section_keywords = {
            'skills': ['skills', 'technical skills', 'core competencies', 'tools', 'technologies', 'expertise', 'proficiencies'],
            'projects': ['projects', 'project', 'academic projects', 'machine learning projects', 'personal projects'],
            'experience': ['experience', 'work experience', 'professional experience', 'employment', 'internship experience', 'internships', 'work history', 'employment history', 'training', 'training experience'],
            'education': ['education', 'academics', 'academic background'],
            'certifications': ['certifications', 'certificates', 'certification'],
            'summary': ['professional summary', 'summary', 'profile', 'about'],
        }

        for key, keywords in section_keywords.items():
            for kw in keywords:
                if normalized == kw or normalized.startswith(kw):
                    return key
        return None

    def _get_sections(self) -> Dict[str, List[str]]:
        """Split resume into sections by detecting headings."""
        if self._sections_cache:
            return self._sections_cache

        sections: Dict[str, List[str]] = {}
        current_key: Optional[str] = None

        lines = [l.strip() for l in self.text_content.split('\n') if l.strip()]
        for line in lines:
            detected = self._detect_section_key(line)
            if detected:
                current_key = detected
                sections.setdefault(current_key, [])
                continue

            if current_key:
                sections[current_key].append(line)

        self._sections_cache = sections
        return sections
    
    def normalize_skill(self, skill: str, raw_line: Optional[str] = None) -> Optional[str]:
        """
        ✅ CRITICAL: Normalize and clean a skill string.
        - Convert to lowercase
        - Remove noise phrases
        - Split grouped entries
        - Return None if invalid
        """
        if not skill or not isinstance(skill, str):
            return None
        
        is_group_label = False
        if skill.startswith("GROUP:"):
            is_group_label = True
            skill = skill.replace("GROUP:", "", 1)

        original = skill.strip()
        skill = original.lower()
        
        # ❌ Remove noise phrases
        if not is_group_label:
            for noise in self.NOISE_PHRASES:
                skill = re.sub(re.escape(noise), '', skill, flags=re.IGNORECASE)
        
        # ❌ Remove leading/trailing punctuation and whitespace
        skill = re.sub(r'^[\s\-:•*]+|[\s\-:•*]+$', '', skill)
        
        # ❌ Skip if too short or too long
        if len(skill) < 2 or len(skill) > 50:
            # Allow single-character languages only when explicitly mentioned
            if len(skill) == 1 and skill in ['c', 'r']:
                if raw_line:
                    pattern = r'\b' + re.escape(original) + r'\b'
                    if not re.search(pattern, raw_line, re.IGNORECASE):
                        return None
                return skill
            return None
        
        # ❌ Skip if it's a heading or category (unless it's a group label)
        if not is_group_label and skill in ['skills', 'technical skills', 'programming', 'languages', 'frameworks',
                                            'libraries', 'tools', 'databases', 'technologies', 'expertise']:
            return None
        
        # ❌ Skip if it's a soft skill
        if skill in self.SOFT_SKILLS:
            return None
        
        # ❌ Skip if it's mostly numbers or special characters
        if re.match(r'^[\d\W]+$', skill):
            return None
        
        return skill

    def format_skill_display(self, skill: str) -> str:
        """Return canonical display name for a skill."""
        skill_lower = skill.strip().lower()
        if skill_lower in self.SKILL_CANONICAL:
            return self.SKILL_CANONICAL[skill_lower]
        # Title-case fallback with common acronyms preserved
        if skill_lower in ['api', 'apis']:
            return 'API'
        if skill_lower in ['ml', 'ai', 'nlp']:
            return skill_lower.upper()
        return skill_lower.title()

    def extract_skill_items_from_line(self, line: str) -> List[str]:
        """Extract candidate skill items from a single skills line."""
        items: List[str] = []
        if not line:
            return items

        raw = line.strip()

        # Split leading bullets
        raw = re.sub(r'^[\s\-•*]+', '', raw)
        raw = raw.replace('(cid:127)', '').strip()

        # If line uses a group label like "Embedded Systems: C, C++"
        if ':' in raw:
            group_label, rest = raw.split(':', 1)
            group_label = group_label.strip()
            if group_label:
                items.append(f"GROUP:{group_label}")
            raw = rest.strip()

        # Capture parenthetical items
        paren_items = re.findall(r'\(([^\)]+)\)', raw)
        if paren_items:
            for block in paren_items:
                for part in re.split(r'[;,/]|\band\b', block, flags=re.IGNORECASE):
                    part = part.strip()
                    if part:
                        items.append(part)

        # Remove parenthetical blocks from main line
        raw = re.sub(r'\([^\)]+\)', '', raw).strip()

        # Split remaining by commas and ampersands
        for part in re.split(r'[;,]|\s&\s|\band\b', raw, flags=re.IGNORECASE):
            part = part.strip()
            if part:
                items.append(part)

        return items

    def format_soft_skill(self, skill: str) -> str:
        skill_lower = skill.strip().lower()
        if skill_lower in self.SOFT_SKILL_CANONICAL:
            return self.SOFT_SKILL_CANONICAL[skill_lower]
        return skill_lower.title()
    
    def categorize_skill(self, skill: str) -> str:
        """
        ✅ Categorize a skill into: programming_languages, frameworks_libraries,
        tools_platforms, databases, or technical_skills (general)
        STRICT RULES:
        - HTML, CSS → frameworks_libraries
        - Render, Vercel → tools_platforms
        - Networking → technical_skills ONLY if explicitly in Skills section
        """
        skill_lower = skill.lower()
        
        # Hard rules for specific skills
        if skill_lower in ['html', 'css']:
            return 'frameworks_libraries'
        elif skill_lower in ['render', 'vercel']:
            return 'tools_platforms'
        elif skill_lower in self.PROGRAMMING_LANGUAGES:
            return 'programming_languages'
        elif skill_lower in self.FRAMEWORKS_LIBRARIES:
            return 'frameworks_libraries'
        elif skill_lower in self.TOOLS_PLATFORMS:
            return 'tools_platforms'
        elif skill_lower in self.DATABASES:
            return 'databases'
        else:
            return 'technical_skills'

    def _normalize_embedded_skill(self, skill: str) -> Optional[str]:
        """Normalize embedded/system terms to standard forms."""
        if not skill:
            return None
        s = skill.strip().lower()
        
        if s in ['hsi2c']:
            return 'i2c'
        if 'zephyr' in s and 'rtos' in s:
            return 'rtos'
        if s in ['freertos']:
            return 'rtos'
        if 'linux kernel module' in s or 'kernel module' in s:
            return 'device drivers'
        if 'device driver' in s:
            return 'device drivers'
        if s in ['shell scripting', 'shell script']:
            return 'shell'
        
        return skill

    def _harvest_skills_from_texts(self, texts: List[str]) -> Dict[str, set]:
        """Harvest technical skills from arbitrary text (experience, projects, tech stack)."""
        harvested = {
            'technical_skills': set(),
            'programming_languages': set(),
            'frameworks_libraries': set(),
            'tools_platforms': set(),
            'databases': set(),
        }

        if not texts:
            return harvested

        all_known_skills = (
            self.PROGRAMMING_LANGUAGES +
            self.FRAMEWORKS_LIBRARIES +
            self.TOOLS_PLATFORMS +
            self.DATABASES
        )

        # Join for easier matching
        combined = "\n".join([t for t in texts if t])

        # Match known skills with strict boundaries (avoid prefix-only matches)
        for known_skill in all_known_skills:
            pattern = r'(?<![A-Za-z0-9])' + re.escape(known_skill) + r'(?![A-Za-z0-9])'
            if re.search(pattern, combined, re.IGNORECASE):
                category = self.categorize_skill(known_skill)
                harvested[category].add(self.format_skill_display(known_skill))

        # Match technical concepts
        for concept in self.TECHNICAL_CONCEPTS:
            pattern = r'(?<![A-Za-z0-9])' + re.escape(concept) + r'(?![A-Za-z0-9])'
            if re.search(pattern, combined, re.IGNORECASE):
                harvested['technical_skills'].add(self.format_skill_display(concept))

        # Embedded/RTOS normalization rules based on raw text
        if re.search(r'\bHSI2C\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('I2C')
        if re.search(r'\bFreeRTOS\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('RTOS')
        if re.search(r'\bZephyr\s+RTOS\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('RTOS')
        if re.search(r'\bLinux\s+kernel\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('Linux kernel')
        if re.search(r'\b(kernel\s+module|linux\s+kernel\s+module)\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('Device drivers')
        if re.search(r'\b(device\s+driver|character\s+driver)\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('Device drivers')
        if re.search(r'\bshell\s+scripting\b', combined, re.IGNORECASE):
            harvested['tools_platforms'].add('Shell')
        if re.search(r'\bstm32\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('STM32')
            harvested['technical_skills'].add('Microcontrollers')
        if re.search(r'\bUART\b', combined, re.IGNORECASE):
            harvested['technical_skills'].add('UART')

        return harvested

    def _post_process_skills(self, skills_data: Dict[str, List[str]], projects: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Final post-processing: canonical mapping, category enforcement, garbage removal, vague filtering, title case."""
        # Step 1: Promote project tools to their correct categories (NOT all to technical_skills)
        for proj in projects or []:
            for tech in proj.get('tools_methods_used', []):
                if tech:
                    # Categorize correctly instead of dumping to technical_skills
                    category = self.categorize_skill(tech.lower())
                    if category not in skills_data:
                        skills_data[category] = []
                    skills_data[category].append(tech)
        
        # Step 2: Collect all skills and apply canonical mapping
        all_skills = {}
        for category in ['technical_skills', 'programming_languages', 'frameworks_libraries', 'tools_platforms', 'databases']:
            for skill in skills_data.get(category, []):
                if not skill or not skill.strip():
                    continue
                skill = skill.strip()
                
                # Normalize embedded/system terms first
                skill = self._normalize_embedded_skill(skill)
                if not skill:
                    continue
                
                # Apply canonical mapping
                skill = self.CANONICAL_MAPPING.get(skill, skill)
                
                # Kill single-letter tokens except C
                if len(skill) == 1 and skill != 'C':
                    continue
                
                # Hard delete garbage tokens
                if skill in self.INVALID_SKILLS:
                    continue
                
                # Drop vague concepts
                if skill in self.VAGUE_CONCEPTS:
                    continue
                
                # Store with original category
                if skill not in all_skills:
                    all_skills[skill] = category
        
        # Step 3: Enforce single category per skill
        categorized = {
            'programming_languages': set(),
            'frameworks_libraries': set(),
            'tools_platforms': set(),
            'databases': set(),
            'technical_skills': set()
        }
        
        # Known programming languages
        known_languages = {'C', 'C++', 'C#', 'Python', 'Java', 'JavaScript', 'TypeScript', 
                          'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala'}
        
        # Known frameworks/libraries
        known_frameworks = {'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 
                           'Flask', 'Spring', 'Spring Boot', 'TensorFlow', 'PyTorch', 'Keras'}
        
        # Known tools/platforms
        known_tools = {'Git', 'Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Azure', 'GCP', 
                      'Linux', 'VS Code', 'IntelliJ', 'GDB', 'Trace32', 'Logic Analyzer', 
                      'Shell Scripting', 'GitHub', 'GitLab', 'Jira', 'Postman'}
        
        # Known databases
        known_databases = {'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 
                          'SQL Server', 'Cassandra', 'DynamoDB', 'Firebase'}
        
        # Hardware/boards/protocols → technical_skills
        hardware_terms = {'Microcontrollers', 'STM32', 'Raspberry Pi', 'Arduino', 'ESP32', 
                         'I2C', 'I3C', 'UART', 'SPI', 'GPIO', 'CAN', 'USB', 'Ethernet', 
                         'Device Drivers', 'RTOS', 'Firmware', 'Embedded Systems'}
        
        for skill, original_category in all_skills.items():
            # Priority: Programming languages first
            if skill in known_languages:
                categorized['programming_languages'].add(skill)
            # Hardware/boards → technical_skills
            elif skill in hardware_terms:
                categorized['technical_skills'].add(skill)
            # Tools/platforms
            elif skill in known_tools:
                categorized['tools_platforms'].add(skill)
            # Frameworks/libraries
            elif skill in known_frameworks:
                categorized['frameworks_libraries'].add(skill)
            # Databases
            elif skill in known_databases:
                categorized['databases'].add(skill)
            # Default: keep in original category
            else:
                categorized[original_category].add(skill)
        
        # Step 4: Normalize casing with title case and sort
        final_skills = {}
        for category, skills_set in categorized.items():
            # Smart title case: preserve known acronyms
            acronyms = {'I2C', 'I3C', 'UART', 'SPI', 'GPIO', 'RTOS', 'USB', 'CAN', 
                       'AWS', 'GCP', 'API', 'REST', 'HTTP', 'HTTPS', 'TCP', 'UDP', 
                       'CSS', 'HTML', 'SQL', 'NoSQL', 'CLI', 'IDE', 'CI/CD', 'NLP',
                       'CNN', 'RNN', 'ML', 'AI', 'IoT', 'MQTT', 'JSON', 'XML', 'YAML'}
            
            normalized = []
            for s in skills_set:
                # Check if skill ends with known acronym
                if s.endswith(' CLI') or s.endswith(' Cli'):
                    # Fix "Linux Cli" → "Linux CLI"
                    normalized.append(s[:-4] + ' CLI')
                elif s.upper() in acronyms:
                    normalized.append(s.upper())
                else:
                    normalized.append(s.title())
            
            final_skills[category] = sorted(set(normalized))
        
        return final_skills
        
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
            # Apply pre-cleaning
            return self._clean_text(text)
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
            # Apply pre-cleaning
            return self._clean_text(text)
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
            # Apply pre-cleaning
            return self._clean_text(text) if text else ""
        except Exception as e:
            print(f"Warning: DOCX extraction failed: {e}", file=sys.stderr)
            return ""
    
    def extract_skills(self) -> Dict[str, List[str]]:
        """
        ✅ STRUCTURED SKILL EXTRACTION
        Returns categorized skills in clean format
        STRICT RULE: Skills must appear verbatim in resume text (no hallucination)
        """
        # Combine all skill lists for detection
        all_known_skills = (
            self.PROGRAMMING_LANGUAGES +
            self.FRAMEWORKS_LIBRARIES +
            self.TOOLS_PLATFORMS +
            self.DATABASES
        )
        
        skills_by_category = {
            'technical_skills': set(),
            'programming_languages': set(),
            'frameworks_libraries': set(),
            'tools_platforms': set(),
            'databases': set(),
            'soft_skills': set()
        }
        
        sections = self._get_sections()
        skills_lines = sections.get('skills', [])
        
        # Full resume text for verbatim check
        resume_text_lower = self.text_content.lower()
        
        text_lower = "\n".join(skills_lines).lower() if skills_lines else resume_text_lower
        
        # Step 1: Extract from skills sections
        # Step 2: Process skills lines
        if skills_lines:
            section_text = "\n".join(skills_lines)
            sections = [section_text]
        else:
            sections = []

        for section in sections:
            # Process line-by-line to preserve parenthetical groups
            parts = section.split('\n')
            for part in parts:
                for item in self.extract_skill_items_from_line(part):
                    normalized = self.normalize_skill(item, raw_line=part)
                    if not normalized:
                        continue

                    matched = False
                    for known_skill in all_known_skills:
                        # VERBATIM CHECK: Skill must appear in resume text
                        if re.search(r'\b' + re.escape(known_skill) + r'\b', normalized) and \
                           re.search(r'\b' + re.escape(known_skill) + r'\b', resume_text_lower):
                            category = self.categorize_skill(known_skill)
                            skills_by_category[category].add(self.format_skill_display(known_skill))
                            matched = True

                    # Add technical concepts not in known lists (with verbatim check)
                    if not matched:
                        # Check if normalized skill appears in resume
                        if normalized in self.TECHNICAL_CONCEPTS and \
                           re.search(r'\b' + re.escape(normalized) + r'\b', resume_text_lower):
                            skills_by_category['technical_skills'].add(self.format_skill_display(normalized))
        
        # Step 3: Keyword search (fallback only if no skills section found)
        if not skills_lines:
            for known_skill in all_known_skills:
                # VERBATIM CHECK: Must appear in resume
                if re.search(r'\b' + re.escape(known_skill) + r'\b', text_lower):
                    category = self.categorize_skill(known_skill)
                    skills_by_category[category].add(self.format_skill_display(known_skill))
        
        # Step 4: Extract soft skills separately (with verbatim check)
        for soft_skill in self.SOFT_SKILLS:
            if re.search(r'\b' + re.escape(soft_skill) + r'\b', text_lower):
                skills_by_category['soft_skills'].add(self.format_soft_skill(soft_skill))
        
        # Convert sets to sorted lists
        result = {
            key: sorted(list(value), key=lambda s: s.lower())
            for key, value in skills_by_category.items()
        }
        
        # Log extraction
        total_technical = sum(len(result[k]) for k in result if k != 'soft_skills')
        log_dev(f"Extracted {total_technical} technical skills, {len(result['soft_skills'])} soft skills")
        
        return result
    
    def extract_education(self) -> List[Dict[str, str]]:
        """Extract education information from resume.
        STRICT: full degree name, complete institution (FULL phrase), start_year/end_year separated.
        RULE: Institution names often on separate line - extract LONGEST meaningful phrase.
        """
        education_list = []
        text_lower = self.text_content.lower()
        
        # Find education section
        education_section_pattern = r'education\s*:?\s*(.*?)(?:experience|skills|projects|certification|professional\s+achievements|internship|declaration|$)'
        education_matches = re.findall(education_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if education_matches:
            education_text = " ".join(education_matches)
            # Extract original text corresponding to education section
            start_idx = self.text_content.lower().find('education')
            if start_idx != -1:
                # Find end of education section
                end_keywords = ['experience', 'skill', 'project', 'certification', 'professional', 'internship', 'declaration']
                end_idx = len(self.text_content)
                for keyword in end_keywords:
                    temp_idx = self.text_content.lower().find(keyword, start_idx + 10)
                    if temp_idx != -1 and temp_idx < end_idx:
                        end_idx = temp_idx
                education_text_orig = self.text_content[start_idx:end_idx]
            else:
                education_text_orig = self.text_content
        else:
            education_text = text_lower
            education_text_orig = self.text_content
        
        # Look for degrees with full names
        degree_pattern = r'(bachelor of technology|bachelor of science|bachelor of arts|masters of technology|masters of science|master of business administration|phd|doctorate|diploma|b\.tech|b\.s|b\.a|m\.tech|m\.s|m\.a|m\.b\.a|mba)\s*(?:in|on)?\s+([^,\n\d]*)'
        for match in re.finditer(degree_pattern, education_text, re.IGNORECASE):
            degree_full = match.group(1).strip()
            # Normalize degree to full form
            if degree_full.lower() in ['b.tech', 'b.s', 'b.a']:
                degree_full = 'Bachelor of Technology' if 'tech' in degree_full.lower() else 'Bachelor of Science'
            elif degree_full.lower() in ['m.tech', 'm.s', 'm.a']:
                degree_full = 'Master of Technology' if 'tech' in degree_full.lower() else 'Master of Science'
            elif degree_full.lower() in ['mba', 'm.b.a']:
                degree_full = 'Master of Business Administration'
            else:
                degree_full = degree_full.title()
            
            field = match.group(2).strip() if match.group(2) else ""
            
            # CRITICAL: Extract field ONLY up to separators like "-", "—", "|"
            # Stop at CGPA mentions or other metadata
            if field:
                # Split by common separators
                for separator in ['-', '—', '|', 'cgpa', 'gpa', 'grade']:
                    if separator in field.lower():
                        field = field.split(separator)[0].strip()
                        break
            
            education_list.append({
                'degree': degree_full,
                'field': field if field else "",
                'institution': "",
                'start_year': "",
                'end_year': "",
                'cgpa': ""
            })
        
        # Extract institution names - PREFER institution on same line as Bachelor's degree
        # Pattern 1: Look for institution on the same line as Bachelor's/Master's degree
        institution_lines = []
        degree_lines = [line for line in education_text_orig.split('\n') 
                       if any(deg in line.lower() for deg in ['bachelor of technology', 'bachelor of science', 'master'])]
        
        for degree_line in degree_lines:
            if any(keyword in degree_line.lower() for keyword in ['university', 'college', 'institute']):
                # Extract institution from degree line
                parts = re.split(r',', degree_line)
                for i, part in enumerate(parts):
                    if any(kw in part.lower() for kw in ['university', 'institute']) and 'bachelor' not in part.lower() and 'master' not in part.lower():
                        institution_candidate = part.strip()
                        # Check if next part is location (not CGPA/year)
                        if i + 1 < len(parts):
                            next_part = parts[i + 1].strip()
                            if not any(s in next_part.lower() for s in ['cgpa', 'gpa', 'percentage', '20', 'grade', 'june', 'july', 'may', 'august']):
                                institution_candidate += ', ' + next_part
                        
                        if 5 < len(institution_candidate) < 200:
                            institution_lines.append(institution_candidate)
                        break
        
        # Pattern 2: Lines with institute/university/college/school keyword (separate line)  
        if not institution_lines:
            for line in education_text_orig.split('\n'):
                line_clean = line.strip()
                # Skip lines with just school names (high school, intermediate)
                if any(skip in line_clean.lower() for skip in ['high school', 'intermediate', 'secondary']):
                    continue
                    
                if any(keyword in line_clean.lower() for keyword in ['institute', 'university', 'college', 'school', 'academy', 'polytechnic']):
                    # Stop at CGPA, percentage, year, or common separators
                    found_stop = False
                    for stop_word in ['cgpa', 'gpa', 'percentage', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028']:
                        if stop_word in line_clean.lower():
                            found_stop = True
                            # Extract the institution part (between commas, before CGPA/year)
                            parts = re.split(r',', line_clean)
                            for i, part in enumerate(parts):
                                if any(kw in part.lower() for kw in ['institute', 'university', 'college', 'school', 'academy', 'polytechnic']):
                                    institution_candidate = part.strip()
                                    # Check if next part is location (not CGPA/year)
                                    if i + 1 < len(parts):
                                        next_part = parts[i + 1].strip()
                                        if not any(s in next_part.lower() for s in ['cgpa', 'gpa', 'percentage', '20', 'grade']):
                                            institution_candidate += ', ' + next_part
                                    
                                    if 5 < len(institution_candidate) < 200:
                                        institution_lines.append(institution_candidate)
                                    break
                            break
                    
                    if not found_stop:
                        # No stop word found, use the whole line but remove trailing metadata
                        clean_line = re.split(r'[,\-—|]', line_clean)[0].strip()
                        if 5 < len(clean_line) < 200:
                            institution_lines.append(clean_line)
        
        # Get first institution name (most relevant for Bachelor's degree)
        if institution_lines:
            institution = institution_lines[0]  # Use first match, not longest
            # Clean up any trailing commas or extra whitespace
            institution = re.sub(r',?\s*$', '', institution).strip()
            if education_list and not education_list[-1]['institution']:
                education_list[-1]['institution'] = institution
        
        # Pattern 2: Fallback - regex for institution phrases if pattern 1 didn't work
        if education_list and not education_list[-1]['institution']:
            institution_pattern = r'([A-Z][A-Za-z\s&,.-]*(?:University|College|School|Institute|Academy|Polytechnic)[A-Za-z\s&,.-]*?)(?:,|$)'
            institution_match = re.search(institution_pattern, education_text_orig)
            if institution_match:
                institution = institution_match.group(1).strip()
                education_list[-1]['institution'] = institution
        
        # Extract years (4-digit numbers that look like years) - find start and end
        year_pattern = r'\b(20\d{2}|19\d{2})\b'
        years = [int(y) for y in re.findall(year_pattern, education_text)]
        if len(years) >= 2 and education_list:
            education_list[-1]['start_year'] = str(min(years))
            education_list[-1]['end_year'] = str(max(years))
        elif len(years) == 1 and education_list:
            education_list[-1]['end_year'] = str(years[0])
        
        # Extract CGPA from education section
        cgpa_pattern = r'(?:cgpa|gpa|grade)\s*[:/,]?\s*([0-9.]+)\s*(?:/\s*([0-9.]+))?'
        cgpa_match = re.search(cgpa_pattern, education_text, re.IGNORECASE)
        if cgpa_match and education_list:
            cgpa_val = cgpa_match.group(1)
            cgpa_scale = cgpa_match.group(2) if cgpa_match.group(2) else '10.0'
            education_list[-1]['cgpa'] = f"{cgpa_val}/{cgpa_scale}"
        
        return education_list
    
    def extract_experience_months(self) -> int:
        """
        ✅ IMPROVED: Extract total work experience in months.
        Looks for explicit duration mentions and date ranges.
        """
        text_lower = self.text_content.lower()
        total_months = 0
        
        # Strategy 1: Look for explicit duration mentions
        # "3 years of experience", "2+ years", "5 yrs experience"
        duration_pattern = r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?'
        matches = re.findall(duration_pattern, text_lower, re.IGNORECASE)
        
        if matches:
            total_years = sum(int(match) for match in matches)
            total_months = min(total_years * 12, 600)  # Cap at 50 years
            log_dev(f"Found explicit experience: {total_years} years = {total_months} months")
            return total_months
        
        # Strategy 2: Extract date ranges from experience section
        # Look for patterns like "Jan 2020 - Dec 2021", "2019-2020", "2018 to 2020"
        date_range_pattern = r'(\d{4})\s*[-–to]+\s*(\d{4}|present|current)'
        date_matches = re.findall(date_range_pattern, text_lower, re.IGNORECASE)
        
        if date_matches:
            import datetime
            current_year = datetime.datetime.now().year
            
            for start, end in date_matches:
                start_year = int(start)
                if end.lower() in ['present', 'current']:
                    end_year = current_year
                else:
                    end_year = int(end)
                
                duration_years = max(0, end_year - start_year)
                total_months += duration_years * 12
            
            total_months = min(total_months, 600)  # Cap at 50 years
            log_dev(f"Calculated from date ranges: {total_months} months")
            return total_months
        
        # Strategy 3: Count experience keywords as proxy (fallback)
        experience_keyword_count = sum(
            1 for keyword in self.EXPERIENCE_KEYWORDS 
            if keyword in text_lower
        )
        
        # Rough estimate: more keywords = more experience
        estimated_months = min(experience_keyword_count * 3, 120)  # Cap at 10 years
        log_dev(f"Estimated from keywords: {estimated_months} months")
        return estimated_months

    def _parse_duration_and_dates(self, text: str) -> Tuple[int, str, str]:
        """Parse duration in months and normalized YYYY-MM start/end dates from a text block."""
        import datetime
        text_lower = text.lower()
        today = datetime.date.today()

        month_map = {
            'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
            'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
            'aug': 8, 'august': 8, 'sep': 9, 'sept': 9, 'september': 9, 'oct': 10,
            'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
        }

        # Date range: Mon YYYY - Mon YYYY / Present
        month_range = re.search(
            r'(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|'
            r'sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{4})\s*[-–—to]+\s*'
            r'(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|'
            r'sep|sept|september|oct|october|nov|november|dec|december|present|current)\s*(\d{4})?',
            text_lower
        )
        if month_range:
            start_month = month_map.get(month_range.group(1), 1)
            start_year = int(month_range.group(2))
            end_token = month_range.group(3)
            if end_token in ['present', 'current']:
                end_year = today.year
                end_month = today.month
            else:
                end_month = month_map.get(end_token, 1)
                end_year = int(month_range.group(4)) if month_range.group(4) else start_year

            duration = max(0, (end_year - start_year) * 12 + (end_month - start_month) + 1)
            start_date = f"{start_year:04d}-{start_month:02d}"
            end_date = f"{end_year:04d}-{end_month:02d}"
            return duration, start_date, end_date

        # Date range: YYYY - YYYY or YYYY - Present
        range_match = re.search(r'(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)', text_lower)
        if range_match:
            start_year = int(range_match.group(1))
            end_raw = range_match.group(2)
            if end_raw in ['present', 'current']:
                end_year = today.year
                end_month = today.month
            else:
                end_year = int(end_raw)
                end_month = 12
            start_month = 1
            duration = max(0, (end_year - start_year) * 12 + (end_month - start_month) + 1)
            start_date = f"{start_year:04d}-{start_month:02d}"
            end_date = f"{end_year:04d}-{end_month:02d}"
            return duration, start_date, end_date

        # Explicit months
        months_match = re.search(r'(\d{1,2})\s*(?:months?|mos?)', text_lower)
        if months_match:
            return int(months_match.group(1)), "", ""

        # Explicit years
        years_match = re.search(r'(\d{1,2})\s*(?:years?|yrs?)', text_lower)
        if years_match:
            return int(years_match.group(1)) * 12, "", ""

        return 0, "", ""

    def _parse_duration_months(self, text: str) -> int:
        """Parse duration in months from a text block."""
        duration, _, _ = self._parse_duration_and_dates(text)
        return duration
    
    def infer_soft_skills_from_responsibilities(self, responsibilities: List[str]) -> List[str]:
        """Infer soft skills from action verbs in responsibilities.
        STRICT: Only infer from actual responsibility verbs.
        """
        soft_skills = set()
        
        # Verb to soft skill mapping
        verb_soft_skill_map = {
            'collaborated': ['collaboration', 'teamwork'],
            'cooperated': ['collaboration', 'teamwork'],
            'partnered': ['teamwork', 'collaboration'],
            'developed': ['problem solving', 'technical thinking'],
            'designed': ['problem solving', 'creativity'],
            'improved': ['problem solving', 'analytical thinking'],
            'optimized': ['analytical thinking', 'problem solving'],
            'evaluated': ['analytical thinking', 'critical thinking'],
            'led': ['leadership'],
            'managed': ['leadership'],
            'mentored': ['leadership'],
            'presented': ['communication', 'presentation'],
            'communicated': ['communication'],
            'negotiated': ['communication', 'negotiation'],
            'delegated': ['leadership'],
            'coordinated': ['teamwork', 'collaboration'],
            'resolved': ['problem solving', 'conflict resolution'],
        }
        
        for responsibility in responsibilities:
            responsibility_lower = responsibility.lower()
            for verb, skills in verb_soft_skill_map.items():
                if verb in responsibility_lower:
                    soft_skills.update(skills)
        
        return list(soft_skills)
    
    def extract_certifications(self) -> List[str]:
        """Extract certifications from resume - ONLY certificate titles, not descriptions."""
        certifications = []
        text_lower = self.text_content.lower()
        
        # Find certifications section
        cert_section_pattern = r'certification\w*\s*:?\s*(.*?)(?:project|experience|education|skill|$)'
        cert_matches = re.findall(cert_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if cert_matches:
            cert_text = " ".join(cert_matches)
            # Extract bullet points or lines
            lines = [line.strip() for line in cert_text.split('\n') if line.strip()]
            for line in lines:
                # Remove bullet points
                line = re.sub(r'^[\u2022\-\*]\s*', '', line)
                
                # Skip description lines that start with action verbs
                if any(line.lower().startswith(verb) for verb in ['learnt', 'learned', 'created', 'built', 'developed', 'implemented', 'gained', 'studied']):
                    continue
                
                # Only include if it's a reasonable certificate title
                if 10 < len(line) < 200:
                    certifications.append(line.strip())
        
        return certifications
    
    def extract_experience_details(self) -> List[Dict[str, Any]]:
        """
        ✅ Extract ALL detailed experience entries (multiple companies supported).
        STRICT: Each role+company+date is a separate entry.
        Types: full-time, internship, freelance, contract
        """
        experiences = []
        sections = self._get_sections()
        exp_lines = sections.get('experience', [])

        # DEBUG: Log detected sections
        log_dev(f"Sections detected: {list(sections.keys())}")
        for section_key, section_lines in sections.items():
            log_dev(f"  Section '{section_key}': {len(section_lines)} lines")
            if section_key == 'experience' and section_lines:
                log_dev(f"    First 5 lines: {section_lines[:5]}")

        if not exp_lines:
            log_dev("No experience section found")
            return experiences

        exp_text = "\n".join(exp_lines)
        
        # Pattern for complete date ranges - support multiple formats
        # Format 1: "May 2024 – July 2024" or "May 2024 - Present"
        # Support various separators (match any 1-3 characters between dates)
        # Support both abbreviated (Jan, Feb) and full month names (January, February)
        month_names = r'(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)'
        date_pattern1 = month_names + r'\s+(\d{4})\s*(.{1,3})\s*' + month_names + r'\s+(\d{4})?'
        # Format 2: "2022 - 2025" or "2022 to Present"
        date_pattern2 = r'(\d{4})\s*(.{1,3})\s*(\d{4}|Present|Current)'
        
        # Find all date line indices using both patterns
        date_indices = []
        for i, line in enumerate(exp_lines):
            if re.search(date_pattern1, line, re.IGNORECASE) or re.search(date_pattern2, line, re.IGNORECASE):
                date_indices.append(i)
                log_dev(f"Found date line at index {i}: {line[:60]}")
        
        if not date_indices:
            log_dev("No date patterns found in experience section, using fallback extraction")
            # Fallback: Use text-based splitting
            entries = re.split(r'\n\n+', exp_text)
            
            for entry in entries:
                entry = entry.strip()
                if len(entry) < 10:
                    continue
                
                lines = [l.strip() for l in entry.split('\n') if l.strip()]
                if not lines:
                    continue
                
                # Extract responsibilities (bullets)
                responsibilities = []
                for l in lines:
                    if re.match(r'^(•|\-|\*|\(cid:127\))', l):
                        responsibilities.append(re.sub(r'^(•|\-|\*|\(cid:127\))\s*', '', l).strip())
                
                # Find date line in this entry
                date_line = ''
                for l in lines:
                    if re.search(date_pattern1, l, re.IGNORECASE) or re.search(date_pattern2, l, re.IGNORECASE):
                        date_line = l
                        break
                
                if not date_line:
                    continue
                
                # Extract role and company
                role = ''
                company = ''
                for i, l in enumerate(lines):
                    if l == date_line or re.match(r'^(•|\-|\*|\(cid:127\))', l):
                        continue
                    if not role:
                        role = l
                    elif not company:
                        company = l
                        break
                
                if not role:
                    continue
                
                # Parse duration and normalized dates
                duration_months, start_date, end_date = self._parse_duration_and_dates(date_line)
                
                # Classify type
                role_lower = role.lower()
                exp_type = 'internship' if 'intern' in role_lower else 'full-time'
                
                if duration_months == 0:
                    duration_months = 6 if exp_type == 'internship' else 12
                    start_date = ''
                    end_date = ''
                
                experiences.append({
                    'role': role[:100],
                    'company': company[:100] if company else '',
                    'duration_months': duration_months,
                    'type': exp_type,
                    'responsibilities': responsibilities,
                    'start_date': start_date,
                    'end_date': end_date
                })
            
            log_dev(f"Extracted {len(experiences)} experience entries (fallback)")
            return experiences
        
        # Process each job entry
        for j, date_idx in enumerate(date_indices):
            # Determine the range for this entry
            # Role/Company are 1-2 lines BEFORE the date line OR on the same line
            # Responsibilities are AFTER the date line until next date or end
            
            # Start position: look back up to 4 lines before date for role/company
            start_idx = max(0, date_idx - 4)
            
            # End position: up to next date line (or end of section)
            if j + 1 < len(date_indices):
                end_idx = date_indices[j + 1]
            else:
                end_idx = len(exp_lines)
            
            # Extract role and company (lines BEFORE date)
            role = ''
            company = ''
            pre_date_lines = []
            
            for k in range(start_idx, date_idx):
                line = exp_lines[k].strip()
                if line and not re.match(r'^(•|\-|\*|\(cid:127\))', line):
                    pre_date_lines.append(line)
            
            # Typical pattern: Role title, then Company/Location
            # Role is usually shorter and comes first
            # Company often has location info (city, state, country)
            if len(pre_date_lines) >= 2:
                # Check which line has location indicators (likely company)
                line1_has_location = any(word in pre_date_lines[-2].lower() for word in ['india', 'bangalore', 'delhi', 'mumbai', 'usa', 'inc', 'ltd', 'llc', 'corp', 'labs', 'ai', 'technology'])
                line2_has_location = any(word in pre_date_lines[-1].lower() for word in ['india', 'bangalore', 'delhi', 'mumbai', 'usa', 'inc', 'ltd', 'llc', 'corp', 'labs', 'ai', 'technology'])
                
                if line2_has_location and not line1_has_location:
                    # Last line is company, second-to-last is role
                    role = pre_date_lines[-2]
                    company = pre_date_lines[-1]
                else:
                    # Last line is role, second-to-last is company (or could be swapped)
                    # If last line is very short (< 30 chars), it's likely role
                    if len(pre_date_lines[-1]) < 30:
                        role = pre_date_lines[-1]
                        company = pre_date_lines[-2]
                    else:
                        role = pre_date_lines[-1]
                        company = pre_date_lines[-2]
            elif len(pre_date_lines) == 1:
                role = pre_date_lines[0]
            
            # Fallback: If no role found before date, check line after date or try to parse from date line itself
            if not role:
                # Some resumes have "Role - Date" on same line
                date_line_text = exp_lines[date_idx].strip()
                parts = date_line_text.split('–')
                if len(parts) >= 2:
                    potential_role = parts[0].strip()
                    if len(potential_role) < 100 and not re.search(r'\d{4}', potential_role):
                        role = potential_role
            
            # Extract date line
            date_line = exp_lines[date_idx].strip()
            
            # Extract responsibilities (lines AFTER date)
            responsibilities = []
            for k in range(date_idx + 1, end_idx):
                line = exp_lines[k].strip()
                if re.match(r'^(•|\-|\*|\(cid:127\))', line):
                    resp_text = re.sub(r'^(•|\-|\*|\(cid:127\))\s*', '', line).strip()
                    if resp_text and len(resp_text) > 5:
                        responsibilities.append(resp_text)
            
            if not role:
                continue
            
            # Parse duration and normalized dates from date line
            duration_months, start_date, end_date = self._parse_duration_and_dates(date_line)
            
            # Clean role and company names (remove bullets/artifacts)
            role = self._clean_string(role)
            company = self._clean_string(company)
            
            # Classify type - check ONLY role title, not full entry text
            role_lower = role.lower()
            if 'intern' in role_lower:
                exp_type = 'internship'
            elif 'training' in role_lower or 'trainee' in role_lower:
                exp_type = 'training'
            elif 'freelance' in role_lower or 'contractor' in role_lower:
                exp_type = 'freelance' if 'freelance' in role_lower else 'contract'
            else:
                exp_type = 'full-time'
            
            # Fallback duration
            if duration_months == 0:
                duration_months = 6 if exp_type == 'internship' else 12
                start_date = ''
                end_date = ''
            
            # Clean responsibilities
            cleaned_responsibilities = [self._clean_string(r) for r in responsibilities]
            
            experiences.append({
                'role': role[:100],
                'company': company[:100] if company else '',
                'duration_months': duration_months,
                'type': exp_type,
                'responsibilities': cleaned_responsibilities,
                'start_date': start_date,
                'end_date': end_date
            })
        
        log_dev(f"Extracted {len(experiences)} experience entries")
        return experiences
    
    def count_projects(self) -> int:
        """
        ✅ IMPROVED: Count projects mentioned in resume.
        Looks for explicit project entries.
        """
        text_lower = self.text_content.lower()
        
        # Look for projects section
        projects_section_pattern = r'projects?\s*:?\s*(.*?)(?:experience|skills|education|certification|$)'
        projects_matches = re.findall(projects_section_pattern, text_lower, re.IGNORECASE | re.DOTALL)
        
        if not projects_matches:
            # No projects section found
            log_dev("No projects section found")
            return 0
        
        projects_text = projects_matches[0]
        
        # Strategy 1: Count bullet points or numbered items
        bullet_pattern = r'(?:^|\n)\s*[•\-\*\d+\.]\s+'
        bullet_count = len(re.findall(bullet_pattern, projects_text))
        
        if bullet_count > 0:
            log_dev(f"Found {bullet_count} projects from bullet points")
            return min(bullet_count, 20)  # Cap at 20
        
        # Strategy 2: Count lines with project indicators
        indicators = ['github', 'gitlab', 'project', 'built', 'developed', 
                     'created', 'designed', 'implemented']
        lines = projects_text.split('\n')
        
        project_count = 0
        for line in lines:
            if any(indicator in line.lower() for indicator in indicators) and len(line) > 15:
                project_count += 1
        
        log_dev(f"Found {project_count} projects from indicators")
        return min(max(0, project_count), 20)  # Cap at 20
    
    def extract_projects_details(self) -> List[Dict[str, Any]]:
        """
        ✅ Extract detailed project entries with tools/methods.
        Returns list of project objects with title, description, tools_methods_used.
        """
        projects = []
        sections = self._get_sections()
        proj_lines = sections.get('projects', [])

        if not proj_lines:
            return projects

        proj_text = "\n".join(proj_lines)
        
        # Parse line-based projects: title line followed by bullets
        lines = [l.strip() for l in proj_text.split('\n') if l.strip()]
        current_title = ''
        current_desc: List[str] = []

        def flush_project():
            nonlocal current_title, current_desc
            if not current_title:
                return
            description = "\n".join(current_desc).strip()
            
            # Extract tools/methods ONLY from project description and tech lines
            tools_methods = []
            
            # STRICT: Only check project description, not entire resume
            project_text = description.lower()
            
            # Check for known tools in THIS project's description only
            known_tools = self.FRAMEWORKS_LIBRARIES + self.PROGRAMMING_LANGUAGES + self.TOOLS_PLATFORMS + self.DATABASES
            for tool in known_tools:
                # Must appear verbatim in project description
                if re.search(r'\b' + re.escape(tool.lower()) + r'\b', project_text):
                    # Add canonical form if available
                    canonical = self.SKILL_CANONICAL.get(tool.lower(), tool.title())
                    if canonical not in tools_methods:
                        tools_methods.append(canonical)
            
            # Extract method names from project description only
            method_patterns = [
                r'(?:TF-IDF|TF/IDF|tfidf)',
                r'(?:Cosine Similarity|cosine similarity)',
                r'(?:Random Forest|random forest)',
                r'(?:Logistic Regression|logistic regression)',
                r'(?:Neural Network|neural networks)',
                r'(?:Feature Engineering|feature engineering)',
                r'(?:Hyperparameter Tuning|hyperparameter tuning)',
                r'(?:Exploratory Data Analysis|EDA)',
                r'(?:NLP|Natural Language Processing)',
                r'(?:CNN|Convolutional Neural Network)',
                r'(?:RNN|Recurrent Neural Network)',
                r'(?:LSTM|Long Short-Term Memory)',
            ]
            for pattern in method_patterns:
                if re.search(pattern, description, re.IGNORECASE):
                    match = re.search(pattern, description, re.IGNORECASE)
                    method = match.group(0)
                    if method not in tools_methods:
                        tools_methods.append(method)
            
            projects.append({
                'title': current_title[:100],
                'description': description[:300],
                'tools_methods_used': tools_methods
            })
            current_title = ''
            current_desc = []

        for line in lines:
            # Skip section heading line if included
            if self._detect_section_key(line) == 'projects':
                continue
            
            # Check if line is a bullet or description line
            is_bullet = (
                re.match(r'^(•|\-|\*|\(cid:127\))', line) or  # Starts with bullet
                line.lower().startswith('developed') or
                line.lower().startswith('built') or
                line.lower().startswith('created') or
                line.lower().startswith('implemented') or
                line.lower().startswith('integrated') or
                line.lower().startswith('demonstrated') or
                line.lower().startswith('used') or
                line.lower().startswith('leveraged') or
                line.lower().startswith('designed') or
                line.lower().startswith('technologies:') or
                line.lower().startswith('tech stack:') or
                (current_title and not re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})', line, re.IGNORECASE))  # Not a title with date
            )
            
            # Detect title line (has date or looks like a title)
            if not is_bullet and (re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})', line, re.IGNORECASE) or not current_title):
                # New title encountered
                if current_title:
                    flush_project()
                current_title = line
                continue

            # Bullet/description line
            bullet_text = re.sub(r'^(•|\-|\*|\(cid:127\))\s*', '', line).strip()
            if bullet_text:
                current_desc.append(bullet_text)

        flush_project()
        
        log_dev(f"Extracted {len(projects)} detailed projects")
        return projects[:20]  # Cap at 20
    
    def extract_cgpa(self) -> Optional[float]:
        """
        ✅ NEW: Extract CGPA from resume.
        Looks for patterns like "CGPA: 8.5", "GPA: 3.8/4.0", "8.5/10"
        Normalizes to 10-point scale.
        """
        text = self.text_content
        
        # Pattern 1: "CGPA: 8.5" or "GPA: 8.5"
        cgpa_pattern = r'(?:cgpa|gpa)\s*:?\s*(\d+\.?\d*)\s*(?:/\s*(\d+\.?\d*))?'
        matches = re.findall(cgpa_pattern, text, re.IGNORECASE)
        
        if matches:
            value = float(matches[0][0])
            max_scale = float(matches[0][1]) if matches[0][1] else 10.0
            
            # Normalize to 10-point scale
            if max_scale == 4.0:
                normalized = (value / 4.0) * 10.0
            elif max_scale == 5.0:
                normalized = (value / 5.0) * 10.0
            elif max_scale == 10.0:
                normalized = value
            else:
                normalized = value  # Assume 10-point scale
            
            log_dev(f"Extracted CGPA: {normalized}/10 (from {value}/{max_scale})")
            return round(min(normalized, 10.0), 2)
        
        # Pattern 2: Standalone number like "8.5/10" or "3.8/4.0"
        standalone_pattern = r'\b(\d+\.?\d*)\s*/\s*(\d+\.?\d*)\b'
        matches = re.findall(standalone_pattern, text)
        
        for match in matches:
            value = float(match[0])
            max_scale = float(match[1])
            
            # Check if it's a reasonable GPA range
            if 0 <= value <= max_scale and max_scale in [4.0, 5.0, 10.0]:
                if max_scale == 4.0:
                    normalized = (value / 4.0) * 10.0
                elif max_scale == 5.0:
                    normalized = (value / 5.0) * 10.0
                else:
                    normalized = value
                
                log_dev(f"Extracted CGPA: {normalized}/10 (from {value}/{max_scale})")
                return round(min(normalized, 10.0), 2)
        
        log_dev("No CGPA found in resume")
        return None
    
    def calculate_completeness_score(self, skills_data: Dict[str, List[str]], 
                                     education: List[Dict], experience_months: int, 
                                     projects: int) -> float:
        """Calculate resume completeness score (0-1)."""
        score = 0.0
        weights = {
            'skills': 0.25,
            'education': 0.25,
            'experience': 0.25,
            'projects': 0.25
        }
        
        # Skills component (count only technical skills, not soft skills)
        total_technical = sum(
            len(skills_data[k]) for k in skills_data 
            if k != 'soft_skills'
        )
        skills_score = min(total_technical / 10, 1.0)
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
        """
        ✅ MAIN PARSING METHOD - STRUCTURED OUTPUT
        Returns clean, categorized resume data for ML
        """
        try:
            # Extract text
            self.raw_text = self.extract_text()
            if not self.raw_text:
                raise ValueError("Could not extract text from resume file")
            
            # Clean text
            self.text_content = self.raw_text.strip()
            
            # ✅ Extract structured components
            skills_data = self.extract_skills()
            education = self.extract_education()
            experience_months = self.extract_experience_months()
            experience_details = self.extract_experience_details()
            projects_count = self.count_projects()
            projects_details = self.extract_projects_details()
            cgpa = self.extract_cgpa()

            # ✅ CRITICAL: experience_months_total MUST equal sum of experience entries only
            # DO NOT use date range calculation (that can include education dates)
            if experience_details:
                experience_months = sum(e.get('duration_months', 0) for e in experience_details)
            else:
                experience_months = 0

            if projects_details:
                projects_count = max(projects_count, len(projects_details))
            
            # ✅ Cross-section skill harvesting (experience, projects, tech stack, full resume)
            harvest_texts = [self.text_content]
            if experience_details:
                for exp in experience_details:
                    harvest_texts.extend(exp.get('responsibilities', []))
            if projects_details:
                for proj in projects_details:
                    harvest_texts.append(proj.get('description', ''))
            harvested = self._harvest_skills_from_texts(harvest_texts)
            for key in ['technical_skills', 'programming_languages', 'frameworks_libraries', 'tools_platforms', 'databases']:
                skills_data[key].extend(list(harvested.get(key, [])))

            # ✅ Infer soft skills from responsibilities if not already extracted
            soft_skills_inferred = []
            if experience_details and not skills_data['soft_skills']:
                all_responsibilities = []
                for exp in experience_details:
                    all_responsibilities.extend(exp.get('responsibilities', []))
                soft_skills_inferred = self.infer_soft_skills_from_responsibilities(all_responsibilities)
            
            # Merge soft skills
            combined_soft_skills = list(set(skills_data['soft_skills'] + soft_skills_inferred))

            # ✅ Required final post-processing of skills
            skills_data = self._post_process_skills(skills_data, projects_details)
            
            # Calculate completeness
            completeness = self.calculate_completeness_score(
                skills_data, education, experience_months, projects_count
            )
            
            # ✅ Extract certifications
            certifications = self.extract_certifications()
            
            # ✅ RETURN STRUCTURED DATA (PRODUCTION-GRADE)
            result = {
                # ✅ Categorized technical skills
                'technical_skills': skills_data['technical_skills'],
                'programming_languages': skills_data['programming_languages'],
                'frameworks_libraries': skills_data['frameworks_libraries'],
                'tools_platforms': skills_data['tools_platforms'],
                'databases': skills_data['databases'],
                
                # ✅ Soft skills (inferred from responsibilities)
                'soft_skills': sorted(list(set(combined_soft_skills))),
                
                # ✅ Experience (STRICT: total = sum of entries only)
                'experience': experience_details,
                'experience_months_total': experience_months,
                
                # ✅ Projects (with tools/methods extracted)
                'projects': projects_details,
                
                # ✅ Education (complete with dates)
                'education': education,
                
                # ✅ Certifications
                'certifications': certifications,
                
                # Metadata
                'resume_completeness_score': completeness,
            }
            
            # ✅ Log what was extracted
            total_technical = sum(len(result[k]) for k in [
                'technical_skills', 'programming_languages', 'frameworks_libraries',
                'tools_platforms', 'databases'
            ])
            
            log_dev(f"✅ RESUME PARSING COMPLETE")
            log_dev(f"  Technical Skills: {total_technical}")
            log_dev(f"  Soft Skills: {len(result['soft_skills'])}")
            log_dev(f"  Projects: {projects_count}")
            log_dev(f"  Experience: {experience_months} months")
            log_dev(f"  CGPA: {cgpa if cgpa else 'Not found'}")
            log_dev(f"  Completeness: {completeness}")
            
            return result
            
        except Exception as e:
            raise Exception(f"Resume parsing failed: {str(e)}")


def log_dev(msg: str):
    """Log debug messages to stderr in development mode."""
    # Default to silent to ensure JSON-only output.
    # Enable with RESUME_PARSER_DEBUG=1
    if os.getenv("RESUME_PARSER_DEBUG", "0") == "1":
        print(f"DEBUG: {msg}", file=sys.stderr)


def main():
    """Main entry point for resume parser."""
    # ====================
    # DEFAULT RESPONSE (on any error)
    # ====================
    default_response = {
        # ✅ STRUCTURED EMPTY RESPONSE
        'technical_skills': [],
        'programming_languages': [],
        'frameworks_libraries': [],
        'tools_platforms': [],
        'databases': [],
        'soft_skills': [],
        'experience': [],
        'experience_months_total': 0,
        'projects': [],
        'education': [],
        'certifications': [],
        'resume_completeness_score': 0,
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
        print(json.dumps(default_response))
        sys.exit(0)


if __name__ == '__main__':
    main()
