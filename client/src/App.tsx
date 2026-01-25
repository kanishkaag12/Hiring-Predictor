import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import JobDetails from "@/pages/job-details";
import Profile from "@/pages/profile";
import PublicJobsPage from "@/pages/public-jobs";
import AppJobsPage from "@/pages/app-jobs";
import Internships from "@/pages/internships";
import LandingPage from "@/pages/landing";
import FavouritesPage from "./pages/favourites";
import AuthPage from "@/pages/auth";
import ResetPasswordPage from "@/pages/reset-password";
import Settings from "@/pages/settings";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
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