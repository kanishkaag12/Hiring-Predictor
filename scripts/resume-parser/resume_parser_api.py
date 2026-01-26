"""
Integration example: Resume Parser with FastAPI backend.
This shows how to integrate the resume parser into a web service.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile
from pathlib import Path
import os
import sys

# Add parent directory to path to import resume_parser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from resume_parser import parse_resume

app = FastAPI(title="Resume Parser API")


@app.post("/api/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Parse a resume file and return structured data.
    
    Accepts: PDF or DOCX files
    Returns: JSON with skills, education, experience, projects, and completeness score
    
    Example:
        curl -X POST -F "file=@resume.pdf" http://localhost:8000/api/parse-resume
    """
    
    # Validate file type
    if file.content_type not in ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF and DOCX files are supported."
        )
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        # Parse resume
        result = parse_resume(tmp_path)
        
        # Clean up
        os.unlink(tmp_path)
        
        # Add file metadata
        result['filename'] = file.filename
        
        return JSONResponse(content=result)
    
    except Exception as e:
        # Clean up temp file if it exists
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing resume: {str(e)}"
        )


@app.post("/api/parse-resume-batch")
async def parse_resume_batch(files: list[UploadFile] = File(...)):
    """
    Parse multiple resume files.
    
    Returns: List of parsed resume data
    
    Example:
        curl -X POST -F "files=@resume1.pdf" -F "files=@resume2.docx" http://localhost:8000/api/parse-resume-batch
    """
    
    results = []
    
    for file in files:
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            # Parse resume
            result = parse_resume(tmp_path)
            result['filename'] = file.filename
            results.append(result)
            
            # Clean up
            os.unlink(tmp_path)
        
        except Exception as e:
            results.append({
                'filename': file.filename,
                'error': str(e)
            })
    
    return JSONResponse(content=results)


@app.post("/api/analyze-candidates")
async def analyze_candidates(files: list[UploadFile] = File(...)):
    """
    Parse resumes and return ranked candidates based on completeness score.
    
    Returns: Ranked list of candidates
    """
    
    results = []
    
    for file in files:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            result = parse_resume(tmp_path)
            result['filename'] = file.filename
            results.append(result)
            
            os.unlink(tmp_path)
        except:
            pass
    
    # Sort by completeness score (descending)
    results.sort(key=lambda x: x.get('resume_completeness_score', 0), reverse=True)
    
    # Add rank
    for i, result in enumerate(results, 1):
        result['rank'] = i
    
    return JSONResponse(content=results)


@app.post("/api/filter-candidates")
async def filter_candidates(
    files: list[UploadFile] = File(...),
    required_skills: list[str] = None,
    min_experience_months: int = 0,
    min_completeness: float = 0.0
):
    """
    Filter candidates based on criteria.
    
    Parameters:
        - required_skills: List of required skills (e.g., ["python", "react", "aws"])
        - min_experience_months: Minimum work experience in months
        - min_completeness: Minimum resume completeness score (0-1)
    
    Returns: Filtered list of qualified candidates
    """
    
    if required_skills is None:
        required_skills = []
    
    qualified = []
    
    for file in files:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            
            result = parse_resume(tmp_path)
            result['filename'] = file.filename
            
            # Check criteria
            skills_match = all(
                any(req_skill.lower() in skill.lower() for skill in result['skills'])
                for req_skill in required_skills
            ) if required_skills else True
            
            exp_match = result['experience_months'] >= min_experience_months
            complete_match = result['resume_completeness_score'] >= min_completeness
            
            if skills_match and exp_match and complete_match:
                qualified.append(result)
            
            os.unlink(tmp_path)
        except:
            pass
    
    return JSONResponse(content={
        'total_files': len(files),
        'qualified_count': len(qualified),
        'criteria': {
            'required_skills': required_skills,
            'min_experience_months': min_experience_months,
            'min_completeness': min_completeness
        },
        'qualified_candidates': qualified
    })


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Resume Parser API"
    }


if __name__ == "__main__":
    import uvicorn
    
    print("Starting Resume Parser API...")
    print("Available endpoints:")
    print("  POST /api/parse-resume - Parse single resume")
    print("  POST /api/parse-resume-batch - Parse multiple resumes")
    print("  POST /api/analyze-candidates - Analyze and rank candidates")
    print("  POST /api/filter-candidates - Filter candidates by criteria")
    print("  GET /health - Health check")
    print("\nServer starting at http://localhost:8000")
    print("API docs at http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
