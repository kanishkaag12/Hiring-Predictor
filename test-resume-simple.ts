/**
 * Simple Resume Test - Shows parsed resume content and mock predictions
 * 
 * Usage: npx tsx test-resume-simple.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parseResume } from './server/services/resume-parser.service';

const RESUME_PATH = 'uploads/resume-1769407134942-931026016.pdf';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📄 RESUME ANALYSIS TEST');
  console.log('='.repeat(80));
  console.log(`Resume: ${RESUME_PATH}\n`);

  try {
    // ========================================
    // STEP 1: VERIFY RESUME FILE
    // ========================================
    console.log('[STEP 1] Reading resume file...');
    const resumePath = path.resolve(process.cwd(), RESUME_PATH);
    
    if (!fs.existsSync(resumePath)) {
      console.error(`❌ Resume file not found: ${resumePath}`);
      process.exit(1);
    }
    
    const resumeBuffer = fs.readFileSync(resumePath);
    const sizeKB = (resumeBuffer.length / 1024).toFixed(2);
    console.log(`✅ Resume loaded (${sizeKB} KB)\n`);

    // ========================================
    // STEP 2: PARSE RESUME
    // ========================================
    console.log('[STEP 2] Parsing resume with Python ML parser...');
    const parsedResume = await parseResume(resumeBuffer, path.basename(resumePath));
    
    console.log('✅ Resume parsed successfully!\n');

    // ========================================
    // STEP 3: DISPLAY PARSED DATA
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 PARSED RESUME DATA');
    console.log('='.repeat(80) + '\n');

    // Technical Skills
    const allTechnicalSkills = [
      ...(parsedResume.technical_skills || []),
      ...(parsedResume.programming_languages || []),
      ...(parsedResume.frameworks_libraries || []),
      ...(parsedResume.tools_platforms || []),
      ...(parsedResume.databases || [])
    ];

    console.log(`🔧 TECHNICAL SKILLS (${allTechnicalSkills.length} total):`);
    console.log('-'.repeat(80));
    if (parsedResume.programming_languages?.length > 0) {
      console.log(`  📌 Programming Languages: ${parsedResume.programming_languages.join(', ')}`);
    }
    if (parsedResume.frameworks_libraries?.length > 0) {
      console.log(`  📌 Frameworks/Libraries: ${parsedResume.frameworks_libraries.join(', ')}`);
    }
    if (parsedResume.tools_platforms?.length > 0) {
      console.log(`  📌 Tools/Platforms: ${parsedResume.tools_platforms.join(', ')}`);
    }
    if (parsedResume.databases?.length > 0) {
      console.log(`  📌 Databases: ${parsedResume.databases.join(', ')}`);
    }
    if (parsedResume.technical_skills?.length > 0) {
      console.log(`  📌 Other Technical: ${parsedResume.technical_skills.join(', ')}`);
    }
    console.log();

    // Soft Skills
    if (parsedResume.soft_skills && parsedResume.soft_skills.length > 0) {
      console.log(`💬 SOFT SKILLS (${parsedResume.soft_skills.length} total):`);
      console.log('-'.repeat(80));
      console.log(`  ${parsedResume.soft_skills.join(', ')}`);
      console.log();
    }

    // Experience
    console.log(`💼 WORK EXPERIENCE:`);
    console.log('-'.repeat(80));
    console.log(`  Total Experience: ${parsedResume.experience_months_total || 0} months`);
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      parsedResume.experience.forEach((exp, idx) => {
        console.log(`\n  [${idx + 1}] ${exp.role}${exp.company ? ` at ${exp.company}` : ''}`);
        if (exp.duration) console.log(`      Duration: ${exp.duration}`);
        if (exp.type) console.log(`      Type: ${exp.type}`);
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          console.log(`      Responsibilities:`);
          exp.responsibilities.forEach(r => console.log(`        - ${r}`));
        }
      });
    } else {
      console.log('  No work experience found');
    }
    console.log();

    // Projects
    console.log(`🚀 PROJECTS:`);
    console.log('-'.repeat(80));
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      parsedResume.projects.forEach((proj, idx) => {
        console.log(`\n  [${idx + 1}] ${proj.title}`);
        if (proj.description) {
          const desc = proj.description.length > 200 
            ? proj.description.substring(0, 200) + '...' 
            : proj.description;
          console.log(`      ${desc}`);
        }
        const techStack = proj.tech_stack || proj.tools_methods_used || [];
        if (techStack.length > 0) {
          console.log(`      Tech Stack: ${techStack.join(', ')}`);
        }
      });
    } else {
      console.log('  No projects found');
    }
    console.log();

    // Education
    console.log(`🎓 EDUCATION:`);
    console.log('-'.repeat(80));
    if (parsedResume.education && parsedResume.education.length > 0) {
      parsedResume.education.forEach((edu, idx) => {
        console.log(`\n  [${idx + 1}] ${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
        if (edu.institution) console.log(`      Institution: ${edu.institution}`);
        if (edu.year) console.log(`      Year: ${edu.year}`);
        if (edu.cgpa) console.log(`      CGPA/Score: ${edu.cgpa}`);
      });
    } else {
      console.log('  No education found');
    }
    console.log();

    // Certifications
    if (parsedResume.certifications && parsedResume.certifications.length > 0) {
      console.log(`📜 CERTIFICATIONS:`);
      console.log('-'.repeat(80));
      parsedResume.certifications.forEach((cert, idx) => {
        console.log(`  [${idx + 1}] ${cert.name}${cert.issuer ? ` by ${cert.issuer}` : ''}`);
        if (cert.date) console.log(`      Date: ${cert.date}`);
      });
      console.log();
    }

    // Resume Quality
    console.log(`📈 RESUME QUALITY METRICS:`);
    console.log('-'.repeat(80));
    console.log(`  Completeness Score: ${(parsedResume.resume_completeness_score * 100).toFixed(0)}%`);
    console.log(`  Total Skills: ${allTechnicalSkills.length}`);
    console.log(`  Total Experience: ${parsedResume.experience_months_total || 0} months`);
    console.log(`  Total Projects: ${parsedResume.projects?.length || 0}`);
    console.log(`  Education Entries: ${parsedResume.education?.length || 0}`);
    console.log();

    // ========================================
    // STEP 4: MOCK PREDICTIONS
    // ========================================
    console.log('='.repeat(80));
    console.log('🤖 SAMPLE SHORTLIST PROBABILITY PREDICTIONS');
    console.log('='.repeat(80));
    console.log('(These are illustrative examples based on skill matching)\n');

    // Define sample jobs
    const sampleJobs = [
      {
        title: 'Machine Learning Engineer',
        company: 'DataCorp',
        requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Data Analysis'],
      },
      {
        title: 'Data Scientist',
        company: 'AnalyticsPro',
        requiredSkills: ['Python', 'Data Analysis', 'Statistics', 'Machine Learning', 'SQL'],
      },
      {
        title: 'Python Developer',
        company: 'TechSolutions',
        requiredSkills: ['Python', 'Django', 'REST API', 'PostgreSQL', 'Git'],
      },
      {
        title: 'AI Research Engineer',
        company: 'AILabs',
        requiredSkills: ['Python', 'Deep Learning', 'NLP', 'Computer Vision', 'Research'],
      },
      {
        title: 'Backend Developer',
        company: 'WebCo',
        requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'Docker'],
      },
      {
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        requiredSkills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'AWS'],
      },
    ];

    // Calculate mock predictions
    const userSkillsLower = new Set(allTechnicalSkills.map(s => s.toLowerCase()));
    
    const predictions = sampleJobs.map(job => {
      const requiredSkillsLower = job.requiredSkills.map(s => s.toLowerCase());
      const matchedSkills = job.requiredSkills.filter(skill => 
        userSkillsLower.has(skill.toLowerCase())
      );
      const missingSkills = job.requiredSkills.filter(skill => 
        !userSkillsLower.has(skill.toLowerCase())
      );
      
      const matchRate = matchedSkills.length / job.requiredSkills.length;
      
      // Mock candidate strength (based on experience + projects)
      const experienceMonths = parsedResume.experience_months_total || 0;
      const projectCount = parsedResume.projects?.length || 0;
      const candidateStrength = Math.min(
        0.95,
        0.3 + (experienceMonths / 60) * 0.3 + (projectCount / 5) * 0.2 + (allTechnicalSkills.length / 30) * 0.2
      );
      
      // Formula: 0.4 × candidate_strength + 0.6 × job_match
      const rawProbability = (0.4 * candidateStrength) + (0.6 * matchRate);
      const probability = Math.max(0.05, Math.min(0.95, rawProbability));
      
      return {
        ...job,
        candidateStrength: Math.round(candidateStrength * 100),
        jobMatchScore: Math.round(matchRate * 100),
        shortlistProbability: Math.round(probability * 100),
        matchedSkills,
        missingSkills,
      };
    });

    // Sort by probability
    predictions.sort((a, b) => b.shortlistProbability - a.shortlistProbability);

    // Display results
    console.log('Rank | Probability | Strength | Match | Job Title & Company');
    console.log('-'.repeat(80));
    
    predictions.forEach((pred, idx) => {
      const rank = `${idx + 1}`.padStart(4);
      const prob = `${pred.shortlistProbability}%`.padStart(11);
      const strength = `${pred.candidateStrength}%`.padStart(8);
      const match = `${pred.jobMatchScore}%`.padStart(5);
      const jobInfo = `${pred.title} @ ${pred.company}`.substring(0, 40);
      
      console.log(`${rank} | ${prob} | ${strength} | ${match} | ${jobInfo}`);
    });

    // Detailed breakdown for top 3
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DETAILED BREAKDOWN (TOP 3 JOBS)');
    console.log('='.repeat(80) + '\n');

    for (let i = 0; i < Math.min(3, predictions.length); i++) {
      const pred = predictions[i];
      
      console.log(`[${i + 1}] ${pred.title} @ ${pred.company}`);
      console.log('-'.repeat(80));
      console.log(`  Shortlist Probability: ${pred.shortlistProbability}%`);
      console.log(`  Candidate Strength:    ${pred.candidateStrength}%`);
      console.log(`  Job Match Score:       ${pred.jobMatchScore}%`);
      console.log();
      console.log(`  ✅ Matched Skills (${pred.matchedSkills.length}/${pred.requiredSkills.length}):`);
      if (pred.matchedSkills.length > 0) {
        console.log(`     ${pred.matchedSkills.join(', ')}`);
      } else {
        console.log(`     (None)`);
      }
      console.log();
      console.log(`  ❌ Missing Skills (${pred.missingSkills.length}/${pred.requiredSkills.length}):`);
      if (pred.missingSkills.length > 0) {
        console.log(`     ${pred.missingSkills.join(', ')}`);
      } else {
        console.log(`     (None)`);
      }
      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('\nNOTE: To see real predictions for all jobs in your database,');
    console.log('ensure your database is accessible and run: npx tsx test-resume-predictions.ts\n');

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
