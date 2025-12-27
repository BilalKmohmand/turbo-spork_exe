import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraphPanel } from "@/components/graph-panel";
import { renderMathText, SolutionStep } from "@/components/math-display";
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Send, 
  Camera,
  ImageIcon,
  ArrowRight,
  Zap,
  BookOpen,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw
} from "lucide-react";
import type { Message, GraphSpec } from "@shared/schema";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  aiSolution?: string;
  aiSteps?: string[];
  aiExplanation?: string;
  problemType?: "math" | "science" | "other";
  graphSpec?: GraphSpec;
  messages?: Message[];
}

export default function Home() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [textProblem, setTextProblem] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
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
      setUploadProgress(100);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to process image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const compressImage = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg" });
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
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

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setUploadProgress(10);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadProgress(30);

    try {
      const { base64, mimeType } = await compressImage(file);
      setUploadProgress(50);
      submitMutation.mutate({ base64, mimeType });
    } catch {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
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
    setUploadProgress(0);
  };

  const handleTextSubmit = () => {
    if (textProblem.trim()) {
      textMutation.mutate(textProblem.trim());
    }
  };

  const isLoading = submitMutation.isPending || textMutation.isPending || isUploading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {!result && !isLoading && (
          <div className="space-y-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Solve Any Problem Instantly
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Upload a photo or type your homework question. Get step-by-step solutions with visual graphs for math problems.
                </p>
              </div>
            </div>

            <Card className="border-2 shadow-xl">
              <CardContent className="p-8 space-y-6">
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
                  className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
                    dragActive 
                      ? "border-primary bg-primary/5 scale-[1.02]" 
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone"
                >
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        Drop your homework image here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 h-12"
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    data-testid="button-camera"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    data-testid="button-upload"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground font-medium">or type your problem</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Type or paste your math, science, or homework question here..."
                    value={textProblem}
                    onChange={(e) => setTextProblem(e.target.value)}
                    className="min-h-[120px] text-base resize-none"
                    data-testid="input-text-problem"
                  />
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!textProblem.trim()}
                    className="w-full h-12 text-base"
                    size="lg"
                    data-testid="button-solve-text"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Get Solution
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Instant Answers</p>
                  <p className="text-xs text-muted-foreground">Solutions in seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Step-by-Step</p>
                  <p className="text-xs text-muted-foreground">Clear explanations</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Visual Graphs</p>
                  <p className="text-xs text-muted-foreground">Math visualization</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <Card className="border-2 shadow-xl">
            <CardContent className="p-12 space-y-8">
              {previewUrl && (
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded homework" 
                    className="max-h-48 rounded-xl object-contain shadow-md"
                    data-testid="img-preview"
                  />
                </div>
              )}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">
                    AI is solving your problem...
                  </h2>
                  <p className="text-muted-foreground">
                    Analyzing and generating step-by-step solution
                  </p>
                </div>
                {uploadProgress > 0 && (
                  <div className="max-w-xs mx-auto">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {result && !isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Solution Ready</h2>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                data-testid="button-new-problem"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Problem
              </Button>
            </div>

            {previewUrl && (
              <div className="flex justify-center p-4 bg-muted/50 rounded-xl">
                <img 
                  src={previewUrl} 
                  alt="Your problem" 
                  className="max-h-32 rounded-lg object-contain"
                />
              </div>
            )}

            <Card className="border-2 shadow-xl overflow-visible">
              <CardContent className="p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
                    Final Answer
                  </h3>
                  <div className="p-6 bg-muted/30 rounded-xl" data-testid="text-solution">
                    <div className="text-xl font-medium leading-relaxed">
                      {renderMathText(result.aiSolution || "")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-thumbs-up">
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-thumbs-down">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-copy">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-regenerate">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {result.graphSpec && result.graphSpec.expressions.length > 0 && (
                  <div>
                    <GraphPanel graphSpec={result.graphSpec} />
                  </div>
                )}

                {result.aiSteps && result.aiSteps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                      Explanation
                    </h3>
                    <div className="space-y-6">
                      {result.aiSteps.map((step, index) => (
                        <div key={index} data-testid={`text-step-${index}`}>
                          <SolutionStep step={step} index={index} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.aiExplanation && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Key Concepts</h4>
                    <div className="text-sm leading-relaxed" data-testid="text-explanation">
                      {renderMathText(result.aiExplanation)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Have a follow-up question?
                </h3>
                {result.messages && result.messages.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {result.messages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-xl ${
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about this solution..."
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    className="min-h-[48px] max-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFollowUp();
                      }
                    }}
                    data-testid="input-followup"
                  />
                  <Button 
                    onClick={handleFollowUp}
                    disabled={!followUpQuestion.trim() || isAskingFollowUp}
                    size="icon"
                    className="h-12 w-12 flex-shrink-0"
                    data-testid="button-followup"
                  >
                    {isAskingFollowUp ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
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
