import { CloudLightning, TrendingUp, TrendingDown, Users, Briefcase, Award } from "lucide-react";

export const MOCK_USER = {
  name: "Alex Chen",
  role: "Software Engineer Intern",
  school: "University of Tech",
  gpa: 3.8,
  rank: 85, // Percentile
  skills: ["React", "TypeScript", "Node.js", "Python", "Data Structures"],
  resumeScore: 88,
};

export const MOCK_JOBS = [
  {
    id: 1,
    title: "Frontend Engineer Intern",
    company: "FinTech Global",
    location: "New York, NY",
    type: "Internship",
    postedDate: "2 days ago",
    probability: 78,
    hiringSignal: "Stable",
    applicants: 450,
    logo: "FG",
    salary: "$40-50/hr"
  },
  {
    id: 2,
    title: "AI Research Associate",
    company: "Nebula AI",
    location: "San Francisco, CA",
    type: "Full-time",
    postedDate: "5 hours ago",
    probability: 42,
    hiringSignal: "Surge",
    applicants: 1200,
    logo: "NA",
    salary: "$140k-180k"
  },
  {
    id: 3,
    title: "Product Design Intern",
    company: "Creative Inc",
    location: "Remote",
    type: "Internship",
    postedDate: "1 week ago",
    probability: 92,
    hiringSignal: "Slowdown",
    applicants: 150,
    logo: "CI",
    salary: "$30-40/hr"
  },
  {
    id: 4,
    title: "Backend Developer",
    company: "StreamLine",
    location: "Austin, TX",
    type: "Full-time",
    postedDate: "3 days ago",
    probability: 65,
    hiringSignal: "Stable",
    applicants: 320,
    logo: "SL",
    salary: "$110k-130k"
  }
];

export const HIRING_TRENDS = [
  { month: "Jan", openings: 120, applications: 400 },
  { month: "Feb", openings: 135, applications: 380 },
  { month: "Mar", openings: 150, applications: 550 },
  { month: "Apr", openings: 180, applications: 700 },
  { month: "May", openings: 140, applications: 600 },
  { month: "Jun", openings: 160, applications: 500 },
];

export const PEER_CLUSTERS = [
  { x: 20, y: 30, z: 10, status: "rejected" },
  { x: 30, y: 50, z: 20, status: "rejected" },
  { x: 45, y: 40, z: 15, status: "rejected" },
  { x: 60, y: 70, z: 30, status: "interview" },
  { x: 75, y: 65, z: 40, status: "interview" },
  { x: 85, y: 80, z: 50, status: "offer" },
  { x: 90, y: 90, z: 60, status: "offer" },
  { x: 80, y: 85, z: 45, status: "offer" },
  // User
  { x: 78, y: 72, z: 35, status: "user" }, 
];

export const RECOMMENDATIONS = [
  {
    id: 1,
    type: "Skill Gap",
    title: "Learn GraphQL",
    description: "70% of shortlisted candidates for this role have GraphQL on their resume.",
    icon: CloudLightning,
    impact: "High"
  },
  {
    id: 2,
    type: "Network",
    title: "Connect with Alumni",
    description: "3 alumni from your school work at Nebula AI. Reach out for a referral.",
    icon: Users,
    impact: "Medium"
  },
  {
    id: 3,
    type: "Experience",
    title: "Showcase Open Source",
    description: "Candidates with open source contributions are 2x more likely to be interviewed.",
    icon: Award,
    impact: "High"
  }
];