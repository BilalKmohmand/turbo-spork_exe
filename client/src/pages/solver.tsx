import { useState, useRef, useCallback } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { GraphPanel } from "@/components/graph-panel";
import { renderMathText } from "@/components/math-display";
import { BlockMath } from "react-katex";
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
  Camera,
  Brain,
  LogOut,
  User
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Message, GraphSpec, StepObject, QuestionObject } from "@shared/schema";

interface SubmissionResult {
  id: string;
  content: string;
  status: string;
  aiSolution?: string;
  aiSteps?: StepObject[];
  aiExplanation?: string;
  problemType?: "math" | "science" | "other" | "chat";
  isChat?: boolean;
  graphSpec?: GraphSpec;
  messages?: Message[];
  questions?: QuestionObject[];
  rawText?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Solver() {
  const { isLoading: authLoading, isAuthenticated } = useAuth(true);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [textProblem, setTextProblem] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submittedProblem, setSubmittedProblem] = useState<string>("");
  const [lastProblem, setLastProblem] = useState<{ type: "text" | "image"; content: string; mimeType?: string }>({ type: "text", content: "" });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setLocation("/");
    } catch {
      setLocation("/");
    }
  };

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

  const solveWithStreaming = async (problem: string) => {
    setIsStreaming(true);
    setStreamingText("");
    
    try {
      const response = await fetch("/api/solve-text-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, history: chatHistory }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(line => line.startsWith("data: "));
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                fullText += data.token;
                setStreamingText(fullText);
                scrollToBottom();
              }
              if (data.done && data.result) {
                // Parse final result
                const r = data.result;
                if (r.type === "graph") {
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    status: "completed",
                    aiSolution: r.aiSolution || r.message,
                    graphSpec: r.graphSpec,
                    problemType: "math",
                  });
                  setChatHistory(prev => [...prev, 
                    { role: "user", content: problem },
                    { role: "assistant", content: r.message }
                  ]);
                } else if (r.type === "chat") {
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    status: "completed",
                    aiSolution: r.message,
                    isChat: true,
                    problemType: "chat",
                  });
                  setChatHistory(prev => [...prev, 
                    { role: "user", content: problem },
                    { role: "assistant", content: r.message }
                  ]);
                } else if (r.type === "problem" || r.aiSolution) {
                  // Handle regular math problems
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    status: "completed",
                    aiSolution: r.aiSolution || r.rawText,
                    problemType: "math",
                  });
                  setChatHistory(prev => [...prev, 
                    { role: "user", content: problem },
                    { role: "assistant", content: r.aiSolution || r.rawText }
                  ]);
                } else if (r.questions) {
                  const solution = r.questions.map((q: any) => `**Question ${q.questionNumber}**\n${q.answer}`).join("\n\n");
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    status: "completed",
                    aiSolution: solution,
                    questions: r.questions,
                    problemType: r.problemType || "math",
                  });
                  setChatHistory(prev => [...prev, 
                    { role: "user", content: problem },
                    { role: "assistant", content: solution }
                  ]);
                }
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to solve problem.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const textMutation = useMutation({
    mutationFn: async (problem: string) => {
      const response = await apiRequest("POST", "/api/solve-text", { problem, history: chatHistory });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to solve");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      // Save to chat history
      const aiResponse = data.aiSolution || data.questions?.map((q: any) => `Q${q.questionNumber}: ${q.answer}`).join(", ") || "Solution provided";
      setChatHistory(prev => [...prev, 
        { role: "user", content: submittedProblem },
        { role: "assistant", content: aiResponse }
      ]);
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

  // Streaming function for images - shows actual AI response token by token
  const solveImageWithStreaming = async (base64: string, mimeType: string) => {
    setIsStreaming(true);
    setStreamingText("");
    setResult(null);
    setSubmittedProblem("PDF uploaded for analysis");
    setIsUploading(false);
    
    try {
      const response = await fetch("/api/solve-image-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.redirect === "text" && data.problem) {
                  setIsStreaming(false);
                  solveWithStreaming(data.problem);
                  return;
                }
                
                if (data.token) {
                  fullText += data.token;
                  setStreamingText(fullText);
                  scrollToBottom();
                }
                
                if (data.done) {
                  // Set final result with all the streamed text
                  setResult({ 
                    id: data.result?.id || "",
                    content: "Image problem",
                    status: "ai_graded",
                    aiSolution: fullText, 
                    rawText: fullText,
                    isChat: false,
                    ...(data.result || {})
                  });
                }
                
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch {
                // Ignore parse errors during streaming
              }
            }
          }
        }
        
        // If we got text but no explicit done message, still show it
        if (fullText) {
          setResult({ 
            id: "", 
            content: "Image problem", 
            status: "ai_graded",
            aiSolution: fullText, 
            rawText: fullText, 
            isChat: false 
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const submitMutation = useMutation({
    mutationFn: async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
      // Use streaming instead
      solveImageWithStreaming(base64, mimeType);
      return null;
    },
    onSuccess: async () => {
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
        // Smaller size = faster upload & AI processing
        const maxDim = 1000;
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
        
        // Lower quality = smaller file = faster
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg" });
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith("image/") || 
                    /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif)$/i.test(file.name);
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isWord = file.type === "application/msword" || 
                   file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                   file.name.endsWith(".doc") || file.name.endsWith(".docx");
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    
    if (!isImage && !isPDF && !isWord && !isText) {
      toast({
        title: "Invalid file",
        description: "Please upload an image, PDF, Word document, or text file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setUploadProgress(10);
    setSubmittedProblem("");

    const url = URL.createObjectURL(file);
    setPreviewUrl(isPDF ? null : url);
    setUploadProgress(30);

    try {
      let base64: string;
      let mimeType: string;
      
      if (isText) {
        // For text files, read as text and solve directly
        const text = await file.text();
        if (text.trim()) {
          setIsUploading(false);
          setUploadProgress(0);
          setLastProblem({ type: "text", content: text.trim() });
          solveWithStreaming(text.trim());
          return;
        } else {
          throw new Error("Text file is empty");
        }
      } else if (isPDF) {
        // For PDFs, read as base64 directly
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
        mimeType = "application/pdf";
      } else if (isWord) {
        // For Word documents, read as base64
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
        mimeType = file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        // For images, compress and convert
        const result = await compressImage(file);
        base64 = result.base64;
        mimeType = result.mimeType;
      }
      
      setUploadProgress(50);
      setLastProblem({ type: "image", content: base64, mimeType });
      submitMutation.mutate({ base64, mimeType });
    } catch {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
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
    if (!followUpQuestion.trim() || !result || isAskingFollowUp) return;

    const userQuestion = followUpQuestion.trim();
    setFollowUpQuestion("");
    setIsAskingFollowUp(true);
    
    // Get existing messages before adding new ones
    const existingMessages = result.messages || [];
    
    // Add user message immediately
    const messagesWithUser = [...existingMessages, { role: "user" as const, content: userQuestion }];
    setResult(prev => prev ? { ...prev, messages: messagesWithUser } : prev);
    scrollToBottom();
    
    try {
      // Check if we have a real database ID (small numbers from serial primary key)
      const hasRealDatabaseId = result.id && !isNaN(Number(result.id)) && Number(result.id) < 1000000;
      
      if (hasRealDatabaseId) {
        const response = await apiRequest("POST", `/api/submissions/${result.id}/followup`, {
          question: userQuestion,
        });
        const data = await response.json();
        setResult(prev => prev ? { ...prev, messages: data.messages } : prev);
      } else {
        // For image results without ID, use text streaming with context
        const context = result.rawText || result.aiSolution || "";
        
        const response = await fetch("/api/solve-text-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            problem: userQuestion,
            history: [
              { role: "assistant", content: context },
              { role: "user", content: userQuestion }
            ]
          }),
        });
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = "";
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.token) {
                    aiResponse += data.token;
                    // Update with streaming response - keep user message, update AI response
                    setResult(prev => prev ? {
                      ...prev,
                      messages: [
                        ...messagesWithUser,
                        { role: "assistant" as const, content: aiResponse }
                      ]
                    } : prev);
                    scrollToBottom();
                  }
                } catch {}
              }
            }
          }
        }
        
        // Set final messages
        if (aiResponse) {
          setResult(prev => prev ? {
            ...prev,
            messages: [
              ...messagesWithUser,
              { role: "assistant" as const, content: aiResponse }
            ]
          } : prev);
        }
      }
      scrollToBottom();
    } catch {
      toast({
        title: "Error",
        description: "Failed to ask follow-up question. Please try again.",
        variant: "destructive",
      });
      // Remove the user message on error
      setResult(prev => prev ? { ...prev, messages: existingMessages } : prev);
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
    setIsUploading(false);
    setChatHistory([]);
  };

  const handleTextSubmit = () => {
    if (textProblem.trim()) {
      const problem = textProblem.trim();
      setSubmittedProblem(problem);
      setPreviewUrl(null);
      setResult(null);
      setLastProblem({ type: "text", content: problem });
      solveWithStreaming(problem);
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

  const isLoading = submitMutation.isPending || textMutation.isPending || isUploading || isStreaming;
  const hasConversation = result || isLoading || submittedProblem || previewUrl;

  return (
    <div 
      className="flex flex-col h-screen bg-background"
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Header with navigation */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
            <img src={logoPath} alt="TheHighGrader" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg">TheHighGrader™</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" data-testid="link-pricing">Pricing</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.heif,.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
        data-testid="input-file"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.heic,.heif"
        capture="environment"
        data-testid="input-camera"
      />

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto relative"
      >
        {!hasConversation && (
          <div className="flex items-center justify-center min-h-full px-3 sm:px-4 py-8">
            <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold px-2">
                  What can I help you solve?
                </h1>
                <p className="text-muted-foreground">
                  Upload a photo or type your problem to get step-by-step solutions
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-2xl border p-3">
                <Textarea
                  placeholder="Type your math, science, or homework question here..."
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
                    className="gap-2 rounded-xl px-4 w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600"
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
          <div className="max-w-3xl mx-auto px-4 py-6 pb-4 space-y-6">
            {/* Previous Chat History */}
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === "user" 
                    ? "bg-violet-600 text-white rounded-tr-md" 
                    : "bg-muted rounded-tl-md"
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Current User's Message Bubble */}
            {(submittedProblem || previewUrl) && (
              <div className="flex gap-3 justify-end" data-testid="user-problem-section">
                <div className="max-w-[85%] space-y-3">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Uploaded problem" 
                      className="max-h-64 rounded-lg border ml-auto"
                      data-testid="img-preview"
                    />
                  )}
                  {submittedProblem && (
                    <div className="bg-violet-600 text-white rounded-2xl rounded-tr-md p-4">
                      <p className="whitespace-pre-wrap leading-relaxed">{submittedProblem}</p>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-muted rounded-2xl rounded-tl-md p-4">
                  {streamingText ? (
                    <div className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                      {renderMathText(streamingText)}
                      <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle">&#8203;</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Solving your problem...</span>
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3 h-1.5 bg-background rounded-full overflow-hidden max-w-xs">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && !isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 space-y-4 overflow-visible">
                  {/* Chat Response - Simple Message */}
                  {result.isChat ? (
                    <div className="bg-muted rounded-2xl rounded-tl-md p-4">
                      <p className="text-foreground leading-relaxed">{result.aiSolution}</p>
                    </div>
                  ) : (
                  /* AI Response Bubble - Problem Solutions */
                  <div className="bg-muted rounded-2xl rounded-tl-md p-5 space-y-6">
                    {/* Feedback buttons */}
                    <div className="flex items-center gap-0.5 border-b pb-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleFeedback(true)} data-testid="button-thumbs-up">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleFeedback(false)} data-testid="button-thumbs-down">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCopy} data-testid="button-copy">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleRegenerate} disabled={isLoading} data-testid="button-regenerate">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {result.graphSpec && result.graphSpec.expressions.length > 0 && (
                      <GraphPanel graphSpec={result.graphSpec} />
                    )}

                    {/* Streamed Text Display (new format) */}
                    {result.rawText ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="streamed-solution">
                        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {renderMathText(result.rawText)}
                        </div>
                      </div>
                    ) : result.questions && Array.isArray(result.questions) && result.questions.length > 0 ? (
                      /* step-by-step Question-by-Question Display */
                      <div className="space-y-8">
                        {result.questions.map((question) => (
                          <div key={question.questionNumber} className="space-y-4" data-testid={`question-${question.questionNumber}`}>
                            {/* Question Header */}
                            <div className="border-b-2 border-blue-500 pb-2">
                              <h2 className="text-lg font-bold text-blue-500">
                                Question {question.questionNumber}
                              </h2>
                            </div>
                            
                            {/* Problem Statement */}
                            <p className="text-foreground font-medium">
                              {renderMathText(question.problemStatement || "")}
                            </p>
                            
                            {/* Steps for this question */}
                            <div className="space-y-4">
                              {Array.isArray(question.steps) && question.steps.map((step, stepIndex) => (
                                <div key={stepIndex} className="space-y-2" data-testid={`question-${question.questionNumber}-step-${stepIndex}`}>
                                  <div className="flex items-start gap-2">
                                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded bg-blue-500/20 text-blue-500 text-sm font-bold px-2">
                                      {stepIndex + 1}
                                    </span>
                                    <h4 className="font-semibold text-foreground underline decoration-1 underline-offset-2">
                                      {renderMathText(step.title)}
                                    </h4>
                                  </div>
                                  {step.reasoning && (
                                    <p className="text-muted-foreground leading-relaxed ml-8">
                                      {renderMathText(step.reasoning)}
                                    </p>
                                  )}
                                  {step.math && (
                                    <div className="py-3 px-4 bg-background/50 border rounded-lg overflow-x-auto text-center ml-8">
                                      <BlockMath math={step.math} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Answer for this question */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded bg-emerald-500/20 text-emerald-500 text-sm font-bold px-2">
                                  {(Array.isArray(question.steps) ? question.steps.length : 0) + 1}
                                </span>
                                <h4 className="font-semibold text-foreground underline decoration-1 underline-offset-2">
                                  Answer
                                </h4>
                              </div>
                              <div className="px-5 py-3 bg-background/80 border rounded-lg ml-8" data-testid={`answer-${question.questionNumber}`}>
                                <p className="text-foreground font-medium">
                                  {renderMathText(question.answer)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                    <>
                      {/* Fallback: Old format display */}
                      {/* Final Answer Section */}
                      {result.aiSolution && (
                        <div>
                          <h3 className="text-base font-semibold text-emerald-500 mb-3">
                            Final Answer
                          </h3>
                          <div className="px-5 py-4 bg-card border rounded-xl shadow-sm" data-testid="text-solution">
                            <div className="text-xl font-semibold text-foreground">
                              {renderMathText(result.aiSolution)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation Section */}
                      {result.aiExplanation && (
                        <div>
                          <h3 className="text-base font-semibold text-orange-500 mb-3">
                            Explanation
                          </h3>
                          <p className="text-foreground leading-relaxed" data-testid="text-explanation">
                            {renderMathText(result.aiExplanation)}
                          </p>
                        </div>
                      )}

                      {/* Step-by-Step Solution */}
                      {result.aiSteps && result.aiSteps.length > 0 && (
                        <div className="space-y-5">
                          {result.aiSteps.map((step, index) => (
                            <div key={index} className="border-l-2 border-blue-500/50 pl-4" data-testid={`text-step-${index}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 text-xs font-bold">
                                  {index + 1}
                                </span>
                                <h4 className="font-semibold text-foreground">
                                  {renderMathText(step.title)}
                                </h4>
                              </div>
                              {step.reasoning && (
                                <p className="text-muted-foreground leading-relaxed mb-2">
                                  {renderMathText(step.reasoning)}
                                </p>
                              )}
                              {step.math && (
                                <div className="py-3 px-4 bg-muted/50 rounded-lg overflow-x-auto text-center">
                                  <BlockMath math={step.math} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      </>
                    )}
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
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 rounded-tr-md" 
                        : "bg-muted rounded-tl-md"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">
                          {renderMathText(msg.content)}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
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
                className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600"
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
              AI can make mistakes. Always verify important answers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
