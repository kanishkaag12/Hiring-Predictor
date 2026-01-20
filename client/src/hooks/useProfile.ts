import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { User, Skill, Project, Experience } from "@shared/schema";

export interface FullProfile extends User {
    skills: Skill[];
    projects: Project[];
    experiences: Experience[];
}

export function useProfile() {
    const { data: profile, isLoading } = useQuery<FullProfile>({
        queryKey: ["/api/profile"],
    });

    const updateProfile = useMutation({
        mutationFn: async (update: Partial<User>) => {
            const res = await apiRequest("PATCH", "/api/profile", update);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const addSkill = useMutation({
        mutationFn: async (skill: { name: string; level: string }) => {
            const res = await apiRequest("POST", "/api/profile/skills", skill);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const removeSkill = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/profile/skills/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const addProject = useMutation({
        mutationFn: async (project: { title: string; techStack: string[]; description: string; complexity: string; githubLink?: string }) => {
            const res = await apiRequest("POST", "/api/profile/projects", project);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const removeProject = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/profile/projects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const addExperience = useMutation({
        mutationFn: async (exp: { company: string; role: string; duration: string; type: string }) => {
            const res = await apiRequest("POST", "/api/profile/experience", exp);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const removeExperience = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/profile/experience/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const updateLinkedin = useMutation({
        mutationFn: async (url: string) => {
            const res = await apiRequest("PUT", "/api/profile/linkedin", { url });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const updateGithub = useMutation({
        mutationFn: async (url: string) => {
            const res = await apiRequest("PUT", "/api/profile/github", { url });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    const uploadResume = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("resume", file);
            const res = await fetch("/api/profile/resume", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to upload resume");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        },
    });

    return {
        profile,
        isLoading,
        updateProfile,
        addSkill,
        removeSkill,
        addProject,
        removeProject,
        addExperience,
        removeExperience,
        updateLinkedin,
        updateGithub,
        uploadResume,
    };
}

