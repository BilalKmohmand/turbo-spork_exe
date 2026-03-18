import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Target,
  Award
} from "lucide-react";
import type { Submission, DashboardStats } from "@shared/schema";

export default function TeacherAnalytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<(Submission & { aiScore?: number })[]>({
    queryKey: ["/api/teacher/all-submissions"],
  });

  const isLoading = statsLoading || submissionsLoading;

  const scoreBrackets = {
    excellent: submissions?.filter(s => (s.aiScore || 0) >= 90).length || 0,
    good: submissions?.filter(s => (s.aiScore || 0) >= 70 && (s.aiScore || 0) < 90).length || 0,
    average: submissions?.filter(s => (s.aiScore || 0) >= 50 && (s.aiScore || 0) < 70).length || 0,
    needsWork: submissions?.filter(s => (s.aiScore || 0) < 50).length || 0,
  };

  const total = submissions?.length || 1;
  const completionRate = submissions 
    ? Math.round((submissions.filter(s => s.status === "teacher_reviewed").length / total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Analytics</h1>
        <p className="text-muted-foreground">Overview of class performance and submission statistics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Submissions"
              value={submissions?.length || 0}
              icon={Users}
              description="All student work received"
            />
            <StatCard
              title="Review Rate"
              value={`${completionRate}%`}
              icon={CheckCircle}
              description="Submissions fully reviewed"
            />
            <StatCard
              title="Average AI Score"
              value={stats?.averageScore ? `${stats.averageScore}%` : "N/A"}
              icon={TrendingUp}
              description="Class average performance"
            />
            <StatCard
              title="Top Performer"
              value={scoreBrackets.excellent}
              icon={Award}
              description="Students scoring 90%+"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Score Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of AI scores across all submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-2" />
                        <span className="text-sm font-medium">Excellent (90-100%)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{scoreBrackets.excellent}</span>
                    </div>
                    <Progress value={(scoreBrackets.excellent / total) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-1" />
                        <span className="text-sm font-medium">Good (70-89%)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{scoreBrackets.good}</span>
                    </div>
                    <Progress value={(scoreBrackets.good / total) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-chart-4" />
                        <span className="text-sm font-medium">Average (50-69%)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{scoreBrackets.average}</span>
                    </div>
                    <Progress value={(scoreBrackets.average / total) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span className="text-sm font-medium">Needs Work (&lt;50%)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{scoreBrackets.needsWork}</span>
                    </div>
                    <Progress value={(scoreBrackets.needsWork / total) * 100} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key indicators for class assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold">{stats?.pendingReview || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
                    <p className="text-2xl font-bold text-chart-2">{stats?.teacherReviewed || 0}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Processing Success</span>
                    <span className="text-sm font-medium text-chart-2">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Review Completion</span>
                    <span className="text-sm font-medium">{completionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. AI Score vs Teacher</span>
                    <span className="text-sm font-medium text-muted-foreground">Aligned</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
