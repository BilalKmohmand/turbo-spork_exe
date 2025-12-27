import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Camera,
  ImageIcon,
  Type
} from "lucide-react";
import type { Message } from "@shared/schema";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  extractedText?: string;
  aiSolution?: string;
  aiSteps?: string[];
  aiExplanation?: string;
  messages?: Message[];
}

export default function Home() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [textProblem, setTextProblem] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const textMutation = useMutation({
    mutationFn: async (problem: string) => {
      const response = await apiRequest("POST", "/api/solve-text", { problem });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to solve");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setTextProblem("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to solve problem.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
      const response = await apiRequest("POST", "/api/solve-image", {
        image: base64,
        mimeType,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to solve");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      setResult(data);
      setIsUploading(false);
      setIsPolling(false);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to process image. Please try again.",
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      submitMutation.mutate({ base64, mimeType: file.type });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to read image. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

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
    setPreviewUrl(null);
    setFollowUpQuestion("");
    setTextProblem("");
  };

  const handleTextSubmit = () => {
    if (textProblem.trim()) {
      textMutation.mutate(textProblem.trim());
    }
  };

  const isLoading = submitMutation.isPending || textMutation.isPending || isUploading || (isPolling && result?.status === "pending");

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
                Snap & Solve
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Take a photo of your homework and get step-by-step solutions instantly
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
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

            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="dropzone"
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop your homework image here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or use the buttons below
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={() => cameraInputRef.current?.click()}
                    data-testid="button-camera"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Supports JPG, PNG, HEIC and other image formats up to 10MB
            </p>

            <div className="relative flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground px-2">or type your problem</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="Type or paste your homework problem here..."
                value={textProblem}
                onChange={(e) => setTextProblem(e.target.value)}
                className="min-h-[120px] text-base"
                data-testid="input-text-problem"
              />
              <Button
                onClick={handleTextSubmit}
                disabled={!textProblem.trim()}
                className="w-full"
                size="lg"
                data-testid="button-solve-text"
              >
                <Type className="w-5 h-5 mr-2" />
                Solve Problem
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <Card className="border-2">
            <CardContent className="p-8 space-y-6">
              {previewUrl && (
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded homework" 
                    className="max-h-48 rounded-lg object-contain"
                    data-testid="img-preview"
                  />
                </div>
              )}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {isPolling ? "Claude is solving..." : "Reading your image..."}
                  </h2>
                  <p className="text-muted-foreground">
                    {isPolling 
                      ? "Creating a step-by-step solution" 
                      : "Extracting text and equations"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.status !== "pending" && (
          <div className="space-y-6" data-testid="card-result">
            <div className="flex items-center justify-between gap-4 flex-wrap">
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

            {previewUrl && (
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Your problem" 
                  className="max-h-32 rounded-lg object-contain"
                />
              </div>
            )}

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
                        className="flex gap-3"
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
