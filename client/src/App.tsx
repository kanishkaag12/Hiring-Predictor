import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import JobDetails from "@/pages/job-details";
import Profile from "@/pages/profile";
import Jobs from "@/pages/jobs";
import Internships from "@/pages/internships";
import LandingPage from "@/pages/landing";
import FavouritesPage from "./pages/favourites";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/:id" component={JobDetails} />
      <Route path="/internships" component={Internships} />
      <Route path="/profile" component={Profile} />
      <Route path="/favourites" component={FavouritesPage} />
      <Route path="/applications" component={FavouritesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;