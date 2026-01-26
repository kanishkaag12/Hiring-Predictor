import { useQuery } from "@tanstack/react-query";
import { Layout, JobCard } from "@/components/index";
import { useFavourites } from "@/hooks/useFavourites";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function FavouritesPage() {
    const { favourites, isLoading: isFavsLoading } = useFavourites();
    const { data: allJobs = [], isLoading: isJobsLoading } = useQuery<any[]>({
        queryKey: ["/api/jobs"],
    });

    const isLoading = isFavsLoading || isJobsLoading;

    const favouriteJobs = allJobs.filter((job) =>
        favourites.some((f) => f.jobId === job.id)
    );

    return (
        <Layout>
            <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
                <header className="mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-display font-bold text-foreground mb-2 flex items-center gap-3"
                    >
                        <Star className="w-8 h-8 text-amber-400 fill-current" />
                        Your Favourites
                    </motion.h1>
                    <p className="text-muted-foreground text-lg">
                        Roles you've saved for shortlisting and planning.
                    </p>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-3xl" />
                        ))}
                    </div>
                ) : favouriteJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
                        <div className="p-6 rounded-full bg-muted/20">
                            <Star className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">No favourites yet</h2>
                            <p className="text-muted-foreground max-w-md">
                                You haven't starred any roles yet. Save roles to track and analyze them later.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favouriteJobs.map((job, i) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <JobCard job={job} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
