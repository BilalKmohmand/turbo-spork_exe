import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, Upload, Calendar } from "lucide-react";
import type { Submission } from "@shared/schema";

export default function StudentSubmissions() {
  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ["/api/student/submissions"],
  });

  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const gradedSubmissions = submissions?.filter(s => s.status === "ai_graded") || [];
  const reviewedSubmissions = submissions?.filter(s => s.status === "teacher_reviewed") || [];

  const SubmissionsList = ({ items }: { items: Submission[] }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No submissions in this category</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((submission) => (
          <Card key={submission.id} className="hover-elevate" data-testid={`submission-card-${submission.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div>
                      <h3 className="font-medium">{submission.studentName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={submission.status} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {submission.content.substring(0, 150)}...
                  </p>
                  <Link href={`/student/submissions/${submission.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-${submission.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">My Submissions</h1>
          <p className="text-muted-foreground">View all your assignment submissions and feedback</p>
        </div>
        <Link href="/student/submit">
          <Button data-testid="button-new-submission">
            <Upload className="w-4 h-4 mr-2" />
            New Submission
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList data-testid="tabs-submission-filter">
            <TabsTrigger value="all">All ({submissions?.length || 0})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
            <TabsTrigger value="graded">AI Graded ({gradedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewedSubmissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <SubmissionsList items={submissions || []} />
          </TabsContent>
          <TabsContent value="pending">
            <SubmissionsList items={pendingSubmissions} />
          </TabsContent>
          <TabsContent value="graded">
            <SubmissionsList items={gradedSubmissions} />
          </TabsContent>
          <TabsContent value="reviewed">
            <SubmissionsList items={reviewedSubmissions} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
