import { useState, useRef, useEffect } from "react";
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
  MicOff,
  User,
  MoreHorizontal,
  ChevronDown
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
  { icon: Calculator, label: "Math", prompt: "Solve: ", color: "text-blue-500" },
  { icon: FlaskConical, label: "Science", prompt: "Explain: ", isScience: true, color: "text-emerald-500" },
  { icon: BookOpen, label: "History", prompt: "Tell me about: ", color: "text-orange-500" },
  { icon: Globe, label: "Languages", prompt: "Translate: ", color: "text-violet-500" },
];

export default function SolverContent() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [textProblem, setTextProblem] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const solveWithStreaming = async (problem: string) => {
    const userMsg: ChatMessage = { role: "user", content: problem, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setIsStreaming(true);
    scrollToBottom();
    
    try {
      const response = await fetch("/api/solve-text-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, history: chatHistory }),
      });

      if (!response.ok) throw new Error("Failed to connect to AI");

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
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              const data = JSON.parse(jsonStr);
              if (data.token) fullText += data.token;
            } catch (e) {}
          }
        }
      }

      setChatHistory(prev => [...prev, { role: "assistant", content: fullText, timestamp: new Date() }]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to solve", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  const handleSubmit = () => {
    if (!textProblem.trim() || isStreaming) return;
    const p = textProblem;
    setTextProblem("");
    solveWithStreaming(p);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0A0A0A] relative">
      {/* Scrollable Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-32"
      >
        <div className="max-w-3xl mx-auto px-6 w-full">
          {chatHistory.length === 0 ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#111110] dark:bg-white flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white dark:text-black" />
              </div>
              <h2 className="text-2xl font-semibold text-[#111110] dark:text-white mb-2">How can I help you?</h2>
              <p className="text-[#666660] text-center mb-10 max-w-sm">Gradeio's specialized education AI is ready to help you with any subject.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((item) => (
                  <button 
                    key={item.label}
                    onClick={() => setTextProblem(item.prompt)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] hover:bg-[#F9F9F8] dark:hover:bg-[#1A1A1A] transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-[#F0F0F0] dark:bg-[#1A1A1A] flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{item.label}</p>
                      <p className="text-[12px] text-[#999990]">Ask a question</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white dark:text-black" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#F0F0F0] dark:bg-[#1A1A1A] px-4 py-3 rounded-2xl text-[#111110] dark:text-white' : 'text-[#111110] dark:text-[#E5E5E0]'}`}>
                    <div className="text-[15px] leading-[1.6]">
                      {msg.role === 'assistant' ? renderMathText(msg.content) : msg.content}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 mt-1 border border-violet-200 dark:border-violet-900">
                      <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && (
                <div className="flex gap-5">
                  <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <div className="text-[#666660] text-[15px] italic">Thinking...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-[24px] shadow-2xl overflow-hidden focus-within:border-[#111110] dark:focus-within:border-[#F9F9F8] transition-all">
            <Textarea
              value={textProblem}
              onChange={(e) => setTextProblem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder="Message Gradeio..."
              className="w-full min-h-[60px] max-h-48 p-4 pt-5 pb-12 bg-transparent border-none focus-visible:ring-0 text-[15px] resize-none no-scrollbar placeholder:text-[#999990]"
            />
            <div className="absolute bottom-3 left-4 flex items-center gap-1">
              <button className="p-2 rounded-lg text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 right-4">
              <button 
                onClick={handleSubmit}
                disabled={!textProblem.trim() || isStreaming}
                className="w-8 h-8 rounded-full bg-[#111110] dark:bg-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4 text-white dark:text-black" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
