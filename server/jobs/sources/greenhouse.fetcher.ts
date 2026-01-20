import axios from "axios";
import { Job } from "../job.types";

/**
 * Greenhouse public board API:
 * https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
 * 
 * For this demo/platform, we use a few well-known public tokens 
 * but the architecture supports any public board.
 */

const WELL_KNOWN_BOARDS = [
    "stripe",
    "figma"
];

export async function fetchGreenhouseJobs(): Promise<Job[]> {
    const fetchBoardJobs = async (board: string): Promise<Job[]> => {
        try {
            const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, {
                timeout: 3000 // 3s timeout
            });
            const data = response.data;
            const companyName = board.charAt(0).toUpperCase() + board.slice(1);

            if (data.jobs && Array.isArray(data.jobs)) {
                return data.jobs.map((j: any) => ({
                    id: `greenhouse-${board}-${j.id}`,
                    title: j.title,
                    company: companyName,
                    location: j.location?.name || "Remote",
                    employmentType: "Full-time",
                    experienceLevel: "Mid",
                    postedAt: j.updated_at || new Date().toISOString(),
                    applyUrl: j.absolute_url,
                    source: "greenhouse",
                    skills: [],
                    hiringPlatform: "Greenhouse" as const,
                    hiringPlatformUrl: `https://boards.greenhouse.io/${board}`
                }));
            }
        } catch (error: any) {
            // Silently skip if board is not found (404) or timeout
            if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
                console.error(`Failed to fetch Greenhouse roles for ${board}:`, error.message);
            }
        }
        return [];
    };

    const results = await Promise.all(WELL_KNOWN_BOARDS.map(fetchBoardJobs));
    return results.flat();
}
