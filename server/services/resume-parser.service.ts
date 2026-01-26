/**
 * RESUME PARSER SERVICE
 * Wrapper for the Python resume parser utility.
 * Calls the Python script to extract structured resume data.
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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
  skills_extraction_warning?: boolean;
}


/**
 * Get the project root directory.
 * 
 * Assumes standard directory structure:
 * - package.json exists at project root
 * - server/ directory exists at project root
 * 
 * Returns the directory containing package.json and server/
 */
export function getProjectRoot(): string {
  const cwd = process.cwd();
  
  // Check if we're already at project root
  if (
    fs.existsSync(path.join(cwd, "package.json")) &&
    fs.existsSync(path.join(cwd, "server"))
  ) {
    return cwd;
  }
  
  // Check parent directory (if run from server/)
  const parent = path.dirname(cwd);
  if (
    fs.existsSync(path.join(parent, "package.json")) &&
    fs.existsSync(path.join(parent, "server"))
  ) {
    return parent;
  }
  
  // Fallback to cwd
  console.warn(
    `[Resume Parser] Could not determine project root. Using current working directory: ${cwd}`
  );
  return cwd;
}

/**
 * Find the Python executable path from the virtual environment.
 * 
 * Looks for .venv in the project root directory.
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
    return venvPythonPath;
  }

  // Fallback to system python
  return isWindows ? "python.exe" : "python";
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

/**
 * Verify resume parser script exists at canonical location.
 * Returns absolute path if it exists, null if missing.
 */
export function getResumeParserPath(): string | null {
  const projectRoot = getProjectRoot();
  const parserPath = path.resolve(projectRoot, "python", "resume_parser.py");
  
  if (fs.existsSync(parserPath)) {
    return parserPath;
  }
  
  return null;
}

/**
 * Log parser readiness at startup (dev only).
 */
export function logParserStatus(): void {
  const devMode = process.env.NODE_ENV !== "production";
  if (!devMode) return;
  
  const parserPath = getResumeParserPath();
  
  if (parserPath) {
    console.log(`[Resume Parser] ✓ Resume parser found at: ${parserPath}`);
  } else {
    console.warn(
      `[Resume Parser] ⚠ Resume parser NOT found at: ${path.resolve(getProjectRoot(), "python", "resume_parser.py")}`
    );
    console.warn(
      `[Resume Parser] Resume uploads will gracefully degrade to empty defaults`
    );
  }
}
/**
 * Parse a resume buffer (PDF or DOCX) and extract structured data.
 * 
 * @param fileBuffer - The resume file as a Buffer
 * @param fileName - Original filename (used to determine file type)
 * @returns Parsed resume data or empty defaults on error
 */

/**
 * Parse a resume buffer (PDF or DOCX) and extract structured data.
 * 
 * @param fileBuffer - The resume file as a Buffer
 * @param fileName - Original filename (used to determine file type)
 * @returns Parsed resume data or empty defaults on error
 * @throws Error if parsing fails critically (NOT caught - caller should handle)
 */
export async function parseResume(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedResumeData> {
  const devMode = process.env.NODE_ENV !== "production";
  const startTime = Date.now();

  // Check if parser exists
  const parserPath = getResumeParserPath();
  if (!parserPath) {
    const err = new Error("Resume parser not found - skipping parse");
    if (devMode) {
      console.log(`[Resume Parser] ${err.message}`);
    }
    throw err;
  }

  // Defensive validation
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error("Empty or invalid resume file buffer");
  }

  // Create temporary file
  const tempDir = os.tmpdir();
  const tempFileName = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(fileName)}`;
  const tempFilePath = path.resolve(tempDir, tempFileName);

  try {
    if (devMode) {
      console.log(`[Resume Parser] Writing temp file: ${tempFilePath}`);
    }

    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, fileBuffer);

    if (devMode) {
      console.log(`[Resume Parser] Temp file written (${fileBuffer.length} bytes)`);
    }

    // Call the Python resume parser
    const result = await callPythonParser(tempFilePath);

    const duration = Date.now() - startTime;
    if (devMode) {
      console.log(
        `[Resume Parser] Successfully parsed: ${result.skills.length} skills, ${result.education.length} education entries, completeness ${result.resume_completeness_score}`
      );
      console.log(`[Resume Parser] Parse duration: ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[Resume Parser] Parse failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        if (devMode) {
          console.log(`[Resume Parser] Temp file cleaned up`);
        }
      }
    } catch (cleanupError) {
      console.error("[Resume Parser] Cleanup failed:", cleanupError);
    }
  }
}
/**
 * Call the Python resume parser script with proper error handling, timeout, and logging.
 * 
 * @param filePath - Absolute path to the resume file
 * @returns Parsed resume data (or empty defaults on error)
 */


/**
 * Call the Python resume parser script with timeout and error handling.
 * 
 * @param filePath - Absolute path to the resume file
 * @returns Parsed resume data
 * @throws Error if parsing fails
 */
function callPythonParser(filePath: string): Promise<ParsedResumeData> {
  return new Promise((resolve, reject) => {
    const devMode = process.env.NODE_ENV !== "production";
    const startTime = Date.now();
    let hasResolved = false;
    let timeoutHandle: NodeJS.Timeout | null = null;

    try {
      const projectRoot = getProjectRoot();
      const parserPath = getResumeParserPath();

      if (!parserPath) {
        return reject(new Error("Resume parser path is null"));
      }

      if (devMode) {
        console.log(`[Resume Parser] Parser: ${parserPath}`);
        console.log(`[Resume Parser] File: ${filePath}`);
      }

      // Spawn Python process
      const pythonExe = findPythonExecutable(projectRoot);
      const PARSER_TIMEOUT = 30000; // 30 seconds

      const pythonProcess = spawn(pythonExe, [parserPath, filePath], {
        timeout: PARSER_TIMEOUT,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      // Capture stderr
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
        if (devMode) {
          console.error("[Resume Parser] stderr:", data.toString());
        }
      });

      // Capture stdout
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      // Timeout handler
      timeoutHandle = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          pythonProcess.kill("SIGTERM");
          console.error(
            `[Resume Parser] Timeout after ${PARSER_TIMEOUT}ms, process killed`
          );
          reject(new Error(`Resume parser timeout (${PARSER_TIMEOUT}ms)`));
        }
      }, PARSER_TIMEOUT + 1000);

      // Process close
      pythonProcess.on("close", (code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (hasResolved) return;
        hasResolved = true;

        const duration = Date.now() - startTime;

        try {
          if (!stdout) {
            console.error("[Resume Parser] No output from Python");
            if (devMode && stderr) {
              console.error("[Resume Parser] stderr:", stderr);
            }
            return reject(new Error("Resume parser produced no output"));
          }

          // Parse JSON
          const result: ParsedResumeData = JSON.parse(stdout);

          // Validate structure
          if (
            !Array.isArray(result.skills) ||
            !Array.isArray(result.education) ||
            typeof result.experience_months !== "number" ||
            typeof result.projects_count !== "number" ||
            typeof result.resume_completeness_score !== "number"
          ) {
            return reject(new Error("Invalid resume parser output format"));
          }

          if (devMode) {
            console.log(
              `[Resume Parser] Process completed in ${duration}ms (exit code ${code})`
            );
          }

          resolve(result);
        } catch (parseError) {
          console.error(
            "[Resume Parser] Failed to parse output:",
            parseError instanceof Error ? parseError.message : String(parseError)
          );
          if (devMode && stdout) {
            console.error("[Resume Parser] stdout:", stdout.substring(0, 500));
          }
          reject(new Error("Failed to parse parser output"));
        }
      });

      // Process error
      pythonProcess.on("error", (error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (hasResolved) return;
        hasResolved = true;

        console.error("[Resume Parser] Failed to spawn process:", error.message);
        reject(new Error(`Failed to spawn Python: ${error.message}`));
      });
    } catch (error) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      console.error(
        "[Resume Parser] Unexpected error:",
        error instanceof Error ? error.message : String(error)
      );
      reject(error);
    }
  });
}

export default {
  parseResume,
  getResumeParserPath,
  logParserStatus,
};
