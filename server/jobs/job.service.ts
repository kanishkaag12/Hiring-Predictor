import { Job, JobFilter, CompanyDiscovery } from "./job.types";
import { getEnabledBackendSources } from "./job.sources";
import { fetchRemotiveJobs } from "./sources/remotive.fetcher";
import { fetchGreenhouseJobs } from "./sources/greenhouse.fetcher";
import { fetchLeverJobs } from "./sources/lever.fetcher";
import { analyzeJob } from "./job.analysis";

function getDaysSincePosted(postedAt: string): number {
  const postedDate = new Date(postedAt);
  const today = new Date();
  const diffTime = today.getTime() - postedDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function inferRoleLevel(
  title: string
): "Intern" | "Junior" | "Mid" | "Senior" {
  const t = title.toLowerCase();

  if (t.includes("intern")) return "Intern";
  if (t.includes("junior") || t.includes("entry")) return "Junior";
  if (
    t.includes("senior") ||
    t.includes("lead") ||
    t.includes("principal")
  )
    return "Senior";

  return "Mid";
}

/**
 * Temporary heuristic for applicants
 * (later replaced by real data / ML)
 */
function inferApplicants(daysSincePosted: number): number {
  if (daysSincePosted <= 2) return 40;
  if (daysSincePosted <= 5) return 120;
  if (daysSincePosted <= 10) return 300;
  return 600;
}

// --- NEW INFERENCE HELPERS ---

const MNC_LIST = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Spotify", "Stripe", "Coinbase", "Airbnb", "Adobe", "Salesforce", "IBM", "Intel", "Oracle", "Cisco", "Dell", "HP", "Lenovo", "Samsung", "Sony", "LG", "Nvidia", "AMD", "Qualcomm", "TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "Deloitte", "PwC", "KPMG", "EY", "JPMorgan", "Goldman Sachs", "Morgan Stanley", "Citi", "Bank of America", "Wells Fargo", "HSBC", "Barclays", "Visa", "Mastercard", "PayPal", "American Express"];

function inferCompanyType(company: string): "Startup" | "MNC" | "Agency" | "Product" | "Other" {
  if (MNC_LIST.some(mnc => company.toLowerCase().includes(mnc.toLowerCase()))) return "MNC";
  if (company.includes("Inc") || company.includes("Ltd") || company.includes("LLC")) return "Product";
  return "Startup";
}

/**
 * Infer company size based on total job board volume
 * Heuristic: Boards with > 100 roles are Large, 20-100 are Mid, etc.
 */
function inferCompanySize(rolesCount: number): "Startup" | "Small" | "Mid-size" | "Large" {
  if (rolesCount > 100) return "Large";
  if (rolesCount > 50) return "Mid-size";
  if (rolesCount > 10) return "Small";
  return "Startup";
}

function inferCompanyTags(job: any): string[] {
  const tags: string[] = [];
  const lowerTitle = job.title?.toLowerCase() || "";
  const lowerDesc = job.description?.toLowerCase() || "";
  const lowerCompany = job.company?.toLowerCase() || "";

  // Remote
  if (job.location?.toLowerCase().includes("remote")) tags.push("Remote-first");

  // Industry
  if (lowerTitle.includes("fintech") || lowerDesc.includes("finance")) tags.push("FinTech");
  if (lowerTitle.includes("ai") || lowerDesc.includes("machine learning") || lowerTitle.includes("gpt")) tags.push("AI/ML");
  if (lowerTitle.includes("crypto") || lowerTitle.includes("blockchain") || lowerTitle.includes("web3")) tags.push("Web3");
  if (lowerTitle.includes("saas") || lowerDesc.includes("saas")) tags.push("SaaS");
  if (lowerTitle.includes("game") || lowerTitle.includes("gaming")) tags.push("Gaming");
  if (lowerTitle.includes("health") || lowerTitle.includes("med")) tags.push("HealthTech");

  // Type
  if (job.companyType === "MNC") tags.push("Enterprise");
  if (job.companyType === "Startup") tags.push("High Growth");

  return Array.from(new Set(tags)).slice(0, 3);
}

export async function fetchJobs(filter: JobFilter = {}): Promise<Job[]> {
  const enabledSources = getEnabledBackendSources();
  let allRawJobs: Job[] = [];

  // Fetch all sources in parallel
  const fetchPromises = enabledSources.map(async (source) => {
    try {
      if (source.id === "remotive") return await fetchRemotiveJobs();
      if (source.id === "greenhouse") return await fetchGreenhouseJobs();
      if (source.id === "lever") return await fetchLeverJobs();
    } catch (error) {
      console.error(`Failed to fetch jobs from ${source.id}:`, error);
    }
    return [];
  });

  const results = await Promise.all(fetchPromises);
  allRawJobs = results.flat();

  // Count roles per company for size inference
  const companyCounts: Record<string, number> = {};
  allRawJobs.forEach(job => {
    companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
  });

  const enrichedJobs: Job[] = allRawJobs.map((job) => {
    const daysSincePosted = getDaysSincePosted(job.postedAt);
    const applicants = inferApplicants(daysSincePosted);
    const roleLevel = inferRoleLevel(job.title);
    const isInternship = roleLevel === "Intern" || job.title.toLowerCase().includes("intern") || job.employmentType === "Internship";
    const companyType = inferCompanyType(job.company);
    const companySizeTag = inferCompanySize(companyCounts[job.company] || 1);

    // 🔥 ANALYSIS LAYER (CORE LOGIC)
    const analysis = analyzeJob({
      id: job.id,
      title: job.title,
      company: job.company,
      daysSincePosted,
      applicants,
      roleLevel,
      postedAt: job.postedAt,
      skills: job.skills,
    });

    return {
      ...job,
      daysSincePosted,
      applicants,
      analysis,
      companyType,
      companySizeTag,
      companyTags: inferCompanyTags({ ...job, companyType }),
      isInternship,
      experienceLevel: roleLevel === "Intern" ? "Student" : (roleLevel as any)
    };
  });

  // --- FILTERING LOGIC ---
  return enrichedJobs.filter(job => {
    // 1. Strict Separation: Job vs Internship
    if (filter.type === "internship" && !job.isInternship) return false;
    if (filter.type === "job" && job.isInternship) return false;

    // 2. Search (Company, Title, Skills)
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matches =
        job.company.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.skills.some(s => s.toLowerCase().includes(q));
      if (!matches) return false;
    }

    // 3. Level Filter
    if (filter.level && job.experienceLevel !== filter.level) return false;

    // 4. Company Type Filter
    if (filter.companyType && job.companyType !== filter.companyType) return false;

    // 5. Company Size Filter
    if (filter.companySize && job.companySizeTag !== filter.companySize) return false;

    // 6. Work Type Filter
    if (filter.workType) {
      if (filter.workType === "Remote" && !job.location.toLowerCase().includes("remote")) return false;
    }

    return true;
  });
}



export async function fetchJobById(jobId: string): Promise<Job | null> {
  const jobs = await fetchJobs();
  return jobs.find((job) => job.id === jobId) ?? null;
}
