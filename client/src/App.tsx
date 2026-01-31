import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SEOHead } from "@/components/seo-head";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import Knowledge from "@/pages/knowledge";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/student" component={Dashboard} />
      <Route path="/solver" component={Dashboard} />
      <Route path="/quiz" component={Dashboard} />
      <Route path="/essay" component={Dashboard} />
      <Route path="/notes" component={Dashboard} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/knowledge" component={Knowledge} />
      <Route>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <a href="/" className="text-violet-600 hover:underline">
              Go Home
            </a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="gradeio-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SEOHead />
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
