#!/usr/bin/env python3
import sys
import json
import os
import glob

# Add project to path
sys.path.insert(0, os.path.dirname(__file__))

from python.resume_parser import ResumeParser

# Find first PDF resume
uploads_dir = './uploads'
pdf_files = glob.glob(os.path.join(uploads_dir, '*.pdf'))

if pdf_files:
    file_path = pdf_files[0]
    print(f"Testing with: {file_path}", file=sys.stderr)
    try:
        parser = ResumeParser(file_path)
        result = parser.parse()
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print(json.dumps({
            'skills': [],
            'education': [],
            'experience_months': 0,
            'projects_count': 0,
            'resume_completeness_score': 0,
            'skills_extraction_warning': True
        }))
else:
    print("No PDF files found in uploads directory")
