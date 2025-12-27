import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Send, 
  User, 
  Bot,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Zap
} from "lucide-react";
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
  const [problemText, setProblemText] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleSubmit = () => {
    if (!problemText.trim()) {
      toast({
        title: "Enter a problem",
        description: "Please type or paste your problem first.",
        variant: "destructive",
      });
      return;
    }
    setResult(null);
    submitMutation.mutate(problemText.trim());
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      toast({
        title: "Images not supported yet",
        description: "Please upload a text file or type your problem directly.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    try {
      const content = await file.text();
      setProblemText(content);
      toast({
        title: "File loaded",
        description: `Loaded "${file.name}" - review and click Get Solution.`,
      });
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
    setProblemText("");
    setFollowUpQuestion("");
  };

  const isLoading = submitMutation.isPending || (isPolling && result?.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
        {!result && !isLoading && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Solve Any Problem
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Type your math, science, or homework question and get a step-by-step solution instantly
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <Textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Type or paste your problem here...&#10;&#10;Examples:&#10;- Solve for x: 2x + 5 = 13&#10;- What is the derivative of x^2 + 3x?&#10;- Explain the water cycle"
                  className="min-h-[200px] text-base resize-none border-0 focus-visible:ring-0 bg-transparent"
                  data-testid="input-problem"
                />
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.md,.py,.js,.ts,.java,.c,.cpp,.html,.css,.json"
                    data-testid="input-file"
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="sm:w-auto"
                    data-testid="button-upload"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Text File
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!problemText.trim()}
                    className="flex-1 sm:flex-none"
                    size="lg"
                    data-testid="button-submit"
                  >
                    Get Solution
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span>Instant answers</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span>All subjects</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <span>Learn concepts</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <Card className="border-2">
            <CardContent className="p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary text-primary-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Solving your problem...</h2>
                <p className="text-muted-foreground">
                  Claude is analyzing and creating a step-by-step solution
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>This usually takes a few seconds</span>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.status !== "pending" && (
          <div className="space-y-6" data-testid="card-result">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold">Solution Ready</h2>
                  <p className="text-sm text-muted-foreground">Powered by Claude AI</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="button-new-submission"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Problem
              </Button>
            </div>

            <Card className="border-2">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Answer
                  </h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10" data-testid="text-solution">
                    <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">
                      {result.aiSolution}
                    </p>
                  </div>
                </div>

                {result.aiSteps && result.aiSteps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                      Step-by-Step Solution
                    </h3>
                    <div className="space-y-3">
                      {result.aiSteps.map((step, index) => (
                        <div 
                          key={index} 
                          className="flex gap-4"
                          data-testid={`text-step-${index}`}
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-relaxed pt-1 flex-1">{step}</p>
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
                    <div className="p-4 bg-muted/50 rounded-lg" data-testid="text-explanation">
                      <p className="text-sm leading-relaxed">
                        {result.aiExplanation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {result.messages && result.messages.length > 0 && (
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Follow-up Questions
                  </h3>
                  <div className="space-y-4">
                    {result.messages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-3 ${msg.role === "user" ? "" : ""}`}
                        data-testid={`message-${index}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === "user" ? "bg-muted" : "bg-primary/10"
                        }`}>
                          {msg.role === "user" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg ${
                          msg.role === "user" ? "bg-muted" : "bg-primary/5"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Input
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="Ask a follow-up question about the solution..."
                    onKeyDown={(e) => e.key === "Enter" && !isAskingFollowUp && handleFollowUp()}
                    disabled={isAskingFollowUp}
                    className="flex-1"
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
