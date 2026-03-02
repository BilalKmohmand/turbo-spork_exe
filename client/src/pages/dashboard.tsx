import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MessageSquare, Mic, FileText, FileEdit, Brain,
  LogOut, LayoutDashboard, Sparkles, Settings,
  HelpCircle, Crown, ClipboardCheck, GraduationCap,
  Menu, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

import SolverContent    from "@/components/dashboard/solver-content";
import NotesContent     from "@/components/dashboard/notes-content";
import QuizContent      from "@/components/dashboard/quiz-content";
import EssayContent     from "@/components/dashboard/essay-content";
import OverviewContent  from "@/components/dashboard/overview-content";
import HelpContent      from "@/components/dashboard/help-content";
import SettingsContent  from "@/components/dashboard/settings-content";
import EvaluateContent  from "@/components/dashboard/evaluate-content";
import CoursesContent   from "@/components/dashboard/courses-content";

/* ─── Nav config ─────────────────────────────────────────────── */
const NAV = [
  {
    group: "Platform",
    items: [
      { id: "overview", label: "Overview",        icon: LayoutDashboard },
      { id: "courses",  label: "My Courses",       icon: GraduationCap, badge: "New" },
      { id: "solver",   label: "AI Tutor",         icon: MessageSquare },
      { id: "notes",    label: "Lecture Notes",    icon: Mic },
      { id: "quiz",     label: "Quiz Generator",   icon: FileText },
      { id: "essay",    label: "Essay Writer",     icon: FileEdit },
    ],
  },
];

const TEACHER_NAV = {
  group: "Teacher",
  items: [
    { id: "evaluate", label: "AI Evaluator", icon: ClipboardCheck, badge: "New" },
  ],
};

const SUPPORT_NAV = {
  group: "Support",
  items: [
    { id: "settings", label: "Settings",    icon: Settings },
    { id: "help",     label: "Help Center", icon: HelpCircle },
  ],
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({
  active,
  setActive,
  user,
  logout,
  open,
  setOpen,
  isCollapsed,
  setIsCollapsed
}: {
  active: string;
  setActive: (s: string) => void;
  user: { displayName: string; email: string; role: string };
  logout: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  const allGroups = [
    ...NAV,
    ...(user.role === "teacher" ? [TEACHER_NAV] : []),
    SUPPORT_NAV,
  ];

  const navigate = (id: string) => {
    setActive(id);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-40 h-full flex flex-col
          bg-[#F9F9F8] dark:bg-[#111110]
          border-r border-[#E5E5E0] dark:border-[#22221F]
          transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-[72px]" : "w-[260px]"}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-[60px] flex items-center justify-between px-4 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-black dark:bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-[#111110] dark:text-[#F9F9F8]">Gradeio</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-7 h-7 rounded-md bg-black dark:bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white dark:text-black" />
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-[#666660] hover:bg-[#E5E5E0] dark:hover:bg-[#22221F] transition-colors"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
          {allGroups.map(group => (
            <div key={group.group}>
              {!isCollapsed && (
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#999990] px-3 mb-2">
                  {group.group}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigate(item.id)}
                        data-testid={`sidebar-${item.id}`}
                        title={isCollapsed ? item.label : ""}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium
                          transition-all duration-200
                          ${isActive
                            ? "bg-[#E5E5E0] dark:bg-[#22221F] text-[#111110] dark:text-[#F9F9F8]"
                            : "text-[#666660] hover:bg-[#E5E5E0]/50 dark:hover:bg-[#22221F]/50 hover:text-[#111110] dark:hover:text-[#F9F9F8]"
                          }
                          ${isCollapsed ? "justify-center px-0" : ""}
                        `}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-black dark:text-white" : ""}`} />
                        {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                        {!isCollapsed && "badge" in item && item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#666660]">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E5E0] dark:border-[#22221F]">
          <div className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${isCollapsed ? "justify-center" : ""}`}>
            <Avatar className="w-8 h-8 shrink-0 border border-[#E5E5E0] dark:border-[#22221F]">
              <AvatarFallback className="bg-[#111110] text-white text-[11px] font-bold">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#111110] dark:text-[#F9F9F8] truncate leading-tight">{user.displayName}</p>
                <p className="text-[11px] text-[#999990] truncate">{user.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md text-[#666660] hover:bg-[#E5E5E0] dark:hover:bg-[#22221F] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Header ─────────────────────────────────────────────────── */
function Header({
  activeLabel,
  onMenuClick,
}: {
  activeLabel: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white dark:bg-[#0A0A0A] border-b border-[#E5E5E0] dark:border-[#22221F] sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-md text-[#666660] hover:bg-[#F0F0F0]">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-[#111110] dark:text-[#F9F9F8]">{activeLabel}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, isLoading, logout } = useAuth(true);
  const [active, setActive]         = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white dark:text-black" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const allItems = [
    ...NAV.flatMap(g => g.items),
    ...(user.role === "teacher" ? TEACHER_NAV.items : []),
    ...SUPPORT_NAV.items,
  ];
  const activeLabel = allItems.find(i => i.id === active)?.label ?? "Overview";

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0A0A0A] text-[#111110] dark:text-[#F9F9F8] overflow-hidden selection:bg-black/5 dark:selection:bg-white/10">
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        logout={logout}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          activeLabel={activeLabel} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] dark:bg-[#0A0A0A]">
          <div className={`max-w-screen-xl mx-auto h-full ${active === 'solver' ? '' : 'p-6 lg:p-8'}`}>
            {active === "overview"  && <OverviewContent user={user} onNavigate={setActive} />}
            {active === "courses"   && <CoursesContent />}
            {active === "solver"    && <SolverContent />}
            {active === "notes"     && <NotesContent />}
            {active === "quiz"      && <QuizContent />}
            {active === "essay"     && <EssayContent />}
            {active === "evaluate"  && user.role === "teacher" && <EvaluateContent />}
            {active === "help"      && <HelpContent />}
            {active === "settings"  && <SettingsContent user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
}
