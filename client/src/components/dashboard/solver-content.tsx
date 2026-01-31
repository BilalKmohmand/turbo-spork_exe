import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { renderMathText } from "@/components/math-display";
import { GraphPanel } from "@/components/graph-panel";
import { 
  Loader2, 
  Send, 
  Paperclip,
  Plus,
  Sparkles,
  Camera
} from "lucide-react";
import type { GraphSpec } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SubmissionResult {
  id: string;
  content: string;
  aiSolution?: string;
  graphSpec?: GraphSpec;
  isChat?: boolean;
}

export default function SolverContent() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [textProblem, setTextProblem] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
                const r = data.result;
                if (r.type === "graph") {
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    aiSolution: r.aiSolution || r.message,
                    graphSpec: r.graphSpec,
                  });
                } else if (r.type === "chat") {
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    aiSolution: r.message,
                    isChat: true,
                  });
                } else if (r.type === "problem" || r.aiSolution) {
                  setResult({
                    id: Date.now().toString(),
                    content: problem,
                    aiSolution: r.aiSolution || r.rawText,
                  });
                }
                setChatHistory(prev => [...prev, 
                  { role: "user", content: problem },
                  { role: "assistant", content: r.aiSolution || r.message || r.rawText || fullText }
                ]);
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

        setIsStreaming(true);
        if (readerStream) {
          while (true) {
            const { done, value } = await readerStream.read();
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
                  setResult({
                    id: Date.now().toString(),
                    content: file.name,
                    aiSolution: data.result.aiSolution || fullText,
                  });
                  setChatHistory(prev => [...prev, 
                    { role: "user", content: `[Uploaded: ${file.name}]` },
                    { role: "assistant", content: data.result.aiSolution || fullText }
                  ]);
                }
              } catch {}
            }
          }
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
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {!hasConversation && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Homework Helper</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Ask any question, upload a photo of your homework, or paste a problem. 
              I'll provide step-by-step solutions instantly.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Solve 2x + 5 = 13", "Explain photosynthesis", "Factor x² - 9"].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setTextProblem(example)}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === "user" 
                ? "bg-violet-600 text-white rounded-tr-md" 
                : "bg-muted rounded-tl-md"
            }`}>
              {msg.role === "assistant" ? renderMathText(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 bg-muted rounded-2xl rounded-tl-md p-4">
              {streamingText ? (
                <div className="text-sm leading-relaxed">
                  {renderMathText(streamingText)}
                  <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-0.5">&#8203;</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
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

      <div className="border-t p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              data-testid="button-upload"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            {hasConversation && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleNewChat}
                disabled={isLoading}
                data-testid="button-new-chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Textarea
              placeholder="Type your question or paste a problem..."
              value={textProblem}
              onChange={(e) => setTextProblem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={isLoading}
              data-testid="input-problem"
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !textProblem.trim()}
              className="bg-violet-600 hover:bg-violet-700"
              data-testid="button-submit"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI can make mistakes. Always verify important answers.
          </p>
        </div>
      </div>
    </div>
  );
}
