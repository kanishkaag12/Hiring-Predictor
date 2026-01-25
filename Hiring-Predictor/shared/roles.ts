export interface RoleRequirementProfile {
    roleName: string;
    requiredSkills: string[];
    preferredSkills: string[];
    minProjects: number;
    internshipPreference: boolean;
    competitionLevel: "High" | "Medium" | "Low";
    marketDemand: number; // 0.0 to 1.2 multiplier
}

export const ROLE_REQUIREMENTS: Record<string, RoleRequirementProfile> = {
    "SDE Intern": {
        roleName: "SDE Intern",
        requiredSkills: ["Data Structures", "Algorithms", "Java", "Python", "C++", "System Design Basics"],
        preferredSkills: ["React", "Node.js", "SQL", "Git", "Docker"],
        minProjects: 2,
        internshipPreference: false,
        competitionLevel: "High",
        marketDemand: 1.1
    },
    "Frontend Intern": {
        roleName: "Frontend Intern",
        requiredSkills: ["HTML", "CSS", "JavaScript", "React", "Vue", "Angular"],
        preferredSkills: ["TypeScript", "Tailwind CSS", "Redux", "Figma Basics"],
        minProjects: 2,
        internshipPreference: false,
        competitionLevel: "Medium",
        marketDemand: 1.0
    },
    "Data Analyst": {
        roleName: "Data Analyst",
        requiredSkills: ["Python", "SQL", "Statistics", "Excel"],
        preferredSkills: ["Tableau", "PowerBI", "Pandas", "NumPy", "ML Basics"],
        minProjects: 1,
        internshipPreference: false,
        competitionLevel: "High",
        marketDemand: 0.9
    },
    "Backend Intern": {
        roleName: "Backend Intern",
        requiredSkills: ["Node.js", "Python", "Go", "SQL", "NoSQL", "REST APIs"],
        preferredSkills: ["Redis", "Docker", "AWS Basics", "Microservices"],
        minProjects: 2,
        internshipPreference: false,
        competitionLevel: "Medium",
        marketDemand: 1.05
    }
};
