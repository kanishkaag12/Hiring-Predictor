import { Layout } from "@/components/index";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Github, Linkedin, MapPin,
  GraduationCap, Briefcase, Plus, Trash2,
  Edit3, Code, Layers, Info, Target, Eye, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Profile() {
  const {
    profile, isLoading, updateProfile,
    addSkill, removeSkill,
    addProject, removeProject,
    addExperience, removeExperience,
    updateLinkedin, updateGithub, uploadResume,
    updateInterestRoles, uploadProfilePhoto, removeProfilePhoto
  } = useProfile();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("identity");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addExperienceOpen, setAddExperienceOpen] = useState(false);
  const [addInterestRolesOpen, setAddInterestRolesOpen] = useState(false);
  const [addInterestRolesOpen2, setAddInterestRolesOpen2] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(profile?.userType || "");

  useEffect(() => {
    if (profile?.userType) {
      setSelectedUserType(profile.userType);
    }
  }, [profile?.userType]);

  if (isLoading || !profile) {
    return (
      <Layout>
        <div className="p-6 md:p-12 max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  // Handle Updates
  const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      await updateProfile.mutateAsync(data);
      toast({ title: "Profile updated", description: "Your personal info has been saved." });
      setEditProfileOpen(false);
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    try {
      await uploadProfilePhoto.mutateAsync(file);
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
      setPhotoModalOpen(false);
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handlePhotoRemove = async () => {
    try {
      await removeProfilePhoto.mutateAsync();
      toast({ title: "Photo removed", description: "Your profile photo has been removed." });
      setPhotoModalOpen(false);
    } catch (err) {
      toast({ title: "Remove failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    try {
      const result = await uploadResume.mutateAsync(file);
      const skillCount = result?.parsedResume?.skills?.length || 0;

      if (result?.parsingError) {
        toast({
          title: "Resume Uploaded (Parsing Issue)",
          description: result.parsingError,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Resume Uploaded & Analyzed",
          description: skillCount > 0
            ? `Extracted ${skillCount} skills. Dashboard updated with new role predictions.`
            : "Resume processed. Visit dashboard for updated insights."
        });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">

        {/* SECTION 1: IDENTITY HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border-none bg-linear-to-br from-card to-card/50 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-primary/20 via-indigo-500/10 to-transparent pointer-events-none" />
            <CardContent className="relative pt-12 px-8 pb-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="flex gap-6 items-center">
                  <div className="relative group">
                    <button
                      onClick={() => setPhotoModalOpen(true)}
                      className="relative"
                      title="Click to upload profile photo"
                    >
                      <Avatar className="w-28 h-28 border-4 border-background shadow-2xl group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <AvatarImage src={profile.profileImage || ""} />
                        <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                          {profile.name?.split(' ')?.map((n: string) => n[0])?.join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full border border-border cursor-pointer hover:bg-accent transition-colors group-hover:scale-110 group-hover:shadow-lg">
                        <Edit3 className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-display font-bold tracking-tight">{profile.name || "Set Your Name"}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-medium">
                      <p className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {profile.role || "Desired Role"}</p>
                      <p className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {profile.college || "University"}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.location || "Location"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                        <Edit3 className="w-4 h-4" /> Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Personal Info</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateInfo} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" defaultValue={profile.name || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Current/Goal Role</Label>
                            <Input id="role" name="role" defaultValue={profile.role || ""} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="college">University</Label>
                            <Input id="college" name="college" defaultValue={profile.college || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="userType">Career Status</Label>
                            <Select
                              value={selectedUserType}
                              onValueChange={(val) => setSelectedUserType(val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Working Professional">Working Professional</SelectItem>
                                <SelectItem value="Fresher">Fresher</SelectItem>
                                <SelectItem value="Career Switcher">Career Switcher</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="userType" value={selectedUserType} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gradYear">Graduation Year</Label>
                            <Input id="gradYear" name="gradYear" defaultValue={profile.gradYear || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" defaultValue={profile.location || ""} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="github">GitHub Link</Label>
                            <Input id="github" name="githubUrl" defaultValue={profile.githubUrl || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn Link</Label>
                            <Input id="linkedin" name="linkedinUrl" defaultValue={profile.linkedinUrl || ""} />
                          </div>
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MAIN NAVIGATION TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-muted/40 backdrop-blur-sm rounded-2xl">
            <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Identity</TabsTrigger>
            <TabsTrigger value="skills" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Skills</TabsTrigger>
            <TabsTrigger value="experience" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Experience</TabsTrigger>
          </TabsList>

          <div className="mt-8">
            {/* TAB 1: IDENTITY (PERSONAL & PROJECTS) */}
            <TabsContent value="identity" className="space-y-8 mt-0 border-none p-0 outline-none">

              {/* Interest Roles Section (Zero-Assumption) */}
              <Card className="border-border/40 bg-card/40 backdrop-blur-md mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Interest Roles
                  </CardTitle>
                  <CardDescription>
                    {(!profile || (profile.interestRoles?.length || 0) === 0)
                      ? "Interest roles help HirePulse generate role-specific insights. Add roles you are actively aiming for."
                      : "We generate separate intelligence for each of your selected roles."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(!profile || (profile.interestRoles?.length || 0) === 0) ? (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 group hover:border-primary/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-4">No interest roles added yet.</p>
                      <Dialog open={addInterestRolesOpen} onOpenChange={setAddInterestRolesOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 font-bold">
                            <Plus className="w-4 h-4" /> Add Interest Roles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Select Interest Roles</DialogTitle>
                            <DialogDescription>Choose 2-4 roles you are targeting. This data drives your dashboard intelligence.</DialogDescription>
                          </DialogHeader>
                          <RoleSelector
                            currentRoles={profile?.interestRoles || []}
                            onSave={(roles) => {
                              updateInterestRoles.mutate(roles);
                              setAddInterestRolesOpen(false);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {profile.interestRoles?.map((role) => (
                          <div key={role} className="flex justify-between items-center p-4 rounded-2xl border border-primary/20 bg-primary/5 group">
                            <span className="text-sm font-bold">{role}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const updated = profile.interestRoles?.filter(r => r !== role) || [];
                                updateInterestRoles.mutate(updated);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <Info className="w-3 h-3 text-primary" />
                          {(profile.interestRoles?.length || 0) < 2
                            ? "Select at least 2 roles to unlock dashboard intelligence."
                            : "Your profile is being analyzed for these roles."}
                        </p>
                        <Dialog open={addInterestRolesOpen2} onOpenChange={setAddInterestRolesOpen2}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold px-4 hover:bg-primary/5">
                              <Plus className="w-3 h-3" /> Manage Roles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Update Interest Roles</DialogTitle>
                            </DialogHeader>
                            <RoleSelector
                              currentRoles={profile.interestRoles || []}
                              onSave={(roles) => {
                                updateInterestRoles.mutate(roles);
                                setAddInterestRolesOpen2(false);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Projects Section */}
                  <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">Projects</CardTitle>
                        <CardDescription>Showcase your technical depth and problem-solving skills.</CardDescription>
                      </div>
                      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="rounded-xl border-dashed">
                            <Plus className="w-4 h-4 mr-2" /> Add Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Add New Project</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              const tech = (fd.get("tech") as string).split(",").map(s => s.trim());
                              await addProject.mutateAsync({
                                title: fd.get("title") as string,
                                techStack: tech,
                                description: fd.get("description") as string,
                                complexity: fd.get("complexity") as string,
                                githubLink: fd.get("github") as string,
                              });
                              toast({ title: "Project added" });
                              setAddProjectOpen(false);
                            }}
                            className="space-y-4 py-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="p-title">Project Title</Label>
                              <Input id="p-title" name="title" placeholder="e.g. AI Content Generator" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="p-tech">Tech Stack (comma separated)</Label>
                              <Input id="p-tech" name="tech" placeholder="React, Node.js, OpenAI" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="p-desc">Description</Label>
                              <Textarea id="p-desc" name="description" placeholder="What did you build and why?" required className="min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="p-comp">Complexity</Label>
                                <Select name="complexity" defaultValue="Medium">
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="p-link">GitHub Link</Label>
                                <Input id="p-link" name="github" placeholder="https://github.com/..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full">Create Project</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {profile.projects.length === 0 ? (
                        <div className="py-10 text-center space-y-3 opacity-60">
                          <Layers className="w-10 h-10 mx-auto" />
                          <p className="text-sm">Build and add projects to improve your score.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {profile.projects.map((p) => (
                            <div key={p.id} className="p-5 rounded-2xl bg-muted/20 border border-border/40 group relative">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => removeProject.mutate(p.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg">{p.title}</h4>
                                  <Badge variant="outline" className="text-[10px] font-mono">{p.complexity}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {p.techStack.map(t => (
                                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{t}</span>
                                  ))}
                                </div>
                                {p.githubLink && (
                                  <a href={p.githubLink} target="_blank" rel="noreferrer" className="text-xs font-medium inline-flex items-center gap-1.5 text-primary hover:underline">
                                    <Github className="w-3.5 h-3.5" /> View Source
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-8">
                  {/* Sidebar: Social & Contact */}
                  <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Connections</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 group relative overflow-hidden">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Linkedin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{profile.linkedinUrl ? "Connected" : "Not Linked"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{profile.linkedinUrl || "linkedin.com/in/..."}</p>
                        </div>
                        {profile.linkedinUrl ? (
                          <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
                        ) : (
                          <button onClick={() => setLinkedinModalOpen(true)} className="absolute inset-0 z-10" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 group relative overflow-hidden">
                        <div className="p-2 rounded-lg bg-foreground/10 text-foreground">
                          <Github className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{profile.githubUrl ? "Linked" : "Not Linked"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{profile.githubUrl || "github.com/..."}</p>
                        </div>
                        {profile.githubUrl ? (
                          <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
                        ) : (
                          <button onClick={() => setGithubModalOpen(true)} className="absolute inset-0 z-10" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resume Card */}
                  <Card className="border-primary/20 bg-primary/5 shadow-inner">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary uppercase">Readiness</p>
                          <p className="text-2xl font-black text-primary">{profile.resumeScore}%</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold">Resume Scan Results</p>
                        <Progress value={profile.resumeScore} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground">
                          {profile.resumeUploadedAt
                            ? `Last updated ${new Date(profile.resumeUploadedAt).toLocaleDateString()}`
                            : "No resume uploaded"}
                        </p>
                        {/* Parsing error banner suppressed to prevent user disruption */}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          id="resume-upload"
                          onChange={handleResumeUpload}
                          disabled={uploadResume.isPending}
                        />
                        <Button
                          asChild
                          className="w-full rounded-xl gap-2 h-10 cursor-pointer"
                          disabled={uploadResume.isPending}
                        >
                          <label htmlFor="resume-upload">
                            {uploadResume.isPending ? "Uploading..." : "Upload New PDF"}
                          </label>
                        </Button>
                        {profile.resumeUrl && (
                          <Button
                            variant="outline"
                            className="w-full rounded-xl gap-2 h-10 mt-2"
                            onClick={() => {
                              if (profile.resumeUrl) {
                                window.open(profile.resumeUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            aria-label="View uploaded resume in new tab"
                          >
                            <Eye className="w-4 h-4" />
                            View Resume
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: SKILLS */}
            <TabsContent value="skills" className="space-y-8 mt-0 border-none p-0 outline-none">
              <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Skills Management</CardTitle>
                    <CardDescription>Your technical expertise level directly affects all AI predictions.</CardDescription>
                  </div>
                  <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Skill</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          await addSkill.mutateAsync({
                            name: fd.get("name") as string,
                            level: fd.get("level") as string,
                          });
                          toast({ title: "Skill added" });
                          setAddSkillOpen(false);
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="space-y-2">
                          <Label>Skill Name</Label>
                          <Input name="name" placeholder="e.g. React, Python, AWS" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Proficiency Level</Label>
                          <Select name="level" defaultValue="Intermediate">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Add to Profile</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {["Beginner", "Intermediate", "Advanced"].map(level => {
                      const skillsAtLevel = profile.skills.filter(s => s.level === level);
                      if (skillsAtLevel.length === 0) return null;
                      return (
                        <div key={level} className="space-y-4">
                          <h4 className={cn(
                            "text-xs font-black uppercase tracking-widest flex items-center gap-2",
                            level === "Advanced" ? "text-emerald-400" : level === "Intermediate" ? "text-blue-400" : "text-slate-400"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full",
                              level === "Advanced" ? "bg-emerald-400" : level === "Intermediate" ? "bg-blue-400" : "bg-slate-400"
                            )} />
                            {level}
                          </h4>
                          <div className="flex flex-col gap-2">
                            {skillsAtLevel.map(skill => (
                              <div key={skill.id} className="flex justify-between items-center p-3 rounded-2xl bg-muted/20 border border-border/20 group animate-in fade-in slide-in-from-left-2 transition-all hover:border-primary/20">
                                <span className="font-semibold text-sm">{skill.name}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500"
                                  onClick={() => removeSkill.mutate(skill.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {profile.skills.length === 0 && (
                      <div className="col-span-full py-20 text-center space-y-4 opacity-50">
                        <Code className="w-12 h-12 mx-auto" />
                        <p>No skills added yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: EXPERIENCE */}
            <TabsContent value="experience" className="space-y-8 mt-0 border-none p-0 outline-none">
              <Card className="border-border/40 bg-card/40 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Experience</CardTitle>
                    <CardDescription>Work history and internships play a huge role in peer ranking.</CardDescription>
                  </div>
                  <Dialog open={addExperienceOpen} onOpenChange={setAddExperienceOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" /> Add Experience
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Experience</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          await addExperience.mutateAsync({
                            company: fd.get("company") as string,
                            role: fd.get("role") as string,
                            duration: fd.get("duration") as string,
                            type: fd.get("type") as string,
                          });
                          toast({ title: "Experience added" });
                          setAddExperienceOpen(false);
                        }}
                        className="space-y-4 py-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input name="company" placeholder="e.g. Google" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Input name="role" placeholder="e.g. Frontend Intern" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (e.g. Jun 2024 - Aug 2024)</Label>
                          <Input name="duration" placeholder="Dates" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select name="type" defaultValue="Internship">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Internship">Internship</SelectItem>
                              <SelectItem value="Job">Full-time Job</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Add Experience</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.experiences.length === 0 ? (
                    <div className="py-20 text-center space-y-3 opacity-60">
                      <Briefcase className="w-10 h-10 mx-auto" />
                      <p>No roles recorded. Start adding your background.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.experiences.map((exp) => (
                        <div key={exp.id} className="flex items-center gap-6 p-6 rounded-3xl bg-muted/10 border border-border/40 group relative">
                          <div className="w-14 h-14 rounded-2xl bg-background flex items-center justify-center border border-border/60 shadow-inner">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold truncate">{exp.role}</h4>
                              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">{exp.type}</Badge>
                            </div>
                            <p className="text-primary font-bold">{exp.company}</p>
                            <p className="text-sm text-muted-foreground">{exp.duration}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500"
                            onClick={() => removeExperience.mutate(exp.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* MODALS for Social Connections */}
        <Dialog open={linkedinModalOpen} onOpenChange={setLinkedinModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect LinkedIn</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const url = new FormData(e.currentTarget).get("url") as string;
              if (!url.includes("linkedin.com/")) {
                toast({ title: "Invalid URL", description: "Please enter a valid LinkedIn profile URL.", variant: "destructive" });
                return;
              }
              await updateLinkedin.mutateAsync(url);
              setLinkedinModalOpen(false);
              toast({ title: "LinkedIn Connected" });
            }} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>LinkedIn Profile URL</Label>
                <Input name="url" placeholder="https://www.linkedin.com/in/yourprofile" required />
              </div>
              <Button type="submit" className="w-full" disabled={updateLinkedin.isPending}>
                {updateLinkedin.isPending ? "Saving..." : "Save Connection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={githubModalOpen} onOpenChange={setGithubModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect GitHub</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const url = new FormData(e.currentTarget).get("url") as string;
              if (!url.includes("github.com/")) {
                toast({ title: "Invalid URL", description: "Please enter a valid GitHub profile URL.", variant: "destructive" });
                return;
              }
              await updateGithub.mutateAsync(url);
              setGithubModalOpen(false);
              toast({ title: "GitHub Connected" });
            }} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>GitHub Profile URL</Label>
                <Input name="url" placeholder="https://github.com/yourusername" required />
              </div>
              <Button type="submit" className="w-full" disabled={updateGithub.isPending}>
                {updateGithub.isPending ? "Saving..." : "Save Connection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Profile Photo</DialogTitle>
              <DialogDescription>Add or update your professional photo. Supports JPG, PNG, and GIF formats.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {profile.profileImage && (
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32 border-4 border-border">
                    <AvatarImage src={profile.profileImage} />
                    <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                      {profile.name?.split(' ')?.map((n: string) => n[0])?.join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handlePhotoRemove}
                    disabled={removeProfilePhoto.isPending}
                    className="rounded-xl"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {removeProfilePhoto.isPending ? "Removing..." : "Remove Photo"}
                  </Button>
                </div>
              )}
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/40 rounded-2xl hover:border-primary/40 transition-colors bg-muted/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadProfilePhoto.isPending}
                  className="hidden"
                  id="photo-input"
                />
                <label htmlFor="photo-input" className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Edit3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{uploadProfilePhoto.isPending ? "Uploading..." : profile.profileImage ? "Change Photo" : "Upload Photo"}</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function RoleSelector({ currentRoles, onSave }: { currentRoles: string[], onSave: (roles: string[]) => void }) {
  const MAX_ROLES = 6;
  const MIN_ROLES = 2;

  const [selected, setSelected] = useState<string[]>(currentRoles);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const suggestions = [
    "Software Engineer", "Frontend Developer", "Backend Developer", "Fullstack Developer",
    "Data Scientist", "Data Analyst", "Data Engineer", "ML Engineer", "Product Manager", "UI/UX Designer",
    "DevOps Engineer", "Cloud Architect", "Mobile App Developer",
    "Cybersecurity Analyst", "Solution Architect", "QA Engineer", "Business Analyst"
  ];

  // Deduplicate and normalize roles (case-insensitive)
  const normalizedSelected = Array.from(new Set(selected.map(r => r.trim())));

  const filteredSuggestions = suggestions.filter(role =>
    role.toLowerCase().includes(search.toLowerCase()) &&
    !normalizedSelected.some(s => s.toLowerCase() === role.toLowerCase())
  ).slice(0, 6);

  const toggleRole = (role: string) => {
    const normalized = role.trim();
    const isSelected = normalizedSelected.some(s => s.toLowerCase() === normalized.toLowerCase());

    if (isSelected) {
      setSelected(selected.filter(r => r.toLowerCase() !== normalized.toLowerCase()));
    } else {
      if (normalizedSelected.length >= MAX_ROLES) {
        toast({
          title: "Limit Reached",
          description: `You can select up to ${MAX_ROLES} roles. Remove one to add another.`,
          variant: "destructive"
        });
        return;
      }
      setSelected([...normalizedSelected, normalized]);
      setSearch("");
    }
  };

  const handleCustomAdd = () => {
    if (!search.trim()) return;

    const normalized = search.trim();
    const isDuplicate = normalizedSelected.some(s => s.toLowerCase() === normalized.toLowerCase());

    if (isDuplicate) {
      toast({
        title: "Already Added",
        description: "This role is already in your selection.",
        variant: "default"
      });
      setSearch("");
      return;
    }

    if (normalizedSelected.length >= MAX_ROLES) {
      toast({
        title: "Limit Reached",
        description: `You can select up to ${MAX_ROLES} roles. Remove one to add another.`,
        variant: "destructive"
      });
      return;
    }

    setSelected([...normalizedSelected, normalized]);
    setSearch("");
  };

  const handleConfirm = () => {
    if (normalizedSelected.length < MIN_ROLES) {
      toast({
        title: "Insufficient Selection",
        description: `Please select at least ${MIN_ROLES} roles.`,
        variant: "destructive"
      });
      return;
    }
    onSave(normalizedSelected);
  };

  const remainingSlots = MAX_ROLES - normalizedSelected.length;
  const capacityStatus = remainingSlots === 0 ? "full" : remainingSlots <= 2 ? "warning" : "normal";

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Search or add custom role... (${remainingSlots} slots left)`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomAdd())}
            className="rounded-xl"
          />
          {search && (
            <Button onClick={handleCustomAdd} variant="secondary" className="rounded-xl">
              Add
            </Button>
          )}
        </div>

        {/* Dynamic Capacity Warning */}
        {capacityStatus === "full" && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <p className="font-medium">You've reached the {MAX_ROLES} role limit</p>
            <p className="text-xs opacity-75 mt-1">Remove a role to add a different one</p>
          </div>
        )}
        {capacityStatus === "warning" && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <p className="font-medium">Only {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} remaining</p>
          </div>
        )}

        {/* Selected Roles */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {normalizedSelected.map(role => (
              <motion.div
                key={role}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="default" className="pl-3 pr-1 py-1.5 gap-1 rounded-full bg-primary text-primary-foreground group">
                  {role}
                  <button
                    onClick={() => toggleRole(role)}
                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                    title="Remove role"
                  >
                    <Plus className="w-3 h-3 rotate-45" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Suggestions */}
        {search && filteredSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-1">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className="px-3 py-1.5 rounded-full border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-sm transition-all text-muted-foreground hover:text-foreground"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Tags (only if nothing searched) */}
        {!search && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-1">Common Career Paths</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 8).map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  disabled={normalizedSelected.some(s => s.toLowerCase() === role.toLowerCase())}
                  className={`
                     px-3 py-1.5 rounded-full border text-sm transition-all
                     ${normalizedSelected.some(s => s.toLowerCase() === role.toLowerCase())
                      ? "border-primary bg-primary/10 text-primary opacity-50 cursor-not-allowed"
                      : "border-border/40 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground"}
                   `}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          <span>{normalizedSelected.length} of {MAX_ROLES} selected</span>
          {normalizedSelected.length < MIN_ROLES && <span className="text-rose-400">Min {MIN_ROLES} required</span>}
        </div>
        <DialogFooter>
          <Button
            className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/10"
            onClick={handleConfirm}
            disabled={normalizedSelected.length < MIN_ROLES}
          >
            Confirm & Initialize AI
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
}

