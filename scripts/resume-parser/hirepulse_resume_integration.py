"""
HirePulse Resume Parser Integration Example
Complete backend integration showing how to use the resume parser
in the HirePulse application for user profile completion.
"""

import json
import os
import tempfile
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path

# Import resume parser
from resume_parser import parse_resume, ResumeParser


class HirePulseResumeIntegration:
    """Integration layer for resume parsing in HirePulse."""

    def __init__(self, user_id: str, uploads_dir: str = "uploads/resumes"):
        """Initialize integration."""
        self.user_id = user_id
        self.uploads_dir = Path(uploads_dir)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    def upload_and_parse_resume(self, file_path: str) -> Dict:
        """
        Upload and parse a resume file.
        
        Args:
            file_path: Path to resume file (PDF or DOCX)
            
        Returns:
            Parsed resume data with metadata
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found: {file_path}")

        try:
            # Parse resume
            result = parse_resume(file_path)
            
            # Add metadata
            result['user_id'] = self.user_id
            result['filename'] = Path(file_path).name
            result['uploaded_at'] = datetime.now().isoformat()
            result['status'] = 'parsed'
            
            # Store parsed data
            self._store_resume_data(result)
            
            return result
        
        except Exception as e:
            return {
                'user_id': self.user_id,
                'status': 'error',
                'error': str(e),
                'uploaded_at': datetime.now().isoformat()
            }

    def get_profile_suggestions(self, resume_data: Dict) -> Dict:
        """
        Generate profile completion suggestions based on resume.
        
        Args:
            resume_data: Parsed resume data
            
        Returns:
            Suggestions for profile improvement
        """
        score = resume_data['resume_completeness_score']
        suggestions = {
            'score': score,
            'rating': self._rate_quality(score),
            'suggestions': [],
            'next_steps': []
        }

        # Check for missing elements
        if not resume_data['skills'] or len(resume_data['skills']) < 5:
            suggestions['suggestions'].append({
                'type': 'skills',
                'message': 'Add more technical skills to improve visibility',
                'action': 'Add at least 10 relevant skills'
            })

        if not resume_data['education']:
            suggestions['suggestions'].append({
                'type': 'education',
                'message': 'Add your education details',
                'action': 'Upload resume with education section'
            })

        if resume_data['experience_months'] == 0:
            suggestions['suggestions'].append({
                'type': 'experience',
                'message': 'Add your work experience',
                'action': 'Upload resume with experience section'
            })

        if resume_data['projects_count'] == 0:
            suggestions['suggestions'].append({
                'type': 'projects',
                'message': 'Highlight your projects and achievements',
                'action': 'Add a projects section to your resume'
            })

        # Generate next steps
        if score < 0.6:
            suggestions['next_steps'].append('Complete basic resume sections')
        if score < 0.8:
            suggestions['next_steps'].append('Add quantifiable metrics to achievements')
        if score < 0.9:
            suggestions['next_steps'].append('Include certifications and awards')

        return suggestions

    def match_jobs(self, resume_data: Dict, job_requirements: Dict) -> Dict:
        """
        Match resume against job requirements.
        
        Args:
            resume_data: Parsed resume data
            job_requirements: Job posting requirements
            
        Returns:
            Match score and detailed analysis
        """
        match_score = 0.0
        details = {
            'skills_match': 0.0,
            'experience_match': 0.0,
            'education_match': 0.0,
            'matched_skills': [],
            'missing_skills': [],
            'recommendation': ''
        }

        # Skills matching
        required_skills = set(skill.lower() for skill in job_requirements.get('required_skills', []))
        candidate_skills = set(skill.lower() for skill in resume_data['skills'])
        
        matched = required_skills & candidate_skills
        missing = required_skills - candidate_skills
        
        details['matched_skills'] = list(matched)
        details['missing_skills'] = list(missing)
        
        if required_skills:
            details['skills_match'] = len(matched) / len(required_skills)
            match_score += details['skills_match'] * 0.5

        # Experience matching
        min_experience = job_requirements.get('min_experience_months', 0)
        if resume_data['experience_months'] >= min_experience:
            details['experience_match'] = 1.0
            match_score += 0.3
        else:
            details['experience_match'] = resume_data['experience_months'] / max(min_experience, 1)
            match_score += details['experience_match'] * 0.3

        # Education matching
        required_degree = job_requirements.get('required_degree')
        if required_degree and resume_data['education']:
            if any(required_degree.lower() in edu['degree'].lower() 
                   for edu in resume_data['education']):
                details['education_match'] = 1.0
                match_score += 0.2

        # Generate recommendation
        match_score = min(match_score, 1.0)
        if match_score >= 0.85:
            details['recommendation'] = 'Strong match - Highly recommended'
        elif match_score >= 0.7:
            details['recommendation'] = 'Good match - Apply'
        elif match_score >= 0.5:
            details['recommendation'] = 'Moderate match - Consider applying'
        else:
            details['recommendation'] = 'Weak match - May not meet requirements'

        return {
            'match_score': round(match_score, 2),
            'details': details
        }

    def get_recommended_jobs(self, resume_data: Dict, available_jobs: list) -> list:
        """
        Get recommended jobs for candidate.
        
        Args:
            resume_data: Parsed resume data
            available_jobs: List of job postings
            
        Returns:
            Ranked list of recommended jobs
        """
        recommendations = []

        for job in available_jobs:
            match = self.match_jobs(resume_data, job)
            
            recommendation = {
                'job_id': job['id'],
                'job_title': job['title'],
                'company': job['company'],
                'match_score': match['match_score'],
                'recommendation': match['details']['recommendation'],
                'missing_skills': match['details']['missing_skills'][:3]  # Top 3
            }
            
            recommendations.append(recommendation)

        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:10]  # Top 10

    def generate_profile_report(self, resume_data: Dict) -> Dict:
        """
        Generate comprehensive profile report.
        
        Args:
            resume_data: Parsed resume data
            
        Returns:
            Detailed profile report
        """
        return {
            'summary': {
                'completeness': resume_data['resume_completeness_score'],
                'quality': self._rate_quality(resume_data['resume_completeness_score']),
                'total_skills': len(resume_data['skills']),
                'total_education': len(resume_data['education']),
                'experience_years': round(resume_data['experience_months'] / 12, 1),
                'projects': resume_data['projects_count']
            },
            'skills': {
                'top_skills': resume_data['skills'][:10],
                'total': len(resume_data['skills']),
                'categories': self._categorize_skills(resume_data['skills'])
            },
            'education': {
                'entries': resume_data['education'],
                'total': len(resume_data['education'])
            },
            'experience': {
                'months': resume_data['experience_months'],
                'years': round(resume_data['experience_months'] / 12, 1),
                'interpretation': self._interpret_experience(resume_data['experience_months'])
            },
            'achievements': {
                'projects': resume_data['projects_count'],
                'interpretation': self._interpret_projects(resume_data['projects_count'])
            },
            'recommendations': self.get_profile_suggestions(resume_data),
            'generated_at': datetime.now().isoformat()
        }

    def _rate_quality(self, score: float) -> str:
        """Rate resume quality."""
        if score >= 0.95:
            return "Excellent"
        elif score >= 0.85:
            return "Very Good"
        elif score >= 0.75:
            return "Good"
        elif score >= 0.60:
            return "Fair"
        else:
            return "Needs Improvement"

    def _categorize_skills(self, skills: list) -> Dict:
        """Categorize skills."""
        categories = {
            'programming': [],
            'frameworks': [],
            'databases': [],
            'tools': [],
            'other': []
        }

        prog_keywords = ['python', 'java', 'javascript', 'typescript', 'c#', 'go', 'rust']
        framework_keywords = ['react', 'angular', 'vue', 'django', 'flask', 'spring']
        db_keywords = ['sql', 'postgres', 'mongo', 'redis', 'elastic']
        tool_keywords = ['docker', 'kubernetes', 'aws', 'git', 'jenkins']

        for skill in skills:
            skill_lower = skill.lower()
            if any(kw in skill_lower for kw in prog_keywords):
                categories['programming'].append(skill)
            elif any(kw in skill_lower for kw in framework_keywords):
                categories['frameworks'].append(skill)
            elif any(kw in skill_lower for kw in db_keywords):
                categories['databases'].append(skill)
            elif any(kw in skill_lower for kw in tool_keywords):
                categories['tools'].append(skill)
            else:
                categories['other'].append(skill)

        return {k: v for k, v in categories.items() if v}

    def _interpret_experience(self, months: int) -> str:
        """Interpret experience level."""
        years = months / 12
        if years < 1:
            return "Entry Level"
        elif years < 3:
            return "Junior"
        elif years < 5:
            return "Mid-Level"
        elif years < 10:
            return "Senior"
        else:
            return "Principal/Lead"

    def _interpret_projects(self, count: int) -> str:
        """Interpret project count."""
        if count == 0:
            return "No projects listed"
        elif count == 1:
            return "One project listed"
        elif count < 5:
            return "Few projects highlighted"
        else:
            return "Multiple projects showcased"

    def _store_resume_data(self, data: Dict):
        """Store parsed resume data."""
        # In production, this would save to database
        # For now, save to JSON file
        filename = f"{self.user_id}_resume_{datetime.now().timestamp()}.json"
        filepath = self.uploads_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)


# Example usage
if __name__ == "__main__":
    # Sample resume data
    sample_resume_data = {
        'skills': [
            'Python', 'JavaScript', 'React', 'Django', 'PostgreSQL',
            'Docker', 'AWS', 'Git', 'Kubernetes', 'Redis',
            'TypeScript', 'Node.js'
        ],
        'education': [
            {
                'degree': 'Bachelor',
                'institution': 'Stanford University',
                'year': '2020'
            }
        ],
        'experience_months': 36,
        'projects_count': 5,
        'resume_completeness_score': 0.87
    }

    # Sample job requirements
    sample_job = {
        'id': 'job_123',
        'title': 'Senior Full Stack Engineer',
        'company': 'TechCorp',
        'required_skills': ['Python', 'React', 'Docker', 'AWS'],
        'min_experience_months': 24,
        'required_degree': 'Bachelor'
    }

    # Initialize integration
    integration = HirePulseResumeIntegration('user_123')

    # Get profile suggestions
    suggestions = integration.get_profile_suggestions(sample_resume_data)
    print("Profile Suggestions:")
    print(json.dumps(suggestions, indent=2))

    # Match job
    match = integration.match_jobs(sample_resume_data, sample_job)
    print("\nJob Match:")
    print(json.dumps(match, indent=2))

    # Generate report
    report = integration.generate_profile_report(sample_resume_data)
    print("\nProfile Report:")
    print(json.dumps(report, indent=2))
