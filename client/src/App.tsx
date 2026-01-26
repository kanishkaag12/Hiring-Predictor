import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "@/lib/queryClient";
import { setQueryClient } from "@/lib/cacheManager";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

// Lazy load pages
const LandingPage = lazy(() => import("@/pages/landing"));
const AuthPage = lazy(() => import("@/pages/auth"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const PublicJobsPage = lazy(() => import("@/pages/public-jobs"));
const AppJobsPage = lazy(() => import("@/pages/app-jobs"));
const JobDetails = lazy(() => import("@/pages/job-details"));
const Internships = lazy(() => import("@/pages/internships"));
const FavouritesPage = lazy(() => import("@/pages/favourites"));
const Settings = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Initialize cache manager with query client
setQueryClient(queryClient);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/jobs" component={PublicJobsPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/app/jobs" component={AppJobsPage} />
        <ProtectedRoute path="/jobs/:id" component={JobDetails} />
        <ProtectedRoute path="/internships" component={Internships} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/favourites" component={FavouritesPage} />
        <ProtectedRoute path="/applications" component={FavouritesPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;