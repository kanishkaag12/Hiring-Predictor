/**
 * Skill-to-Role Mapping Service Tests
 * 
 * Demonstrates:
 * - Skill matching accuracy
 * - Deterministic scoring
 * - Explainability of scores
 * - Edge cases and validation
 */

import SkillRoleMappingService, {
  SkillMatchResult,
  ROLE_SKILL_PROFILES
} from "./skill-role-mapping.service";

// ============================================================================
// TEST SUITE
// ============================================================================

export class SkillRoleMappingTests {
  /**
   * Test 1: Data Analyst with complete skill set
   */
  static testDataAnalystComplete() {
    console.log("\n=== Test 1: Data Analyst with Complete Skill Set ===");

    const skills = [
      "Python",
      "SQL",
      "Excel",
      "Pandas",
      "NumPy",
      "Tableau",
      "Statistics"
    ];

    const result = SkillRoleMappingService.calculateSkillMatchScore(
      "Data Analyst",
      skills
    );

    console.log(`Role: ${result.roleName}`);
    console.log(`Score: ${result.overallScore.toFixed(2)}/1.0 (${result.matchPercentage}%)`);
    console.log(`\nComponent Breakdown:`);
    result.components.forEach((comp) => {
      console.log(
        `  - ${comp.categoryName}: ${comp.categoryScore.toFixed(2)} (${comp.explanation})`
      );
    });
    console.log(`\nEssential Gaps: ${result.essentialGaps.join(", ") || "None"}`);
    console.log(`Strengths: ${result.strengths.join(", ")}`);
    console.log(`\nExplanation: ${result.explanation}`);
    console.log(`Recommendations: ${result.recommendations.join("; ")}`);

    return result;
  }

  /**
   * Test 2: ML Engineer with partial skills
   */
  static testMLEngineerPartial() {
    console.log("\n=== Test 2: ML Engineer with Partial Skills ===");

    const skills = [
      "Python",
      "TensorFlow",
      "Pandas",
      "Git",
      "NumPy"
    ];

    const result = SkillRoleMappingService.calculateSkillMatchScore(
      "ML Engineer",
      skills
    );

    console.log(`Role: ${result.roleName}`);
    console.log(`Score: ${result.overallScore.toFixed(2)}/1.0 (${result.matchPercentage}%)`);
    console.log(`\nComponent Breakdown:`);
    result.components.forEach((comp) => {
      console.log(
        `  - ${comp.categoryName}: ${comp.categoryScore.toFixed(2)} (${comp.explanation})`
      );
    });
    console.log(`\nEssential Gaps: ${result.essentialGaps.join(", ") || "None"}`);
    console.log(`Strengths: ${result.strengths.join(", ")}`);
    console.log(`\nExplanation: ${result.explanation}`);
    console.log(`Recommendations: ${result.recommendations.join("; ")}`);

    return result;
  }

  /**
   * Test 3: Web Developer with mismatched skills
   */
  static testWebDeveloperMismatch() {
    console.log("\n=== Test 3: Web Developer with Mismatched Skills ===");

    const skills = [
      "Java",
      "AWS",
      "Statistics",
      "Power BI"
    ];

    const result = SkillRoleMappingService.calculateSkillMatchScore(
      "Web Developer",
      skills
    );

    console.log(`Role: ${result.roleName}`);
    console.log(`Score: ${result.overallScore.toFixed(2)}/1.0 (${result.matchPercentage}%)`);
    console.log(`\nComponent Breakdown:`);
    result.components.forEach((comp) => {
      console.log(
        `  - ${comp.categoryName}: ${comp.categoryScore.toFixed(2)} (${comp.explanation})`
      );
    });
    console.log(`\nEssential Gaps: ${result.essentialGaps.join(", ") || "None"}`);
    console.log(`Strengths: ${result.strengths.join(", ")}`);
    console.log(`\nExplanation: ${result.explanation}`);
    console.log(`Recommendations: ${result.recommendations.join("; ")}`);

    return result;
  }

  /**
   * Test 4: Batch scoring across all roles
   */
  static testBatchScoring() {
    console.log("\n=== Test 4: Batch Scoring Across All Roles ===");

    const skills = [
      "Python",
      "SQL",
      "React",
      "Docker",
      "Git",
      "Communication"
    ];

    const allScores = SkillRoleMappingService.calculateAllRoleMatches(skills);

    console.log(`Testing skills: ${skills.join(", ")}\n`);
    console.log("Role Scores:");

    const sorted = Object.entries(allScores)
      .sort(([, a], [, b]) => b.score - a.score);

    sorted.forEach(([role, score]) => {
      const barLength = Math.round(score.score * 20);
      const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
      console.log(
        `  ${role.padEnd(20)} [${bar}] ${score.matchPercentage}%`
      );
    });

    return allScores;
  }

  /**
   * Test 5: Alias resolution
   */
  static testAliasResolution() {
    console.log("\n=== Test 5: Alias Resolution ===");

    // These should all resolve to the same canonical skills
    const skillVariations = [
      ["Python", "py", "python3"],
      ["JavaScript", "js", "es6"],
      ["Node.js", "nodejs", "node"],
      ["React", "reactjs", "react.js"],
      ["Docker"],
      ["kubernetes", "k8s"]
    ];

    const roles = ["Web Developer", "Backend Developer"];

    for (const role of roles) {
      console.log(`\n${role}:`);
      for (const variations of skillVariations) {
        const result = SkillRoleMappingService.calculateSkillMatchScore(
          role,
          variations
        );
        console.log(
          `  ${variations.join(" / ")} → ${result.matchPercentage}%`
        );
      }
    }
  }

  /**
   * Test 6: Deterministic scoring (same input = same output)
   */
  static testDeterminism() {
    console.log("\n=== Test 6: Deterministic Scoring ===");

    const skills = ["Python", "SQL", "React", "Docker"];
    const role = "Web Developer";

    const results: number[] = [];
    for (let i = 0; i < 5; i++) {
      const result = SkillRoleMappingService.calculateSkillMatchScore(
        role,
        skills
      );
      results.push(result.overallScore);
    }

    const allEqual = results.every((score) => score === results[0]);
    console.log(`Scores: ${results.map((s) => s.toFixed(3)).join(", ")}`);
    console.log(`All scores identical: ${allEqual ? "✓ PASS" : "✗ FAIL"}`);

    return allEqual;
  }

  /**
   * Test 7: Empty skills handling
   */
  static testEdgeCases() {
    console.log("\n=== Test 7: Edge Cases ===");

    // Empty skills
    console.log("\n1. Empty skills:");
    const emptyResult = SkillRoleMappingService.calculateSkillMatchScore(
      "Data Analyst",
      []
    );
    console.log(`   Score: ${emptyResult.matchPercentage}%`);
    console.log(`   All gaps: ${emptyResult.essentialGaps.join(", ")}`);

    // Unknown skills
    console.log("\n2. Unknown/unrecognized skills:");
    const unknownResult = SkillRoleMappingService.calculateSkillMatchScore(
      "Data Analyst",
      ["XYZUnknownSkill", "InvalidTool123"]
    );
    console.log(`   Score: ${unknownResult.matchPercentage}%`);
    console.log(`   Explanation: ${unknownResult.explanation}`);

    // Case variations
    console.log("\n3. Case variations:");
    const caseResult1 = SkillRoleMappingService.calculateSkillMatchScore(
      "Data Analyst",
      ["python", "SQL", "EXCEL"]
    );
    const caseResult2 = SkillRoleMappingService.calculateSkillMatchScore(
      "Data Analyst",
      ["Python", "sql", "excel"]
    );
    console.log(
      `   "python, SQL, EXCEL": ${caseResult1.matchPercentage}%`
    );
    console.log(
      `   "Python, sql, excel": ${caseResult2.matchPercentage}%`
    );
    console.log(
      `   Scores match: ${caseResult1.overallScore === caseResult2.overallScore ? "✓" : "✗"}`
    );
  }

  /**
   * Run all tests
   */
  static runAllTests() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       Skill-to-Role Mapping Service - Test Suite           ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    try {
      this.testDataAnalystComplete();
      this.testMLEngineerPartial();
      this.testWebDeveloperMismatch();
      this.testBatchScoring();
      this.testAliasResolution();
      const deterministicPass = this.testDeterminism();
      this.testEdgeCases();

      console.log(
        "\n╔════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║                    Test Suite Complete                     ║"
      );
      console.log(
        "╚════════════════════════════════════════════════════════════╝\n"
      );

      return deterministicPass;
    } catch (error) {
      console.error("Test suite error:", error);
      return false;
    }
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

export default SkillRoleMappingTests;
