import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, CheckCircle, Lightbulb } from "lucide-react";
import type { Submission } from "@shared/schema";

type SubmissionWithAI = Submission & {
  aiScore?: number | null;
  aiAccuracy?: number | null;
  aiCompleteness?: number | null;
  aiCreativity?: number | null;
  aiFeedback?: string | null;
};

interface AIFeedbackPanelProps {
  submission: SubmissionWithAI;
}

export function AIFeedbackPanel({ submission }: AIFeedbackPanelProps) {
  if (submission.status === "pending") {
    return (
      <Card data-testid="ai-feedback-pending">
        <CardContent className="py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">AI evaluation in progress...</p>
        </CardContent>
      </Card>
    );
  }

  const scores = [
    { label: "Accuracy", value: submission.aiAccuracy || 0, icon: Target, color: "bg-chart-1" },
    { label: "Completeness", value: submission.aiCompleteness || 0, icon: CheckCircle, color: "bg-chart-2" },
    { label: "Creativity", value: submission.aiCreativity || 0, icon: Lightbulb, color: "bg-chart-4" },
  ];

  return (
    <Card data-testid="ai-feedback-panel">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
          <p className="text-4xl font-bold text-primary" data-testid="text-ai-score">
            {submission.aiScore || 0}
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>

        <div className="space-y-4">
          {scores.map((score) => (
            <div key={score.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <score.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{score.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{score.value}%</span>
              </div>
              <Progress value={score.value} className="h-2" />
            </div>
          ))}
        </div>

        {submission.aiFeedback && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Detailed Feedback</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-ai-feedback">
              {submission.aiFeedback}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
