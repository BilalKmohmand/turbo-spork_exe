import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatusBadge } from "@/components/status-badge";
import { AIFeedbackPanel } from "@/components/ai-feedback-panel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, Calendar, Send, Loader2, CheckCircle } from "lucide-react";
import type { Submission } from "@shared/schema";

type SubmissionExtended = Submission & {
  teacherScore?: number | null;
  teacherFeedback?: string | null;
  aiScore?: number | null;
  reviewedAt?: Date | string | null;
};

const evaluationFormSchema = z.object({
  teacherScore: z.number().min(0).max(100),
  teacherFeedback: z.string().min(10, "Please provide detailed feedback (at least 10 characters)"),
});

type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

export default function EvaluateSubmission() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submission, isLoading } = useQuery<SubmissionExtended>({
    queryKey: ["/api/submissions", id],
  });

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      teacherScore: 75,
      teacherFeedback: "",
    },
  });

  useEffect(() => {
    if (submission) {
      form.reset({
        teacherScore: submission.teacherScore ?? submission.aiScore ?? 75,
        teacherFeedback: submission.teacherFeedback ?? "",
      });
    }
  }, [submission, form]);

  const evaluateMutation = useMutation({
    mutationFn: async (data: EvaluationFormValues) => {
      const response = await apiRequest("POST", `/api/submissions/${id}/evaluate`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/all-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      toast({
        title: "Evaluation Submitted",
        description: "Your feedback has been saved successfully.",
      });
      navigate("/teacher/queue");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EvaluationFormValues) => {
    evaluateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
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
        <Link href="/teacher/queue">
          <Button variant="ghost">Back to queue</Button>
        </Link>
      </div>
    );
  }

  const isAlreadyReviewed = submission.status === "teacher_reviewed";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/teacher/queue">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {isAlreadyReviewed ? "Review Details" : "Evaluate Submission"}
            </h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Student Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[600px] overflow-y-auto" data-testid="text-submission-content">
              {submission.content}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <AIFeedbackPanel submission={submission} />
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {isAlreadyReviewed ? "Your Evaluation" : "Add Your Evaluation"}
            </CardTitle>
            <CardDescription>
              {isAlreadyReviewed 
                ? "Review your previous evaluation"
                : "Override AI score and add personalized feedback"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAlreadyReviewed ? (
              <div className="space-y-6">
                <div className="text-center p-4 bg-chart-2/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-4xl font-bold text-chart-2" data-testid="text-final-score">
                    {submission.teacherScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Your Feedback</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4" data-testid="text-teacher-feedback">
                    {submission.teacherFeedback}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />
                  Reviewed on {new Date(submission.reviewedAt!).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="teacherScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score</FormLabel>
                        <div className="text-center p-4 bg-muted/50 rounded-lg mb-4">
                          <p className="text-4xl font-bold text-primary" data-testid="text-score-preview">
                            {field.value}
                            <span className="text-lg text-muted-foreground">/100</span>
                          </p>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            max={100}
                            step={1}
                            data-testid="slider-score"
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teacherFeedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide detailed feedback for the student..."
                            className="min-h-32 resize-none"
                            {...field}
                            data-testid="textarea-feedback"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={evaluateMutation.isPending}
                    data-testid="button-submit-evaluation"
                  >
                    {evaluateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Evaluation
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
