import { useRoute } from "wouter";
import { Layout, ProbabilityGauge, PeerClusterMap } from "@/components";
import { MOCK_JOBS, PEER_CLUSTERS, RECOMMENDATIONS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, AlertCircle, Share2, MapPin, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function JobDetails() {
  const [match, params] = useRoute("/jobs/:id");
  const id = params ? parseInt(params.id) : 1;
  const job = MOCK_JOBS.find(j => j.id === id) || MOCK_JOBS[0];

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        {/* Job Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4">
             <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center font-bold text-2xl border border-border shadow-inner">
              {job.logo}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">{job.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.postedDate}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">Apply Now</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Probability & Analysis */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Probability Score Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="bg-gradient-to-br from-card to-secondary/30 border-border/60 shadow-md">
                <CardHeader>
                  <CardTitle>Shortlist Probability</CardTitle>
                  <CardDescription>Based on historical hiring data & your profile</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <ProbabilityGauge score={job.probability} size="lg" />
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Peer Comparison</CardTitle>
                  <CardDescription>Where you stand vs. other applicants</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] p-0">
                  <PeerClusterMap data={PEER_CLUSTERS} />
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">AI Recommendations</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Beta</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {RECOMMENDATIONS.map((rec) => (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="flex gap-4 p-4 rounded-lg bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-3 bg-background rounded-full shadow-sm h-fit">
                      <rec.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {rec.title}
                        {rec.impact === "High" && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] h-5">High Impact</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar: Job Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Applicants</span>
                  <span className="font-mono font-medium">{job.applicants}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Hiring Pace</span>
                  <Badge variant="outline">{job.hiringSignal}</Badge>
                </div>
                 <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Salary Est.</span>
                  <span className="font-mono font-medium">{job.salary}</span>
                </div>
                 <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Remote Policy</span>
                  <span className="font-medium">Hybrid</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold mb-2">Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                Candidates who apply within the first 48 hours are 40% more likely to get an interview screen at {job.company}.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}