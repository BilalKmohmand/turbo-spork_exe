import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MessageSquare,
  Mic,
  FileText,
  FileEdit,
  Brain,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Settings,
  HelpCircle,
  Crown,
  ClipboardCheck,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

import SolverContent from "@/components/dashboard/solver-content";
import NotesContent from "@/components/dashboard/notes-content";
import QuizContent from "@/components/dashboard/quiz-content";
import EssayContent from "@/components/dashboard/essay-content";
import OverviewContent from "@/components/dashboard/overview-content";
import HelpContent from "@/components/dashboard/help-content";
import SettingsContent from "@/components/dashboard/settings-content";
import EvaluateContent from "@/components/dashboard/evaluate-content";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "solver", label: "AI Tutor", icon: MessageSquare, badge: "Popular" },
  { id: "notes", label: "Lecture Notes", icon: Mic },
  { id: "quiz", label: "Quiz Generator", icon: FileText },
  { id: "essay", label: "Essay Writer", icon: FileEdit },
];

const teacherItems = [
  { id: "evaluate", label: "AI Evaluator", icon: ClipboardCheck, badge: "New" },
];

const supportItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help Center", icon: HelpCircle },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth(true);
  const [activeSection, setActiveSection] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const allItems = [...navItems, ...teacherItems, ...supportItems];
  const activeItem = allItems.find(i => i.id === activeSection);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-sidebar h-full">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Gradeio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {/* Main */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1.5">Menu</p>
            <ul className="space-y-0.5">
              {navItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`sidebar-${item.id}`}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon className="w-[15px] h-[15px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                        activeSection === item.id
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Teacher */}
          {user.role === "teacher" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1.5">Teacher</p>
              <ul className="space-y-0.5">
                {teacherItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      data-testid={`sidebar-${item.id}`}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? "bg-emerald-600 text-white"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <item.icon className="w-[15px] h-[15px] shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                          activeSection === item.id
                            ? "bg-white/20 text-white"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1.5">Support</p>
            <ul className="space-y-0.5">
              {supportItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`sidebar-${item.id}`}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon className="w-[15px] h-[15px] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade card */}
          <div className="mx-0.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold">Free Plan</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
              Upgrade for unlimited AI credits and features.
            </p>
            <Button size="sm" className="w-full h-7 text-xs">
              Upgrade
            </Button>
          </div>
        </nav>

        {/* User Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none mb-0.5">{user.displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={logout}
                data-testid="button-logout"
                className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-5 bg-background">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Dashboard</span>
            {activeSection !== "overview" && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="font-medium">{activeItem?.label}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="h-8 pl-8 w-44 text-sm bg-muted/50 border-transparent focus:border-border focus:bg-background"
              />
            </div>
            <button className="relative p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Badge variant="outline" className="text-[10px] gap-1 h-6 font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                AI Online
              </Badge>
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 dark:bg-background">
          {activeSection === "overview" && <OverviewContent user={user} onNavigate={setActiveSection} />}
          {activeSection === "solver" && <SolverContent />}
          {activeSection === "notes" && <NotesContent />}
          {activeSection === "quiz" && <QuizContent />}
          {activeSection === "essay" && <EssayContent />}
          {activeSection === "evaluate" && user.role === "teacher" && <EvaluateContent />}
          {activeSection === "help" && <HelpContent />}
          {activeSection === "settings" && <SettingsContent user={user} />}
        </main>
      </div>
    </div>
  );
}
