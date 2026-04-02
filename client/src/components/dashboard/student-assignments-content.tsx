import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen, Clock, GraduationCap, ClipboardList, Loader2,
  FileText, ChevronDown, ChevronUp, Send, Check, AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

interface StudentAssignment {
  id: string;
  name: string;
  subject: string;
  totalPoints: number;
  gradeLevel?: string | null;
  assignmentType?: string | null;
  studentInstructions?: string | null;
  estimatedTime?: string | null;
  publishedAt?: string | null;
  className?: string | null;
  criteria: RubricCriterion[];
  submission: {
    id: string;
    status: string;
    submittedAt: string;
    content: string;
  } | null;
  evaluation: {
    overallScore: number;
    overallFeedback: string;
    criteriaScores: CriterionScore[];
    pushedAt?: string | null;
  } | null;
}

function letterGrade(pct: number) {
  if (pct >= 90) return { letter: "A", color: "text-green-600 dark:text-green-400" };
  if (pct >= 80) return { letter: "B", color: "text-blue-600 dark:text-blue-400" };
  if (pct >= 70) return { letter: "C", color: "text-yellow-600 dark:text-yellow-400" };
  if (pct >= 60) return { letter: "D", color: "text-orange-600 dark:text-orange-400" };
  return { letter: "F", color: "text-red-600 dark:text-red-400" };
}

function AssignmentCard({ assignment }: { assignment: StudentAssignment }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const hasSubmitted = !!assignment.submission;
  const isPushed = assignment.submission?.status === "pushed";

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/student/assignments/${assignment.id}/submit`, { content: answer });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/assignments"] });
      toast({ title: "Assignment submitted!", description: "Your teacher will review and push your result.", variant: "success" });
      setAnswer("");
      setExpanded(false);
    },
    onError: (err: any) => toast({ title: "Submission failed", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  const pct = assignment.evaluation && assignment.totalPoints > 0
    ? Math.round((assignment.evaluation.overallScore / assignment.totalPoints) * 100)
    : null;
  const grade = pct !== null ? letterGrade(pct) : null;

  return (
    <Card className="border border-border bg-card" data-testid={`card-student-assignment-${assignment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{assignment.name}</h4>
              {assignment.assignmentType && (
                <Badge variant="secondary" className="text-xs">{assignment.assignmentType}</Badge>
              )}
              {assignment.className && (
                <Badge variant="outline" className="text-xs">{assignment.className}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{assignment.subject}</span>
              {assignment.gradeLevel && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{assignment.gradeLevel}</span>}
              {assignment.estimatedTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{assignment.estimatedTime}</span>}
              <span>{assignment.totalPoints} pts · {assignment.criteria.length} criteria</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isPushed && grade && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${grade.color}`} data-testid={`grade-${assignment.id}`}>{grade.letter}</p>
                <p className="text-xs text-muted-foreground">{assignment.evaluation!.overallScore}/{assignment.totalPoints}</p>
              </div>
            )}
            {!hasSubmitted && (
              <Button
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-open-assignment-${assignment.id}`}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? "Close" : "Start"}
              </Button>
            )}
            {hasSubmitted && !isPushed && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-view-submission-${assignment.id}`}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                View
              </Button>
            )}
            {isPushed && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => setExpanded(!expanded)}
                data-testid={`button-view-result-${assignment.id}`}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Full Feedback
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {assignment.studentInstructions && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Instructions
                </h5>
                <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {assignment.studentInstructions}
                </div>
              </div>
            )}

            {!hasSubmitted && (
              <>
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Your Answer
                  </h5>
                  <Textarea
                    placeholder="Write or paste your answer here…"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    className="resize-none"
                    data-testid={`textarea-answer-${assignment.id}`}
                  />
                </div>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!answer.trim() || submitMutation.isPending}
                  className="w-full gap-2"
                  data-testid={`button-submit-assignment-${assignment.id}`}
                >
                  {submitMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <><Send className="h-4 w-4" /> Submit Assignment</>
                  }
                </Button>
              </>
            )}

            {hasSubmitted && !isPushed && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Awaiting teacher review
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(assignment.submission!.submittedAt).toLocaleDateString()}
                </p>
                <div className="border-t border-border pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Your submission:</p>
                  <p className="text-sm whitespace-pre-wrap text-foreground/80">{assignment.submission!.content}</p>
                </div>
              </div>
            )}

            {isPushed && assignment.evaluation && (
              <div className="space-y-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium">Overall Feedback</p>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.evaluation.overallFeedback}</p>
                    </div>
                    {grade && (
                      <div className="text-right shrink-0">
                        <p className={`text-3xl font-bold ${grade.color}`}>{grade.letter}</p>
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 border-t border-border pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" /> Criteria Breakdown
                    </p>
                    {assignment.evaluation.criteriaScores.map((cs, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" data-testid={`criterion-score-${assignment.id}-${i}`}>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{cs.criterionName}:</span>{" "}
                          <span className="text-muted-foreground">{cs.feedback}</span>
                        </div>
                        <span className="shrink-0 font-medium">{cs.score}/{cs.maxPoints}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentAssignmentsContent() {
  const { data: assignments = [], isLoading } = useQuery<StudentAssignment[]>({
    queryKey: ["/api/student/assignments"],
  });

  const todo = assignments.filter(a => !a.submission);
  const submitted = assignments.filter(a => !!a.submission);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Assignments</h2>
        <p className="text-muted-foreground mt-1">
          Complete your assignments and view your results once your teacher reviews them.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="todo">
          <TabsList className="mb-4">
            <TabsTrigger value="todo" data-testid="tab-todo">
              To Do {todo.length > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{todo.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="submitted" data-testid="tab-submitted">
              Submitted {submitted.length > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{submitted.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo">
            {todo.length === 0 ? (
              <Card className="border-dashed border-border bg-muted/20">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-green-500/40 mb-3" />
                  <p className="text-muted-foreground font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">No pending assignments right now</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {todo.map(a => <AssignmentCard key={a.id} assignment={a} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted">
            {submitted.length === 0 ? (
              <Card className="border-dashed border-border bg-muted/20">
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No submissions yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Submit an assignment from the To Do tab</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {submitted.map(a => {
                  const isPushed = a.submission?.status === "pushed";
                  const pct = a.evaluation && a.totalPoints > 0
                    ? Math.round((a.evaluation.overallScore / a.totalPoints) * 100)
                    : null;
                  const grade = pct !== null ? letterGrade(pct) : null;
                  return (
                    <div key={a.id} className="relative">
                      {!isPushed && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <Badge variant="secondary" className="text-[10px] flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                            <Clock className="h-2.5 w-2.5" /> Awaiting Review
                          </Badge>
                        </div>
                      )}
                      {isPushed && grade && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <Badge className={`text-[10px] flex items-center gap-1 border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>
                            <CheckCircle2 className="h-2.5 w-2.5" /> Graded · {grade.letter} ({pct}%)
                          </Badge>
                        </div>
                      )}
                      <AssignmentCard assignment={a} />
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
