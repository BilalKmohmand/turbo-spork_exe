import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Upload,
  Eye,
  ArrowRight
} from "lucide-react";
import type { Submission, DashboardStats } from "@shared/schema";

type SubmissionExtended = Submission & { aiScore?: number | null };

export default function StudentDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery<SubmissionExtended[]>({
    queryKey: ["/api/student/submissions"],
  });

  const recent = recentSubmissions?.slice(0, 3) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Welcome Back</h1>
          <p className="text-muted-foreground">Track your assignments and AI feedback</p>
        </div>
        <Link href="/student/submit">
          <Button data-testid="button-new-submission">
            <Upload className="w-4 h-4 mr-2" />
            New Submission
          </Button>
        </Link>
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
              title="Total Assignments"
              value={stats?.totalSubmissions || 0}
              icon={FileText}
              description="Available to submit"
            />
            <StatCard
              title="Pending Review"
              value={stats?.pendingReview || 0}
              icon={Clock}
              description="Awaiting evaluation"
            />
            <StatCard
              title="Completed"
              value={stats?.teacherReviewed || 0}
              icon={CheckCircle}
              description="Fully reviewed"
            />
            <StatCard
              title="Average Score"
              value={stats?.averageScore ? `${stats.averageScore}%` : "N/A"}
              icon={TrendingUp}
              description="Across all submissions"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
              <CardDescription>Your latest assignment submissions</CardDescription>
            </div>
            <Link href="/student/submissions">
              <Button variant="ghost" size="sm" data-testid="link-view-all-submissions">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
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
            ) : recent.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No submissions yet</p>
                <Link href="/student/submit">
                  <Button variant="ghost" className="mt-2">
                    Submit your first assignment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recent.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`submission-item-${submission.id}`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{submission.content.substring(0, 40)}...</p>
                      <p className="text-sm text-muted-foreground">
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                    {submission.aiScore !== undefined && (
                      <span className="text-sm font-medium">{submission.aiScore}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/submit">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="action-upload">
                <Upload className="w-4 h-4" />
                Upload New Assignment
              </Button>
            </Link>
            <Link href="/student/submissions">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="action-view-history">
                <Eye className="w-4 h-4" />
                View Submission History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
