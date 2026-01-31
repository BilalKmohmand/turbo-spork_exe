import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Mic, 
  FileText, 
  FileEdit,
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles
} from "lucide-react";
import type { User } from "@/hooks/use-auth";

interface OverviewContentProps {
  user: User;
}

export default function OverviewContent({ user }: OverviewContentProps) {
  const { data: stats } = useQuery<{ totalSubmissions: number; pendingReview: number; reviewed: number }>({
    queryKey: ["/api/student/stats"],
  });

  const features = [
    { 
      icon: MessageSquare, 
      title: "AI Homework Help", 
      description: "Get instant solutions to any problem",
      color: "from-blue-500 to-cyan-500",
      stat: stats?.totalSubmissions || 0,
      statLabel: "Problems solved"
    },
    { 
      icon: Mic, 
      title: "Lecture Notes", 
      description: "Record and transcribe lectures",
      color: "from-violet-500 to-purple-500",
      stat: 0,
      statLabel: "Notes created"
    },
    { 
      icon: FileText, 
      title: "Quiz Generator", 
      description: "Create practice quizzes from any text",
      color: "from-emerald-500 to-teal-500",
      stat: 0,
      statLabel: "Quizzes generated"
    },
    { 
      icon: FileEdit, 
      title: "Essay Writer", 
      description: "AI-powered essay assistance",
      color: "from-orange-500 to-amber-500",
      stat: 0,
      statLabel: "Essays written"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.displayName}!</h1>
          <p className="text-muted-foreground">Here's an overview of your learning journey</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSubmissions || 0}</div>
            <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Problems solved this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-500" />
              {stats?.pendingReview || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              {stats?.reviewed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-500" />
              Unlimited
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="hover-elevate cursor-pointer transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
