import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Mic, FileText, FileEdit,
  TrendingUp, CheckCircle, ArrowUpRight,
  Zap, Target, Star, Trophy, Award, BookOpen,
  BarChart2, Sparkles, ArrowUp, ArrowDown,
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

interface QuizAttempt {
  difficulty: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  attemptedAt?: string;
}

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ScoreBadge({ score }: { score: number }) {
  const pass = score >= 70;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      pass
        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
    }`}>
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function DiffBadge({ diff }: { diff: string }) {
  const map: Record<string, string> = {
    basic:        "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
    intermediate: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
    advanced:     "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[diff] ?? "bg-gray-100 text-gray-500"}`}>
      {diff}
    </span>
  );
}

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
    refetchInterval: 2000,
  });

  const { data: quizAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
    refetchInterval: 5000,
  });

  const xp        = stats?.points ?? 0;
  const level     = stats?.level ?? 1;
  const xpInLevel = xp % 1000;
  const xpPct     = Math.min(100, (xpInLevel / 1000) * 100);

  const todayQ    = stats?.quizzesSolvedToday ?? 0;
  const yestQ     = stats?.quizzesSolvedYesterday ?? 0;
  const quizDelta = todayQ - yestQ;

  const statCards = [
    {
      label: "Problems Solved",
      value: stats?.totalSubmissions ?? 0,
      sub: "Total AI sessions",
      icon: Target,
      iconBg: "bg-violet-100 dark:bg-violet-950/50",
      iconColor: "text-violet-600 dark:text-violet-400",
      delta: null,
    },
    {
      label: "Quizzes Taken",
      value: stats?.totalQuizzesSolved ?? 0,
      sub: "All time",
      icon: CheckCircle,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      delta: todayQ > 0 ? `+${todayQ} today` : null,
      deltaUp: quizDelta >= 0,
    },
    {
      label: "Average Score",
      value: `${stats?.averageScore ?? 0}%`,
      sub: "Across all quizzes",
      icon: TrendingUp,
      iconBg: "bg-amber-100 dark:bg-amber-950/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      delta: null,
    },
    {
      label: "XP Earned",
      value: xp.toLocaleString(),
      sub: `Level ${level} · ${xpInLevel}/1,000`,
      icon: Star,
      iconBg: "bg-blue-100 dark:bg-blue-950/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      delta: null,
    },
  ];

  const tools = [
    { id: "solver", icon: MessageSquare, label: "AI Tutor",       desc: "Chat with AI on any subject",   color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-950/50" },
    { id: "notes",  icon: Mic,           label: "Lecture Notes",  desc: "Transcribe and summarize audio", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/50" },
    { id: "quiz",   icon: FileText,      label: "Quiz Generator", desc: "Create quizzes from any text",   color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-950/50" },
    { id: "essay",  icon: FileEdit,      label: "Essay Writer",   desc: "AI-powered writing assistant",   color: "text-amber-600",  bg: "bg-amber-100 dark:bg-amber-950/50" },
  ];

  const recent = [...quizAttempts].reverse().slice(0, 6);

  const badges = [
    { icon: Zap,      name: "Quick Learner", req: 0,    color: "text-amber-500",   bg: "bg-amber-100 dark:bg-amber-950/50" },
    { icon: Trophy,   name: "Quiz Master",   req: 500,  color: "text-violet-500",  bg: "bg-violet-100 dark:bg-violet-950/50" },
    { icon: Award,    name: "Top Student",   req: 1000, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/50" },
    { icon: BookOpen, name: "Scholar",       req: 2500, color: "text-blue-500",    bg: "bg-blue-100 dark:bg-blue-950/50" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {greeting()}, {user.displayName.split(" ")[0]} 👋
          </h2>
          <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
            Here's what's happening with your learning today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[12px] font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />
            {xp.toLocaleString()} XP
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 text-[12px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Level {level}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.delta && (
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  card.deltaUp !== false ? "text-emerald-600" : "text-red-500"
                }`}>
                  {card.deltaUp !== false ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {card.delta}
                </span>
              )}
            </div>
            <div>
              <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">{card.value}</p>
              <p className="mt-1 text-[12px] text-gray-400 dark:text-gray-500">{card.sub}</p>
              <p className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── XP Progress + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Level Progress</h3>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              Lv. {level}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              <span>{xpInLevel.toLocaleString()} XP</span>
              <span>1,000 XP</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700 ease-out"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* XP rules */}
          <div className="space-y-2 pt-1">
            {[
              { icon: MessageSquare, label: "+50 XP per problem solved",   color: "text-violet-500" },
              { icon: FileText,      label: "+score×2 XP per quiz",        color: "text-emerald-500" },
              { icon: Zap,           label: "Level up every 1,000 XP",     color: "text-amber-500" },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2.5 text-[12px] text-gray-500 dark:text-gray-400">
                <r.icon className={`w-3.5 h-3.5 shrink-0 ${r.color}`} />
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz History Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Recent Quiz Activity</h3>
            <button
              onClick={() => onNavigate("quiz")}
              className="flex items-center gap-1 text-[12px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-1">No quizzes yet</p>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-4">Take your first quiz to see your progress</p>
              <Button size="sm" onClick={() => onNavigate("quiz")} className="h-8 text-[12px]">
                Start a Quiz
              </Button>
            </div>
          ) : (
            <>
              {/* Table head */}
              <div className="grid grid-cols-5 gap-3 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                {["Difficulty", "Score", "Correct", "Questions", "Result"].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</span>
                ))}
              </div>
              {/* Table rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recent.map((a, i) => (
                  <div key={i} className="grid grid-cols-5 gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <span><DiffBadge diff={a.difficulty} /></span>
                    <span className="text-[14px] font-bold text-gray-900 dark:text-white">{a.score}%</span>
                    <span className="text-[13px] text-gray-600 dark:text-gray-400 self-center">{a.correctCount}</span>
                    <span className="text-[13px] text-gray-600 dark:text-gray-400 self-center">{a.totalQuestions}</span>
                    <span className="self-center"><ScoreBadge score={a.score} /></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── AI Tools Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">AI Tools</h3>
          <span className="text-[12px] text-gray-400 dark:text-gray-500">{tools.length} tools available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              data-testid={`card-tool-${tool.id}`}
              className="text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tool.bg}`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">{tool.label}</p>
                  <p className="mt-0.5 text-[12px] text-gray-400 dark:text-gray-500 leading-relaxed">{tool.desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-500 transition-colors shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Achievements</h3>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Earn XP to unlock</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-800">
          {badges.map(badge => {
            const earned = xp >= badge.req;
            return (
              <div key={badge.name} className={`flex flex-col items-center gap-2 p-5 text-center transition-opacity ${earned ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${earned ? badge.bg : "bg-gray-100 dark:bg-gray-800"}`}>
                  <badge.icon className={`w-6 h-6 ${earned ? badge.color : "text-gray-400"}`} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{badge.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {earned ? "✓ Earned" : `${badge.req.toLocaleString()} XP needed`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
