import { useState, useRef, useCallback } from "react";
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
  Upload,
  FileText,
  X,
  Award,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import ClassSelector from "./class-selector";

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
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  studentName: string;
  evaluatedAt: string;
}

const ACCEPT_TYPES = ".pdf,.doc,.docx,.txt,.rtf,.csv,.json,.xml,.md";

export default function EvaluateContent() {
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: "", description: "", maxPoints: 20 },
  ]);
  const [studentName, setStudentName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process file");
      }
      return res.json();
    },
    onSuccess: (data: { text: string; fileName: string; notice?: string }) => {
      setUploadedFileName(data.fileName);
      if (data.notice || !data.text) {
        setContent("");
        toast({ title: "Notice", description: data.notice || "File uploaded but no readable content found.", variant: "destructive" });
      } else {
        setContent(data.text);
        toast({ title: "File loaded", description: `Extracted text from ${data.fileName}` });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quick-evaluate", {
        criteria: criteria.filter((c) => c.name.trim()),
        studentName: studentName.trim() || "Student",
        content,
        ...(selectedClassId && selectedClassId !== "all" ? { classId: selectedClassId } : {}),
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

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setContent("");
  };

  const totalPoints = criteria.reduce((s, c) => s + (c.maxPoints || 0), 0);
  const isValid =
    criteria.some((c) => c.name.trim() && c.maxPoints > 0) && content.trim();

  const resetAll = () => {
    setResult(null);
    setCriteria([{ name: "", description: "", maxPoints: 20 }]);
    setStudentName("");
    setContent("");
    setUploadedFileName(null);
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
          Set your criteria, upload student work, and get instant AI-powered evaluation
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
        <div className="space-y-5">
          <Card className="border-border/50 overflow-visible">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <Label className="font-semibold text-sm">Evaluation Criteria</Label>
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  {totalPoints} pts total
                </Badge>
              </div>

              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div
                    key={i}
                    className="group relative flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-muted/20 transition-colors"
                    data-testid={`criterion-row-${i}`}
                  >
                    <div className="flex items-center justify-center w-6 h-9 text-muted-foreground/40 flex-shrink-0">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={c.name}
                          onChange={(e) => updateCriterion(i, "name", e.target.value)}
                          placeholder="Criterion name (e.g., Grammar, Thesis, Evidence)"
                          className="border-border/40 bg-background"
                          data-testid={`input-criterion-name-${i}`}
                        />
                        <div className="relative w-24 flex-shrink-0">
                          <Input
                            type="number"
                            value={c.maxPoints}
                            onChange={(e) =>
                              updateCriterion(i, "maxPoints", parseInt(e.target.value) || 0)
                            }
                            className="pr-7 border-border/40 bg-background"
                            data-testid={`input-criterion-points-${i}`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            pts
                          </span>
                        </div>
                      </div>
                      <Input
                        value={c.description}
                        onChange={(e) => updateCriterion(i, "description", e.target.value)}
                        placeholder="What should this evaluate? (optional)"
                        className="text-sm border-border/40 bg-background"
                        data-testid={`input-criterion-desc-${i}`}
                      />
                    </div>
                    {criteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriterion(i)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ visibility: "visible" }}
                        data-testid={`button-remove-criterion-${i}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addCriterion}
                className="w-full gap-2 mt-3 border-dashed border-border/60"
                data-testid="button-add-criterion"
              >
                <Plus className="w-4 h-4" /> Add Criterion
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 overflow-visible">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <Label className="font-semibold text-sm">Student Work</Label>
              </div>

              <div className="mb-3">
                <ClassSelector
                  selectedClassId={selectedClassId}
                  onClassChange={setSelectedClassId}
                  showAllOption
                  placeholder="Select class (optional)"
                />
              </div>

              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name (optional)"
                className="mb-3 border-border/40"
                data-testid="input-student-name"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_TYPES}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />

              <div className="space-y-3">
                {uploadedFileName && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex-1 truncate">
                      {uploadedFileName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearFile}
                      className="w-6 h-6 flex-shrink-0"
                      data-testid="button-clear-file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste student's work here… or upload a file below."
                  className="min-h-[160px] resize-none border-border/40"
                  data-testid="input-student-work"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border/60 hover:border-emerald-300 hover:bg-muted/30"
                  }`}
                  data-testid="dropzone-upload"
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      <p className="text-sm font-medium">Extracting text...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      <p className="text-sm">
                        {uploadedFileName ? "Upload different file" : "Or drop a file here (PDF, Word, TXT)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => evaluateMutation.mutate()}
            disabled={!isValid || evaluateMutation.isPending}
            className="w-full gap-2 h-12 text-base bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20 border-0"
            data-testid="button-evaluate"
          >
            {evaluateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
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
  const gradeLabel =
    scorePercent >= 90
      ? "Excellent"
      : scorePercent >= 80
        ? "Great"
        : scorePercent >= 70
          ? "Good"
          : scorePercent >= 60
            ? "Satisfactory"
            : "Needs Improvement";

  return (
    <div className="space-y-4">
      <Card className={`border-0 bg-gradient-to-br ${scoreGradient} text-white shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-90">
                  {result.studentName}
                </span>
              </div>
              <p className="text-3xl font-bold" data-testid="text-overall-score">
                {result.overallScore}/{result.totalMaxPoints}
              </p>
              <Badge className="mt-2 bg-white/20 text-white border-0 no-default-hover-elevate no-default-active-elevate">
                {gradeLabel}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold tracking-tight" data-testid="text-score-percent">
                {scorePercent}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Score Breakdown</h3>
          </div>
          <div className="space-y-4">
            {result.scores.map((s, i) => {
              const pct =
                s.maxPoints > 0 ? Math.round((s.score / s.maxPoints) * 100) : 0;
              const barColor =
                pct >= 80
                  ? "bg-emerald-500"
                  : pct >= 60
                    ? "bg-amber-500"
                    : "bg-red-500";
              const textColor =
                pct >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : pct >= 60
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400";

              return (
                <div key={i} data-testid={`score-criterion-${i}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className={`text-sm font-bold ${textColor}`}>
                      {s.score}/{s.maxPoints}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.feedback}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {result.summary && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <h3 className="font-semibold text-sm">Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-summary">
              {result.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {result.strengths?.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Strengths</h3>
            </div>
            <ul className="space-y-2" data-testid="list-strengths">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.weaknesses?.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Weaknesses</h3>
            </div>
            <ul className="space-y-2" data-testid="list-weaknesses">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.suggestions?.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Suggestions for Improvement</h3>
            </div>
            <ul className="space-y-2" data-testid="list-suggestions">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
