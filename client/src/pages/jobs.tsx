import { Layout, JobCard } from "@/components/index";
import { MOCK_JOBS } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";


export default function Jobs() {
  const [jobs, setJobs] = useState(MOCK_JOBS);

  useEffect(() => {
    async function loadRealJobs() {
      try {
        const res = await fetch("/api/jobs/real");
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
        }
      } catch (error) {
        console.error("Failed to load real jobs, using mock jobs", error);
      }
    }

    loadRealJobs();
  }, []);

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
            <h1 className="text-3xl font-display font-bold">Find Opportunities</h1>
            <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search by role, company, or skills..." className="pl-10 h-12 bg-card/50 backdrop-blur-sm" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <JobCard job={job} />
                </motion.div>
            ))}
        </div>
      </div>
    </Layout>
  );
}