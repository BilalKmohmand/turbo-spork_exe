import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import RoleSelection from "@/pages/role-selection";
import StudentDashboard from "@/pages/student/dashboard";
import SubmitAssignment from "@/pages/student/submit-assignment";
import StudentSubmissions from "@/pages/student/submissions";
import SubmissionDetail from "@/pages/student/submission-detail";
import TeacherDashboard from "@/pages/teacher/dashboard";
import ReviewQueue from "@/pages/teacher/review-queue";
import EvaluateSubmission from "@/pages/teacher/evaluate";
import EvaluatedSubmissions from "@/pages/teacher/evaluated";
import TeacherAnalytics from "@/pages/teacher/analytics";
import NotFound from "@/pages/not-found";
import type { UserRole } from "@shared/schema";

function StudentRoutes() {
  return (
    <Switch>
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/submit" component={SubmitAssignment} />
      <Route path="/student/submissions" component={StudentSubmissions} />
      <Route path="/student/submissions/:id" component={SubmissionDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TeacherRoutes() {
  return (
    <Switch>
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/teacher/queue" component={ReviewQueue} />
      <Route path="/teacher/evaluate/:id" component={EvaluateSubmission} />
      <Route path="/teacher/evaluated" component={EvaluatedSubmissions} />
      <Route path="/teacher/analytics" component={TeacherAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const savedRole = localStorage.getItem("eduai-role") as UserRole | null;
    if (savedRole) {
      setRole(savedRole);
      navigate(savedRole === "student" ? "/student" : "/teacher");
    }
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem("eduai-role", selectedRole);
    navigate(selectedRole === "student" ? "/student" : "/teacher");
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem("eduai-role");
    navigate("/");
  };

  if (!role) {
    return <RoleSelection onSelectRole={handleSelectRole} />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {role === "student" ? <StudentRoutes /> : <TeacherRoutes />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="eduai-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
