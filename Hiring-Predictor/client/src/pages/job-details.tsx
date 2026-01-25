import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Layout, ProbabilityGauge, PeerClusterMap } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = params?.id;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    fetch(`/api/jobs/${jobId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Job not found");
        return res.json();
      })
      .then((data) => {
        console.log("JOB DETAILS RESPONSE:", data); // 🔍 DEBUG
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-muted-foreground">
          Loading job analysis…
        </div>
      </Layout>
    );
  }

  if (!job || !job.analysis) {
    return (
      <Layout>
        <div className="p-12 text-red-500">
          Job analysis not available
        </div>
      </Layout>
    );
  }

  const { analysis } = job;

  const peerData = [
    { x: 45, y: 45, label: "Peer Avg" },
    { x: analysis.probability, y: analysis.probability, label: "You" },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">

        <Link href="/jobs">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
          </Button>
        </Link>

        {/* HEADER */}
        <div className="flex justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <div className="flex items-center gap-3 text-muted-foreground mt-1">
              <span className="font-medium">{job.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {job.daysSincePosted} days ago
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <a href={job.applyUrl} target="_blank" rel="noreferrer">
              <Button className="bg-primary">Apply Now</Button>
            </a>
          </div>
        </div>

        {/* ANALYSIS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN */}
          <div className="lg:col-span-2 space-y-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* PROBABILITY */}
              <Card>
                <CardHeader>
                  <CardTitle>Shortlist Probability</CardTitle>
                  <CardDescription>
                    Based on hiring patterns & competition
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <ProbabilityGauge score={analysis.probability} size="lg" />
                </CardContent>
              </Card>

              {/* PEERS */}
              <Card>
                <CardHeader>
                  <CardTitle>Peer Comparison</CardTitle>
                  <CardDescription>
                    Where you stand vs other applicants
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] p-0">
                  <PeerClusterMap data={peerData} />
                </CardContent>
              </Card>
            </motion.div>

            {/* 🔥 REASONING (THIS WAS MISSING VISUALLY) */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Why this recommendation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis.reasoning}
                </p>
              </CardContent>
            </Card>

          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Apply Signal</span>
                  <Badge>{analysis.applySignal}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Source</span>
                  <span className="font-mono">{job.source}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                Applying early when competition is low significantly improves shortlisting chances.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
