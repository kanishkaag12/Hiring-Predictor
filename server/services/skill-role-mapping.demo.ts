/**
 * SKILL-TO-ROLE MAPPING - PRACTICAL DEMO
 * 
 * This file demonstrates real-world usage scenarios for the skill-to-role mapping service.
 * Run with: npm run demo:skills
 */

import SkillRoleMappingService from "./skill-role-mapping.service";
import skillConfig from "./skill-role-mapping.config";

// ============================================================================
// DEMO 1: Real Resume Examples
// ============================================================================

export function demoResumeAnalysis() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 1: Resume Analysis - Real Examples");
  console.log("=".repeat(70));

  // Resume 1: Fresh Data Science Candidate
  console.log("\n📄 Candidate 1: Recent CS Graduate, interested in Data Science");
  const candidate1Skills = [
    "Python",
    "SQL",
    "Pandas",
    "NumPy",
    "Statistics",
    "Excel",
    "Git",
    "Jupyter"
  ];

  console.log(`Skills: ${candidate1Skills.join(", ")}`);

  const dataAnalystMatch = SkillRoleMappingService.calculateSkillMatchScore(
    "Data Analyst",
    candidate1Skills
  );

  console.log(`\n→ Data Analyst: ${dataAnalystMatch.matchPercentage}%`);
  console.log(`  Status: ${dataAnalystMatch.overallScore >= 0.8 ? "✓ Strong" : dataAnalystMatch.overallScore >= 0.6 ? "⚠ Good" : "✗ Needs Work"}`);
  console.log(`  Explanation: ${dataAnalystMatch.explanation}`);

  if (dataAnalystMatch.essentialGaps.length > 0) {
    console.log(`  Missing: ${dataAnalystMatch.essentialGaps.join(", ")}`);
  }

  // Resume 2: Full-Stack Web Developer
  console.log("\n📄 Candidate 2: 3 Years Full-Stack Experience");
  const candidate2Skills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Git",
    "Redux",
    "CSS",
    "HTML"
  ];

  console.log(`Skills: ${candidate2Skills.join(", ")}`);

  const webDevMatch = SkillRoleMappingService.calculateSkillMatchScore(
    "Web Developer",
    candidate2Skills
  );

  console.log(`\n→ Web Developer: ${webDevMatch.matchPercentage}%`);
  console.log(`  Status: ${webDevMatch.overallScore >= 0.8 ? "✓ Strong" : "⚠ Good"}`);

  // Also check backend fit
  const backendMatch = SkillRoleMappingService.calculateSkillMatchScore(
    "Backend Developer",
    candidate2Skills
  );
  console.log(`→ Backend Developer: ${backendMatch.matchPercentage}%`);

  // Resume 3: ML Engineer with Research Background
  console.log("\n📄 Candidate 3: ML Research Background");
  const candidate3Skills = [
    "Python",
    "PyTorch",
    "TensorFlow",
    "NumPy",
    "Pandas",
    "Scikit-learn",
    "SQL",
    "Git",
    "Linux",
    "Deep Learning",
    "NLP"
  ];

  console.log(`Skills: ${candidate3Skills.join(", ")}`);

  const mlMatch = SkillRoleMappingService.calculateSkillMatchScore(
    "ML Engineer",
    candidate3Skills
  );

  console.log(`\n→ ML Engineer: ${mlMatch.matchPercentage}%`);
  console.log(`  Status: ${mlMatch.overallScore >= 0.8 ? "✓ Strong" : "⚠ Good"}`);
  console.log(`  Explanation: ${mlMatch.explanation}`);
}

// ============================================================================
// DEMO 2: Role Recommendations
// ============================================================================

export function demoRoleRecommendations() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 2: Role Recommendations - Find Best Fit");
  console.log("=".repeat(70));

  const portfolioSkills = [
    "Python",
    "SQL",
    "Tableau",
    "Excel",
    "Git",
    "Statistics",
    "PowerBI",
    "Google Analytics"
  ];

  console.log(`\nCandidate Skills: ${portfolioSkills.join(", ")}`);

  const recommendations = skillConfig.recommendTopRoles(portfolioSkills, 5);

  console.log("\nTop Role Recommendations:");
  recommendations.forEach((rec, idx) => {
    const icon =
      rec.matchPercentage >= 80
        ? "🟢"
        : rec.matchPercentage >= 60
          ? "🟡"
          : "🔴";
    console.log(
      `  ${idx + 1}. ${icon} ${rec.roleName}: ${rec.matchPercentage}% (${rec.label})`
    );
  });
}

// ============================================================================
// DEMO 3: Skill Gap Analysis
// ============================================================================

export function demoSkillGapAnalysis() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 3: Skill Gap Analysis - Learning Path");
  console.log("=".repeat(70));

  const currentSkills = ["Python", "SQL", "Git"];
  const targetRole = "Data Analyst";

  console.log(`\nCurrent Skills: ${currentSkills.join(", ")}`);
  console.log(`Target Role: ${targetRole}`);

  const gapAnalysis = skillConfig.analyzeSkillGaps(targetRole, currentSkills);

  console.log(`\n📊 Gap Analysis:`);
  console.log(`   Critical Missing: ${gapAnalysis.missingCritical.join(", ") || "None"}`);
  console.log(`   Preferred Missing: ${gapAnalysis.missingPreferred.join(", ") || "None"}`);

  console.log(`\n📚 Personalized Learning Path:`);
  console.log(`   Immediate (Next 1-2 months): ${gapAnalysis.learningPath.immediate.join(", ")}`);
  console.log(`   Short-term (3-6 months): ${gapAnalysis.learningPath.shortTerm.join(", ") || "None"}`);
  console.log(`   Long-term (6+ months): ${gapAnalysis.learningPath.longTerm.join(", ") || "None"}`);

  console.log(`\n⏱️  Estimated Time to Job Ready: ${gapAnalysis.estimatedTimeToJobReady}`);
}

// ============================================================================
// DEMO 4: Batch Candidate Evaluation
// ============================================================================

export function demoBatchEvaluation() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 4: Batch Evaluation - Ranking Multiple Candidates");
  console.log("=".repeat(70));

  const jobRole = "Backend Developer";
  const candidates = [
    {
      id: "CAND001",
      name: "Alice Chen",
      skills: ["Python", "Django", "PostgreSQL", "Docker", "AWS", "Git"]
    },
    {
      id: "CAND002",
      name: "Bob Kumar",
      skills: ["Node.js", "Express", "MongoDB", "Redis", "Docker", "AWS"]
    },
    {
      id: "CAND003",
      name: "Carol Smith",
      skills: ["Java", "Spring Boot", "MySQL", "SQL", "Git"]
    },
    {
      id: "CAND004",
      name: "David Lee",
      skills: ["Python", "Flask", "PostgreSQL", "REST APIs", "Docker"]
    }
  ];

  console.log(`\nJob Opening: ${jobRole}`);
  console.log(`Candidates: ${candidates.length}`);

  const ranked = skillConfig.rankCandidatesByRole(jobRole, candidates);

  console.log(`\nRanking:`);
  ranked.forEach((candidate, idx) => {
    const candInfo = candidates.find((c) => c.id === candidate.candidateId)!;
    const stars = "⭐".repeat(
      candidate.fit === "Excellent"
        ? 4
        : candidate.fit === "Good"
          ? 3
          : candidate.fit === "Moderate"
            ? 2
            : 1
    );
    console.log(
      `  ${idx + 1}. ${candInfo.name} (${candidate.candidateId}): ${candidate.matchPercentage}% ${stars}`
    );
    console.log(`     Skills: ${candInfo.skills.join(", ")}`);
    if (candidate.gaps.length > 0) {
      console.log(`     Needs: ${candidate.gaps.join(", ")}`);
    }
  });
}

// ============================================================================
// DEMO 5: Score Explanation - Transparency
// ============================================================================

export function demoScoreExplanation() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 5: Score Transparency - Understanding the Breakdown");
  console.log("=".repeat(70));

  const skills = [
    "Python",
    "SQL",
    "Tableau",
    "Pandas",
    "NumPy",
    "Statistics",
    "Excel"
  ];

  console.log(`\nSkills: ${skills.join(", ")}\n`);

  const result = SkillRoleMappingService.calculateSkillMatchScore(
    "Data Analyst",
    skills
  );

  console.log(`📈 OVERALL: ${result.matchPercentage}% match`);
  console.log(`   Label: ${result.explanation}\n`);

  console.log("📊 COMPONENT BREAKDOWN:");
  result.components.forEach((comp) => {
    const barLength = Math.round(comp.categoryScore * 15);
    const bar = "█".repeat(barLength) + "░".repeat(15 - barLength);
    console.log(
      `   ${comp.categoryName.padEnd(25)} [${bar}] ${(comp.categoryScore * 100).toFixed(0)}%`
    );
    console.log(`      └─ ${comp.explanation}`);
    if (comp.matchedSkills.length > 0) {
      console.log(`      └─ Found: ${comp.matchedSkills.join(", ")}`);
    }
  });

  console.log(`\n💡 INSIGHTS:`);
  if (result.strengths.length > 0) {
    console.log(`   Strengths: ${result.strengths.join(", ")}`);
  }
  if (result.essentialGaps.length > 0) {
    console.log(`   Gaps: ${result.essentialGaps.join(", ")}`);
  }

  console.log(`\n🎯 RECOMMENDATIONS:`);
  result.recommendations.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. ${rec}`);
  });
}

// ============================================================================
// DEMO 6: Real-world Integration Scenario
// ============================================================================

export function demoIntegrationScenario() {
  console.log("\n" + "=".repeat(70));
  console.log("DEMO 6: Complete Integration Scenario");
  console.log("=".repeat(70));

  console.log("\n📋 SCENARIO: Resume Upload & Analysis Pipeline");
  console.log("-".repeat(70));

  // Step 1: Resume upload
  console.log(
    "\n[1] User uploads resume with extracted skills from resume parser"
  );
  const extractedSkills = [
    "Java",
    "Spring Boot",
    "MySQL",
    "Docker",
    "Git",
    "REST APIs",
    "AWS",
    "JUnit",
    "Maven"
  ];
  console.log(`    Extracted: ${extractedSkills.join(", ")}`);

  // Step 2: Multi-role analysis
  console.log("\n[2] System analyzes fit across all roles");
  const allMatches = SkillRoleMappingService.calculateAllRoleMatches(extractedSkills);
  const sortedMatches = Object.entries(allMatches)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3);

  sortedMatches.forEach(([role, data]) => {
    console.log(`    ${role}: ${data.matchPercentage}%`);
  });

  // Step 3: Personalized recommendations
  console.log("\n[3] Generate personalized recommendations");
  const topRole = sortedMatches[0][0];
  const topScore = sortedMatches[0][1].score;

  if (topScore >= 0.65) {
    const gapInfo = skillConfig.analyzeSkillGaps(topRole, extractedSkills);
    console.log(`    ✓ Strong fit for: ${topRole}`);
    console.log(`    ⏱️  Can be job-ready in: ${gapInfo.estimatedTimeToJobReady}`);
    if (gapInfo.missingCritical.length > 0) {
      console.log(`    📚 Learn: ${gapInfo.missingCritical.join(", ")}`);
    }
  }

  // Step 4: Alternative paths
  console.log("\n[4] Show alternative career paths");
  const alternativePaths = skillConfig.findRolesWithGaps(extractedSkills, 0.55);
  console.log(`    Other viable roles with skill development:`);
  alternativePaths.slice(0, 2).forEach((alt) => {
    console.log(`    - ${alt.roleName}: ${alt.gaps.join(", ")}`);
  });

  console.log("\n" + "-".repeat(70));
  console.log("✅ Resume analysis complete!");
}

// ============================================================================
// DEMO RUNNER
// ============================================================================

export function runAllDemos() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║" + "  SKILL-TO-ROLE MAPPING SERVICE - PRACTICAL DEMOS".padEnd(68) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝");

  try {
    demoResumeAnalysis();
    demoRoleRecommendations();
    demoSkillGapAnalysis();
    demoBatchEvaluation();
    demoScoreExplanation();
    demoIntegrationScenario();

    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + " ".repeat(68) + "║");
    console.log("║" + "  ✅ ALL DEMOS COMPLETED SUCCESSFULLY".padEnd(68) + "║");
    console.log("║" + " ".repeat(68) + "║");
    console.log("╚" + "═".repeat(68) + "╝\n");
  } catch (error) {
    console.error("\n❌ Demo Error:", error);
  }
}

// Run on direct execution
if (require.main === module) {
  runAllDemos();
}

export default { runAllDemos };
