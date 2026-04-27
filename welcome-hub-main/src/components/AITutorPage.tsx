import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, History, Trash2, User, Sparkles, ChevronRight, Calculator, FlaskConical, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  subject?: string;
}

const SUBJECTS = [
  { id: "math", label: "Math", icon: Calculator, description: "Solve equations, geometry & word problems" },
  { id: "science", label: "Science", icon: FlaskConical, description: "Physics, Chemistry & Biology explained" },
  { id: "english", label: "English", icon: BookOpen, description: "Grammar, comprehension, essays & more" },
  { id: "history", label: "History", icon: Clock, description: "Explore events, people & historical context" },
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; date: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await apiFetch<{ sessions: { id: string; title: string; createdAt: string }[] }>("/api/tutor/sessions");
      setHistory(res.sessions.map(s => ({ id: s.id, title: s.title, date: new Date(s.createdAt).toLocaleDateString() })));
    } catch {
      setHistory([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      subject: selectedSubject || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiFetch<{ response: string }>("/api/tutor/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          subject: selectedSubject,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedSubject(null);
  };

  const selectSubject = (subjectId: string) => {
    setSelectedSubject(subjectId);
    const subject = SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `I'm ready to help you with ${subject.label}! What would you like to learn about?`,
      };
      setMessages([welcomeMsg]);
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar History */}
      <div className={cn(
        "border-r border-border bg-card/50 transition-all duration-300 overflow-hidden",
        showHistory ? "w-64" : "w-0"
      )}>
        <div className="w-64 h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No history yet
                </div>
              ) : (
                history.map(item => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm truncate transition-colors"
                  >
                    {item.title}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/40">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold">AI Tutor</h2>
            {selectedSubject && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {SUBJECTS.find(s => s.id === selectedSubject)?.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">What can I help you learn today?</h3>
              <p className="text-sm text-muted-foreground mb-8 text-center">
                Select a subject to get started or ask any question directly
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                {SUBJECTS.map(subject => {
                  const Icon = subject.icon;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => selectSubject(subject.id)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{subject.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{subject.description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%] text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted text-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/40">
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <Paperclip className="w-4 h-4" />
              </Button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, or drag & drop files here..."
                className="flex-1 bg-transparent border-none outline-none resize-none min-h-[20px] max-h-[120px] text-sm py-1"
                rows={1}
              />
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="shrink-0 h-8 w-8 rounded-xl"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Shift+Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
