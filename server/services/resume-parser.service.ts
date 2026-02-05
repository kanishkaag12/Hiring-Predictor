/**
 * RESUME PARSER SERVICE
 * Wrapper for the Python resume parser utility.
 * Calls the Python script to extract structured resume data.
 */

import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * ✅ STRUCTURED RESUME DATA INTERFACE
 * Matches the new Python parser output format
 */
export interface ParsedResumeData {
  // ✅ Categorized technical skills (clean, normalized)
  technical_skills: string[];
  programming_languages: string[];
  frameworks_libraries: string[];
  tools_platforms: string[];
  databases: string[];
  
  // ✅ Soft skills (separated from technical)
  soft_skills: string[];
  
  // ✅ Experience (months + detailed entries)
  experience_months_total: number; // ⚠️ CORRECT FIELD NAME
  experience: Array<{
    company?: string;
    role: string;
    duration?: string;
    duration_months?: number;
    start_date?: string;
    end_date?: string;
    type?: 'full-time' | 'internship' | 'training' | 'part-time' | string;
    responsibilities?: string[];
  }>;
  
  // ✅ Projects (with detailed entries)
  projects: Array<{
    title: string;
    description: string;
    tools_methods_used?: string[];
    tech_stack?: string[];
  }>;
  
  // ✅ Education
  education: Array<{
    degree: string;
    field?: string;
    institution?: string;
    year?: string;
    cgpa?: string;
    start_date?: string;
    end_date?: string;
  }>;
  
  // ✅ Certifications
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  
  // Metadata
  resume_completeness_score: number;
  
  // Legacy compatibility
  skills?: string[]; // For backward compatibility
  projects_count?: number; // Computed from projects.length
  experience_months?: number; // Alias for experience_months_total
  cgpa?: number | null; // Extracted from education
}

/**
 * Find the Python executable path from the virtual environment.
 * 
 * Looks for .venv in the outer project root directory.
 * Supports both Windows (.venv\Scripts\python.exe) and Unix (.venv/bin/python)
 * 
 * Falls back to "python" if .venv not found.
 */
export function findPythonExecutable(projectRoot: string): string {
  const isWindows = os.platform() === "win32";
  const venvPythonPath = path.join(
    projectRoot,
    ".venv",
    isWindows ? "Scripts" : "bin",
    isWindows ? "python.exe" : "python"
  );

  if (fs.existsSync(venvPythonPath)) {
    console.log(`[Resume Parser] Using venv Python: ${venvPythonPath}`);
    return venvPythonPath;
  }

  console.warn(`[Resume Parser] .venv not found at ${venvPythonPath}, falling back to system python`);
  return "python";
}

/**
 * Dynamically find the project root directory.
 * 
 * The project has a nested structure:
 * /Hiring-Predictor (outer - contains scripts/)
 *   /Hiring-Predictor (inner - contains package.json, server/, client/)
 *     /server (backend - this is where this file runs from)
 *     /client (frontend)
 * 
 * This function traverses up from current working directory to find:
 * 1. The inner Hiring-Predictor with package.json
 * 2. Then goes up one more level to find the outer Hiring-Predictor with scripts/
 * 
 * This ensures script paths work regardless of working directory at startup.
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxLevels = 10; // Safety limit to prevent infinite loops

  console.log(`[Resume Parser] Starting search from: ${currentDir}`);

  // Find the project root (contains package.json, server/, and scripts/)
  for (let i = 0; i < maxLevels; i++) {
    const packageJsonPath = path.join(currentDir, "package.json");
    const serverPath = path.join(currentDir, "server");
    const scriptsPath = path.join(currentDir, "scripts");

    // Check if this directory has all required folders
    if (fs.existsSync(packageJsonPath) && fs.existsSync(serverPath) && fs.existsSync(scriptsPath)) {
      console.log(`[Resume Parser] Project root found at: ${currentDir}`);
      return currentDir;
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }

  // Fallback: use current working directory
  console.warn("[Resume Parser] Could not find project root structure, using current directory");
  console.warn(`[Resume Parser] Fallback path: ${process.cwd()}`);
  return process.cwd();
}

/**
 * Parse a resume buffer (PDF or DOCX) and extract structured data.
 * 
 * @param fileBuffer - The resume file as a Buffer
 * @param fileName - Original filename (used to determine file type)
 * @returns Parsed resume data
 */
export async function parseResume(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedResumeData> {
  // Defensive: ensure we have a valid file buffer before proceeding
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error(
      "Empty or invalid resume file buffer provided. Ensure the upload uses memoryStorage or read the file from disk before parsing."
    );
  }

  // Create a temporary file
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(
    tempDir,
    `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(fileName)}`
  );

  try {
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, fileBuffer);

    // Call the Python resume parser
    const result = await callPythonParser(tempFilePath);

    return result;
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error("Failed to clean up temp file:", cleanupError);
    }
  }
}

/**
 * Call the Python resume parser script synchronously.
 * 
 * @param filePath - Path to the resume file
 * @returns Parsed resume data
 */
function callPythonParser(filePath: string): Promise<ParsedResumeData> {
  return new Promise((resolve, reject) => {
    try {
      // Dynamically find project root and resolve script path
      const projectRoot = findProjectRoot();
      const candidateScriptPaths = [
        path.join(projectRoot, "python", "resume_parser.py"),
        path.join(projectRoot, "scripts", "resume-parser", "resume_parser.py"),
      ];

      const pythonScriptPath = candidateScriptPaths.find((candidate) =>
        fs.existsSync(candidate)
      );

      console.log(
        `[Resume Parser] Looking for script at: ${candidateScriptPaths.join(", ")}`
      );

      // Check if the Python script exists
      if (!pythonScriptPath) {
        // Provide helpful debugging information
        const searchedLocations = [
          ...candidateScriptPaths,
          path.join(process.cwd(), "python", "resume_parser.py"),
          path.join(process.cwd(), "scripts", "resume-parser", "resume_parser.py"),
          path.join(process.cwd(), "..", "scripts", "resume-parser", "resume_parser.py"),
        ];

        const errorMsg =
          `Resume parser script not found.\n\n` +
          `Searched locations:\n${searchedLocations.map(loc => `  - ${loc}`).join('\n')}\n\n` +
          `Project root detected: ${projectRoot}\n` +
          `Current working directory: ${process.cwd()}\n\n` +
          `Ensure the resume_parser.py script exists at one of:\n${searchedLocations.map(loc => `  - ${loc}`).join('\n')}`;

        return reject(new Error(errorMsg));
      }

      console.log(`[Resume Parser] Script found. Executing...`);

      // Find the Python executable (prefer .venv over system python)
      const pythonExe = findPythonExecutable(projectRoot);

      // Execute the Python script
      const pythonProcess = spawn(pythonExe, [pythonScriptPath, filePath], {
        timeout: 30000, // 30 second timeout
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("[Resume Parser] Python stderr:", data.toString());
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          return reject(
            new Error(
              `Python script exited with code ${code}. Error: ${stderr}`
            )
          );
        }

        try {
          // Parse the JSON output from Python script
          const result: ParsedResumeData = JSON.parse(stdout);

          // Validate the result structure (check for new format fields)
          if (
            !Array.isArray(result.technical_skills) ||
            !Array.isArray(result.programming_languages) ||
            !Array.isArray(result.education) ||
            typeof result.experience_months_total !== "number" ||
            typeof result.resume_completeness_score !== "number"
          ) {
            return reject(
              new Error("Invalid resume parser output format - missing required fields")
            );
          }
          
          // Add legacy compatibility fields
          const allSkills = [
            ...result.technical_skills,
            ...result.programming_languages,
            ...result.frameworks_libraries,
            ...result.tools_platforms,
            ...result.databases
          ];
          
          result.skills = allSkills; // Legacy compatibility
          result.projects_count = result.projects?.length || 0;
          result.experience_months = result.experience_months_total;

          resolve(result);
        } catch (parseError) {
          reject(
            new Error(
              `Failed to parse Python output: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            )
          );
        }
      });

      pythonProcess.on("error", (error) => {
        reject(
          new Error(
            `Failed to spawn Python process: ${error.message}`
          )
        );
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Safe wrapper for resume parsing with fallback values.
 * DEPRECATED: This function masks errors which leads to empty parsed data.
 * Use parseResume() directly in upload handlers and catch errors explicitly.
 * 
 * @deprecated Use parseResume() and handle errors at call site
 * @param fileBuffer - The resume file as a Buffer
 * @param fileName - Original filename
 * @returns Parsed resume data or default values
 */
export async function parseResumeWithFallback(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedResumeData> {
  // Always attempt to parse - let caller decide what to do with errors
  return await parseResume(fileBuffer, fileName);
}

export default {
  parseResume,
  parseResumeWithFallback,
};
