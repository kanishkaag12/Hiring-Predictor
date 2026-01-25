# Resume Parser

A Python script to parse resume PDF and DOCX files and extract structured data using text extraction and NLP keyword matching.

## Features

✅ **Multi-format Support**: Parse both PDF and DOCX files  
✅ **Comprehensive Skill Extraction**: 100+ programming languages, frameworks, databases, and tools  
✅ **Education Information**: Extract degree types, institutions, and graduation years  
✅ **Experience Calculation**: Calculate total months of work experience from date ranges  
✅ **Project Detection**: Count projects mentioned in resume  
✅ **Completeness Scoring**: Rate resume quality from 0-1  
✅ **NLP-based**: Uses regex and keyword matching, no hardcoded dummy values  

## Installation

### 1. Install Required Packages

```bash
pip install -r resume_parser_requirements.txt
```

Or individually:

```bash
pip install pdfplumber==0.10.3
pip install python-docx==0.8.11
```

### 2. Verify Installation

```bash
python -c "import pdfplumber; import docx; print('All dependencies installed!')"
```

## Quick Start

### Command Line Usage

```bash
# Parse a single resume
python resume_parser.py resume.pdf
python resume_parser.py resume.docx

# Example output:
# {
#   "skills": ["Python", "React", "AWS", ...],
#   "education": [
#     {
#       "degree": "Bachelor",
#       "institution": "Stanford University",
#       "year": "2020"
#     }
#   ],
#   "experience_months": 36,
#   "projects_count": 5,
#   "resume_completeness_score": 0.85
# }
```

### Python API Usage

```python
from resume_parser import parse_resume, ResumeParser

# Simple usage
result = parse_resume("resume.pdf")
print(result)

# Detailed usage
parser = ResumeParser("resume.docx")
text = parser.extract_text()
skills = parser.extract_skills()
education = parser.extract_education()
experience = parser.extract_experience_months()
projects = parser.extract_projects_count()
score = parser.calculate_completeness_score()

# Get full result as JSON
json_data = parser.to_json()
print(json_data)
```

## Output Format

The parser returns a JSON object with the following structure:

```json
{
  "skills": [
    "Python",
    "React",
    "AWS",
    "Docker",
    "PostgreSQL"
  ],
  "education": [
    {
      "degree": "Bachelor",
      "institution": "Stanford University",
      "year": "2020"
    },
    {
      "degree": "Master",
      "institution": "MIT",
      "year": "2022"
    }
  ],
  "experience_months": 36,
  "projects_count": 5,
  "resume_completeness_score": 0.87
}
```

## Extraction Methods

### Skills Extraction

The parser recognizes:

- **Programming Languages**: Python, Java, JavaScript, TypeScript, C#, C++, Go, Rust, etc.
- **Web Frameworks**: React, Angular, Vue, Django, Flask, Spring, Rails, Express, etc.
- **Databases**: MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch, DynamoDB, etc.
- **Tools & Platforms**: Git, Docker, Kubernetes, AWS, Azure, GCP, Jenkins, etc.
- **Data Science**: TensorFlow, PyTorch, Pandas, Scikit-learn, Spark, Kafka, etc.
- **Custom Skills**: Extracted from "Skills:" sections and skill-related patterns

### Education Extraction

Identifies:

- **Degree Types**: Bachelor, Master, PhD, Diploma, Bootcamp
- **Institutions**: University names and colleges
- **Years**: Graduation years from the text

### Experience Calculation

Calculates total work experience by:

- Finding date ranges (e.g., "Jan 2020 - Dec 2021")
- Supporting multiple date formats (MM/DD/YYYY, Month YYYY, YYYY-YYYY)
- Handling "Present" as current date
- Summing up overlapping or sequential experiences

### Projects Counting

Counts projects by:

- Looking for "Projects" or "Portfolio" sections
- Counting bullet points (-, •, *) in project sections
- Counting numbered lists
- Finding action verbs (built, developed, created, designed)

### Completeness Scoring

Rates resume quality (0-1) based on:

- **Contact Info** (email): +1.5 points
- **Phone Number**: +0.5 points
- **Section Headers**: +3 points (max, 0.6 per section)
- **Education**: +1.5 points
- **Skills**: +1.5 points
- **Experience**: +1.5 points
- **Projects**: +0.5 points
- **Length**: +1 point (if > 200 words)

Maximum score: 10 points (normalized to 0-1)

## Examples

### Example 1: Parse Single Resume

```python
from resume_parser import parse_resume

result = parse_resume("john_resume.pdf")
print(f"Skills: {len(result['skills'])} found")
print(f"Experience: {result['experience_months']} months")
print(f"Completeness: {result['resume_completeness_score']:.0%}")
```

### Example 2: Batch Parse Multiple Resumes

```python
import json
from pathlib import Path
from resume_parser import parse_resume

resume_dir = "resumes/"
results = {}

for resume_file in Path(resume_dir).glob("*.pdf"):
    result = parse_resume(str(resume_file))
    results[resume_file.name] = result

print(json.dumps(results, indent=2))
```

### Example 3: Filter by Criteria

```python
from resume_parser import parse_resume

required_skills = ['python', 'react', 'aws']
min_experience = 24  # months

resume_files = ["resume1.pdf", "resume2.docx", "resume3.pdf"]

for file in resume_files:
    result = parse_resume(file)
    
    skills_match = any(
        req_skill.lower() in skill.lower()
        for skill in result['skills']
        for req_skill in required_skills
    )
    
    exp_match = result['experience_months'] >= min_experience
    
    if skills_match and exp_match:
        print(f"✓ {file} matches criteria")
```

### Example 4: Resume Scoring

```python
from resume_parser import parse_resume

result = parse_resume("resume.pdf")

score = result['resume_completeness_score']

if score >= 0.9:
    quality = "Excellent"
elif score >= 0.75:
    quality = "Good"
elif score >= 0.6:
    quality = "Average"
else:
    quality = f"Needs improvement"

print(f"Resume Quality: {quality} ({score:.0%})")
```

## How It Works

### 1. Text Extraction

- **PDF files**: Uses `pdfplumber` to extract text from each page
- **DOCX files**: Uses `python-docx` to extract from paragraphs and tables

### 2. NLP Processing

- **Keyword Matching**: Matches predefined lists of skills, frameworks, tools
- **Regex Patterns**: Uses regular expressions to find:
  - Date ranges for experience calculation
  - Email addresses and phone numbers
  - Education keywords (degree types, institutions)
  - Skill patterns ("proficient in...", "skilled with...")
  - Project sections and action verbs

### 3. Data Structuring

- Returns structured JSON with no hardcoded dummy values
- All data is extracted from actual resume content
- Scores and counts are calculated based on detected content

## Limitations

- **Handwritten Resumes**: Cannot parse scanned images (only text-based PDFs/DOCX)
- **Date Parsing**: Works best with standard date formats
- **Unclear Writing**: May miss ambiguous skill descriptions
- **Non-English Resumes**: Currently optimized for English text
- **Complex Layouts**: PDF with complex tables may lose formatting

## Error Handling

```python
from resume_parser import parse_resume

try:
    result = parse_resume("resume.pdf")
except FileNotFoundError:
    print("Resume file not found")
except ImportError:
    print("Dependencies not installed. Run: pip install -r resume_parser_requirements.txt")
except Exception as e:
    print(f"Error parsing resume: {e}")
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'pdfplumber'"

**Solution:**
```bash
pip install pdfplumber==0.10.3
```

### Issue: "ModuleNotFoundError: No module named 'docx'"

**Solution:**
```bash
pip install python-docx==0.8.11
```

### Issue: PDF text not extracted correctly

**Possible causes:**
- PDF is an image/scanned document
- PDF has encrypted content
- Complex PDF formatting

**Solution:**
- Try converting PDF to text format first
- Use OCR if PDF is scanned
- Ensure PDF is not password-protected

### Issue: Low completeness score

**This is normal if resume:**
- Lacks contact information
- Missing major sections (education, experience)
- Very short (< 200 words)
- Poorly formatted

**Improvement suggestions:**
- Add email address and phone number
- Include all relevant sections
- Use clear section headers
- Expand descriptions of roles and projects

## Advanced Usage

### Custom Skill Lists

```python
from resume_parser import ResumeParser

parser = ResumeParser("resume.pdf")

# Add custom skills to extraction
custom_skills = ['kubernetes', 'prometheus', 'terraform']
parser.TOOLS_PLATFORMS.extend(custom_skills)

skills = parser.extract_skills()
```

### Integration with Database

```python
import json
from resume_parser import parse_resume

# Parse and save to database
result = parse_resume("resume.pdf")

# Store in database
db_record = {
    'filename': 'resume.pdf',
    'data': json.dumps(result),
    'score': result['resume_completeness_score']
}
# db.insert(db_record)
```

## Performance

- **Single PDF**: ~1-2 seconds
- **Single DOCX**: ~0.5-1 second
- **Batch (10 files)**: ~10-15 seconds
- **Memory**: ~50-100 MB per file

## License

MIT License - Feel free to use and modify

## Contributing

Contributions welcome! Areas for improvement:

- Support for more date formats
- Multi-language support
- Better OCR integration
- Machine learning-based extraction
- LinkedIn profile parsing

## Contact

For issues or questions, create an issue or pull request.
