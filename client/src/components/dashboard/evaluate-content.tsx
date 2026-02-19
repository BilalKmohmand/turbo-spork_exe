import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Target,
} from "lucide-react";

interface Criterion {
  name: string;
  description: string;
  maxPoints: number;
}

interface ScoreResult {
  name: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface EvalResult {
  scores: ScoreResult[];
  overallScore: number;
  totalMaxPoints: number;
  overallFeedback: string;
  studentName: string;
  evaluatedAt: string;
}

export default function EvaluateContent() {
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: "", description: "", maxPoints: 20 },
  ]);
  const [studentName, setStudentName] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<EvalResult | null>(null);
  const { toast } = useToast();

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quick-evaluate", {
        criteria: criteria.filter((c) => c.name.trim()),
        studentName: studentName.trim() || "Student",
        content,
      });
      return res.json();
    },
    onSuccess: (data: EvalResult) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addCriterion = () =>
    setCriteria([...criteria, { name: "", description: "", maxPoints: 20 }]);

  const removeCriterion = (i: number) =>
    setCriteria(criteria.filter((_, idx) => idx !== i));

  const updateCriterion = (i: number, field: keyof Criterion, value: string | number) => {
    const updated = [...criteria];
    (updated[i] as any)[field] = value;
    setCriteria(updated);
  };

  const totalPoints = criteria.reduce((s, c) => s + (c.maxPoints || 0), 0);
  const isValid =
    criteria.some((c) => c.name.trim() && c.maxPoints > 0) && content.trim();

  const resetAll = () => {
    setResult(null);
    setCriteria([{ name: "", description: "", maxPoints: 20 }]);
    setStudentName("");
    setContent("");
  };

  const scorePercent =
    result && result.totalMaxPoints > 0
      ? Math.round((result.overallScore / result.totalMaxPoints) * 100)
      : 0;

  const scoreGradient =
    scorePercent >= 80
      ? "from-emerald-600 to-teal-600"
      : scorePercent >= 60
        ? "from-amber-500 to-orange-500"
        : "from-red-500 to-orange-500";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
          <ClipboardCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" data-testid="text-evaluator-title">
          AI Evaluator
        </h1>
        <p className="text-muted-foreground">
          Add your criteria, paste student work, and let AI evaluate it
        </p>
      </div>

      {result ? (
        <ResultView
          result={result}
          scorePercent={scorePercent}
          scoreGradient={scoreGradient}
          onReset={resetAll}
        />
      ) : (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Evaluation Criteria</Label>
                <Badge variant="outline" className="text-xs">
                  Total: {totalPoints} pts
                </Badge>
              </div>

              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2"
                    data-testid={`criterion-row-${i}`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={c.name}
                          onChange={(e) => updateCriterion(i, "name", e.target.value)}
                          placeholder="Criterion name (e.g., Grammar)"
                          data-testid={`input-criterion-name-${i}`}
                        />
                        <Input
                          type="number"
                          value={c.maxPoints}
                          onChange={(e) =>
                            updateCriterion(i, "maxPoints", parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                          placeholder="Pts"
                          data-testid={`input-criterion-points-${i}`}
                        />
                      </div>
                      <Input
                        value={c.description}
                        onChange={(e) => updateCriterion(i, "description", e.target.value)}
                        placeholder="Optional: What should this criterion evaluate?"
                        className="text-sm"
                        data-testid={`input-criterion-desc-${i}`}
                      />
                    </div>
                    {criteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriterion(i)}
                        className="mt-0.5 flex-shrink-0"
                        data-testid={`button-remove-criterion-${i}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addCriterion}
                className="w-full gap-2"
                data-testid="button-add-criterion"
              >
                <Plus className="w-4 h-4" /> Add Criterion
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5 space-y-3">
              <Label className="font-semibold">Student Work</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name (optional)"
                data-testid="input-student-name"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste student's work here..."
                className="min-h-[180px] resize-none"
                data-testid="input-student-work"
              />
            </CardContent>
          </Card>

          <Button
            onClick={() => evaluateMutation.mutate()}
            disabled={!isValid || evaluateMutation.isPending}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-evaluate"
          >
            {evaluateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Evaluate with AI
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ResultView({
  result,
  scorePercent,
  scoreGradient,
  onReset,
}: {
  result: EvalResult;
  scorePercent: number;
  scoreGradient: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className={`border-0 bg-gradient-to-br ${scoreGradient} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">
                  {result.studentName}
                </span>
              </div>
              <p className="text-3xl font-bold" data-testid="text-overall-score">
                {result.overallScore}/{result.totalMaxPoints}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold" data-testid="text-score-percent">
                {scorePercent}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            {result.scores.map((s, i) => {
              const pct =
                s.maxPoints > 0 ? Math.round((s.score / s.maxPoints) * 100) : 0;
              const barColor =
                pct >= 80
                  ? "bg-emerald-500"
                  : pct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500";

              return (
                <div key={i} data-testid={`score-criterion-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-sm font-bold">
                      {s.score}/{s.maxPoints}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.feedback}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Overall Feedback</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-overall-feedback">
            {result.overallFeedback}
          </p>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={onReset}
        className="w-full gap-2"
        data-testid="button-new-evaluation"
      >
        <RotateCcw className="w-4 h-4" />
        New Evaluation
      </Button>
    </div>
  );
}
