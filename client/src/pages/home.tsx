import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Camera, Loader2, CheckCircle, RotateCcw, Sparkles, BookOpen, Zap, Send, MessageCircle, User, Bot } from "lucide-react";
import type { Message } from "@shared/schema";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  aiSolution?: string;
  aiSteps?: string[];
  aiExplanation?: string;
  messages?: Message[];
}

export default function Home() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
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
    const maxAttempts = 60;
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

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !result?.id) return;

    setIsAskingFollowUp(true);
    try {
      const response = await apiRequest("POST", `/api/submissions/${result.id}/followup`, {
        question: followUpQuestion.trim(),
      });
      const data = await response.json();
      setResult(prev => prev ? { ...prev, messages: data.messages } : prev);
      setFollowUpQuestion("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to ask follow-up question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFileName(null);
    setFollowUpQuestion("");
  };

  const isLoading = submitMutation.isPending || (isPolling && result?.status === "pending");

  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/30">
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
        <div className="w-full max-w-lg">
          {!result && !isLoading && (
            <div className="text-center">
              <div className="mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-3">
                  Solve Any Problem
                </h1>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Upload your homework and get step-by-step solutions instantly
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".txt,.md,.py,.js,.ts,.java,.c,.cpp,.html,.css,.json,.pdf,.doc,.docx,image/*"
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

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                  data-testid="button-upload"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Upload File</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, TXT, Code</p>
                  </div>
                </button>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                  data-testid="button-camera"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Camera className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Take Photo</p>
                    <p className="text-xs text-muted-foreground mt-1">Snap your homework</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Instant results
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  All subjects
                </span>
              </div>
            </div>
          )}

          {isLoading && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70">
                  <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Solving your problem...</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  {fileName || "Analyzing your submission"}
                </p>
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <Skeleton className="h-3 flex-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse" />
                    </div>
                    <Skeleton className="h-3 flex-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    </div>
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && result.status !== "pending" && (
            <div className="space-y-4" data-testid="card-result">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                  <div className="flex items-center gap-3 text-primary-foreground">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Solution Ready</p>
                      <p className="text-sm opacity-90">Step-by-step breakdown below</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Answer
                    </h3>
                    <div className="p-4 bg-accent/50 rounded-xl" data-testid="text-solution">
                      <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">
                        {result.aiSolution}
                      </p>
                    </div>
                  </div>

                  {result.aiSteps && result.aiSteps.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Step-by-Step Solution
                      </h3>
                      <div className="space-y-3">
                        {result.aiSteps.map((step, index) => (
                          <div 
                            key={index} 
                            className="flex gap-4 p-4 bg-muted/40 rounded-xl"
                            data-testid={`text-step-${index}`}
                          >
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{index + 1}</span>
                            </div>
                            <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.aiExplanation && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Key Concepts
                      </h3>
                      <div className="p-4 bg-muted/40 rounded-xl border-l-4 border-primary" data-testid="text-explanation">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {result.aiExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.messages && result.messages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Follow-up Questions
                      </h3>
                      <div className="space-y-3">
                        {result.messages.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex gap-3 p-4 rounded-xl ${
                              msg.role === "user" ? "bg-primary/10" : "bg-muted/40"
                            }`}
                            data-testid={`message-${index}`}
                          >
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                              msg.role === "user" ? "bg-primary/20" : "bg-accent"
                            }`}>
                              {msg.role === "user" ? (
                                <User className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm leading-relaxed pt-0.5 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Ask a Follow-up
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        placeholder="Ask anything about the solution..."
                        onKeyDown={(e) => e.key === "Enter" && !isAskingFollowUp && handleFollowUp()}
                        disabled={isAskingFollowUp}
                        data-testid="input-followup"
                      />
                      <Button
                        size="icon"
                        onClick={handleFollowUp}
                        disabled={!followUpQuestion.trim() || isAskingFollowUp}
                        data-testid="button-ask-followup"
                      >
                        {isAskingFollowUp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleReset}
                data-testid="button-new-submission"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Solve Another Problem
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
