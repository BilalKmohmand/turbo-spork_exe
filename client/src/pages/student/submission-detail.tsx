import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { AIFeedbackPanel } from "@/components/ai-feedback-panel";
import { ArrowLeft, Calendar, User, MessageSquare } from "lucide-react";
import type { Submission } from "@shared/schema";

type SubmissionExtended = Submission & {
  teacherScore?: number | null;
  teacherFeedback?: string | null;
  reviewedAt?: Date | string | null;
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: submission, isLoading } = useQuery<SubmissionExtended>({
    queryKey: ["/api/submissions", id],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Submission not found</p>
        <Link href="/student/submissions">
          <Button variant="ghost">Back to submissions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/student/submissions">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Submission Details</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {submission.studentName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto" data-testid="text-submission-content">
              {submission.content}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AIFeedbackPanel submission={submission} />

          {submission.teacherFeedback && (
            <Card data-testid="teacher-feedback-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-chart-2" />
                  Teacher Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.teacherScore !== undefined && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Teacher Score</p>
                    <p className="text-3xl font-bold text-chart-2" data-testid="text-teacher-score">
                      {submission.teacherScore}
                      <span className="text-lg text-muted-foreground">/100</span>
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Comments</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-teacher-feedback">
                    {submission.teacherFeedback}
                  </p>
                </div>
                {submission.reviewedAt && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed on {new Date(submission.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
