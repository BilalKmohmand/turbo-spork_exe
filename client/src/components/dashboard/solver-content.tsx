import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { renderMathText } from "@/components/math-display";
import { GraphPanel } from "@/components/graph-panel";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  Send, 
  Paperclip,
  Plus,
  Sparkles,
  Camera,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Image,
  Mic,
  MicOff
} from "lucide-react";
import type { GraphSpec } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface SubmissionResult {
  id: string;
  content: string;
  aiSolution?: string;
  graphSpec?: GraphSpec;
  isChat?: boolean;
}

const quickPrompts = [
  { icon: Calculator, label: "Math", prompt: "Solve: " },
  { icon: FlaskConical, label: "Science", prompt: "Explain: " },
  { icon: BookOpen, label: "History", prompt: "Tell me about: " },
  { icon: Globe, label: "Languages", prompt: "Translate: " },
];

export default function SolverContent() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [textProblem, setTextProblem] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const baseTextRef = useRef("");
  const { toast } = useToast();

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        stopVoiceInput();
        toast({
          title: "Voice input stopped",
          description: "Stopped listening due to silence. Click mic to continue.",
        });
      }
    }, 5000);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    setInterimTranscript("");
    baseTextRef.current = textProblem;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      resetSilenceTimeout();
      toast({
        title: "Listening...",
        description: "Speak now. I'll stop after 5 seconds of silence.",
      });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      resetSilenceTimeout();

      if (finalTranscript) {
        const base = baseTextRef.current;
        const needsSpace = base.length > 0 && !base.endsWith(" ");
        const newText = base + (needsSpace ? " " : "") + finalTranscript.trim();
        setTextProblem(newText);
        baseTextRef.current = newText;
        setInterimTranscript("");
      } else if (interim) {
        const base = baseTextRef.current;
        const needsSpace = base.length > 0 && !base.endsWith(" ");
        setTextProblem(base + (needsSpace ? " " : "") + interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      } else if (event.error === "no-speech") {
        toast({
          title: "No speech detected",
          description: "Please try speaking again.",
        });
      }
      stopVoiceInput();
    };

    recognition.onend = () => {
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or stopped
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      toast({
        title: "Voice input error",
        description: "Could not start voice input. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceInput = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
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
      let finalResult: any = null;
      let streamError: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(line => line.startsWith("data: "));
          
          for (const line of lines) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              const data = JSON.parse(jsonStr);
              if (data.error) {
                streamError = data.error;
              }
              if (data.token) {
                fullText += data.token;
              }
              if (data.done && data.result) {
                finalResult = data.result;
              }
            } catch (e) {
              console.error("Stream parse error:", e, line);
            }
          }
        }
      }

      // Handle stream errors
      if (streamError) {
        toast({
          title: "Error",
          description: streamError,
          variant: "destructive",
        });
        return;
      }

      // Display the complete response at once
      const aiSolution = finalResult?.aiSolution || finalResult?.message || finalResult?.rawText || fullText;
      if (aiSolution.trim()) {
        const newResult = {
          id: Date.now().toString(),
          content: problem,
          aiSolution,
          graphSpec: finalResult?.type === "graph" ? finalResult.graphSpec : undefined,
          isChat: finalResult?.type === "chat",
        };
        setResult(newResult);
        setChatHistory(prev => [...prev, 
          { role: "user", content: problem, timestamp: new Date() },
          { role: "assistant", content: newResult.aiSolution, timestamp: new Date() }
        ]);
        scrollToBottom();
      } else {
        toast({
          title: "Error",
          description: "Could not get a response. Please try again.",
          variant: "destructive",
        });
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

  const handleSubmit = () => {
    const problem = textProblem.trim();
    if (!problem) return;
    solveWithStreaming(problem);
    setTextProblem("");
  };

  const handleNewChat = () => {
    setResult(null);
    setChatHistory([]);
    setPreviewUrl(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      setPreviewUrl(event.target?.result as string);
      
      try {
        const response = await fetch("/api/solve-image-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        });

        const readerStream = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let finalResult: any = null;
        let streamError: string | null = null;

        setIsStreaming(true);
        if (readerStream) {
          while (true) {
            const { done, value } = await readerStream.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(line => line.startsWith("data: "));
            
            for (const line of lines) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                const data = JSON.parse(jsonStr);
                if (data.error) {
                  streamError = data.error;
                }
                if (data.token) {
                  fullText += data.token;
                }
                if (data.done && data.result) {
                  finalResult = data.result;
                }
              } catch (e) {
                console.error("Stream parse error:", e, line);
              }
            }
          }
        }

        // Handle stream errors
        if (streamError) {
          toast({
            title: "Error",
            description: streamError,
            variant: "destructive",
          });
          return;
        }

        // Display the complete response at once (only if there's content)
        const solution = finalResult?.aiSolution || fullText;
        if (solution.trim()) {
          setResult({
            id: Date.now().toString(),
            content: file.name,
            aiSolution: solution,
          });
          setChatHistory(prev => [...prev, 
            { role: "user", content: `[Uploaded: ${file.name}]`, timestamp: new Date() },
            { role: "assistant", content: solution, timestamp: new Date() }
          ]);
          scrollToBottom();
        } else {
          toast({
            title: "Error",
            description: "Could not process the file. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to process file.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setIsStreaming(false);
        setStreamingText("");
      }
    };

    reader.readAsDataURL(file);
  };

  const isLoading = isStreaming || isUploading;
  const hasConversation = result || isLoading || chatHistory.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {!hasConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-600/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Ask any question, upload a photo of your homework, or choose a subject below.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-2xl w-full">
              {quickPrompts.map((item) => (
                <Card 
                  key={item.label}
                  className="p-4 hover-elevate cursor-pointer transition-all border-border/50"
                  onClick={() => setTextProblem(item.prompt)}
                >
                  <item.icon className="w-5 h-5 text-violet-600 mb-2" />
                  <p className="text-sm font-medium">{item.label}</p>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {["Solve 2x + 5 = 13", "Explain photosynthesis", "What causes rain?"].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setTextProblem(example)}
                  className="text-xs border-border/50 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950"
                  data-testid={`example-${example.split(" ")[0].toLowerCase()}`}
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" 
                    ? "bg-violet-600 text-white rounded-br-md" 
                    : "bg-card border border-border/50 rounded-bl-md shadow-sm"
                }`}>
                  <div className="text-sm leading-relaxed">
                    {msg.role === "assistant" ? renderMathText(msg.content) : msg.content}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">You</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-card border border-border/50 rounded-2xl rounded-bl-md p-4 shadow-sm">
                  {streamingText ? (
                    <div className="text-sm leading-relaxed">
                      {renderMathText(streamingText)}
                      <span className="inline-block w-0.5 h-4 bg-violet-500 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result?.graphSpec && (
              <div className="mt-4">
                <GraphPanel graphSpec={result.graphSpec} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border/50 p-4 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-3xl mx-auto">
          {isListening && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 rounded-full border border-red-200 dark:border-red-900">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Listening...</span>
              </div>
              {interimTranscript && (
                <span className="text-sm text-muted-foreground italic truncate flex-1">
                  "{interimTranscript}"
                </span>
              )}
            </div>
          )}
          <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-2 border border-border/50 shadow-sm">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="*/*"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload image"
              data-testid="button-upload"
            >
              <Image className="w-4 h-4" />
            </Button>
            {hasConversation && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80"
                onClick={handleNewChat}
                disabled={isLoading}
                title="New chat"
                data-testid="button-new-chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Textarea
              placeholder={isListening ? "Speak now..." : "Ask me anything..."}
              value={textProblem}
              onChange={(e) => setTextProblem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 min-h-[40px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 text-sm"
              disabled={isLoading}
              data-testid="input-problem"
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all ${
                  isListening 
                    ? "text-white bg-red-500 hover:bg-red-600 shadow-md" 
                    : "text-muted-foreground hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                }`}
                onClick={toggleVoiceInput}
                disabled={isLoading}
                title={isListening ? "Stop listening" : "Voice input"}
                data-testid="button-voice-input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !textProblem.trim()}
                size="icon"
                className="h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-md disabled:opacity-50"
                title="Send message"
                data-testid="button-submit"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Gradeio AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
