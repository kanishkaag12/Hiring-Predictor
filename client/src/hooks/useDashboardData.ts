import { useQuery } from "@tanstack/react-query";
import { MOCK_DASHBOARD_DATA } from "@/lib/dashboardMockData";

export function useDashboardData() {
    return useQuery({
        queryKey: ["/api/dashboard"],
        queryFn: async () => {
            // Simulate API latency
            await new Promise((resolve) => setTimeout(resolve, 800));
            return MOCK_DASHBOARD_DATA;
        },
    });
}
