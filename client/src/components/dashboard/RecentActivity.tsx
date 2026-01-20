import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, PenTool, Send } from "lucide-react";

interface Activity {
    type: "analysis" | "skill" | "application";
    label: string;
    timestamp: string;
}

interface RecentActivityProps {
    activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case "analysis": return <Search className="w-3.5 h-3.5" />;
            case "skill": return <PenTool className="w-3.5 h-3.5" />;
            case "application": return <Send className="w-3.5 h-3.5" />;
        }
    };

    return (
        <Card className="border-border/40 bg-card/20 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold opacity-60 uppercase tracking-widest">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted/50 text-muted-foreground">
                            {getIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{activity.label}</p>
                            <p className="text-[10px] text-muted-foreground">{activity.timestamp}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
