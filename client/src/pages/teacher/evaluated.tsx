import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Eye, CheckCircle } from "lucide-react";
import type { Submission } from "@shared/schema";

type SubmissionExtended = Submission & {
  aiScore?: number | null;
  teacherScore?: number | null;
  reviewedAt?: Date | string | null;
};

export default function EvaluatedSubmissions() {
  const { data: submissions, isLoading } = useQuery<SubmissionExtended[]>({
    queryKey: ["/api/teacher/all-submissions"],
  });

  const evaluated = submissions?.filter(s => s.status === "teacher_reviewed") || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Evaluated Submissions</h1>
        <p className="text-muted-foreground">View all submissions you have reviewed</p>
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
      ) : evaluated.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No submissions have been evaluated yet</p>
            <Link href="/teacher/queue">
              <Button variant="outline">Go to Review Queue</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Your Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluated.map((submission) => (
                  <TableRow key={submission.id} data-testid={`table-row-${submission.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-2/10 rounded flex items-center justify-center">
                          <FileText className="w-4 h-4 text-chart-2" />
                        </div>
                        {submission.studentName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {submission.reviewedAt 
                        ? new Date(submission.reviewedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{submission.aiScore}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-chart-2">{submission.teacherScore}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/teacher/evaluate/${submission.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-view-${submission.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
