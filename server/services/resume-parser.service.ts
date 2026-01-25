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
 * Dynamically find the project root directory.
 * Traverses upward from current working directory until finding package.json.
 * This ensures script paths work regardless of where the server is executed from.
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxLevels = 10; // Safety limit to prevent infinite loops
  
  for (let i = 0; i < maxLevels; i++) {
    // Check if package.json exists at this level
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      // Found package.json, check if parent has scripts folder
      const parentDir = path.dirname(currentDir);
      const scriptsDir = path.join(parentDir, "scripts");
      
      // If scripts folder exists at parent level, use parent as root
      if (fs.existsSync(scriptsDir)) {
        return parentDir;
      }
      
      // Otherwise, check if scripts exist at current level
      const localScriptsDir = path.join(currentDir, "scripts");
      if (fs.existsSync(localScriptsDir)) {
        return currentDir;
      }
    }
    
    // Move up one directory
    const parentDir = path.dirname(currentDir);
    
    // Check if we've reached the root (no more parent directories)
    if (parentDir === currentDir) {
      break;
    }
    
    currentDir = parentDir;
  }
  
  // Fallback: assume scripts are in parent of current working directory
  return path.dirname(process.cwd());
}

export interface ParsedResumeData {
  skills: string[];
  education: Array<{
    degree: string;
    institution?: string;
    year?: string;
  }>;
  experience_months: number;
  projects_count: number;
  resume_completeness_score: number;
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
      const pythonScriptPath = path.join(
        projectRoot,
        "scripts",
        "resume-parser",
        "resume_parser.py"
      );

      // Check if the Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        const searchedLocations = [
          pythonScriptPath,
          path.join(process.cwd(), "scripts", "resume-parser", "resume_parser.py"),
          path.join(process.cwd(), "..", "scripts", "resume-parser", "resume_parser.py"),
        ];
        
        return reject(
          new Error(
            `Resume parser script not found. Searched locations:\n${searchedLocations.map(loc => `  - ${loc}`).join('\n')}\n` +
            `Project root detected: ${projectRoot}\n` +
            `Current working directory: ${process.cwd()}`
          )
        );
      }

      console.log(`[Resume Parser] Using script at: ${pythonScriptPath}`);

      // Execute the Python script
      const pythonProcess = spawn("python", [pythonScriptPath, filePath], {
        timeout: 30000, // 30 second timeout
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("Python stderr:", data.toString());
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

          // Validate the result structure
          if (
            !result.skills ||
            !result.education ||
            typeof result.experience_months !== "number" ||
            typeof result.projects_count !== "number" ||
            typeof result.resume_completeness_score !== "number"
          ) {
            return reject(
              new Error("Invalid resume parser output format")
            );
          }

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
