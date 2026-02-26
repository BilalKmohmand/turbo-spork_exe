import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Mic,
  FileText,
  FileEdit,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  Zap,
  Target,
  Star,
  Trophy,
  Award,
  BarChart2,
  BookOpen,
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
}

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

const tools = [
  { id: "solver", icon: MessageSquare, label: "AI Tutor", desc: "Get instant help with any subject", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { id: "notes",  icon: Mic,          label: "Lecture Notes", desc: "Record & transcribe lectures",  color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "quiz",   icon: FileText,      label: "Quiz Generator", desc: "Create quizzes from any text", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "essay",  icon: FileEdit,      label: "Essay Writer",  desc: "AI-powered writing assistant", color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30"  },
];

const earnRules = [
  { icon: MessageSquare, label: "+50 XP per problem", color: "text-violet-500" },
  { icon: FileText,      label: "+score×2 XP per quiz", color: "text-emerald-500" },
  { icon: Zap,           label: "Level up every 1,000 XP", color: "text-amber-500" },
];

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
    refetchInterval: 1000,
  });

  const { data: quizAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  const xp = stats?.points ?? 0;
  const level = stats?.level ?? 1;
  const xpInLevel = xp % 1000;
  const xpPct = (xpInLevel / 1000) * 100;

  const statCards = [
    { label: "Problems Solved",   value: stats?.totalSubmissions ?? 0,   icon: Target,      delta: "+2 today",    color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Quizzes Completed", value: stats?.totalQuizzesSolved ?? 0,  icon: CheckCircle, delta: `+${stats?.quizzesSolvedToday ?? 0} today`, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Average Score",     value: `${stats?.averageScore ?? 0}%`,  icon: TrendingUp,  delta: "all time",    color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Current XP",        value: xp.toLocaleString(),             icon: Star,        delta: `Level ${level}`, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  ];

  const recentAttempts = [...quizAttempts].reverse().slice(0, 5);

  const diffColor: Record<string, string> = {
    basic:        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    intermediate: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    advanced:     "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Good {getGreeting()}, {user.displayName.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening with your learning today.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 h-7 font-medium">
          <Star className="w-3 h-3 fill-current text-amber-500" />
          {xp.toLocaleString()} XP · Level {level}
        </Badge>
      </div>

      {/* Stat cards — Figma KBD card row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Card key={card.label} className="border border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${card.bg}`}>
                  <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold leading-none mb-1">{card.value}</p>
              <p className="text-[11px] text-muted-foreground">{card.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* XP Progress + Activity row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* XP Progress */}
        <Card className="border border-border bg-card md:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Level Progress</span>
              <span className="text-xs text-muted-foreground">Lv. {level}</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>{xpInLevel} XP</span>
                <span>1,000 XP</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 rounded-full"
                  style={{ width: `${Math.min(100, xpPct)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              {earnRules.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <r.icon className={`w-3 h-3 shrink-0 ${r.color}`} />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quiz Activity */}
        <Card className="border border-border bg-card md:col-span-2">
          <CardHeader className="pb-0 pt-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Recent Quiz Activity</span>
              <button onClick={() => onNavigate("quiz")} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {recentAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                  <BarChart2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No quizzes taken yet</p>
                <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={() => onNavigate("quiz")}>
                  Take a Quiz
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Table header */}
                <div className="grid grid-cols-4 px-4 py-2 bg-muted/40">
                  {["Difficulty", "Score", "Correct", "Result"].map(h => (
                    <span key={h} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                {recentAttempts.map((a, i) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${diffColor[a.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                        {a.difficulty}
                      </span>
                    </span>
                    <span className="text-sm font-semibold">{a.score}%</span>
                    <span className="text-sm text-muted-foreground">{a.correctCount}/{a.totalQuestions}</span>
                    <span>
                      <span className={`text-[11px] font-medium ${a.score >= 70 ? "text-emerald-600" : "text-red-500"}`}>
                        {a.score >= 70 ? "Pass" : "Fail"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">AI Tools</h2>
          <span className="text-[11px] text-muted-foreground">{tools.length} available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {tools.map(tool => (
            <Card
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="border border-border bg-card cursor-pointer hover-elevate group transition-all"
              data-testid={`card-tool-${tool.id}`}
            >
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tool.bg}`}>
                  <tool.icon className={`w-4.5 h-4.5 ${tool.color}`} />
                </div>
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-sm font-semibold leading-none mb-1">{tool.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.desc}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Badges row */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">Achievements</span>
            <span className="text-[11px] text-muted-foreground">Earn XP to unlock</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Zap,      name: "Quick Learner",  xp: 0,    color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20" },
              { icon: Trophy,   name: "Quiz Master",    xp: 500,  color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/20" },
              { icon: Award,    name: "Top Student",    xp: 1000, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
              { icon: BookOpen, name: "Scholar",        xp: 2000, color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/20" },
            ].map(badge => {
              const earned = xp >= badge.xp;
              return (
                <div key={badge.name} className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all ${earned ? "border-border" : "border-dashed border-border/50 opacity-50"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${earned ? badge.bg : "bg-muted"}`}>
                    <badge.icon className={`w-4 h-4 ${earned ? badge.color : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-none mb-0.5">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground">{earned ? "Earned" : `${badge.xp} XP`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
