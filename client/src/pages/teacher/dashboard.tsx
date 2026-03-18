import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, 
  CheckCircle, 
  TrendingUp,
  Users,
  ArrowRight,
  FileText
} from "lucide-react";
import type { Submission, DashboardStats } from "@shared/schema";

type SubmissionExtended = Submission & { aiScore?: number | null };

export default function TeacherDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: pendingQueue, isLoading: queueLoading } = useQuery<SubmissionExtended[]>({
    queryKey: ["/api/teacher/queue"],
  });

  const pending = pendingQueue?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Review and evaluate student submissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
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
          </>
        ) : (
          <>
            <StatCard
              title="Pending Review"
              value={stats?.pendingReview || 0}
              icon={ClipboardList}
              description="Awaiting your evaluation"
            />
            <StatCard
              title="Completed Reviews"
              value={stats?.teacherReviewed || 0}
              icon={CheckCircle}
              description="Fully evaluated"
            />
            <StatCard
              title="Total Submissions"
              value={stats?.totalSubmissions || 0}
              icon={Users}
              description="All student work"
            />
            <StatCard
              title="Class Average"
              value={stats?.averageScore ? `${stats.averageScore}%` : "N/A"}
              icon={TrendingUp}
              description="Overall performance"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Review Queue</CardTitle>
            <CardDescription>Submissions awaiting your evaluation</CardDescription>
          </div>
          <Link href="/teacher/queue">
            <Button variant="ghost" size="sm" data-testid="link-view-all-queue">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-chart-2 mb-3" />
              <p className="text-muted-foreground">All submissions have been reviewed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover-elevate"
                  data-testid={`queue-item-${submission.id}`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{submission.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <StatusBadge status={submission.status} />
                  {submission.aiScore !== undefined && (
                    <span className="text-sm font-medium">AI: {submission.aiScore}%</span>
                  )}
                  <Link href={`/teacher/evaluate/${submission.id}`}>
                    <Button size="sm" data-testid={`button-evaluate-${submission.id}`}>
                      Evaluate
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
