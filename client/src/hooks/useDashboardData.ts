import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useDashboardData() {
    return useQuery({
        queryKey: ["/api/dashboard"],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });
}
