# Resume Parser Integration Guide

## Files Included

1. **`resume_parser.py`** - Main parser module (700+ lines)
2. **`resume_parser_examples.py`** - Usage examples
3. **`test_resume_parser.py`** - Unit tests
4. **`resume_parser_api.py`** - FastAPI integration
5. **`resume_parser_requirements.txt`** - Dependencies
6. **`RESUME_PARSER_README.md`** - Full documentation
7. **`INTEGRATION_GUIDE.md`** - This file

## Quick Start

### 1. Install Dependencies

```bash
pip install -r resume_parser_requirements.txt
```

### 2. Parse a Resume from Command Line

```bash
python resume_parser.py path/to/resume.pdf
```

Output:
```json
{
  "skills": ["Python", "React", "AWS", ...],
  "education": [
    {
      "degree": "Bachelor",
      "institution": "Stanford University",
      "year": "2020"
    }
  ],
  "experience_months": 36,
  "projects_count": 5,
  "resume_completeness_score": 0.87
}
```

### 3. Use in Python Code

```python
from resume_parser import parse_resume

result = parse_resume("resume.pdf")
print(result)
```

## Integration with HirePulse Backend

### Option 1: Simple Integration (Server-side parsing)

```python
# In your server/routes.ts or similar
from resume_parser import parse_resume

@app.post("/api/parse-resume")
def upload_resume(file):
    # Save uploaded file temporarily
    temp_path = save_temp_file(file)
    
    try:
        # Parse resume
        result = parse_resume(temp_path)
        
        # Store in database
        user_data = {
            'resume_data': result,
            'user_id': current_user.id
        }
        db.save(user_data)
        
        return result
    finally:
        os.remove(temp_path)
```

### Option 2: FastAPI Service

Run the dedicated API service:

```bash
python resume_parser_api.py
```

Then call from your frontend:

```javascript
// Upload resume
const formData = new FormData();
formData.append('file', resumeFile);

const response = await fetch('http://localhost:8000/api/parse-resume', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

### Option 3: Microservice Architecture

Deploy `resume_parser_api.py` as a separate service:

```bash
# Docker
docker build -t resume-parser .
docker run -p 8000:8000 resume-parser

# Or with systemd
systemctl start resume-parser-service
```

## Database Schema

Store parsed resume data:

```sql
CREATE TABLE user_resumes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  filename VARCHAR(255),
  skills TEXT,  -- JSON array
  education TEXT,  -- JSON array
  experience_months INTEGER,
  projects_count INTEGER,
  completeness_score FLOAT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Example storage:

```python
import json
from datetime import datetime

result = parse_resume(file_path)

db.execute("""
  INSERT INTO user_resumes 
  (user_id, filename, skills, education, experience_months, projects_count, completeness_score, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
  user_id,
  filename,
  json.dumps(result['skills']),
  json.dumps(result['education']),
  result['experience_months'],
  result['projects_count'],
  result['resume_completeness_score'],
  datetime.now()
))
```

## Use Cases

### 1. User Profile Completion

Use completeness score to encourage users to fill profile:

```python
score = result['resume_completeness_score']

if score < 0.7:
    return {
        'message': 'Your profile is incomplete. Add more details to improve your chances.',
        'score': score,
        'suggestions': get_suggestions(result)
    }
```

### 2. Job Matching

Filter candidates by requirements:

```python
from resume_parser import parse_resume

def is_qualified(resume_path, job_requirements):
    result = parse_resume(resume_path)
    
    # Check skills
    skills_match = any(
        req_skill.lower() in skill.lower()
        for skill in result['skills']
        for req_skill in job_requirements['skills']
    )
    
    # Check experience
    exp_match = result['experience_months'] >= job_requirements['min_experience']
    
    return skills_match and exp_match
```

### 3. Resume Analysis Report

Generate insights:

```python
def generate_report(result):
    return {
        'summary': {
            'total_skills': len(result['skills']),
            'total_education': len(result['education']),
            'experience_years': result['experience_months'] / 12,
            'projects': result['projects_count']
        },
        'quality': {
            'score': result['resume_completeness_score'],
            'rating': rate_quality(result['resume_completeness_score'])
        },
        'top_skills': result['skills'][:5],
        'education_details': result['education']
    }
```

### 4. Bulk Resume Processing

Process multiple candidates:

```python
from pathlib import Path

def process_job_applications(folder_path, job_id):
    results = []
    
    for resume_file in Path(folder_path).glob('*.pdf'):
        result = parse_resume(str(resume_file))
        result['filename'] = resume_file.name
        results.append(result)
    
    # Store all results
    for result in results:
        save_to_db(job_id, result)
    
    return results
```

## Performance Optimization

### Caching

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def parse_resume_cached(file_hash):
    # Only reparse if file changes
    pass

def get_file_hash(file_path):
    with open(file_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()
```

### Async Processing

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

async def parse_resumes_async(file_paths):
    loop = asyncio.get_event_loop()
    
    with ProcessPoolExecutor() as pool:
        tasks = [
            loop.run_in_executor(pool, parse_resume, path)
            for path in file_paths
        ]
        results = await asyncio.gather(*tasks)
    
    return results
```

## Error Handling

```python
from resume_parser import parse_resume

def safe_parse_resume(file_path):
    try:
        return parse_resume(file_path)
    except FileNotFoundError:
        return {'error': 'File not found'}
    except ImportError:
        return {'error': 'Dependencies not installed'}
    except Exception as e:
        return {'error': f'Parse failed: {str(e)}'}
```

## Testing

Run tests:

```bash
python test_resume_parser.py
```

Or with pytest:

```bash
pip install pytest
pytest test_resume_parser.py -v
```

## Troubleshooting

### PDF not parsing correctly

- Ensure it's a text-based PDF (not scanned)
- Try converting to DOCX format
- Check if PDF is encrypted

### Skills not detected

- Make sure skill keywords are spelled correctly
- Skills must match the predefined lists
- Check RESUME_PARSER_README.md for full skill list

### Low completeness score

- Add email and phone number
- Include all major sections (education, experience, skills)
- Use clear section headers

## Next Steps

1. **Install dependencies** and test locally
2. **Integrate into backend** using one of the options above
3. **Create API endpoint** for resume uploads
4. **Store results** in database
5. **Use parsed data** for job matching and recommendations
6. **Monitor performance** and optimize as needed

## Support

For issues:

1. Check RESUME_PARSER_README.md for detailed documentation
2. Review examples in resume_parser_examples.py
3. Run test_resume_parser.py to verify setup
4. Check error messages in logs

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Production Ready
