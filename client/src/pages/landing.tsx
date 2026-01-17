import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BarChart2, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  TrendingUp,
  Search,
  Zap,
  Briefcase,
  GraduationCap
} from "lucide-react";
import heroImage from "@assets/generated_images/futuristic_data_hiring_network_visualization_with_glowing_nodes.png";

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen font-sans selection:bg-primary/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-lg">H</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">HirePulse</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">The Challenge</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#audience" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For You</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden md:inline-flex">Log In</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-[1.05] mb-8 tracking-tight">
              A calmer way to navigate <br />
              <span className="text-muted-foreground/60">the modern job market.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
              HirePulse provides students and professionals with predictive hiring intelligence, moving beyond the uncertainty of standard applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all group rounded-full">
                  Enter Platform <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full">
                Learn our methodology
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block opacity-20 pointer-events-none">
             <img src={heroImage} alt="" className="w-full h-full object-cover grayscale" />
        </div>
      </section>

      {/* The Problem */}
      <section id="problem" className="py-24 bg-card/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 leading-tight">The application black hole is real.</h2>
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Asymmetric Information</h4>
                    <p className="text-muted-foreground leading-relaxed">Companies know who they're looking for, but you're left guessing if your profile even makes it past the first filter.</p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Silent Freezes</h4>
                    <p className="text-muted-foreground leading-relaxed">Job boards often list roles that have already been frozen or filled internally, wasting your time and energy.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background border border-border/60 p-10 rounded-3xl shadow-sm">
                <div className="space-y-6">
                    <p className="text-lg text-muted-foreground italic leading-relaxed">
                        "Applying today feels like sending letters into a void. You spend hours on a cover letter for a role that was closed three days ago, without even knowing it."
                    </p>
                    <div className="h-px bg-border/40" />
                    <p className="font-medium text-sm uppercase tracking-widest text-muted-foreground">The Current State of Hiring</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why HirePulse */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-8">Why HirePulse exists.</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
                We believe that job seeking shouldn't be a game of chance. By analyzing public hiring signals and historical peer outcomes, we provide a layer of transparency that helps you make informed decisions about where to invest your career.
            </p>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold">A systematic approach.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              {
                step: "01",
                title: "Data Ingestion",
                desc: "We monitor thousands of job boards and company career pages for subtle hiring signals."
              },
              {
                step: "02",
                title: "Profile Analysis",
                desc: "Our engine maps your skills and experience against successful historical candidates."
              },
              {
                step: "03",
                title: "Probability Engine",
                desc: "Calculate a conservative estimate of your shortlist probability based on peer clusters."
              },
              {
                step: "04",
                title: "Actionable Insights",
                desc: "Receive specific recommendations on skill gaps or networking opportunities."
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <span className="text-6xl font-display font-bold text-primary/5 absolute -top-10 left-0 leading-none">{item.step}</span>
                <h3 className="text-xl font-bold mb-4 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students vs Seekers */}
      <section id="audience" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="p-10 rounded-3xl bg-primary/5 border border-primary/10">
                    <GraduationCap className="h-10 w-10 text-primary mb-6" />
                    <h3 className="text-2xl font-bold mb-4">For Students & Freshers</h3>
                    <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> Navigate internship cycles with confidence</li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> Identify which skills are actually getting peers hired</li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> Compare your profile with top university cohorts</li>
                    </ul>
                </div>
                <div className="p-10 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                    <Briefcase className="h-10 w-10 text-indigo-500 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">For Experienced Seekers</h3>
                    <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" /> Detect hiring slowdowns before they are announced</li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" /> Map your career trajectory against market demand</li>
                        <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" /> Receive salary benchmarks based on role probability</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-card/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-display font-bold mb-12 text-center">Not another resume tool.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Generic AI</h4>
                    <p className="text-sm text-muted-foreground">Focuses on generating boilerplate text and keywords to trick simple ATS systems.</p>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Resume Optimizers</h4>
                    <p className="text-sm text-muted-foreground">Help you format your history, but ignore the market signals around you.</p>
                </div>
                <div className="space-y-4 border-l-2 border-primary pl-8">
                    <h4 className="font-bold text-primary uppercase text-xs tracking-widest">HirePulse</h4>
                    <p className="text-sm text-foreground font-medium">Connects your unique profile to real-world market intelligence and historical hiring outcomes.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Trust & Credibility */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-muted-foreground text-sm font-medium mb-10 border border-border/60">
                Data updated every 4 hours
            </div>
            <h2 className="text-3xl font-display font-bold mb-12">Built on verified career signals.</h2>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale filter hover:grayscale-0 transition-all duration-500">
                <span className="text-xl font-bold font-display tracking-tighter">TECHFLOW</span>
                <span className="text-xl font-bold font-display tracking-tighter">DATASTREAM</span>
                <span className="text-xl font-bold font-display tracking-tighter">NEBULAAI</span>
                <span className="text-xl font-bold font-display tracking-tighter">FINTECH+</span>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Ready to navigate smarter?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of candidates who are using data to drive their career search.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="h-16 px-12 text-xl bg-primary text-primary-foreground shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all rounded-full">
              Analyze My Profile <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
          <p className="mt-8 text-sm text-muted-foreground">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card/30 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-xs">H</span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">HirePulse</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}