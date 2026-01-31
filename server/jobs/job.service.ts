import { Job, JobFilter, CompanyDiscovery, MarketStats, DemandTrend } from "./job.types";
import { getEnabledBackendSources } from "./job.sources";
import { fetchRemotiveJobs } from "./sources/remotive.fetcher";
import { fetchGreenhouseJobs } from "./sources/greenhouse.fetcher";
import { fetchLeverJobs } from "./sources/lever.fetcher";
import { analyzeJob } from "./job.analysis";
import { User, Skill, Project, Experience } from "@shared/schema";
import { storage } from "../storage";

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

export interface UserContext {
  user: User;
  skills: Skill[];
  projects: Project[];
  experiences: Experience[];
}

export async function fetchJobs(filter: JobFilter = {}, userContext?: UserContext): Promise<Job[]> {
  const enabledSources = getEnabledBackendSources();
  let allRawJobs: Job[] = [];

  // DISABLED: External job sources (Remotive, Greenhouse, Lever)
  // Only fetch from database now
  // const fetchPromises = enabledSources.map(async (source) => {
  //   try {
  //     if (source.id === "remotive") return await fetchRemotiveJobs();
  //     if (source.id === "greenhouse") return await fetchGreenhouseJobs();
  //     if (source.id === "lever") return await fetchLeverJobs();
  //   } catch (error) {
  //     console.error(`Failed to fetch jobs from ${source.id}:`, error);
  //   }
  //   return [];
  // });

  // const results = await Promise.all(fetchPromises);
  // allRawJobs = results.flat();

  // Fetch jobs from database only
  const dbJobs = await storage.getJobs();
  const mappedDbJobs: Job[] = dbJobs.map(dbJob => ({
    ...dbJob,
    postedAt: dbJob.postedAt.toISOString(),
    isInternship: dbJob.isInternship === 1,
    salaryRange: dbJob.salaryRange ?? undefined,
    employmentType: dbJob.employmentType as any,
    experienceLevel: dbJob.experienceLevel as any,
    companyType: dbJob.companyType as any,
    companySizeTag: dbJob.companySizeTag as any,
    companyTags: dbJob.companyTags ?? [],
    hiringPlatform: dbJob.hiringPlatform as any,
    hiringPlatformUrl: dbJob.hiringPlatformUrl ?? undefined,
    applicants: dbJob.applicants ?? undefined,
    // Ensure id is preserved
    id: dbJob.id
  }));

  allRawJobs = mappedDbJobs;

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
    const analysis = analyzeJob(
      {
        id: job.id,
        title: job.title,
        company: job.company,
        daysSincePosted,
        applicants,
        roleLevel,
        postedAt: job.postedAt,
        skills: job.skills,
        employmentType: job.employmentType,
        isInternship,
        experienceLevel: roleLevel,
      },
      userContext?.user,
      userContext?.skills,
      userContext?.projects,
      userContext?.experiences
    );

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



function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeRoleCategory(title: string): string {
  const t = title.toLowerCase();

  // Data roles
  if (t.includes("data scientist") || t.includes("data science")) return "Data Scientist";
  if (t.includes("data engineer")) return "Data Engineer";
  if (t.includes("data analyst")) return "Data Analyst";
  if (t.includes("machine learning") || t.includes("ml engineer")) return "ML Engineer";

  // Engineering roles - match common user selections
  if (t.includes("frontend") || t.includes("front-end") || t.includes("front end") || t.includes("ui engineer")) return "Frontend Developer";
  if (t.includes("backend") || t.includes("back-end") || t.includes("back end") || t.includes("api developer") || t.includes("server")) return "Backend Developer";
  if (t.includes("full stack") || t.includes("fullstack") || t.includes("full-stack")) return "Fullstack Developer";
  if (t.includes("devops") || t.includes("sre") || t.includes("site reliability")) return "DevOps Engineer";
  if (t.includes("cloud architect") || t.includes("solutions architect")) return "Cloud Architect";
  if (t.includes("mobile") || t.includes("android") || t.includes("ios") || t.includes("react native")) return "Mobile App Developer";

  // Product & Design
  if (t.includes("product manager") || t.includes("product management") || t.includes("product owner")) return "Product Manager";
  if (t.includes("ux") || t.includes("ui design") || t.includes("ui/ux") || t.includes("ux/ui") || t.includes("user experience") || t.includes("user interface")) return "UI/UX Designer";

  // Business & QA
  if (t.includes("business analyst")) return "Business Analyst";
  if (t.includes("qa engineer") || t.includes("qa analyst") || t.includes("quality assurance") || t.includes("test engineer") || t.includes("sdet")) return "QA Engineer";

  // Software Engineer is the catch-all
  return "Software Engineer";
}

function computeDemandTrend(postedDates: string[]): DemandTrend {
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const recentWindow = 7 * dayMs;
  const prevWindowStart = now - 14 * dayMs;
  const prevWindowEnd = now - 7 * dayMs;

  let recent = 0;
  let previous = 0;

  postedDates.forEach((dateStr) => {
    const ts = new Date(dateStr).getTime();
    if (isNaN(ts)) return;
    if (ts >= now - recentWindow) recent += 1;
    else if (ts >= prevWindowStart && ts < prevWindowEnd) previous += 1;
  });

  if (previous === 0 && recent === 0) return "stable";
  if (previous === 0 && recent > 0) return "rising";

  const ratio = recent / Math.max(1, previous);
  if (ratio >= 1.15) return "rising";
  if (ratio <= 0.85) return "falling";
  return "stable";
}

// **CRITICAL: Market Data Aggregation**
// This function computes demand + competition scores aligned with role readiness
export function aggregateMarketStats(jobs: Job[]): MarketStats[] {
  const grouped: Record<string, Job[]> = {};

  jobs.forEach((job) => {
    const roleCategory = normalizeRoleCategory(job.title);
    grouped[roleCategory] = grouped[roleCategory] || [];
    grouped[roleCategory].push(job);
  });

  const results: MarketStats[] = Object.entries(grouped).map(([roleCategory, roleJobs]) => {
    const totalActiveJobs = roleJobs.length;
    const totalApplicants = roleJobs.reduce((sum, job) => sum + (job.applicants || 0), 0);
    const averageApplicantsPerJob = totalActiveJobs > 0 ? totalApplicants / totalActiveJobs : 0;

    const postedDates = roleJobs.map(j => j.postedAt);
    const demandTrend = computeDemandTrend(postedDates);

    const avgDays = roleJobs.reduce((sum, job) => sum + (job.daysSincePosted ?? getDaysSincePosted(job.postedAt)), 0) / Math.max(1, totalActiveJobs);
    const volumeScore = Math.min(1, totalActiveJobs / 50);
    const recencyScore = 1 - Math.min(1, avgDays / 45);
    const trendBonus = demandTrend === "rising" ? 0.1 : demandTrend === "falling" ? -0.05 : 0;
    const marketDemandScore = clamp01(0.2 + 0.45 * volumeScore + 0.35 * recencyScore + trendBonus);

    const applicantScore = Math.min(1, averageApplicantsPerJob / 400);
    const densityScore = Math.min(1, totalActiveJobs / 80);
    const competitionScore = clamp01(0.7 * applicantScore + 0.3 * densityScore);

    const sampleCompanies = Array.from(new Set(roleJobs.map(j => j.company))).slice(0, 5);

    return {
      roleCategory,
      totalActiveJobs,
      averageApplicantsPerJob: Math.round(averageApplicantsPerJob * 10) / 10,
      demandTrend,
      marketDemandScore,
      competitionScore,
      sampleCompanies,
    };
  });

  return results;
}

export async function fetchJobById(jobId: string, userContext?: UserContext): Promise<Job | null> {
  const jobs = await fetchJobs({}, userContext);
  return jobs.find((job) => job.id === jobId) ?? null;
}
