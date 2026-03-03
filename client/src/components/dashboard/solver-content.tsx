import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { renderMathText } from "@/components/math-display";
import {
  Send, Paperclip, Sparkles, BookOpen,
  Calculator, FlaskConical, Globe, Mic, MicOff,
  User, X, FileImage, FileText as FilePdf,
  Atom, TestTube, Leaf, ChevronRight, Copy, Check,
  Trash2, PenLine, Eye, AlignLeft, RefreshCw, BookMarked, GraduationCap,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imagePreviews?: string[];   // multiple image previews
  imagePreview?: string;      // kept for backwards compat
}

interface AttachedFile {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  preview?: string;
}

interface AIMode {
  label: string;
  color: string;
  bg: string;
  instruction: string;
}

/* ─── Sub-mode type ──────────────────────────────────────────────── */
interface SubMode {
  icon: any;
  label: string;
  color: string;
  bg: string;
  desc: string;
  instruction: string;
  prompt: string;
}

/* ─── Science sub-topics ─────────────────────────────────────────── */
const SCIENCE_MODES: SubMode[] = [
  {
    icon: Atom,
    label: "Physics",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    desc: "Forces, energy, motion & waves",
    prompt: "Explain: ",
    instruction: "You are an expert Physics tutor. When explaining, always include relevant formulas with proper units, draw diagrams using text when helpful, break problems into clear steps, and highlight key physics principles involved.",
  },
  {
    icon: TestTube,
    label: "Chemistry",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    desc: "Reactions, elements & bonding",
    prompt: "Explain: ",
    instruction: "You are an expert Chemistry tutor. Always show balanced chemical equations when relevant, explain reaction mechanisms step by step, reference the periodic table when discussing elements, and explain bonding and molecular structures clearly.",
  },
  {
    icon: Leaf,
    label: "Biology",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    desc: "Living systems & life processes",
    prompt: "Explain: ",
    instruction: "You are an expert Biology tutor. Explain biological processes with clear diagrams using text when helpful, relate concepts to real organisms and body systems, use proper scientific terminology while keeping explanations accessible, and connect cellular to organism-level concepts.",
  },
];

/* ─── English sub-topics ─────────────────────────────────────────── */
const ENGLISH_MODES: SubMode[] = [
  {
    icon: PenLine,
    label: "Grammar Check",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    desc: "Fix grammar, spelling & punctuation",
    prompt: "Check the grammar of: ",
    instruction: "You are an expert English grammar tutor. When given a sentence or passage, carefully identify all grammar, spelling, punctuation and style errors. Show the corrected version, then explain each correction with a clear rule or reason. Use simple language suitable for students.",
  },
  {
    icon: Eye,
    label: "Comprehension",
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    desc: "Understand passages & answer questions",
    prompt: "Help me understand this passage: ",
    instruction: "You are an expert English comprehension tutor. When given a passage or text, help the student fully understand it by: summarising the main ideas, identifying key themes and literary devices, explaining difficult vocabulary in context, and answering any comprehension questions they have. Always quote relevant parts of the text in your answers.",
  },
  {
    icon: GraduationCap,
    label: "Essay Writing",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    desc: "Structure, argue & improve essays",
    prompt: "Help me write an essay about: ",
    instruction: "You are an expert essay writing tutor. Help the student plan, structure and write compelling essays. Provide clear outlines, suggest strong thesis statements, guide them on paragraph structure (PEEL: Point, Evidence, Explain, Link), and give feedback on argument strength, coherence and academic style. Always explain your suggestions so the student learns.",
  },
  {
    icon: AlignLeft,
    label: "Summarise",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    desc: "Condense long texts clearly",
    prompt: "Summarise this text: ",
    instruction: "You are an expert at summarising complex texts for students. When given text to summarise: produce a concise summary capturing all key ideas, identify the most important points as bullet points, preserve the original meaning accurately, and adjust the reading level to be clear and accessible. If the text has multiple sections, summarise each one.",
  },
  {
    icon: RefreshCw,
    label: "Rewrite / Paraphrase",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    desc: "Rephrase text in your own words",
    prompt: "Rewrite this in clearer words: ",
    instruction: "You are an expert English writing coach. When asked to rewrite or paraphrase text: preserve the original meaning exactly, improve clarity and flow, use varied vocabulary appropriate for the student's level, and if needed provide multiple versions (e.g. formal and informal). Explain significant word choices so the student builds vocabulary.",
  },
  {
    icon: BookMarked,
    label: "Vocabulary",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    desc: "Learn new words & meanings",
    prompt: "Explain the word: ",
    instruction: "You are an expert English vocabulary tutor. When asked about a word or phrase: give a clear definition, show its etymology (word origin) if interesting, provide 3–5 example sentences at different difficulty levels, list common synonyms and antonyms, highlight any common misuses or confusions, and suggest memory tips or mnemonics to help the student remember it.",
  },
];

/* ─── Quick prompt items ─────────────────────────────────────────── */
interface QuickPrompt {
  icon: any;
  label: string;
  desc: string;
  prompt: string;
  color: string;
  bg: string;
  instruction?: string;
  accentBorder?: string;
  accentBg?: string;
  subModes?: SubMode[];
}

const quickPrompts: QuickPrompt[] = [
  {
    icon: Calculator,
    label: "Math",
    desc: "Solve equations, geometry & word problems",
    prompt: "Solve: ",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    instruction: "You are an expert Math tutor. For every problem: show all working step-by-step with clear numbered steps, state the method or formula used at the start, highlight the final answer, and explain any key concepts the student needs to understand. Use LaTeX notation for all mathematical expressions (e.g. $x^2 + 2x + 1$). If the problem has multiple parts, solve each part clearly.",
  },
  {
    icon: FlaskConical,
    label: "Science",
    desc: "Physics, Chemistry & Biology explained",
    prompt: "",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    accentBorder: "border-emerald-300 dark:border-emerald-800",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/20",
    subModes: SCIENCE_MODES,
  },
  {
    icon: BookOpen,
    label: "English",
    desc: "Grammar, comprehension, essays & more",
    prompt: "",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    accentBorder: "border-violet-300 dark:border-violet-800",
    accentBg: "bg-violet-50 dark:bg-violet-950/20",
    subModes: ENGLISH_MODES,
  },
  {
    icon: Globe,
    label: "Languages",
    desc: "Translate text & learn new languages",
    prompt: "Translate to English: ",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    instruction: "You are an expert multilingual language tutor. When asked to translate: provide an accurate translation, then break down key vocabulary word-by-word, explain any grammar structures that differ from English, give pronunciation tips where helpful, and provide cultural context if relevant. If the student asks about grammar rules, explain them with clear examples in both languages.",
  },
  {
    icon: BookMarked,
    label: "History",
    desc: "Explore events, people & historical context",
    prompt: "Tell me about: ",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    instruction: "You are an expert History tutor. When answering historical questions: give clear timelines with dates, explain cause-and-effect relationships between events, describe key figures and their motivations, provide historical context showing why events were significant, and connect historical events to their long-term consequences. Use primary source examples where relevant and help students think critically about different historical perspectives.",
  },
];

/* ─── Waveform bars animation while listening ─────────────────── */
function VoiceWaveform() {
  return (
    <span className="inline-flex items-end gap-[3px] h-4 ml-1">
      {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-red-500"
          style={{
            animation: `voiceBar 0.8s ease-in-out ${delay}s infinite alternate`,
            height: `${8 + i * 2}px`,
          }}
        />
      ))}
    </span>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function SolverContent() {
  const [textProblem, setTextProblem]   = useState("");
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming]   = useState(false);
  const [openSubMenu, setOpenSubMenu]   = useState<string | null>(null);
  const [activeMode, setActiveMode]     = useState<AIMode | null>(null);
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);

  /* File attachment state — supports multiple images */
  const [attachedFiles, setAttachedFiles]           = useState<AttachedFile[]>([]);
  const [isUploadingSolving, setIsUploadingSolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Drag-and-drop state */
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef              = useRef(0); // tracks nested drag enter/leave

  /* Voice / speech-to-text state */
  const [isListening, setIsListening]   = useState(false);
  const recognitionRef                  = useRef<any>(null);
  const listeningRef                    = useRef(false);      // sync ref for callbacks
  const baseTextRef                     = useRef("");          // text in box before voice started
  const finalizedRef                    = useRef("");          // speech API finalized text
  const interimRef                      = useRef("");          // speech API interim (in-progress)

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast }        = useToast();

  /* Clean up recognition on unmount */
  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current?.abort?.();
    };
  }, []);

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
  const solveWithStreaming = async (problem: string, imagePreviews?: string[]) => {
    const userMsg: ChatMessage = { role: "user", content: problem, imagePreviews };
    setChatHistory(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setTextProblem("");
    setAttachedFiles([]);

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

  /* Multi-image solve ---------------------------------------------- */
  const solveImages = async (files: AttachedFile[], prompt: string) => {
    const previews = files.map(f => f.preview).filter(Boolean) as string[];
    const label    = files.length === 1 ? files[0].name : `${files.length} images`;
    const userContent = prompt.trim()
      ? prompt.trim()
      : `[Analysing ${label}]`;

    const userMsg: ChatMessage = { role: "user", content: userContent, imagePreviews: previews };
    setChatHistory(prev => [...prev, userMsg]);
    setIsUploadingSolving(true);
    setAttachedFiles([]);
    setTextProblem("");

    try {
      const response = await fetch("/api/solve-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: files.map(f => ({ base64: f.base64, mimeType: f.mimeType })),
          prompt: prompt.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse images");
      setChatHistory(prev => [...prev, { role: "assistant", content: data.solution || "No response." }]);
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
    if (listeningRef.current) stopVoice();

    if (attachedFiles.length > 0) {
      solveImages(attachedFiles, textProblem);
    } else if (textProblem.trim()) {
      solveWithStreaming(textProblem.trim());
    }
  };

  /* File attachment — supports multiple images -------------------- */
  const MAX_FILES = 8;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    if (!selected.length) return;

    const remaining = MAX_FILES - attachedFiles.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_FILES} images at once.`, variant: "destructive" });
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const toProcess = selected.slice(0, remaining);
    let rejected = 0;

    toProcess.forEach(file => {
      if (!allowed.includes(file.type)) { rejected++; return; }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: `${file.name} is too large`, description: "Max 10 MB per image.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachedFiles(prev => {
          if (prev.length >= MAX_FILES) return prev;
          return [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            base64: dataUrl.split(",")[1],
            mimeType: file.type,
            preview: dataUrl,
          }];
        });
      };
      reader.readAsDataURL(file);
    });

    if (rejected > 0) {
      toast({ title: "Some files skipped", description: "Only JPG, PNG, WEBP, GIF images are supported.", variant: "destructive" });
    }
  };

  const removeFile = (id: string) => setAttachedFiles(prev => prev.filter(f => f.id !== id));

  /* ── Voice input (production-grade) ─────────────────────────── */
  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition         = new SpeechRecognition();
    recognition.continuous    = true;       // keep going across pauses
    recognition.interimResults = true;      // show live transcription
    recognition.lang          = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      listeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      let newFinal   = "";
      let newInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) newFinal   += t;
        else                          newInterim   = t;
      }

      if (newFinal) {
        finalizedRef.current += newFinal + " ";
      }
      interimRef.current = newInterim;

      /* Update textarea: base + all finalized + current interim */
      setTextProblem(
        (baseTextRef.current + finalizedRef.current + interimRef.current).trimStart()
      );
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive",
        });
        listeningRef.current = false;
        setIsListening(false);
      }
      /* For aborted/no-speech errors, let onend handle restart */
    };

    recognition.onend = () => {
      /* Chrome stops recognition after silence — restart automatically if still "listening" */
      if (listeningRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
        interimRef.current = "";
        /* Keep finalizedRef in textarea — don't wipe user's text */
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [toast]);

  const stopVoice = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    interimRef.current = "";
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    /* Leave textarea as-is — keep whatever was spoken */
  }, []);

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice input needs Chrome, Edge, or Safari. Your browser doesn't support it.",
        variant: "destructive",
      });
      return;
    }

    if (listeningRef.current) {
      stopVoice();
    } else {
      /* Save the current box contents as the base, reset finalized/interim */
      baseTextRef.current  = textProblem ? textProblem.trimEnd() + " " : "";
      finalizedRef.current = "";
      interimRef.current   = "";
      startRecognition();
    }
  };

  /* Copy message to clipboard -------------------------------------- */
  const copyMessage = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  /* Clear conversation -------------------------------------------- */
  const clearChat = () => {
    setChatHistory([]);
    setTextProblem("");
    setAttachedFiles([]);
    setActiveMode(null);
    setOpenSubMenu(null);
  };

  const canSend = (!isStreaming && !isUploadingSolving) && (!!textProblem.trim() || attachedFiles.length > 0);

  /* ── Drag-and-drop handlers ────────────────────────────────────── */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const remaining = MAX_FILES - attachedFiles.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_FILES} images at once.`, variant: "destructive" });
      return;
    }

    const toProcess = files.filter(f => allowed.includes(f.type)).slice(0, remaining);
    const rejected  = files.filter(f => !allowed.includes(f.type)).length;

    if (rejected > 0) {
      toast({ title: "Some files skipped", description: "Only JPG, PNG, WEBP, GIF images are supported.", variant: "destructive" });
    }

    toProcess.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: `${file.name} is too large`, description: "Max 10 MB per image.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachedFiles(prev => {
          if (prev.length >= MAX_FILES) return prev;
          return [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            base64: dataUrl.split(",")[1],
            mimeType: file.type,
            preview: dataUrl,
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-[#0A0A0A] relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Waveform keyframes */}
      <style>{`
        @keyframes voiceBar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1.1); }
        }
      `}</style>

      {/* Drag-and-drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-violet-500/10 dark:bg-violet-400/10 backdrop-blur-[1px]" />
          <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-violet-400 dark:border-violet-500" />
          <div className="relative flex flex-col items-center gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#111110] shadow-xl flex items-center justify-center">
              <FileImage className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">Drop images here</p>
              <p className="text-sm text-violet-500 dark:text-violet-400 mt-0.5">JPG, PNG, WEBP, GIF — up to {MAX_FILES} images</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input — multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top bar — clear button when there's history */}
      {chatHistory.length > 0 && (
        <div className="flex justify-end px-6 pt-3 pb-0">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-[12px] text-[#999990] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear chat
          </button>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((item) => {
                  const isOpen = openSubMenu === item.label;
                  const hasSubMenu = !!item.subModes;
                  return (
                    <div key={item.label} className="flex flex-col gap-2">
                      <button
                        data-testid={`quick-prompt-${item.label.toLowerCase()}`}
                        onClick={() => {
                          if (hasSubMenu) {
                            setOpenSubMenu(isOpen ? null : item.label);
                          } else {
                            setOpenSubMenu(null);
                            if (item.instruction) {
                              setActiveMode({ label: item.label, color: item.color, bg: item.bg, instruction: item.instruction });
                            } else {
                              setActiveMode(null);
                            }
                            setTextProblem(item.prompt);
                          }
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left group w-full ${
                          isOpen
                            ? `${item.accentBorder} ${item.accentBg}`
                            : "border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] hover:bg-[#F9F9F8] dark:hover:bg-[#1A1A1A]"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                          isOpen ? "bg-white/70 dark:bg-black/30" : "bg-[#F0F0F0] dark:bg-[#1A1A1A]"
                        }`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{item.label}</p>
                          <p className="text-[12px] text-[#999990] leading-tight">{item.desc}</p>
                        </div>
                        {hasSubMenu && (
                          <ChevronRight className={`w-4 h-4 text-[#999990] shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        )}
                      </button>

                      {/* Generic sub-menu */}
                      {hasSubMenu && isOpen && (
                        <div className="ml-3 flex flex-col gap-1.5 border-l-2 border-[#D5D5D0] dark:border-[#2A2A28] pl-3">
                          {item.subModes!.map(mode => (
                            <button
                              key={mode.label}
                              data-testid={`sub-mode-${mode.label.toLowerCase().replace(/\s+/g, "-")}`}
                              onClick={() => {
                                setActiveMode({ label: mode.label, color: mode.color, bg: mode.bg, instruction: mode.instruction });
                                setTextProblem(mode.prompt);
                                setOpenSubMenu(null);
                              }}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group w-full ${mode.bg} border-transparent hover:border-current`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <mode.icon className={`w-4 h-4 ${mode.color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-[13px] font-bold ${mode.color}`}>{mode.label}</p>
                                <p className="text-[11px] text-[#666660] dark:text-[#888880] leading-tight">{mode.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Voice hint */}
              <p className="mt-8 text-[12px] text-[#BBBBBB] dark:text-[#444440] text-center">
                Tip: Click the mic icon to speak your question hands-free
              </p>
            </div>
          ) : (
            /* ── Chat messages ── */
            <div className="space-y-8 py-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-5 group ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white dark:text-black" />
                    </div>
                  )}
                  <div className={`max-w-[85%] relative ${msg.role === "user" ? "bg-[#F0F0F0] dark:bg-[#1A1A1A] px-4 py-3 rounded-2xl text-[#111110] dark:text-white" : "text-[#111110] dark:text-[#E5E5E0]"}`}>
                    {/* Image previews — supports both single (legacy) and multiple */}
                    {(msg.imagePreviews && msg.imagePreviews.length > 0) && (
                      <div className={`flex flex-wrap gap-2 mb-2 ${msg.imagePreviews.length === 1 ? "" : "max-w-[320px]"}`}>
                        {msg.imagePreviews.map((src, pi) => (
                          <img
                            key={pi}
                            src={src}
                            alt={`Image ${pi + 1}`}
                            className={`rounded-xl border border-[#E5E5E0] object-cover ${
                              msg.imagePreviews!.length === 1 ? "max-w-[240px] max-h-[200px]" :
                              msg.imagePreviews!.length <= 4 ? "w-[140px] h-[110px]" : "w-[100px] h-[80px]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {msg.imagePreview && !msg.imagePreviews && (
                      <img src={msg.imagePreview} alt="attachment" className="max-w-[240px] rounded-xl mb-2 border border-[#E5E5E0]" />
                    )}
                    <div className="text-[15px] leading-[1.6]">
                      {msg.role === "assistant" ? renderMathText(msg.content) : msg.content}
                    </div>
                    {/* Copy button */}
                    {msg.content && (
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className={`absolute -bottom-6 ${msg.role === "user" ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-[#999990] hover:text-[#444440] dark:hover:text-[#BBBBBB] py-0.5 px-2 rounded`}
                        title="Copy message"
                      >
                        {copiedIdx === idx
                          ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                          : <><Copy className="w-3 h-3" />Copy</>
                        }
                      </button>
                    )}
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
                  <div className="flex items-center gap-2 text-[#666660] text-[15px] italic">
                    <span>Thinking</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#999990] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 rounded-full bg-[#999990] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 rounded-full bg-[#999990] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
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

          {/* Live voice indicator banner */}
          {isListening && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 w-fit">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[12px] font-semibold text-red-600 dark:text-red-400">Listening</span>
              <VoiceWaveform />
              <span className="text-[11px] text-red-400 ml-1">Speak now — tap mic to stop</span>
            </div>
          )}

          {/* Attached files preview — scrollable grid of thumbnails */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 items-end">
              {attachedFiles.map(file => (
                <div key={file.id} className="relative group flex-shrink-0">
                  {file.preview ? (
                    <>
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-16 w-16 object-cover rounded-xl border border-[#E5E5E0] dark:border-[#22221F]"
                        data-testid={`img-preview-${file.id}`}
                      />
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-1.5 -right-1.5 bg-[#111110] dark:bg-white text-white dark:text-black rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title={`Remove ${file.name}`}
                        data-testid={`button-remove-file-${file.id}`}
                      >×</button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-[#F5F5F3] dark:bg-[#1A1A1A] px-3 py-1.5 rounded-xl text-xs text-[#111110] dark:text-white border border-[#E5E5E0] dark:border-[#22221F]">
                      <FileImage className="w-3 h-3 text-violet-500" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => removeFile(file.id)} className="ml-1 text-[#999] hover:text-[#111110] dark:hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {attachedFiles.length > 1 && (
                <span className="text-xs text-[#999] dark:text-[#666] self-end mb-0.5">
                  {attachedFiles.length}/{MAX_FILES}
                </span>
              )}
            </div>
          )}

          {/* Input box */}
          <div className="relative group">
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className={`relative bg-white dark:bg-[#111110] border rounded-[24px] shadow-2xl overflow-hidden transition-all ${
              isListening
                ? "border-red-300 dark:border-red-800 shadow-red-100 dark:shadow-red-950/20"
                : "border-[#E5E5E0] dark:border-[#22221F] focus-within:border-[#111110] dark:focus-within:border-[#F9F9F8]"
            }`}>
              <Textarea
                value={textProblem}
                onChange={(e) => {
                  /* If user manually edits while listening, update base so voice appends correctly */
                  if (listeningRef.current) {
                    baseTextRef.current  = e.target.value;
                    finalizedRef.current = "";
                    interimRef.current   = "";
                  }
                  setTextProblem(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                placeholder={isListening ? "Speak now — I'm listening…" : "Ask anything, or drag & drop images here…"}
                className={`w-full min-h-[60px] max-h-48 p-4 pt-5 pb-12 bg-transparent border-none focus-visible:ring-0 text-[15px] resize-none no-scrollbar ${
                  isListening ? "placeholder:text-red-400" : "placeholder:text-[#999990]"
                }`}
              />

              {/* Bottom toolbar */}
              <div className="absolute bottom-3 left-4 flex items-center gap-1">
                {/* Paperclip — open file picker */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or PDF"
                  disabled={isListening}
                  className="p-2 rounded-lg text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] hover:text-[#111110] dark:hover:text-white transition-colors disabled:opacity-40"
                  data-testid="button-attach-file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Mic — voice to text */}
                <button
                  onClick={toggleVoice}
                  title={isListening ? "Stop listening (tap to finish)" : "Start voice input"}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? "text-red-500 bg-red-50 dark:bg-red-950/30 ring-2 ring-red-200 dark:ring-red-800"
                      : "text-[#666660] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] hover:text-[#111110] dark:hover:text-white"
                  }`}
                  data-testid="button-voice-input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Char counter when getting long */}
                {textProblem.length > 200 && (
                  <span className={`text-[11px] ml-1 font-mono ${textProblem.length > 1800 ? "text-red-500" : "text-[#BBBBBB]"}`}>
                    {textProblem.length}/2000
                  </span>
                )}
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

          {/* Keyboard hint */}
          <p className="text-center text-[11px] text-[#CCCCCC] dark:text-[#333330] mt-2">
            Press <kbd className="font-mono bg-[#F0F0F0] dark:bg-[#1A1A1A] px-1 py-0.5 rounded text-[10px] text-[#666660]">Enter</kbd> to send · <kbd className="font-mono bg-[#F0F0F0] dark:bg-[#1A1A1A] px-1 py-0.5 rounded text-[10px] text-[#666660]">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
