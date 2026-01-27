import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Briefcase, Search, Settings, Home, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface UserStats {
  profileScore: number;
  status: string;
  joinedPlatform: string | null;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Fetch stats and activities when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await fetch("/api/dashboard/activity");
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
    fetchActivities();
  }, [user?.id]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Search, label: "Find Jobs", href: "/app/jobs" },
    { icon: Home, label: "Find Internships", href: "/internships" },
    { icon: Briefcase, label: "Favourites", href: "/favourites" },
  ];


  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border/40 bg-card/50 backdrop-blur-xl hidden md:flex flex-col max-h-screen overflow-y-auto">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold font-display text-lg">H</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">HirePulse</span>
            </div>
          </Link>
        </div>

        <nav className="px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (location === '/' && item.href === '/dashboard');
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats Section */}
        <div className="px-4 py-3 mx-4 mb-4 bg-accent/30 rounded-lg border border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Score</span>
              <span className="font-medium text-foreground">
                {statsLoading ? "..." : `${stats?.profileScore || 0}%`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground">
                {statsLoading ? "..." : stats?.status || "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Joined Platform</span>
              <span className="font-medium text-foreground">
                {statsLoading
                  ? "..."
                  : stats?.joinedPlatform
                    ? new Date(stats.joinedPlatform).toLocaleDateString()
                    : "Not available"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="px-4 py-3 mx-4 mb-4 bg-accent/20 rounded-lg border border-border/30">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent Activity</h3>
          <div className="space-y-2">
            {activitiesLoading ? (
              <div className="text-xs text-muted-foreground text-center py-2">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">No activity yet</div>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">{activity.icon} {activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1"></div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="sticky top-0 z-20 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-lg">H</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">HirePulse</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
                Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </header>
        <div className="min-h-[calc(100vh-4rem)] md:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}