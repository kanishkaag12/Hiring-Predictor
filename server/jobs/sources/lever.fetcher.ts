import axios from "axios";
import { Job } from "../job.types";

/**
 * Lever public postings API:
 * https://api.lever.co/v0/postings/{company_id}
 */

const WELL_KNOWN_LEVER_BOARDS = [
    "netflix"
];

export async function fetchLeverJobs(): Promise<Job[]> {
    const fetchCompanyJobs = async (company: string): Promise<Job[]> => {
        try {
            const response = await axios.get(`https://api.lever.co/v0/postings/${company}`, {
                timeout: 3000 // 3s timeout
            });
            const data = response.data;
            const companyName = company.charAt(0).toUpperCase() + company.slice(1);

            if (Array.isArray(data)) {
                return data.map((j: any) => {
                    const isIntern = j.text.toLowerCase().includes("intern") || j.text.toLowerCase().includes("apprentice");
                    return {
                        id: `lever-${company}-${j.id}`,
                        title: j.text,
                        company: companyName,
                        location: j.categories?.location || "Remote",
                        employmentType: isIntern ? "Internship" : "Full-time",
                        experienceLevel: isIntern ? "Student" : "Mid",
                        postedAt: new Date(j.createdAt).toISOString(),
                        applyUrl: j.hostedUrl,
                        source: "lever",
                        skills: [],
                        hiringPlatform: "Lever" as const,
                        hiringPlatformUrl: j.hostedUrl
                    };
                });
            }
        } catch (error: any) {
            if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
                console.error(`Failed to fetch Lever roles for ${company}:`, error.message);
            }
        }
        return [];
    };

    const results = await Promise.all(WELL_KNOWN_LEVER_BOARDS.map(fetchCompanyJobs));
    return results.flat();
}
