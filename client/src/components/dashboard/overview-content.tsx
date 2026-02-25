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
  BookOpen
} from "lucide-react";
import type { User } from "@/hooks/use-auth";

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: stats, isLoading, error } = useQuery<{ totalSubmissions: number; pendingReview: number; teacherReviewed: number; averageScore: number }>({
    queryKey: ["/api/student/stats"],
    refetchInterval: 5000, // Refetch every 5 seconds to keep it updated
  });

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
      icon: ListChecks, 
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
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user.displayName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your learning</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Zap className="w-3 h-3" />
          Free Plan
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} bg-current/10`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.change && (
                  <Badge variant="secondary" className="text-xs gap-0.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI Credits</h3>
                <p className="text-sm text-white/70">Unlimited usage on free plan</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">∞</p>
              <p className="text-sm text-white/70">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold">Quick Tips</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
              <span className="text-muted-foreground">Upload a photo of your homework for instant AI solutions</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
              <span className="text-muted-foreground">Use Lecture Notes to record classes and generate study notes</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
              <span className="text-muted-foreground">Generate practice quizzes from your textbook or notes</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
