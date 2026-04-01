import { useState, useRef, useEffect } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageSquare, Mic, FileText, FileEdit, Brain,
  LogOut, LayoutDashboard, Sparkles, Settings,
  HelpCircle, Crown, ClipboardCheck, GraduationCap,
  Menu, PanelLeftClose, PanelLeftOpen, Globe,
  BookMarked, Users, BookOpen, FileSignature, School,
  Loader2, Plus, ClipboardList,
} from "lucide-react";

import SolverContent          from "@/components/dashboard/solver-content";
import NotesContent           from "@/components/dashboard/notes-content";
import QuizContent            from "@/components/dashboard/quiz-content";
import EssayContent           from "@/components/dashboard/essay-content";
import OverviewContent        from "@/components/dashboard/overview-content";
import HelpContent            from "@/components/dashboard/help-content";
import SettingsContent        from "@/components/dashboard/settings-content";
import EvaluateContent        from "@/components/dashboard/evaluate-content";
import CoursesContent         from "@/components/dashboard/courses-content";
import ResearchContent        from "@/components/dashboard/research-content";
import AssignmentsContent     from "@/components/dashboard/assignments-content";
import ClassGraderContent     from "@/components/dashboard/class-grader-content";
import GradebookContent       from "@/components/dashboard/gradebook-content";
import ReportCardContent      from "@/components/dashboard/report-card-content";
import TeacherClassesContent  from "@/components/dashboard/teacher-classes-content";
import TeacherHomeContent     from "@/components/dashboard/teacher-home-content";
import StudentAssignmentsContent from "@/components/dashboard/student-assignments-content";

/* ─── Nav config ─────────────────────────────────────────────── */
const NAV = [
  {
    group: "Platform",
    items: [
      { id: "overview",     label: "Overview",        icon: LayoutDashboard },
      { id: "courses",      label: "My Courses",       icon: GraduationCap, badge: "New" },
      { id: "my-assignments", label: "Assignments",      icon: ClipboardList },
      { id: "solver",       label: "AI Tutor",         icon: MessageSquare },
      { id: "research",     label: "Research",          icon: Globe, badge: "New" },
      { id: "notes",        label: "Lecture Notes",    icon: Mic },
      { id: "quiz",         label: "Quiz Generator",   icon: FileText },
      { id: "essay",        label: "Essay Writer",     icon: FileEdit },
    ],
  },
];

const TEACHER_NAV = {
  group: "Teacher",
  items: [
    { id: "evaluate",    label: "AI Evaluator",   icon: ClipboardCheck, badge: "New" },
    { id: "assignments", label: "Assignments",     icon: BookMarked },
    { id: "classgrader", label: "Class Grader",    icon: Users, badge: "New" },
    { id: "gradebook",   label: "Grade Book",      icon: BookOpen },
    { id: "reportcard",  label: "Report Cards",    icon: FileSignature, badge: "New" },
    { id: "myclasses",   label: "My Classes",       icon: School },
  ],
};

const SUPPORT_NAV = {
  group: "Support",
  items: [
    { id: "settings", label: "Settings",    icon: Settings },
    { id: "help",     label: "Help Center", icon: HelpCircle },
  ],
};

const SUBJECTS = ["Mathematics","English / Literature","Science","History","Geography",
  "Physics","Chemistry","Biology","Computer Science","Art","Music","Economics","Psychology","Other"];
const GRADE_LEVELS = ["K - Grade 2","Grade 3 - 5","Grade 6 - 8","Grade 9 - 10","Grade 11 - 12","College / University"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Teacher Onboarding Modal ───────────────────────────────── */
function TeacherOnboardingModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [school, setSchool]     = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grade, setGrade]       = useState("");
  const [bio, setBio]           = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teacher/profile", { school, subjects, gradeLevel: grade, bio });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/profile"] });
      toast({ title: "Profile saved! Welcome to TheHighGrader™" });
      onClose();
    },
    onError: () => toast({ title: "Failed to save profile", variant: "destructive" }),
  });

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl border border-[#E5E5E0] dark:border-[#22221F]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Welcome to TheHighGrader™</DialogTitle>
              <DialogDescription>Set up your teacher profile to get started</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label>School Name <span className="text-[#999990] text-xs">(optional)</span></Label>
            <Input
              data-testid="input-school"
              placeholder="e.g. Lincoln High School"
              value={school}
              onChange={e => setSchool(e.target.value)}
              className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Grade Level <span className="text-[#999990] text-xs">(optional)</span></Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]" data-testid="select-grade-level">
                <SelectValue placeholder="Select grade level…" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subjects <span className="text-[#999990] text-xs">(select all that apply)</span></Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  data-testid={`subject-tag-${s.replace(/\s+/g, "-").toLowerCase()}`}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all ${
                    subjects.includes(s)
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "border-[#E5E5E0] dark:border-[#22221F] text-[#666660] hover:border-[#999990]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
              onClick={onClose}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 rounded-xl bg-black dark:bg-white text-white dark:text-black"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-teacher-profile"
            >
              {saveMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                : "Save Profile"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  setIsCollapsed,
  teacherProfile,
}: {
  active: string;
  setActive: (s: string) => void;
  user: { displayName: string; email: string; role: string };
  logout: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  teacherProfile?: { school?: string | null } | null;
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

  const filteredNAV = NAV.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.id !== "my-assignments" || user.role !== "teacher"
    ),
  }));

  const allGroups = [
    ...filteredNAV,
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
              <img src={logoPath} alt="TheHighGrader" className="w-7 h-7 rounded-md object-cover" />
              <span className="font-semibold text-[15px] tracking-tight text-[#111110] dark:text-[#F9F9F8]">TheHighGrader™</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <img src={logoPath} alt="TheHighGrader" className="w-7 h-7 rounded-md object-cover" />
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
                        {!isCollapsed && "badge" in item && (item as { badge?: string }).badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#666660]">
                            {(item as { badge?: string }).badge}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13px] font-semibold text-[#111110] dark:text-[#F9F9F8] truncate leading-tight">{user.displayName}</p>
                  {user.role === "teacher" && (
                    <Badge className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0 leading-none shrink-0">
                      Teacher
                    </Badge>
                  )}
                </div>
                {user.role === "teacher" && teacherProfile?.school ? (
                  <p className="text-[11px] text-[#999990] truncate flex items-center gap-1">
                    <School className="w-2.5 h-2.5 shrink-0" />{teacherProfile.school}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#999990] truncate">{user.email}</p>
                )}
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
        {!isCollapsed && (
          <p className="text-center text-[9px] text-[#CCCCCC]/30 dark:text-white/15 px-4 py-2 border-t border-[#E5E5E0] dark:border-[#22221F]">
            © {new Date().getFullYear()} TheHighGrader™
          </p>
        )}
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
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash || "overview";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasCheckedProfile = useRef(false);

  const { data: teacherProfile, isLoading: profileLoading } = useQuery<{ school?: string | null } | null>({
    queryKey: ["/api/teacher/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teacher/profile");
      return res.json();
    },
    enabled: !isLoading && user?.role === "teacher",
  });

  useEffect(() => {
    window.history.replaceState(null, "", `#${active}`);
  }, [active]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setActive(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!profileLoading && user?.role === "teacher" && !hasCheckedProfile.current) {
      hasCheckedProfile.current = true;
      if (!teacherProfile) {
        setShowOnboarding(true);
      }
    }
  }, [profileLoading, teacherProfile, user]);

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
        teacherProfile={teacherProfile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          activeLabel={activeLabel}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] dark:bg-[#0A0A0A]">
          <div className={`max-w-screen-xl mx-auto h-full ${active === "solver" ? "" : "p-6 lg:p-8"}`}>
            {active === "overview"    && user.role === "teacher"  && <TeacherHomeContent user={user} onNavigate={setActive} />}
            {active === "overview"    && user.role !== "teacher"  && <OverviewContent user={user} onNavigate={setActive} />}
            {active === "courses"     && <CoursesContent userRole={user.role} />}
            {active === "solver"      && <SolverContent />}
            {active === "research"    && <ResearchContent />}
            {active === "notes"       && <NotesContent />}
            {active === "quiz"        && <QuizContent />}
            {active === "essay"       && <EssayContent />}
            {active === "evaluate"        && user.role === "teacher" && <EvaluateContent />}
            {active === "assignments"     && user.role === "teacher" && <AssignmentsContent />}
            {active === "my-assignments"  && user.role !== "teacher" && <StudentAssignmentsContent />}
            {active === "classgrader"     && user.role === "teacher" && <ClassGraderContent />}
            {active === "gradebook"   && user.role === "teacher" && <GradebookContent />}
            {active === "reportcard"  && user.role === "teacher" && <ReportCardContent />}
            {active === "myclasses"   && user.role === "teacher" && <TeacherClassesContent />}
            {active === "help"        && <HelpContent />}
            {active === "settings"    && <SettingsContent user={user} />}
          </div>
        </main>
      </div>

      {user.role === "teacher" && (
        <TeacherOnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
