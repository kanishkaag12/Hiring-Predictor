import PublicLayout from "@/components/public-layout";
import { JobCard } from "@/components";
import { JobFilters } from "@/components/job-filters";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PublicJobsPage() {
  const [, setLocation] = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companySize, setCompanySize] = useState("");

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type: "job", // Strict separation
          search,
          level,
          companyType,
          companySize
        });

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search slightly to avoid spamming
    const timeoutId = setTimeout(() => {
      loadJobs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, level, companyType, companySize]);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Find Your Next Opportunity
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover full-time roles at top startups and MNCs hiring via Greenhouse & Lever.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">
              💡 <strong>Pro Tip:</strong> Create an account to get personalized insights about your chances at each job.
            </p>
            <Button onClick={() => setLocation("/auth")} className="bg-primary hover:bg-primary/90">
              Get Personalized Insights
            </Button>
          </div>
        </div>

        {/* Filters */}
        <JobFilters
          searchValue={search}
          levelValue={level}
          companyTypeValue={companyType}
          companySizeValue={companySize}
          onSearchChange={setSearch}
          onLevelChange={setLevel}
          onCompanyTypeChange={setCompanyType}
          onCompanySizeChange={setCompanySize}
          onReset={() => {
            setSearch("");
            setLevel("");
            setCompanyType("");
            setCompanySize("");
          }}
        />

        {/* Jobs Grid */}
        {loading ? (
          <div className="p-12 text-muted-foreground text-center">Loading opportunities...</div>
        ) : (
          <>
            {jobs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No jobs found matching your filters.
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{jobs.length}</span> {jobs.length === 1 ? "job" : "jobs"}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map(job => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <JobCard job={job} isGuest={true} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">Ready to Apply with Confidence?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get AI-powered insights about your chances at each job before you apply.
          </p>
          <Button onClick={() => setLocation("/auth")} size="lg" className="bg-primary hover:bg-primary/90">
            Sign Up Free
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
