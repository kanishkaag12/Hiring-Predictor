import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

export interface Favourite {
    id: string;
    userId: string;
    jobId: string;
    jobType: string;
    savedAt: string;
}

export function useFavourites() {
    const { data: favourites = [], isLoading } = useQuery<Favourite[]>({
        queryKey: ["/api/favourites"],
    });

    const addFavourite = useMutation({
        mutationFn: async (fav: { jobId: string; jobType: string }) => {
            const res = await apiRequest("POST", "/api/favourites/add", fav);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
        },
    });

    const removeFavourite = useMutation({
        mutationFn: async (jobId: string) => {
            await apiRequest("DELETE", `/api/favourites/remove/${jobId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
        },
    });

    const isStarred = (jobId: string) => {
        return favourites.some((f) => f.jobId === jobId);
    };

    return {
        favourites,
        isLoading,
        addFavourite,
        removeFavourite,
        isStarred,
    };
}
