import { Link, useLocation } from "wouter";
import { LayoutDashboard, Briefcase, User, Search, Settings, LogOut, Home, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Search, label: "Find Jobs", href: "/jobs" },
    { icon: Home, label: "Find Internships", href: "/internships" },
    { icon: Briefcase, label: "Favourites", href: "/favourites" },
    { icon: User, label: "Profile", href: "/profile" },
  ];


  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/50 backdrop-blur-xl hidden md:flex flex-col">
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

        <nav className="flex-1 px-4 py-4 space-y-1">
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

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Alex Chen</p>
              <p className="text-xs text-muted-foreground truncate">Premium Member</p>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="sticky top-0 z-20 h-16 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-display text-lg">H</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">HirePulse</span>
          </div>
        </header>
        <div className="min-h-[calc(100vh-4rem)] md:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}