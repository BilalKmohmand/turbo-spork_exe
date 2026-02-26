import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MessageSquare, Mic, FileText, FileEdit, Brain,
  LogOut, LayoutDashboard, Sparkles, Settings,
  HelpCircle, Crown, ClipboardCheck, Search,
  Bell, ChevronRight, X, Menu,
} from "lucide-react";

import SolverContent    from "@/components/dashboard/solver-content";
import NotesContent     from "@/components/dashboard/notes-content";
import QuizContent      from "@/components/dashboard/quiz-content";
import EssayContent     from "@/components/dashboard/essay-content";
import OverviewContent  from "@/components/dashboard/overview-content";
import HelpContent      from "@/components/dashboard/help-content";
import SettingsContent  from "@/components/dashboard/settings-content";
import EvaluateContent  from "@/components/dashboard/evaluate-content";

/* ─── Nav config ─────────────────────────────────────────────── */
const NAV = [
  {
    group: "Platform",
    items: [
      { id: "overview", label: "Overview",        icon: LayoutDashboard },
      { id: "solver",   label: "AI Tutor",         icon: MessageSquare, badge: "Hot" },
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
}: {
  active: string;
  setActive: (s: string) => void;
  user: { displayName: string; email: string; role: string };
  logout: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
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
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-40 h-full w-[240px] flex flex-col
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          shadow-lg lg:shadow-none
          transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm shadow-violet-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] text-gray-900 dark:text-white tracking-tight">Gradeio</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-5 px-3 space-y-6">
          {allGroups.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-1">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigate(item.id)}
                        data-testid={`sidebar-${item.id}`}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                          transition-all duration-150 group
                          ${isActive
                            ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                          }
                        `}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {"badge" in item && item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? "bg-violet-200 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Upgrade banner */}
          <div className="mx-1 p-3.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[12px] font-semibold">Free Plan</span>
            </div>
            <p className="text-[11px] text-violet-100/80 mb-3 leading-relaxed">
              Upgrade for unlimited credits & premium features.
            </p>
            <button className="w-full h-7 text-[11px] font-semibold bg-white text-violet-700 rounded-lg hover:bg-violet-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-violet-600 text-white text-[11px] font-bold">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{user.displayName}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <button
                onClick={logout}
                data-testid="button-logout"
                title="Sign out"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
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
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-200 dark:border-gray-800 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none mb-0.5">Dashboard</p>
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-none">{activeLabel}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[13px] text-gray-400 dark:text-gray-500 cursor-text hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Search...</span>
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-400">
            ⌘K
          </kbd>
        </div>

        {/* Notification */}
        <button className="relative p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* AI status */}
        <Badge variant="outline" className="hidden sm:flex gap-1.5 h-7 text-[11px] font-medium border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Online
        </Badge>

        {/* Avatar */}
        <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-violet-400 transition-all">
          <AvatarFallback className="bg-violet-600 text-white text-[11px] font-bold">G</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, isLoading, logout } = useAuth(true);
  const [active, setActive]         = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 120, 240].map(d => (
              <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
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
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        logout={logout}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeLabel={activeLabel} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {active === "overview"  && <OverviewContent user={user} onNavigate={setActive} />}
          {active === "solver"    && <SolverContent />}
          {active === "notes"     && <NotesContent />}
          {active === "quiz"      && <QuizContent />}
          {active === "essay"     && <EssayContent />}
          {active === "evaluate"  && user.role === "teacher" && <EvaluateContent />}
          {active === "help"      && <HelpContent />}
          {active === "settings"  && <SettingsContent user={user} />}
        </main>
      </div>
    </div>
  );
}
