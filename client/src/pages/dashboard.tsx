import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  LayoutDashboard,
  ChevronRight,
  Sparkles,
  Settings,
  HelpCircle,
  Crown
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import SolverContent from "@/components/dashboard/solver-content";
import NotesContent from "@/components/dashboard/notes-content";
import QuizContent from "@/components/dashboard/quiz-content";
import EssayContent from "@/components/dashboard/essay-content";
import OverviewContent from "@/components/dashboard/overview-content";
import HelpContent from "@/components/dashboard/help-content";
import SettingsContent from "@/components/dashboard/settings-content";
import EvaluateContent from "@/components/dashboard/evaluate-content";
import { ClipboardCheck } from "lucide-react";

const menuItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, badge: null },
  { id: "solver", label: "AI Tutor", icon: MessageSquare, badge: "Popular" },
  { id: "notes", label: "Lecture Notes", icon: Mic, badge: null },
  { id: "quiz", label: "Quiz Generator", icon: FileText, badge: null },
  { id: "essay", label: "Essay Writer", icon: FileEdit, badge: null },
];

const teacherItems = [
  { id: "evaluate", label: "AI Evaluator", icon: ClipboardCheck, badge: "New" },
];

const supportItems = [
  { id: "help", label: "Help Center", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth(true);
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("solver");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarStyle = {
    "--sidebar-width": "260px",
    "--sidebar-width-icon": "56px",
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-muted/30">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base">Gradeio</h2>
                <p className="text-[11px] text-muted-foreground">AI Learning Platform</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-2">
            <SidebarGroup>
              <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Main Menu
              </p>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className={`w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all ${
                          activeSection === item.id 
                            ? "bg-violet-600 text-white hover:bg-violet-600 hover:text-white" 
                            : "hover:bg-muted"
                        }`}
                        data-testid={`sidebar-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={`ml-auto text-[10px] px-1.5 py-0 ${
                              activeSection === item.id 
                                ? "bg-white/20 text-white" 
                                : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user.role === "teacher" && (
              <SidebarGroup className="mt-4">
                <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Teacher Tools
                </p>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {teacherItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className={`w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all ${
                            activeSection === item.id 
                              ? "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white" 
                              : "hover:bg-muted"
                          }`}
                          data-testid={`sidebar-${item.id}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className={`ml-auto text-[10px] px-1.5 py-0 ${
                                activeSection === item.id 
                                  ? "bg-white/20 text-white" 
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              }`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup className="mt-4">
              <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Support
              </p>
              <SidebarGroupContent>
                <SidebarMenu>
                  {supportItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className={`w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all ${
                          activeSection === item.id 
                            ? "bg-violet-600 text-white hover:bg-violet-600 hover:text-white" 
                            : "hover:bg-muted"
                        }`}
                        data-testid={`sidebar-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-4 mx-2 p-3 rounded-xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-200/50 dark:border-violet-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold">Free Plan</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Upgrade for unlimited AI credits
              </p>
              <Button size="sm" className="w-full h-8 text-xs bg-violet-600 hover:bg-violet-700">
                Upgrade Now
              </Button>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/50">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs font-medium">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" data-testid="button-sidebar-toggle" />
              <div className="h-5 w-px bg-border" />
              {(() => {
                const allItems = [...menuItems, ...teacherItems, ...supportItems];
                const active = allItems.find(m => m.id === activeSection);
                const isTeacher = teacherItems.some(t => t.id === activeSection);
                const Icon = active?.icon || LayoutDashboard;
                return (
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isTeacher ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-violet-100 dark:bg-violet-900/30"}`}>
                      <Icon className={`w-3.5 h-3.5 ${isTeacher ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"}`} />
                    </div>
                    <h1 className="font-semibold text-sm">
                      {active?.label || "Dashboard"}
                    </h1>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1 font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI Online
              </Badge>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-muted/30">
            {activeSection === "overview" && <OverviewContent user={user} onNavigate={setActiveSection} />}
            {activeSection === "solver" && <SolverContent />}
            {activeSection === "notes" && <NotesContent />}
            {activeSection === "quiz" && <QuizContent />}
            {activeSection === "essay" && <EssayContent />}
            {activeSection === "evaluate" && user.role === "teacher" && <EvaluateContent />}
            {activeSection === "help" && <HelpContent />}
            {activeSection === "settings" && <SettingsContent user={user} />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
