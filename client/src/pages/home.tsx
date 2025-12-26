import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Paperclip, Camera, X, FileText, Loader2, CheckCircle, Target, Lightbulb, Award } from "lucide-react";

interface AIResult {
  score: number;
  accuracy: number;
  completeness: number;
  creativity: number;
  feedback: string;
}

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
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
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

  const handleSubmit = async () => {
    let content = inputText.trim();

    if (attachedFile) {
      const fileContent = await attachedFile.text();
      content = content ? `${content}\n\n--- Attached File: ${attachedFile.name} ---\n${fileContent}` : fileContent;
    }

    if (!content) {
      toast({
        title: "Empty submission",
        description: "Please enter some text or attach a file.",
        variant: "destructive",
      });
      return;
    }

    setResult(null);
    submitMutation.mutate(content);
    setInputText("");
    setAttachedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 pb-32">
        <div className="max-w-3xl mx-auto">
          {!result && !submitMutation.isPending && (
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold mb-4">AI Assignment Evaluator</h1>
              <p className="text-muted-foreground text-lg mb-8">
                Submit your work and get instant AI feedback
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-xl mx-auto">
                <div className="flex flex-col items-center gap-2 p-4">
                  <FileText className="w-8 h-8 text-primary/60" />
                  <span>Type or paste text</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Paperclip className="w-8 h-8 text-primary/60" />
                  <span>Upload a file</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Camera className="w-8 h-8 text-primary/60" />
                  <span>Take a photo</span>
                </div>
              </div>
            </div>
          )}

          {(submitMutation.isPending || isPolling) && result?.status === "pending" && (
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="font-medium">Analyzing your submission...</span>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          )}

          {result && result.status !== "pending" && (
            <Card className="mb-4" data-testid="card-result">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Evaluation Complete</span>
                </div>

                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  <p className={`text-6xl font-bold ${getScoreColor(result.aiScore || 0)}`} data-testid="text-overall-score">
                    {result.aiScore}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Target className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold" data-testid="text-accuracy-score">{result.aiAccuracy}</p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Award className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold" data-testid="text-completeness-score">{result.aiCompleteness}</p>
                    <p className="text-xs text-muted-foreground">Completeness</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Lightbulb className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold" data-testid="text-creativity-score">{result.aiCreativity}</p>
                    <p className="text-xs text-muted-foreground">Creativity</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Feedback</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-feedback">
                    {result.aiFeedback}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setResult(null)}
                  data-testid="button-new-submission"
                >
                  Submit Another
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-3xl mx-auto">
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg w-fit">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{attachedFile.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setAttachedFile(null)}
                data-testid="button-remove-file"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.md,.py,.js,.ts,.java,.c,.cpp,.html,.css,.json"
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
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitMutation.isPending}
                data-testid="button-attach"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => cameraInputRef.current?.click()}
                disabled={submitMutation.isPending}
                data-testid="button-camera"
              >
                <Camera className="w-5 h-5" />
              </Button>
            </div>

            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your assignment here or upload a file..."
              className="flex-1 min-h-[52px] max-h-32 resize-none"
              disabled={submitMutation.isPending}
              data-testid="textarea-input"
            />

            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || (!inputText.trim() && !attachedFile)}
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to submit, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
