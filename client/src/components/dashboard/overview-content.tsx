import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Mic, FileText, FileEdit,
  TrendingUp, CheckCircle, ArrowUpRight,
  Zap, Target, Star, Trophy, Award, BookOpen,
  BarChart2, Sparkles, ArrowUp, ArrowDown,
  Clock, Layout, Plus, Search
} from "lucide-react";
import type { User } from "@/hooks/use-auth";

interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  aiGraded: number;
  teacherReviewed: number;
  averageScore: number;
  quizzesSolvedToday: number;
  quizzesSolvedYesterday: number;
  totalQuizzesSolved: number;
  points: number;
  level: number;
  nextLevelPoints: number;
}

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
    refetchInterval: 5000,
  });

  const xp        = stats?.points ?? 0;
  const level     = stats?.level ?? 1;
  const xpInLevel = xp % 1000;
  const xpPct     = Math.min(100, (xpInLevel / 1000) * 100);

  const tools = [
    { id: "solver", icon: MessageSquare, label: "AI Tutor", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "notes",  icon: Mic,           label: "Lecture Notes", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { id: "quiz",   icon: FileText,      label: "Quiz Gen", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "essay",  icon: FileEdit,      label: "Essay Writer", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Welcome Section */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold text-[#111110] dark:text-white tracking-tight">
            Welcome back, {user.displayName.split(" ")[0]}
          </h2>
          <p className="mt-2 text-[#666660] text-[15px]">
            Ready to continue your learning journey today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigate("solver")} className="rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity gap-2 h-10 px-5">
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Progress Card */}
        <div className="md:col-span-2 p-6 rounded-[24px] border border-[#E5E5E0] dark:border-[#22221F] bg-[#F9F9F8] dark:bg-[#111110]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Zap className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">Level {level}</h3>
                <p className="text-[12px] text-[#999990]">{xp.toLocaleString()} Total XP</p>
              </div>
            </div>
            <span className="text-[13px] font-medium text-[#111110] dark:text-white">{xpInLevel}/1,000 XP</span>
          </div>
          <div className="h-3 w-full bg-[#E5E5E0] dark:bg-[#22221F] rounded-full overflow-hidden">
            <div 
              className="h-full bg-black dark:bg-white transition-all duration-1000 ease-out"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="mt-6 flex gap-6">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#999990] uppercase font-medium tracking-wider">Sessions</span>
              <span className="text-xl font-semibold mt-1">{stats?.totalSubmissions ?? 0}</span>
            </div>
            <div className="w-px h-10 bg-[#E5E5E0] dark:bg-[#22221F]" />
            <div className="flex flex-col">
              <span className="text-[11px] text-[#999990] uppercase font-medium tracking-wider">Avg Score</span>
              <span className="text-xl font-semibold mt-1">{stats?.averageScore ?? 0}%</span>
            </div>
            <div className="w-px h-10 bg-[#E5E5E0] dark:bg-[#22221F]" />
            <div className="flex flex-col">
              <span className="text-[11px] text-[#999990] uppercase font-medium tracking-wider">Quizzes</span>
              <span className="text-xl font-semibold mt-1">{stats?.totalQuizzesSolved ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="p-6 rounded-[24px] border border-[#E5E5E0] dark:border-[#22221F] bg-black text-white flex flex-col justify-between">
          <div>
            <Sparkles className="w-8 h-8 text-white mb-4" />
            <h3 className="text-lg font-semibold leading-snug">Boost your grades with AI power.</h3>
            <p className="mt-2 text-white/60 text-[14px]">Try the new Science Tutor module for biology and physics.</p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate("solver")} className="mt-6 w-full rounded-xl h-10 font-semibold">
            Try Now
          </Button>
        </div>
      </section>

      {/* Quick Tools */}
      <section>
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#999990] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group p-4 rounded-2xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A] hover:bg-[#F9F9F8] dark:hover:bg-[#111110] transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{tool.label}</p>
              <div className="mt-1 flex items-center gap-1 text-[12px] text-[#999990]">
                <span>Launch tool</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity Mini-Table */}
      <section className="p-6 rounded-[24px] border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[15px]">Recent Quizzes</h3>
          <button onClick={() => onNavigate('quiz')} className="text-[13px] text-[#666660] hover:text-black dark:hover:text-white transition-colors">View all</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#F0F0F0] dark:border-[#1A1A1A] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F9F9F8] dark:bg-[#111110] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#666660]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium">Calculus II Practice</p>
                  <p className="text-[11px] text-[#999990]">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[14px] font-semibold">85%</span>
                <div className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">PASS</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
