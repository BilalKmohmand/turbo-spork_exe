import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Camera, Loader2, CheckCircle, Target, Lightbulb, Award, RotateCcw } from "lucide-react";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  aiScore?: number;
  aiAccuracy?: number;
  aiCompleteness?: number;
  aiCreativity?: number;
  aiFeedback?: string;
}

export default function Home() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/submissions", {
        assignmentId: "general",
        studentName: "Student",
        content,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      setResult(data);
      setIsPolling(true);
      pollForResult(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pollForResult = async (id: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/submissions/${id}`);
        const data = await response.json();
        setResult(data);

        if (data.status === "ai_graded" || data.status === "teacher_reviewed") {
          setIsPolling(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setIsPolling(false);
        }
      } catch (error) {
        setIsPolling(false);
      }
    };

    poll();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    try {
      const content = await file.text();
      submitMutation.mutate(`File: ${file.name}\n\n${content}`);
    } catch {
      toast({
        title: "Error reading file",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    }

    e.target.value = "";
  };

  const handleReset = () => {
    setResult(null);
    setFileName(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10";
    if (score >= 60) return "bg-amber-500/10";
    return "bg-rose-500/10";
  };

  const isLoading = submitMutation.isPending || (isPolling && result?.status === "pending");

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6">
      <div className="w-full max-w-md">
        {!result && !isLoading && (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Award className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">AI Assignment Evaluator</h1>
              <p className="text-muted-foreground">
                Upload your work to get instant feedback
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.md,.py,.js,.ts,.java,.c,.cpp,.html,.css,.json,.pdf,.doc,.docx"
                data-testid="input-file"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                capture="environment"
                data-testid="input-camera"
              />

              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col gap-3 text-base"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                Upload File
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col gap-3 text-base"
                onClick={() => cameraInputRef.current?.click()}
                data-testid="button-camera"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                Take Photo
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Supports text files, code, documents, and images
            </p>
          </div>
        )}

        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Analyzing...</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {fileName || "Your submission"}
              </p>
              <div className="space-y-3 max-w-xs mx-auto">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.status !== "pending" && (
          <Card data-testid="card-result">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-2xl ${getScoreBg(result.aiScore || 0)} flex items-center justify-center`}>
                  <span className={`text-4xl font-bold ${getScoreColor(result.aiScore || 0)}`} data-testid="text-overall-score">
                    {result.aiScore}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Evaluation Complete
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-muted/40 rounded-xl">
                  <Target className="w-4 h-4 mx-auto mb-1.5 text-blue-500" />
                  <p className="text-lg font-bold" data-testid="text-accuracy-score">{result.aiAccuracy}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Accuracy</p>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-xl">
                  <Award className="w-4 h-4 mx-auto mb-1.5 text-purple-500" />
                  <p className="text-lg font-bold" data-testid="text-completeness-score">{result.aiCompleteness}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Complete</p>
                </div>
                <div className="text-center p-3 bg-muted/40 rounded-xl">
                  <Lightbulb className="w-4 h-4 mx-auto mb-1.5 text-amber-500" />
                  <p className="text-lg font-bold" data-testid="text-creativity-score">{result.aiCreativity}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Creative</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 mb-6">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Feedback</h3>
                <p className="text-sm leading-relaxed" data-testid="text-feedback">
                  {result.aiFeedback}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleReset}
                data-testid="button-new-submission"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Evaluate Another
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
