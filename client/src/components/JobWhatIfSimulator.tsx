import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SkillImpact {
  skill: string;
  currentProbability: number;
  newProbability: number;
  percentageIncrease: number;
  timeToLearn: string;
  reasoning: string;
}

interface JobSimulationResponse {
  whatYouSimulate: string;
  skillImpacts: SkillImpact[];
  overallExplanation: string;
  roi: "High" | "Medium" | "Low";
  recommendedNextSteps: string[];
  jobFocusAreas: string[];
}

type SuggestedSkill = { name: string; impact: string; note: string };

function suggestSkillsForJob(job: any): SuggestedSkill[] {
  const title = (job?.title || "").toLowerCase();
  const desc = (job?.description || "").toLowerCase();
  const text = `${title} ${desc}`;

  const has = (k: string | RegExp) =>
    typeof k === "string" ? text.includes(k.toLowerCase()) : k.test(text);

  // Backend / API / Platform
  if (has(/backend|api|server|platform|microservice|full\s*stack/)) {
    return [
      { name: "Docker & Containers", impact: "+10-15%", note: "Essential for modern deployment" },
      { name: "System Design", impact: "+8-12%", note: "Critical for architecture roles" },
      { name: "Kubernetes", impact: "+8-10%", note: "Advanced orchestration knowledge" }
    ];
  }

  // Frontend / UI / React
  if (has(/frontend|react|next\.js|vue|angular|ui\b|web\s*app/)) {
    return [
      { name: "React Advanced Patterns", impact: "+12-15%", note: "Hooks, performance, context, suspense" },
      { name: "TypeScript", impact: "+8-12%", note: "Prevents bugs and improves DX" },
      { name: "State Management", impact: "+8-10%", note: "Redux/Zustand/RTK for complex UIs" }
    ];
  }

  // Data / Analytics / ML
  if (has(/data\s*scientist|data\s*engineer|analyst|analytics|ml|machine\s*learning|sql/)) {
    return [
      { name: "SQL & Database Design", impact: "+12-15%", note: "Query optimization + modeling" },
      { name: "Python for Data", impact: "+8-12%", note: "Pandas/NumPy for processing" },
      { name: "ML Fundamentals", impact: "+8-10%", note: "Modeling + evaluation basics" }
    ];
  }

  // DevOps / SRE / Cloud
  if (has(/devops|sre|site\s*reliability|platform\s*engineer|infra|infrastructure|cloud|aws|azure|gcp/)) {
    return [
      { name: "Kubernetes", impact: "+10-15%", note: "Cluster operations & workloads" },
      { name: "CI/CD Pipelines", impact: "+8-12%", note: "GitHub Actions/Jenkins optimizations" },
      { name: "Terraform (IaC)", impact: "+8-10%", note: "Reproducible cloud infrastructure" }
    ];
  }

  // Mobile
  if (has(/android|ios|swift|kotlin|react\s*native|mobile/)) {
    return [
      { name: "Platform Native (Swift/Kotlin)", impact: "+10-15%", note: "Deep platform APIs & tooling" },
      { name: "React Native", impact: "+8-12%", note: "Cross‑platform delivery speed" },
      { name: "Performance Optimization", impact: "+8-10%", note: "Profiling & memory efficiency" }
    ];
  }

  // Security
  if (has(/security|secops|appsec|pentest|iam|zero\s*trust/)) {
    return [
      { name: "Threat Modeling", impact: "+10-15%", note: "Design secure systems early" },
      { name: "OWASP Top 10", impact: "+8-12%", note: "Prevent common vulns effectively" },
      { name: "Cloud Security (IAM)", impact: "+8-10%", note: "Least privilege on AWS/Azure/GCP" }
    ];
  }

  // Media / Broadcast / Streaming
  if (has(/broadcast|media|video|stream|ffmpeg|rtmp|hls|ndi|sdi/)) {
    return [
      { name: "FFmpeg & Video Encoding", impact: "+10-15%", note: "Transcoding, bitrate, codecs" },
      { name: "Live Streaming Protocols", impact: "+8-12%", note: "RTMP/HLS/DASH end‑to‑end" },
      { name: "OBS/NDI/SDI Workflows", impact: "+8-10%", note: "Studio pipelines & routing" }
    ];
  }

  // QA / Test
  if (has(/qa|quality|test\s*automation|sdet|cypress|selenium/)) {
    return [
      { name: "E2E Automation", impact: "+10-15%", note: "Cypress/Selenium robust suites" },
      { name: "API Testing", impact: "+8-12%", note: "Postman/Playwright contract tests" },
      { name: "CI Test Strategy", impact: "+8-10%", note: "Parallelism & flaky test control" }
    ];
  }

  // Default generic tech growth
  return [
    { name: "System Design", impact: "+8-12%", note: "Scalable architecture fundamentals" },
    { name: "Cloud Basics (AWS/Azure)", impact: "+8-10%", note: "Deploy & operate reliably" },
    { name: "Databases & SQL", impact: "+8-10%", note: "Modeling & query performance" }
  ];
}

const EXAMPLE_SKILL_RECOMMENDATIONS = {
  userInput: "What skills should I add to improve my chances?",
  response: {
    whatYouSimulate: "Adding the top missing skills for this specific role",
    skillImpacts: [
      {
        skill: "Kubernetes",
        currentProbability: 45,
        newProbability: 58,
        percentageIncrease: 13,
        timeToLearn: "4-6 weeks",
        reasoning: "This role heavily emphasizes container orchestration. Kubernetes is listed in the job description as a key requirement."
      },
      {
        skill: "System Design",
        currentProbability: 45,
        newProbability: 55,
        percentageIncrease: 10,
        timeToLearn: "6-8 weeks",
        reasoning: "Backend roles at this company require solid system design knowledge. This would make your profile more competitive."
      }
    ],
    overallExplanation: "Based on the job description analysis, the missing skills that would have the highest impact are container orchestration tools and system design fundamentals. These are explicitly mentioned in the job posting and are critical for the role.",
    roi: "High",
    recommendedNextSteps: [
      "Start with Kubernetes basics - most valuable for this role",
      "Implement a distributed system project to showcase understanding",
      "Build a portfolio project that demonstrates these skills"
    ],
    jobFocusAreas: ["Container Orchestration", "System Architecture", "Microservices"]
  }
};

export function JobWhatIfSimulator({ job, userProfile, currentScore }: { job: any; userProfile: any; currentScore?: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [autoSimulated, setAutoSimulated] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestedSkills = suggestSkillsForJob(job);
  const topSkill = suggestedSkills[0]?.name || "Docker";
  const secondSkill = suggestedSkills[1]?.name || "System Design";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Don't auto-run on mount - let user choose questions
  // Users will see demo welcome screen with 3 skills, 4 questions, and 3 tips

  const handleAutoSimulation = async () => {
    setAutoSimulated(true);
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/simulate-for-job", {
        jobTitle: job?.title || "Software Engineer",
        jobDescription: job?.description || `${job?.title || 'Software Engineer'} role at ${job?.company || 'Company'} in ${job?.location || 'Remote'}`,
        jobRequirements: job?.requirements || [],
        userProfile: {
          skills: userProfile?.skills || [],
          projects: userProfile?.projects || [],
          experiences: userProfile?.experiences || [],
          roles: userProfile?.interestRoles || []
        },
        query: "What skills should I focus on to improve my chances for this role?"
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: JobSimulationResponse = await res.json();

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: JSON.stringify(data),
        timestamp: new Date()
      };
      setMessages([assistantMsg]);
      setShowDemo(false);
    } catch (err: any) {
      console.error("Auto-simulation error:", err);
      // Keep showing demo welcome section if auto-simulation fails
      setShowDemo(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setShowDemo(false);
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/simulate-for-job", {
        jobTitle: job?.title || "Software Engineer",
        jobDescription: job?.description || `${job?.title || 'Software Engineer'} role at ${job?.company || 'Company'} in ${job?.location || 'Remote'}`,
        jobRequirements: job?.requirements || [],
        userProfile: {
          skills: userProfile?.skills || [],
          projects: userProfile?.projects || [],
          experiences: userProfile?.experiences || [],
          roles: userProfile?.interestRoles || []
        },
        query: messageText
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: JobSimulationResponse = await res.json();

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: JSON.stringify(data),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        title: "Simulation Failed",
        description: err.message || "Could not process your request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseAssistantMessage = (content: string): JobSimulationResponse => {
    try {
      const parsed = JSON.parse(content);
      // Validate that whatYouSimulate exists and is a string
      if (!parsed.whatYouSimulate || typeof parsed.whatYouSimulate !== 'string') {
        console.warn("[Parser] Invalid whatYouSimulate:", parsed.whatYouSimulate);
        parsed.whatYouSimulate = "Unable to parse response properly";
      }
      return parsed;
    } catch (err) {
      console.error("[Parser] Failed to parse message:", err, "Content:", content.substring(0, 100));
      return {
        whatYouSimulate: "Unable to parse response",
        skillImpacts: [],
        overallExplanation: content,
        roi: "Medium",
        recommendedNextSteps: [],
        jobFocusAreas: []
      };
    }
  };

  return (
    <Card className="border-none bg-linear-to-br from-indigo-900/20 to-purple-900/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[70vh] min-h-125">
      <CardHeader className="border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              What-If Simulator for This Role
            </CardTitle>
            <CardDescription className="font-medium text-sm">
              See exactly which skills boost your chances for {job.title}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar">
          {/* Demo / Welcome Message with Recommendations */}
          {showDemo && (
            <div className="space-y-4">
              {/* Section 1: Skills That Could Help */}
              <div className="bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm">
                <p className="text-xs font-bold text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-lg">📈</span> Skills That Could Boost Your Chances
                </p>
                <div className="space-y-3">
                  {suggestedSkills.map((s, i) => (
                    <div key={i} className="bg-background/40 rounded-xl p-3 border border-emerald-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">{s.name}</span>
                        <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50 text-xs">{s.impact}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Suggested Questions */}
              <div className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-2xl p-5 backdrop-blur-sm">
                <p className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-lg">❓</span> Questions To Ask
                </p>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-blue-400 hover:bg-blue-500/10 h-auto py-2 px-3"
                    onClick={() => handleSendMessage(`For a ${job?.title || 'Software Engineer'} role, which skills should I focus on first to improve my chances?`)}
                  >
                    <span className="text-xs">💡 {`"Which skills to focus first for ${job?.title || 'this role'}?"`}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-blue-400 hover:bg-blue-500/10 h-auto py-2 px-3"
                      onClick={() => handleSendMessage(`How much would learning ${topSkill} help my probability?`)}
                  >
                      <span className="text-xs">🐳 {`"How much would ${topSkill} help my chances?"`}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-blue-400 hover:bg-blue-500/10 h-auto py-2 px-3"
                    onClick={() => handleSendMessage(`What's the fastest way to improve my shortlist probability for a ${job?.title || 'Software Engineer'} role?`)}
                  >
                    <span className="text-xs">⚡ {`"Fastest way to improve for ${job?.title || 'this role'}?"`}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-blue-400 hover:bg-blue-500/10 h-auto py-2 px-3"
                      onClick={() => handleSendMessage(`If I learn both ${topSkill} and ${secondSkill}, how much will my chances increase?`)}
                  >
                      <span className="text-xs">🔗 {`"Impact of learning ${topSkill} + ${secondSkill}?"`}</span>
                  </Button>
                </div>
              </div>

              {/* Section 3: Pro Tips */}
              <div className="bg-linear-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-widest">💡 Pro Tips</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Ask about specific skills to get exact probability increases</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Combine multiple skills in one question to see compound effects</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Focus on skills mentioned in the job description first</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map(msg => {
            if (msg.type === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs text-sm">
                    {msg.content}
                  </div>
                </div>
              );
            } else {
              const response = parseAssistantMessage(msg.content);
              return (
                <div key={msg.id} className="flex justify-start space-y-3">
                  <div className="space-y-3 w-full">
                    {/* What You're Simulating */}
                    <div className="bg-background/50 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">
                        📋 What We're Analyzing
                      </p>
                      <p className="text-sm text-foreground">{response.whatYouSimulate}</p>
                    </div>

                    {/* Job Focus Areas */}
                    {response.jobFocusAreas?.length > 0 && (
                      <div className="bg-background/50 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-sm">
                        <p className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-widest">
                          🎯 Job Focus Areas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {response.jobFocusAreas.map((area, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Impact Analysis */}
                    {response.skillImpacts?.length > 0 && (
                      <div className="bg-background/50 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
                        <p className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-widest">
                          📊 Skill Impact Analysis
                        </p>
                        <div className="space-y-4">
                          {response.skillImpacts.map((impact, idx) => (
                            <div key={idx} className="border-l-2 border-emerald-500/30 pl-4 pb-4 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-foreground">{impact.skill}</span>
                                <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50">
                                  +{impact.percentageIncrease}%
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Current: </span>
                                  <span className="font-bold text-foreground">{impact.currentProbability}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">With Skill: </span>
                                  <span className="font-bold text-emerald-400">{impact.newProbability}%</span>
                                </div>
                              </div>
                              <div className="mb-2 text-xs">
                                <span className="text-muted-foreground">Time to Learn: </span>
                                <span className="text-foreground font-medium">{impact.timeToLearn}</span>
                              </div>
                              <p className="text-xs text-muted-foreground italic">{impact.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Explanation */}
                    <div className="bg-background/50 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">
                        💡 Why These Skills Matter
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {response.overallExplanation}
                      </p>
                    </div>

                    {/* ROI & Next Steps */}
                    <div className="bg-background/50 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                          ⚡ ROI Assessment
                        </p>
                        <Badge
                          className={`text-xs font-bold ${
                            response.roi === "High"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : response.roi === "Medium"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {response.roi} ROI
                        </Badge>
                      </div>

                      {response.recommendedNextSteps?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-400 mb-2">📝 Recommended Next Steps:</p>
                          <ul className="space-y-1">
                            {response.recommendedNextSteps.map((step, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground">
                                {idx + 1}. {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background/50 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">Analyzing skills for this role...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-primary/10 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask: 'What if I learn Docker?' or 'How much will X skill help?'"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1 rounded-xl text-sm"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="rounded-xl"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
