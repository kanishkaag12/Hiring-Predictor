import { Layout, JobCard } from "@/components";
import { JobFilters } from "@/components/job-filters";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Internships() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [search, setSearch] = useState("");
    // Internships are mostly student/intern level, but we allow filtering if needed
    const [level, setLevel] = useState("");
    const [companyType, setCompanyType] = useState("");
    const [companySize, setCompanySize] = useState("");

    useEffect(() => {
        async function loadJobs() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    type: "internship", // Strict separation
                    search,
                    level,
                    companyType,
                    companySize
                });

                const res = await fetch(`/api/jobs?${params.toString()}`);
                const data = await res.json();
                setJobs(data);
            } catch (err) {
                console.error("Failed to load internships", err);
            } finally {
                setLoading(false);
            }
        }

        const timeoutId = setTimeout(() => {
            loadJobs();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, level, companyType, companySize]);

    return (
        <Layout>
            <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Find Internships</h1>
                    <p className="text-muted-foreground text-lg">
                        Kickstart your career with student-friendly roles hiring via verified platforms.
                    </p>
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

                {loading ? (
                    <div className="p-12 text-muted-foreground text-center">Loading internships...</div>
                ) : (
                    <>
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                No internships found matching your filters.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map(job => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full"
                                    >
                                        <JobCard job={job} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
