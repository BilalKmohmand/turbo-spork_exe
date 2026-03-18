import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Eye, ClipboardList } from "lucide-react";
import type { Submission } from "@shared/schema";

type SubmissionExtended = Submission & {
  aiScore?: number | null;
  teacherScore?: number | null;
};

export default function ReviewQueue() {
  const { data: submissions, isLoading } = useQuery<SubmissionExtended[]>({
    queryKey: ["/api/teacher/all-submissions"],
  });

  const needsReview = submissions?.filter(s => s.status === "ai_graded") || [];
  const pending = submissions?.filter(s => s.status === "pending") || [];
  const reviewed = submissions?.filter(s => s.status === "teacher_reviewed") || [];

  const SubmissionsTable = ({ items }: { items: SubmissionExtended[] }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No submissions in this category</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Score</TableHead>
            <TableHead>Teacher Score</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((submission) => (
            <TableRow key={submission.id} data-testid={`table-row-${submission.id}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  {submission.studentName}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>
                <StatusBadge status={submission.status} />
              </TableCell>
              <TableCell>
                {submission.aiScore !== undefined ? (
                  <span className="font-medium">{submission.aiScore}%</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {submission.teacherScore !== undefined ? (
                  <span className="font-medium text-chart-2">{submission.teacherScore}%</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/teacher/evaluate/${submission.id}`}>
                  <Button size="sm" variant={submission.status === "ai_graded" ? "default" : "outline"} data-testid={`button-review-${submission.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    {submission.status === "teacher_reviewed" ? "View" : "Review"}
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Review Queue</h1>
        <p className="text-muted-foreground">Manage and evaluate student submissions</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Tabs defaultValue="needs_review" className="w-full">
            <CardHeader>
              <TabsList data-testid="tabs-queue-filter">
                <TabsTrigger value="needs_review">
                  Needs Review ({needsReview.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  AI Processing ({pending.length})
                </TabsTrigger>
                <TabsTrigger value="reviewed">
                  Completed ({reviewed.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="needs_review" className="mt-0">
                <SubmissionsTable items={needsReview} />
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                <SubmissionsTable items={pending} />
              </TabsContent>
              <TabsContent value="reviewed" className="mt-0">
                <SubmissionsTable items={reviewed} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
