import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Landing from "@/pages/landing";
import Solver from "@/pages/solver";
import Quiz from "@/pages/quiz";
import Essay from "@/pages/essay";
import Pricing from "@/pages/pricing";
import Auth from "@/pages/auth";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Calculator, 
  FileText, 
  FileEdit,
  Menu,
  X,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/solver", label: "Homework Help", icon: Calculator },
    { href: "/quiz", label: "Quiz Maker", icon: FileText },
    { href: "/essay", label: "Essay Writer", icon: FileEdit },
  ];

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Gradeio</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={location === item.href ? "secondary" : "ghost"} 
                  size="sm"
                  className="gap-2"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/pricing" className="hidden sm:block">
            <Button variant="outline" size="sm" data-testid="nav-pricing">
              Pricing
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background p-4 space-y-2">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={location === item.href ? "secondary" : "ghost"} 
                className="w-full justify-start gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Pricing
            </Button>
          </Link>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/solver" component={Solver} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/essay" component={Essay} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const standalonePages = ["/", "/auth", "/login", "/student", "/teacher"];
  const isStandalonePage = standalonePages.includes(location);

  return (
    <ThemeProvider defaultTheme="light" storageKey="brainboost-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {isStandalonePage ? (
            <Router />
          ) : (
            <AppLayout>
              <Router />
            </AppLayout>
          )}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
