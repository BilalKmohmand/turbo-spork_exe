import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { renderMathText } from "@/components/math-display";
import {
  Send, Paperclip, Sparkles, BookOpen,
  Calculator, FlaskConical, Globe, Mic, MicOff,
  User, X, FileImage, FileText as FilePdf,
  Atom, TestTube, Leaf, ChevronRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

interface AIMode {
  label: string;
  color: string;
  bg: string;
  instruction: string;
}

/* ─── Science sub-topics ─────────────────────────────────────────── */
const SCIENCE_MODES: { icon: any; label: string; color: string; bg: string; instruction: string; desc: string }[] = [
  {
    icon: Atom,
    label: "Physics",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    desc: "Forces, energy, motion & waves",
    instruction: "You are an expert Physics tutor. When explaining, always include relevant formulas with proper units, draw diagrams using text when helpful, break problems into clear steps, and highlight key physics principles involved.",
  },
  {
    icon: TestTube,
    label: "Chemistry",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    desc: "Reactions, elements & bonding",
    instruction: "You are an expert Chemistry tutor. Always show balanced chemical equations when relevant, explain reaction mechanisms step by step, reference the periodic table when discussing elements, and explain bonding and molecular structures clearly.",
  },
  {
    icon: Leaf,
    label: "Biology",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    desc: "Living systems & life processes",
    instruction: "You are an expert Biology tutor. Explain biological processes with clear diagrams using text when helpful, relate concepts to real organisms and body systems, use proper scientific terminology while keeping explanations accessible, and connect cellular to organism-level concepts.",
  },
];

const quickPrompts = [
  { icon: Calculator,   label: "Math",      prompt: "Solve: ",         color: "text-blue-500",    isScience: false },
  { icon: FlaskConical, label: "Science",   prompt: "",                color: "text-emerald-500", isScience: true  },
  { icon: BookOpen,     label: "History",   prompt: "Tell me about: ", color: "text-orange-500",  isScience: false },
  { icon: Globe,        label: "Languages", prompt: "Translate: ",     color: "text-violet-500",  isScience: false },
];

/* ─── Component ──────────────────────────────────────────────────── */
export default function SolverContent() {
  const [textProblem, setTextProblem]   = useState("");
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming]   = useState(false);
  const [scienceOpen, setScienceOpen]   = useState(false);
  const [activeMode, setActiveMode]     = useState<AIMode | null>(null);

  /* File attachment state */
  const [attachedFile, setAttachedFile]         = useState<{ name: string; base64: string; mimeType: string; preview?: string } | null>(null);
  const [isUploadingSolving, setIsUploadingSolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Voice / speech-to-text state */
  const [isListening, setIsListening]   = useState(false);
  const recognitionRef                  = useRef<any>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast }        = useToast();

  /* Auto-scroll --------------------------------------------------- */
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isStreaming]);

  /* Streaming text solve ------------------------------------------ */
  const solveWithStreaming = async (problem: string, imagePreview?: string) => {
    const userMsg: ChatMessage = { role: "user", content: problem, imagePreview };
    setChatHistory(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setTextProblem("");
    setAttachedFile(null);

    /* Prepend mode instruction as a hidden context header */
    const enrichedProblem = activeMode
      ? `[TUTOR MODE: ${activeMode.instruction}]\n\nStudent question: ${problem}`
      : problem;

    try {
      const response = await fetch("/api/solve-text-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: enrichedProblem, history: chatHistory }),
      });
      if (!response.ok) throw new Error("Failed to connect to AI");

      const reader  = response.body?.getReader();
      const decoder = new TextDecoder();
      let   fullText = "";

      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setChatHistory(prev => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
            try {
              const data = JSON.parse(line.slice(6).trim());
              if (data.token) {
                fullText += data.token;
                setChatHistory(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullText };
                  return updated;
                });
                scrollToBottom();
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to solve", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  };

  /* Image solve ---------------------------------------------------- */
  const solveImage = async (base64: string, mimeType: string, preview: string, label: string) => {
    const userMsg: ChatMessage = { role: "user", content: `[Analyzing ${label}]`, imagePreview: preview };
    setChatHistory(prev => [...prev, userMsg]);
    setIsUploadingSolving(true);
    setAttachedFile(null);
    setTextProblem("");

    try {
      const response = await fetch("/api/solve-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse image");
      const answer = data.solution || data.text || data.answer || JSON.stringify(data);
      setChatHistory(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingSolving(false);
      scrollToBottom();
    }
  };

  /* Handle submit -------------------------------------------------- */
  const handleSubmit = () => {
    if (isStreaming || isUploadingSolving) return;
    if (attachedFile) {
      solveImage(attachedFile.base64, attachedFile.mimeType, attachedFile.preview || "", attachedFile.name);
    } else if (textProblem.trim()) {
      solveWithStreaming(textProblem.trim());
    }
  };

  /* File attachment ----------------------------------------------- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Please attach an image (JPG, PNG, WEBP) or PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl  = reader.result as string;
      const base64   = dataUrl.split(",")[1];
      const preview  = file.type.startsWith("image/") ? dataUrl : undefined;
      setAttachedFile({ name: file.name, base64, mimeType: file.type, preview });
    };
    reader.readAsDataURL(file);
  };

  /* Voice input ---------------------------------------------------- */
  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice input isn't supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition         = new SpeechRecognition();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";
      let final   = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final   += event.results[i][0].transcript;
        else                          interim += event.results[i][0].transcript;
      }
      setTextProblem(prev => (prev + " " + (final || interim)).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Please allow microphone access in your browser.", variant: "destructive" });
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const canSend = (!isStreaming && !isUploadingSolving) && (!!textProblem.trim() || !!attachedFile);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0A0A0A] relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Scrollable chat area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-36">
        <div className="max-w-3xl mx-auto px-6 w-full">
          {chatHistory.length === 0 ? (
            /* ── Empty state ── */
            <div className="py-20 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#111110] dark:bg-white flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white dark:text-black" />
              </div>
              <h2 className="text-2xl font-semibold text-[#111110] dark:text-white mb-2">How can I help you?</h2>
              <p className="text-[#666660] text-center mb-10 max-w-sm">
                Ask any question, upload a photo of your homework, or speak directly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((item) => (
                  <div key={item.label} className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (item.isScience) {
                          setScienceOpen(v => !v);
                        } else {
                          setScienceOpen(false);
                          setActiveMode(null);
                          setTextProblem(item.prompt);
                        }
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left group w-full ${
                        item.isScience && scienceOpen
                          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
                          : "border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] hover:bg-[#F9F9F8] dark:hover:bg-[#1A1A1A]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                        item.isScience && scienceOpen
                          ? "bg-emerald-100 dark:bg-emerald-900"
                          : "bg-[#F0F0F0] dark:bg-[#1A1A1A]"
                      }`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{item.label}</p>
                        <p className="text-[12px] text-[#999990]">
                          {item.isScience ? "Choose a subject" : "Ask a question"}
                        </p>
                      </div>
                      {item.isScience && (
                        <ChevronRight className={`w-4 h-4 text-[#999990] transition-transform ${scienceOpen ? "rotate-90" : ""}`} />
                      )}
                    </button>

                    {/* Science sub-menu */}
                    {item.isScience && scienceOpen && (
                      <div className="ml-3 flex flex-col gap-2 border-l-2 border-emerald-200 dark:border-emerald-800 pl-3">
                        {SCIENCE_MODES.map(mode => (
                          <button
                            key={mode.label}
                            onClick={() => {
                              setActiveMode({ label: mode.label, color: mode.color, bg: mode.bg, instruction: mode.instruction });
                              setTextProblem("Explain: ");
                              setScienceOpen(false);
                            }}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group w-full ${mode.bg} border-transparent hover:border-current`}
                          >
                            <div className={`w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              <mode.icon className={`w-4 h-4 ${mode.color}`} />
                            </div>
                            <div>
                              <p className={`text-[13px] font-bold ${mode.color}`}>{mode.label}</p>
                              <p className="text-[11px] text-[#666660] dark:text-[#888880]">{mode.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <div className="space-y-8 py-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white dark:text-black" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[#F0F0F0] dark:bg-[#1A1A1A] px-4 py-3 rounded-2xl text-[#111110] dark:text-white" : "text-[#111110] dark:text-[#E5E5E0]"}`}>
                    {msg.imagePreview && (
                      <img src={msg.imagePreview} alt="attachment" className="max-w-[240px] rounded-xl mb-2 border border-[#E5E5E0]" />
                    )}
                    <div className="text-[15px] leading-[1.6]">
                      {msg.role === "assistant" ? renderMathText(msg.content) : msg.content}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 mt-1 border border-violet-200 dark:border-violet-900">
                      <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                  )}
                </div>
              ))}
              {(isStreaming || isUploadingSolving) && (
                <div className="flex gap-5">
                  <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <div className="text-[#666660] text-[15px] italic">Thinking…</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating input bar */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Active science mode badge */}
          {activeMode && (
            <div className="mb-2 flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${activeMode.bg} ${activeMode.color} border border-current/20`}>
                <span>{activeMode.label} Tutor Mode</span>
                <button
                  onClick={() => setActiveMode(null)}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Attached file preview */}
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0F0F0] dark:bg-[#1A1A1A] border border-[#E5E5E0] dark:border-[#22221F] w-fit max-w-full">
              {attachedFile.mimeType === "application/pdf"
                ? <FilePdf className="w-4 h-4 text-red-500 shrink-0" />
                : <FileImage className="w-4 h-4 text-violet-500 shrink-0" />
              }
              {attachedFile.preview && (
                <img src={attachedFile.preview} alt="" className="h-8 w-8 rounded object-cover border border-[#E5E5E0]" />
              )}
              <span className="text-[13px] font-medium text-[#444440] dark:text-[#BBBBBB] truncate max-w-[200px]">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="p-0.5 rounded hover:bg-[#E5E5E0] dark:hover:bg-[#22221F] transition-colors shrink-0">
                <X className="w-3.5 h-3.5 text-[#666660]" />
              </button>
            </div>
          )}

          {/* Input box */}
          <div className="relative group">
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-[24px] shadow-2xl overflow-hidden focus-within:border-[#111110] dark:focus-within:border-[#F9F9F8] transition-all">
              <Textarea
                value={textProblem}
                onChange={(e) => setTextProblem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                placeholder={isListening ? "Listening… speak now" : "Message Gradeio, or attach a photo of your homework…"}
                className={`w-full min-h-[60px] max-h-48 p-4 pt-5 pb-12 bg-transparent border-none focus-visible:ring-0 text-[15px] resize-none no-scrollbar placeholder:text-[#999990] ${isListening ? "placeholder:text-red-400" : ""}`}
              />

              {/* Bottom toolbar */}
              <div className="absolute bottom-3 left-4 flex items-center gap-1">
                {/* Paperclip — open file picker */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or PDF"
                  className="p-2 rounded-lg text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] hover:text-[#111110] dark:hover:text-white transition-colors"
                  data-testid="button-attach-file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Mic — voice to text */}
                <button
                  onClick={toggleVoice}
                  title={isListening ? "Stop listening" : "Voice input"}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? "text-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse"
                      : "text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] hover:text-[#111110] dark:hover:text-white"
                  }`}
                  data-testid="button-voice-input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Send button */}
              <div className="absolute bottom-3 right-4">
                <button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className="w-8 h-8 rounded-full bg-[#111110] dark:bg-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4 text-white dark:text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
