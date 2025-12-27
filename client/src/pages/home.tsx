import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraphPanel } from "@/components/graph-panel";
import { renderMathText, SolutionStep } from "@/components/math-display";
import { 
  Loader2, 
  Send, 
  Paperclip,
  Plus,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Camera
} from "lucide-react";
import type { Message, GraphSpec, StepObject } from "@shared/schema";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  aiSolution?: string;
  aiSteps?: StepObject[];
  aiExplanation?: string;
  problemType?: "math" | "science" | "other";
  graphSpec?: GraphSpec;
  messages?: Message[];
}

export default function Home() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [textProblem, setTextProblem] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedProblem, setSubmittedProblem] = useState<string>("");
  const [lastProblem, setLastProblem] = useState<{ type: "text" | "image"; content: string; mimeType?: string }>({ type: "text", content: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    if (result?.aiSolution) {
      navigator.clipboard.writeText(result.aiSolution);
      toast({
        title: "Copied",
        description: "Solution copied to clipboard",
      });
    }
  };

  const handleFeedback = (positive: boolean) => {
    toast({
      title: positive ? "Thanks for the feedback!" : "Sorry about that",
      description: positive ? "Glad this helped!" : "We'll try to improve",
    });
  };

  const handleRegenerate = () => {
    if (lastProblem.type === "text" && lastProblem.content) {
      setResult(null);
      textMutation.mutate(lastProblem.content);
    } else if (lastProblem.type === "image" && lastProblem.content && lastProblem.mimeType) {
      setResult(null);
      setIsUploading(true);
      setUploadProgress(50);
      submitMutation.mutate({ base64: lastProblem.content, mimeType: lastProblem.mimeType });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 100);
  };

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
      scrollToBottom();
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
      scrollToBottom();
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
    setSubmittedProblem("");

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadProgress(30);

    try {
      const { base64, mimeType } = await compressImage(file);
      setUploadProgress(50);
      setLastProblem({ type: "image", content: base64, mimeType });
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
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      scrollToBottom();
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
    setSubmittedProblem("");
  };

  const handleTextSubmit = () => {
    if (textProblem.trim()) {
      const problem = textProblem.trim();
      setSubmittedProblem(problem);
      setPreviewUrl(null);
      setLastProblem({ type: "text", content: problem });
      textMutation.mutate(problem);
      setTextProblem("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (result) {
        handleFollowUp();
      } else {
        handleTextSubmit();
      }
    }
  };

  const isLoading = submitMutation.isPending || textMutation.isPending || isUploading;
  const hasConversation = result || isLoading || submittedProblem || previewUrl;

  return (
    <div 
      className="flex flex-col h-screen bg-background"
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
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
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {!hasConversation && (
          <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4">
            <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold px-2">
                  What can I help you solve?
                </h1>
              </div>
              
              <div className="bg-muted/50 rounded-2xl border p-3">
                <Textarea
                  placeholder="Type text, or add images by uploading, pasting, or dragging here"
                  value={textProblem}
                  onChange={(e) => setTextProblem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                  data-testid="input-main"
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 flex-1 sm:flex-none"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-image-upload"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="hidden xs:inline">Image / PDF</span>
                      <span className="xs:hidden">Upload</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 flex-1 sm:flex-none"
                      onClick={() => cameraInputRef.current?.click()}
                      data-testid="button-camera"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden xs:inline">Take Photo</span>
                      <span className="xs:hidden">Camera</span>
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2 rounded-xl px-4 w-full sm:w-auto"
                    onClick={handleTextSubmit}
                    disabled={!textProblem.trim()}
                    data-testid="button-solve"
                  >
                    <Send className="w-4 h-4" />
                    <span>Solve</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasConversation && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {(submittedProblem || previewUrl) && (
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Uploaded problem" 
                      className="max-h-48 rounded-lg mb-2"
                      data-testid="img-preview"
                    />
                  )}
                  {submittedProblem && (
                    <p className="text-sm whitespace-pre-wrap">{submittedProblem}</p>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 bg-muted rounded-2xl rounded-tl-md p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Solving your problem...</span>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden max-w-xs">
                      <div 
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && !isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 space-y-6 overflow-visible">
                  <div>
                    <h3 className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                      Final Answer
                    </h3>
                    <div className="p-4 bg-muted/50 rounded-xl" data-testid="text-solution">
                      <div className="text-lg font-medium">
                        {renderMathText(result.aiSolution || "")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFeedback(true)} data-testid="button-thumbs-up">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFeedback(false)} data-testid="button-thumbs-down">
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} data-testid="button-copy">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRegenerate} disabled={isLoading} data-testid="button-regenerate">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {result.graphSpec && result.graphSpec.expressions.length > 0 && (
                    <GraphPanel graphSpec={result.graphSpec} />
                  )}

                  {result.aiSteps && result.aiSteps.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-4">
                        Explanation
                      </h3>
                      <div className="space-y-5">
                        {result.aiSteps.map((step, index) => (
                          <div key={index} data-testid={`text-step-${index}`}>
                            <SolutionStep step={step} index={index} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.aiExplanation && (
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Concepts</h4>
                      <div className="text-sm leading-relaxed" data-testid="text-explanation">
                        {renderMathText(result.aiExplanation)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result?.messages && result.messages.length > 0 && (
              <div className="space-y-4">
                {result.messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "gap-3"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted rounded-tl-md"
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">
                        {renderMathText(msg.content)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {hasConversation && (
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {result && (
              <div className="flex justify-center mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2"
                  data-testid="button-new-problem"
                >
                  <Plus className="w-4 h-4" />
                  New Problem
                </Button>
              </div>
            )}
            
            <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                data-testid="button-attach"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <Textarea
                placeholder="Ask a follow-up question..."
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUp();
                  }
                }}
                className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                rows={1}
                disabled={isLoading}
                data-testid="input-chat"
              />
              
              <Button
                size="icon"
                className="h-10 w-10 flex-shrink-0 rounded-xl"
                onClick={handleFollowUp}
                disabled={isLoading || !followUpQuestion.trim()}
                data-testid="button-send"
              >
                {isLoading || isAskingFollowUp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-3">
              AI Homework Solver can make mistakes. Verify important answers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
