import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { renderMathText } from "@/components/math-display";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send, Paperclip, Sparkles, BookOpen,
  Calculator, FlaskConical, Mic, MicOff,
  User, X, FileImage, FileText, File, FileSpreadsheet,
  Atom, TestTube, Leaf, ChevronRight, Copy, Check,
  Trash2, PenLine, Eye, AlignLeft, RefreshCw, BookMarked, GraduationCap,
  Brain, Sigma, Lightbulb, ClipboardList, Clock, Plus, MessageSquare,
} from "lucide-react";

/* ─── Accepted file types ────────────────────────────────────────── */
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOC_MIMES   = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ALL_MIMES = [...IMAGE_MIMES, ...DOC_MIMES];

const FILE_INPUT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif," +
  "application/pdf," +
  ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,text/csv," +
  ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function getDocMeta(mimeType: string): { icon: any; color: string; bg: string; label: string } {
  if (mimeType === "application/pdf")
    return { icon: FileText, color: "text-red-500",   bg: "bg-red-50 dark:bg-red-950/30",   label: "PDF"  };
  if (mimeType.includes("word"))
    return { icon: FileText, color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/30", label: "DOC"  };
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType === "text/csv")
    return { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", label: "XLS" };
  return { icon: File, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/30", label: "TXT" };
}

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

/* ─── Math sub-modes ─────────────────────────────────────────────── */
const MATH_MODES: SubMode[] = [
  {
    icon: Sigma,
    label: "Step-by-Step Solver",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    desc: "Full working with numbered steps",
    prompt: "Solve: ",
    instruction: "You are an expert Math tutor. For every problem: show all working step-by-step with clear numbered steps, state the method or formula used at the start, highlight the final answer clearly, and explain any key concepts the student needs to understand. Use LaTeX notation for all mathematical expressions (e.g. $x^2 + 2x + 1$). If the problem has multiple parts, solve each part clearly.",
  },
  {
    icon: Brain,
    label: "Critical Thinking",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    desc: "Guided discovery — don't just get the answer",
    prompt: "Help me think through: ",
    instruction: "You are a Socratic math tutor focused on developing critical thinking. Do NOT immediately give the final answer. Instead: ask guiding questions that lead the student to discover the solution themselves, highlight the key reasoning step they need to unlock, explain WHY each step matters (not just what to do), point out connections to other concepts, and challenge assumptions. If the student is stuck, give a small hint — not the full answer. End with a deeper follow-up question to strengthen understanding. Use LaTeX for all maths expressions.",
  },
  {
    icon: Lightbulb,
    label: "Concept Explainer",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    desc: "Understand the 'why' behind the maths",
    prompt: "Explain the concept of: ",
    instruction: "You are an expert Math tutor focused on conceptual understanding. When explaining a mathematical concept: start with an intuitive real-world analogy, then build up to the formal definition, show how the concept connects to other ideas the student already knows, give 2–3 worked examples of increasing difficulty, highlight common misconceptions and why they're wrong, and end with a memorable summary. Use LaTeX for all mathematical expressions.",
  },
  {
    icon: ClipboardList,
    label: "Exam Technique",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    desc: "Exam strategy, mark schemes & shortcuts",
    prompt: "Help me with exam technique for: ",
    instruction: "You are an expert Math exam coach. Focus on exam performance: show exactly how a top student would lay out their answer to maximise marks, identify which formula or method examiners expect, point out common mistakes that lose marks and how to avoid them, show time-saving shortcuts where appropriate, explain how marks are allocated (method marks vs answer marks), and give a 'model answer' the student can learn from. Use LaTeX for all mathematical expressions.",
  },
];

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
    prompt: "",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    accentBorder: "border-blue-300 dark:border-blue-800",
    accentBg: "bg-blue-50 dark:bg-blue-950/20",
    subModes: MATH_MODES,
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

/* ─── Streaming cursor ───────────────────────────────────────────── */
function StreamingCursor() {
  return (
    <span
      className="inline-block w-0.5 h-[1em] bg-violet-500 ml-0.5 align-middle rounded-sm"
      style={{ animation: "cursorBlink 1s ease-in-out infinite" }}
    />
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function SolverContent() {
  const [textProblem, setTextProblem]   = useState("");
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming]   = useState(false);
  const [subMenuPopup, setSubMenuPopup] = useState<QuickPrompt | null>(null);
  const [activeMode, setActiveMode]     = useState<AIMode | null>(null);
  const [copiedIdx, setCopiedIdx]       = useState<number | null>(null);
  const [editingIdx, setEditingIdx]     = useState<number | null>(null);
  const [editText, setEditText]         = useState("");

  /* Session history state */
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory]           = useState(false);
  const queryClient = useQueryClient();

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

  /* ── Session history queries ─────────────────────────────────── */
  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/tutor-sessions"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { title: string; messages: any[]; subject?: string }) =>
      (await apiRequest("POST", "/api/tutor-sessions", data)).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tutor-sessions"] }),
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, messages, title }: { id: string; messages: any[]; title?: string }) =>
      (await apiRequest("PATCH", `/api/tutor-sessions/${id}`, { messages, title })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tutor-sessions"] }),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("DELETE", `/api/tutor-sessions/${id}`)).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tutor-sessions"] }),
  });

  /* Persist chat after AI response */
  const currentSessionIdRef = useRef<string | null>(null);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

  const saveSession = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length < 2) return; // need at least one user + one ai message
    const title = msgs[0]?.content?.slice(0, 60) || "New Conversation";
    const sessionId = currentSessionIdRef.current;
    const serialised = msgs.map(m => ({
      role: m.role,
      content: m.content,
      imagePreviews: m.imagePreviews,
    }));
    if (sessionId) {
      updateSessionMutation.mutate({ id: sessionId, messages: serialised, title });
    } else {
      createSessionMutation.mutateAsync({ title, messages: serialised }).then(s => {
        if (s?.id) {
          setCurrentSessionId(s.id);
          currentSessionIdRef.current = s.id;
        }
      });
    }
  }, []);

  /* Load a past session */
  const loadSession = useCallback((session: any) => {
    const msgs: ChatMessage[] = (session.messages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      imagePreviews: m.imagePreviews,
    }));
    setChatHistory(msgs);
    setCurrentSessionId(session.id);
    currentSessionIdRef.current = session.id;
    setShowHistory(false);
    setTextProblem("");
    setAttachedFiles([]);
    setActiveMode(null);
  }, []);

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
      // Auto-save session after streaming completes
      setChatHistory(prev => {
        saveSession(prev);
        return prev;
      });
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
      setChatHistory(prev => {
        const next = [...prev, { role: "assistant" as const, content: data.solution || "No response." }];
        saveSession(next);
        return next;
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingSolving(false);
      scrollToBottom();
    }
  };

  /* Document solve via streaming ---------------------------------- */
  const solveDocument = async (file: AttachedFile, prompt: string) => {
    const displayName = file.name;
    const userContent = prompt.trim() ? `${prompt.trim()}\n\n📎 ${displayName}` : `📎 ${displayName}`;
    const userMsg: ChatMessage = { role: "user", content: userContent };
    setChatHistory(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setAttachedFiles([]);
    setTextProblem("");

    const instruction = activeMode
      ? `[TUTOR MODE: ${activeMode.instruction}]\n\n`
      : "";

    try {
      const response = await fetch("/api/solve-image-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: file.base64,
          mimeType: file.mimeType,
          prompt: instruction + (prompt.trim() || "Analyse and explain the contents of this file in detail."),
        }),
      });
      if (!response.ok) throw new Error("Failed to process file");

      const reader  = response.body?.getReader();
      const decoder = new TextDecoder();
      let   fullText = "";

      setChatHistory(prev => [...prev, { role: "assistant", content: "" }]);

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
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process file", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      scrollToBottom();
      setChatHistory(prev => { saveSession(prev); return prev; });
    }
  };

  /* Handle submit -------------------------------------------------- */
  const handleSubmit = () => {
    if (isStreaming || isUploadingSolving) return;
    if (listeningRef.current) stopVoice();

    if (attachedFiles.length > 0) {
      const docs = attachedFiles.filter(f => !IMAGE_MIMES.includes(f.mimeType));
      const imgs = attachedFiles.filter(f => IMAGE_MIMES.includes(f.mimeType));
      if (docs.length > 0) {
        // Process first document (multiple docs → process one at a time)
        solveDocument(docs[0], textProblem);
      } else {
        solveImages(imgs, textProblem);
      }
    } else if (textProblem.trim()) {
      solveWithStreaming(textProblem.trim());
    }
  };

  /* File attachment — images + documents ------------------------- */
  const MAX_FILES = 8;

  const processFiles = (rawFiles: File[]) => {
    const remaining = MAX_FILES - attachedFiles.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${MAX_FILES} files at once.`, variant: "destructive" });
      return;
    }

    const toProcess: File[] = [];
    const unsupported: string[] = [];

    rawFiles.slice(0, remaining).forEach(file => {
      const mime = file.type || "";
      const ext  = file.name.split(".").pop()?.toLowerCase() ?? "";
      const byExt =
        ["pdf","doc","docx","txt","csv","xls","xlsx"].includes(ext) ||
        ["jpg","jpeg","png","webp","gif"].includes(ext);
      if (ALL_MIMES.includes(mime) || byExt) {
        toProcess.push(file);
      } else {
        unsupported.push(file.name);
      }
    });

    if (unsupported.length > 0) {
      toast({
        title: "Unsupported file type",
        description: `${unsupported.join(", ")} — supported: images, PDF, Word, Excel, TXT`,
        variant: "destructive",
      });
    }

    toProcess.forEach(file => {
      const sizeLimitMB = 25;
      if (file.size > sizeLimitMB * 1024 * 1024) {
        toast({ title: `${file.name} too large`, description: `Max ${sizeLimitMB} MB per file.`, variant: "destructive" });
        return;
      }
      const isImage = IMAGE_MIMES.includes(file.type);
      const reader  = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachedFiles(prev => {
          if (prev.length >= MAX_FILES) return prev;
          return [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            base64: dataUrl.split(",")[1],
            mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf"
              : file.name.match(/\.docx?$/) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : file.name.match(/\.xlsx?$/) ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/plain"),
            preview: isImage ? dataUrl : undefined,
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    if (selected.length) processFiles(selected);
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

  /* Edit message ---------------------------------------------------- */
  const startEdit = (idx: number) => {
    if (chatHistory[idx]?.role === "user") {
      setEditingIdx(idx);
      setEditText(chatHistory[idx].content);
    }
  };

  const saveEdit = async () => {
    if (editingIdx === null || !chatHistory[editingIdx]) return;
    if (!editText.trim()) {
      setEditingIdx(null);
      return;
    }

    const updated = [...chatHistory];
    updated[editingIdx].content = editText.trim();
    setChatHistory(updated);
    setEditingIdx(null);
    setEditText("");
    
    // Save to session if exists
    if (currentSessionId) {
      const serialised = updated.map(msg => ({
        ...msg,
        imagePreviews: msg.imagePreviews || []
      }));
      updateSessionMutation.mutate({ id: currentSessionId, messages: serialised });
    }
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditText("");
  };

  /* Clear conversation / new chat --------------------------------- */
  const clearChat = () => {
    setChatHistory([]);
    setTextProblem("");
    setAttachedFiles([]);
    setActiveMode(null);
    setSubMenuPopup(null);
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
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
    if (files.length) processFiles(files);
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
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
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
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">Drop files here</p>
              <p className="text-sm text-violet-500 dark:text-violet-400 mt-0.5">Images, PDF, Word, Excel, TXT — up to {MAX_FILES} files</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input — multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-0 shrink-0">
        <button
          onClick={() => setShowHistory(h => !h)}
          className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
            showHistory
              ? "bg-[#111110] dark:bg-white text-white dark:text-black"
              : "text-[#666660] hover:text-[#111110] dark:hover:text-white hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A]"
          }`}
          title="Chat history"
        >
          <Clock className="w-3.5 h-3.5" />
          History {sessions.length > 0 && <span className="ml-0.5 opacity-60">({sessions.length})</span>}
        </button>
        <div className="flex items-center gap-2">
          {chatHistory.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-[12px] text-[#999990] hover:text-[#111110] dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A]"
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>
          )}
        </div>
      </div>

      {/* History sidebar panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0 border-b border-[#E5E5E0] dark:border-[#22221F] overflow-hidden bg-[#FAFAF9] dark:bg-[#0D0D0C]"
          >
            <div className="px-6 py-3">
              <div className="max-w-3xl mx-auto">
                {sessions.length === 0 ? (
                  <p className="text-[13px] text-[#999990] py-2">No past conversations yet. Start asking questions!</p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                    {sessions.map((session: any) => {
                      const isActive = session.id === currentSessionId;
                      const msgCount = (session.messages || []).length;
                      return (
                        <div
                          key={session.id}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isActive
                              ? "bg-[#111110] dark:bg-white text-white dark:text-black"
                              : "hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A]"
                          }`}
                          onClick={() => loadSession(session)}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white/20" : "bg-[#E8E8E4] dark:bg-[#1A1A1A]"}`}>
                            <MessageSquare className={`w-3.5 h-3.5 ${isActive ? "text-white dark:text-black" : "text-[#666660]"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-medium truncate ${isActive ? "text-white dark:text-black" : "text-[#111110] dark:text-white"}`}>
                              {session.title}
                            </p>
                            <p className={`text-[11px] ${isActive ? "text-white/60 dark:text-black/60" : "text-[#999990]"}`}>
                              {msgCount} message{msgCount !== 1 ? "s" : ""} · {timeAgo(session.updatedAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSessionMutation.mutate(session.id);
                              if (session.id === currentSessionId) clearChat();
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 ${isActive ? "text-white/70 hover:text-red-300" : "text-[#999990] hover:text-red-500"}`}
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable chat area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-6">
        <div className="max-w-3xl mx-auto px-6 w-full">
          <AnimatePresence mode="wait">
          {chatHistory.length === 0 ? (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="py-20 flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#111110] dark:bg-white flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-white dark:text-black" />
              </div>
              <h2 className="text-2xl font-semibold text-[#111110] dark:text-white mb-2">How can I help you?</h2>
              <p className="text-[#666660] text-center mb-10 max-w-sm">
                Ask any question, upload a photo of your homework, or speak directly.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((item) => {
                  const hasSubMenu = !!item.subModes;
                  return (
                    <button
                      key={item.label}
                      data-testid={`quick-prompt-${item.label.toLowerCase()}`}
                      onClick={() => {
                        if (hasSubMenu) {
                          setSubMenuPopup(item);
                        } else {
                          if (item.instruction) {
                            setActiveMode({ label: item.label, color: item.color, bg: item.bg, instruction: item.instruction });
                          } else {
                            setActiveMode(null);
                          }
                          setTextProblem(item.prompt);
                        }
                      }}
                      className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] hover:bg-[#F9F9F8] dark:hover:bg-[#1A1A1A] transition-all text-left group w-full"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#F0F0F0] dark:bg-[#1A1A1A] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{item.label}</p>
                        <p className="text-[12px] text-[#999990] leading-tight">{item.desc}</p>
                      </div>
                      {hasSubMenu && (
                        <ChevronRight className="w-4 h-4 text-[#999990] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Voice hint */}
              <p className="mt-8 text-[12px] text-[#BBBBBB] dark:text-[#444440] text-center">
                Tip: Click the mic icon to speak your question hands-free
              </p>
            </motion.div>
          ) : (
            /* ── Chat messages ── */
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-6 py-4"
            >
              {chatHistory.map((msg, idx) => {
                const isLastAssistant = msg.role === "assistant" && idx === chatHistory.length - 1;
                const showCursor = isLastAssistant && (isStreaming || isUploadingSolving) && msg.content.length > 0;
                const isAssistant = msg.role === "assistant";
                const showSeparator = idx > 0 && isAssistant && chatHistory[idx - 1]?.role === "user";
                return (
                  <div key={idx}>
                    {showSeparator && (
                      <div className="flex items-center gap-3 my-2 px-1">
                        <div className="flex-1 h-px bg-[#E8E8E4] dark:bg-[#222220]" />
                        <span className="text-[10px] text-[#CCCCCC] dark:text-[#333330] tracking-widest uppercase font-medium select-none">Answer</span>
                        <div className="flex-1 h-px bg-[#E8E8E4] dark:bg-[#222220]" />
                      </div>
                    )}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-4 group ${isAssistant ? "items-start" : "justify-end items-end"}`}
                  >
                    {isAssistant && (
                      <div className={`w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5 ${showCursor ? "animate-pulse" : ""}`}>
                        <Sparkles className="w-4 h-4 text-white dark:text-black" />
                      </div>
                    )}

                    {isAssistant ? (
                      /* ── Assistant bubble — full-width card ── */
                      <div className="flex-1 min-w-0 relative group/msg">
                        {/* Image previews */}
                        {(msg.imagePreviews && msg.imagePreviews.length > 0) && (
                          <div className={`flex flex-wrap gap-2 mb-3 ${msg.imagePreviews.length === 1 ? "" : "max-w-[320px]"}`}>
                            {msg.imagePreviews.map((src, pi) => (
                              <img
                                key={pi}
                                src={src}
                                alt={`Image ${pi + 1}`}
                                className={`rounded-xl border border-[#E5E5E0] dark:border-[#2A2A28] object-cover ${
                                  msg.imagePreviews!.length === 1 ? "max-w-[240px] max-h-[200px]" :
                                  msg.imagePreviews!.length <= 4 ? "w-[140px] h-[110px]" : "w-[100px] h-[80px]"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {msg.imagePreview && !msg.imagePreviews && (
                          <img src={msg.imagePreview} alt="attachment" className="max-w-[240px] rounded-xl mb-3 border border-[#E5E5E0] dark:border-[#2A2A28]" />
                        )}
                        {/* Content card */}
                        <div className="bg-white dark:bg-[#111110] border border-[#E8E8E4] dark:border-[#222220] rounded-2xl px-5 py-4 shadow-sm">
                          <div className="text-[15px] text-[#111110] dark:text-[#E5E5E0]">
                            {renderMathText(msg.content)}
                            {showCursor && <StreamingCursor />}
                          </div>
                        </div>
                        {/* Copy button below card */}
                        {msg.content && (
                          <button
                            onClick={() => copyMessage(msg.content, idx)}
                            className="mt-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-[#999990] hover:text-[#444440] dark:hover:text-[#BBBBBB] py-0.5 px-2 rounded"
                            title="Copy message"
                          >
                            {copiedIdx === idx
                              ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                              : <><Copy className="w-3 h-3" />Copy</>
                            }
                          </button>
                        )}
                      </div>
                    ) : (
                      /* ── User bubble ── */
                      <div className="max-w-[80%] relative group/msg">
                        {/* Image previews */}
                        {(msg.imagePreviews && msg.imagePreviews.length > 0) && (
                          <div className={`flex flex-wrap gap-2 mb-2 justify-end ${msg.imagePreviews.length === 1 ? "" : "max-w-[320px]"}`}>
                            {msg.imagePreviews.map((src, pi) => (
                              <img
                                key={pi}
                                src={src}
                                alt={`Image ${pi + 1}`}
                                className={`rounded-xl border border-[#E5E5E0] dark:border-[#2A2A28] object-cover ${
                                  msg.imagePreviews!.length === 1 ? "max-w-[240px] max-h-[200px]" :
                                  msg.imagePreviews!.length <= 4 ? "w-[140px] h-[110px]" : "w-[100px] h-[80px]"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {msg.imagePreview && !msg.imagePreviews && (
                          <img src={msg.imagePreview} alt="attachment" className="max-w-[240px] rounded-xl mb-2 border border-[#E5E5E0] dark:border-[#2A2A28]" />
                        )}
                        {editingIdx === idx ? (
                          <div className="bg-[#F0F0EE] dark:bg-[#1E1E1C] px-3 py-2 rounded-2xl flex flex-col gap-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-[#E5E5E0] dark:border-[#2A2A28] bg-white dark:bg-[#111110] text-[#111110] dark:text-[#E5E5E0] text-[14px] leading-[1.65] focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                              rows={3}
                              autoFocus
                              data-testid="textarea-edit-message"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={cancelEdit}
                                className="text-[11px] px-3 py-1.5 rounded-lg text-[#999990] hover:text-[#444440] dark:hover:text-[#BBBBBB] hover:bg-[#E5E5E0] dark:hover:bg-[#2A2A28] transition-colors"
                                data-testid="button-cancel-edit"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEdit}
                                className="text-[11px] px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium"
                                data-testid="button-save-edit"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#F0F0EE] dark:bg-[#1E1E1C] px-4 py-3 rounded-2xl text-[15px] text-[#111110] dark:text-[#E5E5E0] leading-[1.65]">
                            {msg.content}
                          </div>
                        )}
                        {msg.content && editingIdx !== idx && (
                          <div className="flex justify-end mt-1.5 gap-2">
                            <button
                              onClick={() => startEdit(idx)}
                              className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-[#999990] hover:text-[#444440] dark:hover:text-[#BBBBBB] py-0.5 px-2 rounded"
                              title="Edit message"
                              data-testid={`button-edit-message-${idx}`}
                            >
                              <PenLine className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => copyMessage(msg.content, idx)}
                              className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-[#999990] hover:text-[#444440] dark:hover:text-[#BBBBBB] py-0.5 px-2 rounded"
                              title="Copy message"
                              data-testid={`button-copy-message-${idx}`}
                            >
                              {copiedIdx === idx
                                ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                                : <><Copy className="w-3 h-3" />Copy</>
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 mb-0.5 border border-violet-200 dark:border-violet-900">
                        <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                  </motion.div>
                  </div>
                );
              })}
              {/* Thinking dots — only before first tokens arrive */}
              {(isStreaming || isUploadingSolving) &&
                (chatHistory.length === 0 || chatHistory[chatHistory.length - 1]?.content === "") && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-5"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#111110] dark:bg-white flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4 text-white dark:text-black" />
                  </div>
                  <div className="flex items-center gap-2 text-[#666660] dark:text-[#888880] text-[15px]">
                    <span className="font-medium">Thinking</span>
                    <span className="flex gap-1 ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky input bar */}
      <div className="shrink-0 px-6 pb-6 pt-2 bg-white dark:bg-[#0A0A0A]">
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

          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 items-end">
              {attachedFiles.map(file => {
                const isImage = IMAGE_MIMES.includes(file.mimeType);
                const docMeta = isImage ? null : getDocMeta(file.mimeType);
                return (
                  <div key={file.id} className="relative group flex-shrink-0">
                    {isImage && file.preview ? (
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
                      /* Document card */
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] max-w-[200px]`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${docMeta?.bg}`}>
                          {docMeta && <docMeta.icon className={`w-4 h-4 ${docMeta.color}`} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#111110] dark:text-white truncate">{file.name}</p>
                          <p className={`text-[10px] font-bold uppercase ${docMeta?.color}`}>{docMeta?.label}</p>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="ml-1 text-[#999] hover:text-[#111110] dark:hover:text-white shrink-0"
                          title={`Remove ${file.name}`}
                          data-testid={`button-remove-file-${file.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                  const val = e.target.value;
                  if (val.length > 2000) return;
                  /* If user manually edits while listening, update base so voice appends correctly */
                  if (listeningRef.current) {
                    baseTextRef.current  = val;
                    finalizedRef.current = "";
                    interimRef.current   = "";
                  }
                  setTextProblem(val);
                }}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                placeholder={isListening ? "Speak now — I'm listening…" : "Ask anything, or drag & drop files here…"}
                className={`w-full min-h-[60px] max-h-48 p-4 pt-5 pb-3 bg-transparent border-none focus-visible:ring-0 text-[15px] resize-none no-scrollbar ${
                  isListening ? "placeholder:text-red-400" : "placeholder:text-[#999990]"
                }`}
              />

              {/* Bottom toolbar — flex row so it never overlaps textarea text */}
              <div className="flex items-center justify-between px-3 pb-3 pt-0">
                <div className="flex items-center gap-1">
                  {/* Paperclip — open file picker */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image, PDF, Word, Excel or TXT"
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

      {/* Sub-mode selection popup */}
      <Dialog open={!!subMenuPopup} onOpenChange={(open) => { if (!open) setSubMenuPopup(null); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-[#E5E5E0] dark:border-[#22221F]">
          {subMenuPopup && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5E5E0] dark:border-[#22221F]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subMenuPopup.bg}`}>
                    <subMenuPopup.icon className={`w-5 h-5 ${subMenuPopup.color}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-[16px] font-semibold text-[#111110] dark:text-white">
                      {subMenuPopup.label}
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-[#999990] mt-0.5">{subMenuPopup.desc}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
                {subMenuPopup.subModes!.map(mode => (
                  <button
                    key={mode.label}
                    data-testid={`sub-mode-${mode.label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => {
                      setActiveMode({ label: mode.label, color: mode.color, bg: mode.bg, instruction: mode.instruction });
                      setTextProblem(mode.prompt);
                      setSubMenuPopup(null);
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border border-transparent hover:border-current transition-all text-left group w-full ${mode.bg}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <mode.icon className={`w-4 h-4 ${mode.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-bold ${mode.color}`}>{mode.label}</p>
                      <p className="text-[11px] text-[#666660] dark:text-[#888880] leading-tight mt-0.5">{mode.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${mode.color}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
