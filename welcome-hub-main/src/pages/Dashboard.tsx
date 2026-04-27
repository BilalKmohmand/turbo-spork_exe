import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  BookOpen,
  FileText,
  GraduationCap,
  LogOut,
  NotebookPen,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearStoredUser, getStoredUser } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import AITutorPage from "@/components/AITutorPage";
import MyCoursesPage from "@/components/MyCoursesPage";
import QuizGeneratorPage from "@/components/QuizGeneratorPage";
import LectureNotesPage from "@/components/LectureNotesPage";
import EssayWriterPage from "@/components/EssayWriterPage";

type NavItem = {
  id: "ai-tutor" | "my-courses" | "quiz-generator" | "lecture-notes" | "essay-writer";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { id: "ai-tutor", label: "AI Tutor", icon: Bot },
  { id: "my-courses", label: "My Courses", icon: GraduationCap },
  { id: "quiz-generator", label: "Quiz Generator", icon: NotebookPen },
  { id: "lecture-notes", label: "Lecture Notes", icon: FileText },
  { id: "essay-writer", label: "Essay Writer", icon: BookOpen },
];

const pageComponents: Record<NavItem["id"], React.ComponentType> = {
  "ai-tutor": AITutorPage,
  "my-courses": MyCoursesPage,
  "quiz-generator": QuizGeneratorPage,
  "lecture-notes": LectureNotesPage,
  "essay-writer": EssayWriterPage,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);

  const [active, setActive] = useState<NavItem["id"]>("ai-tutor");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    if (!user) navigate("/");
  }, [navigate, user]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleLogout = () => {
    apiFetch<{ success: true }>("/api/auth/logout", { method: "POST" })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        clearStoredUser();
        navigate("/");
      });
  };

  if (!user) return null;

  const ActivePage = pageComponents[active];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="w-72 shrink-0 border-r border-sidebar-border bg-[hsl(var(--sidebar-background))]">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shadow-[var(--glow-purple)]">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">TheHighGrader</div>
                <div className="text-lg font-semibold">Dashboard</div>
              </div>
            </div>
          </div>

          <nav className="px-4 pb-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/15 text-foreground border border-primary/25"
                      : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground",
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-4">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 shrink-0 border-b border-border bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/30">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">Signed in as</div>
                <div className="text-sm font-semibold text-foreground">{user.displayName}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary">
                  {user.role === "student" ? "Student" : "Teacher"}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 min-w-0">
            {!isOnline ? (
              <div className="h-full flex items-center justify-center">
                <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <WifiOff className="w-6 h-6 text-destructive" />
                  </div>
                  <h2 className="text-xl font-bold">You’re offline</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check your internet connection to load TheHighGrader dashboard.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[calc(100vh-7rem)] rounded-2xl border border-border bg-card overflow-hidden">
                <ActivePage />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
