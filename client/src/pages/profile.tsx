import { Layout } from "@/components";
import { MOCK_USER } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Github, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8">
        
        {/* Header Profile Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border-border/60">
            <div className="h-32 bg-gradient-to-r from-primary to-indigo-600 opacity-90"></div>
            <CardContent className="relative pt-0 px-8 pb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 gap-4">
                <div className="flex gap-6 items-end">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">AC</AvatarFallback>
                  </Avatar>
                  <div className="mb-1">
                    <h1 className="text-3xl font-display font-bold">{MOCK_USER.name}</h1>
                    <p className="text-muted-foreground">{MOCK_USER.role} • {MOCK_USER.school}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-1">
                    <Button variant="outline" size="sm"><Github className="w-4 h-4 mr-2"/>GitHub</Button>
                    <Button variant="outline" size="sm"><Linkedin className="w-4 h-4 mr-2"/>LinkedIn</Button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {MOCK_USER.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats">Stats & Analytics</TabsTrigger>
                <TabsTrigger value="documents">Resume & Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Strength</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Resume Completeness</span>
                                    <span className="font-mono font-bold">{MOCK_USER.resumeScore}%</span>
                                </div>
                                <Progress value={MOCK_USER.resumeScore} className="h-2" />
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Skill Verification</span>
                                    <span className="font-mono font-bold">60%</span>
                                </div>
                                <Progress value={60} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Market Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-40">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">You are in the top</p>
                                    <p className="text-6xl font-display font-bold text-primary">15%</p>
                                    <p className="text-sm text-muted-foreground mt-2">of candidates in your cohort</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="documents">
                <Card>
                    <CardContent className="p-8 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-accent/10 min-h-[300px]">
                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Resume_v4_Final.pdf</h3>
                        <p className="text-sm text-muted-foreground mb-4">Uploaded 2 days ago</p>
                        <Button variant="secondary">Update Resume</Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}