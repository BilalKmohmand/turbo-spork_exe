import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Mic, 
  FileText, 
  FileEdit,
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  Zap,
  Target,
  BookOpen,
  Star,
  Trophy,
  Award,
  Medal,
} from "lucide-react";
import type { User } from "@/hooks/use-auth";

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
    refetchInterval: 1000, // Real-time refresh every second
  });

  const badges = [
    { name: "Quick Learner", icon: Zap, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/20" },
    { name: "Quiz Master", icon: Trophy, color: "text-violet-500", bgColor: "bg-violet-50 dark:bg-violet-950/20" },
    { name: "Top Student", icon: Award, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/20" },
    { name: "Problem Solver", icon: Target, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/20" },
  ];

  if (error) {
    console.error("Error fetching stats:", error);
  }

  const tools = [
    { 
      id: "solver",
      icon: MessageSquare, 
      title: "AI Tutor", 
      description: "Get instant help with any subject",
      color: "from-violet-500 to-indigo-500",
      bgColor: "bg-violet-50 dark:bg-violet-950/30"
    },
    { 
      id: "notes",
      icon: Mic, 
      title: "Lecture Notes", 
      description: "Record and transcribe lectures",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30"
    },
    { 
      id: "quiz",
      icon: FileText, 
      title: "Quiz Generator", 
      description: "Create quizzes from any text",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    { 
      id: "essay",
      icon: FileEdit, 
      title: "Essay Writer", 
      description: "AI essay assistance",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30"
    },
  ];

  const quickStats = [
    { 
      label: "Problems Solved", 
      value: stats?.totalSubmissions || 0, 
      icon: Target, 
      color: "text-violet-600"
    },
    { 
      label: "Quizzes Completed", 
      value: stats?.totalQuizzesSolved || 0, 
      icon: CheckCircle, 
      color: "text-emerald-600"
    },
    { 
      label: "Average Score", 
      value: stats?.averageScore ? `${stats.averageScore}%` : "0%", 
      icon: TrendingUp, 
      color: "text-amber-600"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex flex-col items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <span className="text-[10px] uppercase font-bold opacity-70">Level</span>
            <span className="text-2xl font-black leading-none">{stats?.level || 1}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user.displayName.split(" ")[0]}!
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                <Star className="w-3 h-3 fill-current" />
                {stats?.points || 0} XP
              </div>
              <p className="text-muted-foreground text-sm">Keep up the great work!</p>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Zap className="w-3 h-3" />
          Free Plan
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>Level Progress</span>
          <span>{stats?.points || 0} / {stats?.nextLevelPoints || 1000} XP</span>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-1000" 
            style={{ width: `${Math.min(100, (((stats?.points || 0) % 1000) / 10))}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
            <MessageSquare className="w-3 h-3 text-violet-500" />
            <span>+50 XP per problem solved</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
            <FileText className="w-3 h-3 text-emerald-500" />
            <span>+score×2 XP per quiz</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Level up every 1,000 XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} bg-current/10`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Tools</h2>
          <Badge variant="outline" className="text-xs">4 available</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Card key={tool.title} className="border-border/50 hover-elevate cursor-pointer transition-all group" onClick={() => onNavigate(tool.id)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tool.title}</h3>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
