import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
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

interface SimulationResponse {
  simulation: string;
  impactByRole: Array<{
    role: string;
    impact: string; // "+X%"
    reason: string;
  }>;
  explanation: string;
  roi: "High" | "Medium" | "Low";
  alternatives: string[];
}

const EXAMPLE_DEMO = {
  userInput: "If I add one backend project",
  response: {
    whatYouSimulate: "Adding one backend-focused project to your portfolio",
    impactByRole: [
      {
        roleName: "Backend Developer",
        improvement: 12,
        reason: "Direct alignment with role - real API and database experience is highly valued"
      },
      {
        roleName: "Fullstack Developer",
        improvement: 8,
        reason: "Backend skills are valuable but fullstack roles also emphasize frontend expertise"
      }
    ],
    aiExplanation:
      "Recruiters for backend roles prioritize hands-on API development and database design. A complete backend project demonstrates these skills directly. For fullstack roles, the backend project is valuable but doesn't address frontend capabilities, so the impact is lower.",
    roiLevel: "High",
    betterAlternatives: [
      { action: "Learn system design basics", impact: "+7–9% for Backend roles" }
    ]
  }
};

export function WhatIfSimulatorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile, isLoading: profileLoading } = useProfile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    if (!profile || !profile.interestRoles || profile.interestRoles.length === 0) {
      toast({
        title: "Select target roles first",
        description: "Add at least one interest role in your profile to run simulations.",
        variant: "destructive"
      });
      return;
    }

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
      const res = await apiRequest("POST", "/api/ai/simulate", {
        userQuery: messageText,
        userProfile: {
          skills: profile.skills,
          projects: profile.projects,
          experiences: profile.experiences,
          roles: profile.interestRoles || []
        }
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: SimulationResponse = await res.json();

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

  const parseAssistantMessage = (content: string): SimulationResponse => {
    try {
      return JSON.parse(content);
    } catch {
      return {
        simulation: "Unable to parse response",
        impactByRole: [],
        explanation: content,
        roi: "Medium",
        alternatives: []
      };
    }
  };

  return (
    <Card className="border-none bg-linear-to-br from-indigo-900/20 to-purple-900/10 shadow-2xl relative overflow-hidden h-full flex flex-col max-h-[75vh] min-h-[560px]">
      <CardHeader className="border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight uppercase">
              What-If Simulator
            </CardTitle>
            <CardDescription className="font-medium">
              Explore hypothetical profile improvements and their impact
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {profileLoading && (
          <div className="text-sm text-muted-foreground">Loading your profile...</div>
        )}
        {!profileLoading && !profile && (
          <div className="text-sm text-destructive">Unable to load profile. Please retry.</div>
        )}
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 hide-scrollbar">
          {/* Demo / Welcome Message */}
          {showDemo && (
            <div className="space-y-4">
              <div className="bg-background/50 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">
                  📚 Example Demo
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Try:</strong> "{EXAMPLE_DEMO.userInput}"
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:bg-primary/10 h-8 text-xs"
                      onClick={() => handleSendMessage(EXAMPLE_DEMO.userInput)}
                    >
                      Try This Example
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground italic">
                Type your hypothetical action (e.g., "If I add communication skills", "What if I learn
                system design?")
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
                    {/* 1️⃣ What You're Simulating */}
                    <div className="bg-background/50 border border-primary/20 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">
                        1️⃣ What You're Simulating
                      </p>
                      <p className="text-sm text-foreground">{response.simulation}</p>
                    </div>

                    {/* 2️⃣ Impact by Role */}
                    <div className="bg-background/50 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-widest">
                        2️⃣ Impact by Role
                      </p>
                      <div className="space-y-3">
                        {response.impactByRole.map((role, idx) => (
                          <div key={idx} className="border-l-2 border-emerald-500/30 pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">{role.role}</span>
                              <span className="text-emerald-400 font-bold">{role.impact}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{role.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3️⃣ Why This Happens */}
                    <div className="bg-background/50 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">
                        3️⃣ Why This Happens (AI Explanation)
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {response.explanation}
                      </p>
                    </div>

                    {/* 4️⃣ High-ROI Assessment */}
                    <div className="bg-background/50 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                          4️⃣ Is This High-ROI?
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

                      {response.alternatives && response.alternatives.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-500/10">
                          <p className="text-xs font-semibold text-amber-400 mb-2">
                            💡 Better Alternatives:
                          </p>
                          <ul className="space-y-1">
                            {response.alternatives.map((alt, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground">
                                • {alt}
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
                  <p className="text-sm text-muted-foreground">Simulating impact...</p>
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
              placeholder="Try: 'If I add communication skills' or 'What if I learn system design?'"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1 rounded-xl"
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
          <p className="text-[10px] text-muted-foreground italic mt-2">
            💡 Tip: Be specific about your hypothetical action. Example: "If I add Docker and Kubernetes skills"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
