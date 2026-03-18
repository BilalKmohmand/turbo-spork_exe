import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ClipboardCheck, BookMarked, Users, BookOpen,
  FileSignature, GraduationCap, ArrowUpRight,
  School, Plus, TrendingUp, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/hooks/use-auth";

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string | null;
  classCode: string;
  studentCount: number;
  createdAt: string;
}

interface ClassStats {
  studentCount: number;
  assignmentCount: number;
  avgScore: number | null;
}

interface TeacherProfile {
  school?: string | null;
  subjects?: string[];
  gradeLevel?: string | null;
}

function ClassCard({ cls, onNavigate }: { cls: ClassItem; onNavigate: (s: string) => void }) {
  const { data: stats } = useQuery<ClassStats>({
    queryKey: ["/api/teacher/classes", cls.id, "stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/teacher/classes/${cls.id}/stats`);
      return res.json();
    },
  });

  function letterGrade(pct: number) {
    if (pct >= 90) return { letter: "A", color: "text-emerald-600" };
    if (pct >= 80) return { letter: "B", color: "text-blue-600" };
    if (pct >= 70) return { letter: "C", color: "text-amber-600" };
    if (pct >= 60) return { letter: "D", color: "text-orange-600" };
    return { letter: "F", color: "text-red-600" };
  }

  return (
    <Card
      data-testid={`home-class-card-${cls.id}`}
      className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px] transition-colors"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#111110] dark:text-[#F9F9F8] truncate">{cls.name}</p>
            <p className="text-[12px] text-[#666660] mt-0.5">{cls.subject}</p>
          </div>
          <span className="font-mono text-[11px] font-bold bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] px-2 py-1 rounded-lg shrink-0">
            {cls.classCode}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-[#999990] mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />{stats?.studentCount ?? cls.studentCount} student{(stats?.studentCount ?? cls.studentCount) !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />{stats?.assignmentCount ?? 0} assignment{(stats?.assignmentCount ?? 0) !== 1 ? "s" : ""}
          </span>
          {stats?.avgScore != null && (
            <span className={`flex items-center gap-1 font-semibold ${letterGrade(stats.avgScore).color}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              Avg {letterGrade(stats.avgScore).letter} ({stats.avgScore}%)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("gradebook")}
            data-testid={`btn-gradebook-${cls.id}`}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            <BookOpen className="w-3 h-3" /> Grade Book
          </button>
          <button
            onClick={() => onNavigate("myclasses")}
            data-testid={`btn-manage-class-${cls.id}`}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] hover:bg-[#E8E8E5] dark:hover:bg-[#222220] transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Manage
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

const teacherTools = [
  { id: "evaluate",    icon: ClipboardCheck, label: "AI Evaluator",  desc: "Grade with AI",        color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30" },
  { id: "assignments", icon: BookMarked,      label: "Assignments",   desc: "Generate rubrics",     color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "classgrader", icon: Users,           label: "Class Grader",  desc: "Batch-grade students", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "gradebook",   icon: BookOpen,        label: "Grade Book",    desc: "View all grades",      color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "reportcard",  icon: FileSignature,   label: "Report Cards",  desc: "Write in seconds",     color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-950/30" },
  { id: "myclasses",   icon: GraduationCap,   label: "My Classes",    desc: "Manage rosters",       color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-950/30" },
];

interface TeacherHomeProps {
  user: User;
  onNavigate: (section: string) => void;
}

export default function TeacherHomeContent({ user, onNavigate }: TeacherHomeProps) {
  const { data: profile } = useQuery<TeacherProfile | null>({
    queryKey: ["/api/teacher/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teacher/profile");
      return res.json();
    },
  });

  const { data: classList = [] } = useQuery<ClassItem[]>({
    queryKey: ["/api/teacher/classes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teacher/classes");
      return res.json();
    },
  });

  const firstName = user.displayName.split(" ")[0];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#111110] dark:text-white tracking-tight">
            Welcome back, {firstName} 👋
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0 text-xs font-semibold px-2">
              Teacher
            </Badge>
            {profile?.school && (
              <span className="flex items-center gap-1 text-[13px] text-[#666660]">
                <School className="w-3.5 h-3.5" /> {profile.school}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Tools */}
      <section>
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#999990] mb-4">Teacher Tools</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {teacherTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              data-testid={`tool-card-${tool.id}`}
              className="group p-5 rounded-2xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A] hover:bg-[#F9F9F8] dark:hover:bg-[#111110] hover:border-[#CCCCCC] dark:hover:border-[#333330] transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{tool.label}</p>
              <div className="mt-1 flex items-center gap-1 text-[12px] text-[#999990]">
                <span>{tool.desc}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Classes Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#999990]">My Classes</h3>
          <button
            onClick={() => onNavigate("myclasses")}
            className="text-[13px] text-[#666660] hover:text-black dark:hover:text-white transition-colors"
          >
            Manage →
          </button>
        </div>

        {classList.length === 0 ? (
          <div
            onClick={() => onNavigate("myclasses")}
            className="group cursor-pointer flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-[#E5E5E0] dark:border-[#22221F] hover:border-[#111110] dark:hover:border-[#F9F9F8] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-[#999990]" />
            </div>
            <div>
              <p className="font-semibold text-[#111110] dark:text-[#F9F9F8]">Create your first class</p>
              <p className="text-[13px] text-[#999990] mt-0.5">Students join using a unique class code</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classList.map(cls => (
              <ClassCard key={cls.id} cls={cls} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
