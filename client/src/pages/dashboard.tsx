import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  MessageSquare, 
  Mic, 
  FileText, 
  FileEdit, 
  Brain,
  LogOut,
  User,
  LayoutDashboard,
  BookOpen,
  History,
  Settings,
  ChevronRight
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

import SolverContent from "@/components/dashboard/solver-content";
import NotesContent from "@/components/dashboard/notes-content";
import QuizContent from "@/components/dashboard/quiz-content";
import EssayContent from "@/components/dashboard/essay-content";
import OverviewContent from "@/components/dashboard/overview-content";

const menuItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "solver", label: "AI Homework Help", icon: MessageSquare },
  { id: "notes", label: "Lecture Notes", icon: Mic },
  { id: "quiz", label: "Quiz Generator", icon: FileText },
  { id: "essay", label: "Essay Writer", icon: FileEdit },
];

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth(true);
  const [activeSection, setActiveSection] = useState("solver");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <Brain className="w-8 h-8 text-violet-600" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarStyle = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "60px",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">Gradeio</h2>
                <p className="text-xs text-muted-foreground truncate">AI Learning Platform</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className="w-full justify-start gap-3 h-11"
                        data-testid={`sidebar-${item.id}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {activeSection === item.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="font-semibold text-lg">
                {menuItems.find(m => m.id === activeSection)?.label || "Dashboard"}
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {activeSection === "overview" && <OverviewContent user={user} />}
            {activeSection === "solver" && <SolverContent />}
            {activeSection === "notes" && <NotesContent />}
            {activeSection === "quiz" && <QuizContent />}
            {activeSection === "essay" && <EssayContent />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
