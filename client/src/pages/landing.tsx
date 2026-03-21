import { useState, useEffect, useRef } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "wouter";
import { renderMathText } from "@/components/math-display";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Camera,
  MessageSquare,
  FileText,
  Mic,
  FileEdit,
  CheckCircle,
  Star,
  Zap,
  Shield,
  ChevronRight,
  Menu,
  X,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Users,
  PenLine,
  Eye,
  AlignLeft,
  Calculator,
  FlaskConical,
  Globe,
  RefreshCw,
  BookMarked,
  Volume2,
  Upload,
  Award,
  Database,
  LayoutDashboard,
  ClipboardCheck,
  BookCopy,
} from "lucide-react";

/* ─── Typing animation ───────────────────────────────────────── */
function useTyping(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return displayed;
}

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "/pricing" },
];

const UNIVERSITIES = [
  "Stanford",
  "MIT",
  "Harvard",
  "Yale",
  "Princeton",
  "Oxford",
  "Cambridge",
  "Columbia",
  "UCL",
  "ETH Zürich",
];

const DEMO_QUESTIONS = [
  { q: "Solve: x² + 5x + 6 = 0", subject: "Math", color: "text-blue-400" },
  { q: "Explain photosynthesis", subject: "Biology", color: "text-green-400" },
  { q: "Check my essay grammar", subject: "English", color: "text-violet-400" },
  {
    q: "Translate 'bonjour' to English",
    subject: "French",
    color: "text-orange-400",
  },
];

const FEATURES_BENTO = [
  {
    icon: MessageSquare,
    label: "AI Tutor Chat",
    size: "large",
    color: "text-violet-400",
    bg: "from-violet-900/40 to-violet-800/20",
    border: "border-violet-500/20",
    desc: "Chat with a specialist tutor 24/7. Subject modes for Math, Science, English, History, Languages. Voice input, drag-and-drop files.",
  },
  {
    icon: GraduationCap,
    label: "AI Course Creator",
    size: "large",
    color: "text-indigo-400",
    bg: "from-indigo-900/40 to-indigo-800/20",
    border: "border-indigo-500/20",
    desc: "Generate full structured courses with chapters, lessons and quizzes — on any topic, in seconds.",
  },
  {
    icon: Camera,
    label: "Photo & PDF Solver",
    size: "small",
    color: "text-fuchsia-400",
    bg: "from-fuchsia-900/40 to-fuchsia-800/20",
    border: "border-fuchsia-500/20",
    desc: "Snap or upload any problem — handwritten, printed, or PDF — and get an instant step-by-step solution.",
  },
  {
    icon: FileText,
    label: "Quiz Generator",
    size: "small",
    color: "text-emerald-400",
    bg: "from-emerald-900/40 to-emerald-800/20",
    border: "border-emerald-500/20",
    desc: "Turn notes, textbooks or PDFs into full practice quizzes with instant scoring.",
  },
  {
    icon: Mic,
    label: "Lecture Notes",
    size: "small",
    color: "text-sky-400",
    bg: "from-sky-900/40 to-sky-800/20",
    border: "border-sky-500/20",
    desc: "Record any lecture and get AI-structured study notes, summaries and key takeaways.",
  },
  {
    icon: FileEdit,
    label: "Essay Writer",
    size: "small",
    color: "text-amber-400",
    bg: "from-amber-900/40 to-amber-800/20",
    border: "border-amber-500/20",
    desc: "Plan, draft and improve essays with AI feedback on structure, argument and style.",
  },
  {
    icon: Database,
    label: "RAG Knowledge Base",
    size: "small",
    color: "text-blue-400",
    bg: "from-blue-900/40 to-blue-800/20",
    border: "border-blue-500/20",
    desc: "Answers grounded in verified textbooks with full citations — not just guesses.",
  },
  {
    icon: Award,
    label: "AI Evaluator",
    size: "small",
    color: "text-rose-400",
    bg: "from-rose-900/40 to-rose-800/20",
    border: "border-rose-500/20",
    desc: "Submit your work and get a scored, detailed review from an AI teacher perspective.",
  },
];

const SUBJECTS = [
  {
    icon: Calculator,
    label: "Mathematics",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: FlaskConical,
    label: "Physics",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    icon: Brain,
    label: "Biology",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    icon: Zap,
    label: "Chemistry",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    icon: PenLine,
    label: "Grammar",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  {
    icon: Eye,
    label: "Comprehension",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    icon: FileEdit,
    label: "Essay Writing",
    color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  },
  {
    icon: AlignLeft,
    label: "Summarise",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    icon: Globe,
    label: "Languages",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    icon: BookMarked,
    label: "History",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  {
    icon: BookOpen,
    label: "Literature",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  {
    icon: RefreshCw,
    label: "Paraphrase",
    color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  {
    icon: Volume2,
    label: "Pronunciation",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    icon: Upload,
    label: "File Upload",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  {
    icon: GraduationCap,
    label: "Courses",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    school: "Stanford",
    avatar: "SM",
    color: "from-violet-500 to-indigo-600",
    rating: 5,
    text: "TheHighGrader helped me understand calculus concepts I'd struggled with for months. The step-by-step explanations are unlike anything else.",
  },
  {
    name: "Michael R.",
    school: "MIT",
    avatar: "MR",
    color: "from-blue-500 to-cyan-600",
    rating: 5,
    text: "I went from failing physics to getting an A. The AI tutor explains things in a way textbooks never could.",
  },
  {
    name: "Emily C.",
    school: "Harvard",
    avatar: "EC",
    color: "from-fuchsia-500 to-pink-600",
    rating: 5,
    text: "The quiz generator is insane. I paste my notes and 30 seconds later I have a full practice test ready.",
  },
  {
    name: "James T.",
    school: "Oxford",
    avatar: "JT",
    color: "from-emerald-500 to-teal-600",
    rating: 5,
    text: "The AI Course Creator is a game-changer. I built an entire Python course in minutes with actual lessons and quizzes.",
  },
  {
    name: "Priya S.",
    school: "Cambridge",
    avatar: "PS",
    color: "from-amber-500 to-orange-600",
    rating: 5,
    text: "As an ESL student, the Grammar Check and Comprehension modes saved my essays. Better than any human editor.",
  },
  {
    name: "Lucas B.",
    school: "Yale",
    avatar: "LB",
    color: "from-rose-500 to-red-600",
    rating: 5,
    text: "Lecture notes from my recorded lectures — automatically structured. This is the future of studying.",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── Hero chat demo ─────────────────────────────────────────── */
function HeroDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "answer" | "pause">("typing");
  const current = DEMO_QUESTIONS[idx];

  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(
        () => setPhase("answer"),
        current.q.length * 32 + 200,
      );
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const t = setTimeout(() => setPhase("pause"), 2400);
      return () => clearTimeout(t);
    }
    if (phase === "pause") {
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % DEMO_QUESTIONS.length);
        setPhase("typing");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, current.q.length]);

  const typed = useTyping(current.q, 32);
  const displayText = phase === "typing" ? typed : current.q;

  const answers: Record<string, { steps: string[]; result: string }> = {
    "Solve: x² + 5x + 6 = 0": {
      steps: ["Factor: (x+2)(x+3) = 0", "Set each factor to zero"],
      result: "x = −2  or  x = −3",
    },
    "Explain photosynthesis": {
      steps: [
        "Plants absorb CO₂ + H₂O + sunlight",
        "Chloroplasts convert energy to glucose",
      ],
      result: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
    },
    "Check my essay grammar": {
      steps: ["Analyse sentence structure", "Identify grammar errors"],
      result: "✓ 3 corrections applied — essay improved!",
    },
    "Translate 'bonjour' to English": {
      steps: ["French → English lookup", "Context: casual greeting"],
      result: '"Hello" / "Good day"',
    },
  };
  const ans = answers[current.q];

  return (
    <div className="bg-[#111110] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A18] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-1.5 mx-auto">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[11px] font-semibold text-white/40">
            TheHighGrader AI Tutor
          </span>
        </div>
      </div>
      <div className="px-4 pt-3 pb-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={current.subject}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold ${current.color}`}
          >
            <Sparkles className="w-2.5 h-2.5" /> {current.subject} Tutor Mode
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="px-4 py-3 space-y-3 min-h-[160px]">
        <div className="flex justify-end">
          <div className="bg-white text-black text-[12px] px-3 py-2 rounded-xl rounded-br-sm max-w-[80%] font-medium">
            {displayText}
            {phase === "typing" && (
              <span className="inline-block w-0.5 h-3 bg-black ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
        <AnimatePresence>
          {(phase === "answer" || phase === "pause") && ans && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2.5 text-[11px] space-y-1.5 flex-1">
                {ans.steps.map((s, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="text-white/60 flex items-start gap-1.5"
                  >
                    <span className="text-violet-400 shrink-0 font-bold">
                      →
                    </span>{" "}
                    {s}
                  </motion.p>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ans.steps.length * 0.15 + 0.1 }}
                  className="mt-2 bg-violet-500/10 border border-violet-400/20 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-violet-300"
                >
                  {ans.result}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-[11px] text-white/20 flex-1">
            Ask anything…
          </span>
          <Mic className="w-3.5 h-3.5 text-white/20" />
          <Upload className="w-3.5 h-3.5 text-white/20" />
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Product showcase (browser frame + tabs) ────────────────── */
const PREVIEW_TABS = [
  { id: "tutor", label: "AI Tutor", icon: MessageSquare },
  { id: "courses", label: "My Courses", icon: GraduationCap },
  { id: "quiz", label: "Quiz Generator", icon: FileText },
  { id: "notes", label: "Lecture Notes", icon: Mic },
];

const COURSE_LIST = [
  {
    emoji: "📐",
    title: "Algebra Fundamentals",
    diff: "Beginner",
    progress: 65,
    active: true,
  },
  {
    emoji: "⚗️",
    title: "Organic Chemistry",
    diff: "Intermediate",
    progress: 30,
    active: false,
  },
  {
    emoji: "📜",
    title: "World History 101",
    diff: "Beginner",
    progress: 80,
    active: false,
  },
  {
    emoji: "✍️",
    title: "Creative Writing",
    diff: "Intermediate",
    progress: 15,
    active: false,
  },
  {
    emoji: "🧮",
    title: "Calculus Mastery",
    diff: "Advanced",
    progress: 45,
    active: false,
  },
];

function DashboardSidebar({ active }: { active: string }) {
  const items = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: GraduationCap },
    { id: "tutor", label: "AI Tutor", icon: MessageSquare },
    { id: "notes", label: "Lecture Notes", icon: Mic },
    { id: "quiz", label: "Quiz Generator", icon: FileText },
    { id: "essay", label: "Essay Writer", icon: FileEdit },
  ];
  return (
    <div className="w-[180px] shrink-0 border-r border-white/5 bg-[#0D0D0C] flex flex-col">
      <div className="h-10 flex items-center gap-2 px-3 border-b border-white/5">
        <img
          src={logoPath}
          alt="TheHighGrader"
          className="w-5 h-5 rounded object-cover"
        />
        <span className="text-[11px] font-bold text-white/70">
          TheHighGrader™
        </span>
      </div>
      <div className="flex-1 py-3 px-2 space-y-0.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium ${
              item.id === active
                ? "bg-white/10 text-white"
                : "text-white/35 hover:text-white/60"
            }`}
          >
            <item.icon className="w-3 h-3 shrink-0" />
            {item.label}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-white/5 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-bold text-white">
          JD
        </div>
        <div>
          <p className="text-[9px] text-white/60 font-medium leading-none">
            John Doe
          </p>
          <p className="text-[8px] text-white/30">Student</p>
        </div>
      </div>
    </div>
  );
}

function PreviewTutor() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DashboardSidebar active="tutor" />
      <div className="flex-1 flex flex-col bg-[#0A0A09] overflow-hidden">
        <div className="h-10 border-b border-white/5 flex items-center px-4">
          <span className="text-[11px] font-semibold text-white/50">
            AI Tutor
          </span>
          <div className="ml-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Calculator className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[9px] font-bold text-blue-400">
              Math Mode
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="flex justify-end">
            <div className="bg-white text-black text-[10px] px-3 py-1.5 rounded-xl rounded-br-sm max-w-[70%] font-medium">
              What is the quadratic formula?
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2 text-[9px] space-y-1.5 flex-1">
              <p className="font-bold text-white/80">The Quadratic Formula</p>
              <p className="text-white/50">
                For any equation ax² + bx + c = 0, the solutions are:
              </p>
              <div className="bg-violet-500/10 border border-violet-400/20 rounded-lg px-2 py-1.5 font-mono text-[10px] text-violet-300 text-center">
                x = (−b ± √(b²−4ac)) / 2a
              </div>
              <p className="text-white/50">
                The part under the √ is called the{" "}
                <span className="text-violet-300 font-medium">
                  discriminant
                </span>
                .
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-white text-black text-[10px] px-3 py-1.5 rounded-xl rounded-br-sm max-w-[70%] font-medium">
              Solve x² - 5x + 6 = 0 using it
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2 text-[9px] space-y-1 flex-1">
              <p className="font-bold text-white/80">Step-by-step solution</p>
              <p className="text-white/50">→ a=1, b=−5, c=6</p>
              <p className="text-white/50">→ discriminant = 25−24 = 1</p>
              <p className="text-white/50">→ x = (5 ± 1) / 2</p>
              <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg px-2 py-1 font-mono text-[10px] text-emerald-300">
                x = 3 or x = 2
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[9px] text-white/20 flex-1">
              Ask a follow-up question…
            </span>
            <Mic className="w-3 h-3 text-white/20" />
            <div className="w-5 h-5 rounded-lg bg-violet-600 flex items-center justify-center">
              <ArrowRight className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCourses() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DashboardSidebar active="courses" />
      <div className="flex-1 bg-[#0A0A09] overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-white">My Courses</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 rounded-xl text-[9px] font-bold text-white cursor-pointer">
            <Sparkles className="w-3 h-3" /> New Course
          </div>
        </div>
        <div className="space-y-2">
          {COURSE_LIST.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border ${c.active ? "bg-indigo-500/10 border-indigo-500/20" : "bg-white/[0.02] border-white/5 hover:bg-white/5"}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">
                  {c.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/30">
                    {c.progress}%
                  </span>
                </div>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  c.diff === "Beginner"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : c.diff === "Intermediate"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                {c.diff}
              </span>
              <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewQuiz() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DashboardSidebar active="quiz" />
      <div className="flex-1 bg-[#0A0A09] overflow-auto p-4">
        <h2 className="text-[13px] font-bold text-white mb-4">
          Quiz Generator
        </h2>
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 mb-3">
          <p className="text-[10px] font-semibold text-white/50 mb-2 uppercase tracking-wider">
            Paste your notes or topic
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] text-white/40 min-h-[60px]">
            Photosynthesis is the process by which green plants and some other
            organisms use sunlight, water and CO₂ to produce food...
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[9px] text-white/40">Difficulty:</span>
              {["Easy", "Medium", "Hard"].map((d, i) => (
                <span
                  key={d}
                  className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${i === 1 ? "bg-violet-500/20 border-violet-500/30 text-violet-300" : "border-white/10 text-white/30"}`}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 rounded-xl text-[9px] font-bold text-white cursor-pointer">
              <Sparkles className="w-2.5 h-2.5" /> Generate
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            {
              q: "What do plants require for photosynthesis?",
              a: "Sunlight, water and CO₂",
              correct: 1,
            },
            {
              q: "Where does photosynthesis occur in plant cells?",
              a: "The chloroplasts",
              correct: 2,
            },
          ].map((item, qi) => (
            <div
              key={qi}
              className="bg-white/[0.03] border border-white/8 rounded-xl p-3"
            >
              <p className="text-[10px] font-semibold text-white/70 mb-2">
                Q{qi + 1}: {item.q}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  "Nutrients only",
                  "Sunlight, water and CO₂",
                  "Just CO₂",
                  "Minerals",
                ]
                  .slice(0, item.correct + 1)
                  .map((opt, oi) => (
                    <div
                      key={oi}
                      className={`text-[9px] px-2 py-1 rounded-lg border ${oi === item.correct - 1 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "border-white/8 text-white/30"}`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewNotes() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DashboardSidebar active="notes" />
      <div className="flex-1 bg-[#0A0A09] overflow-auto p-4">
        <h2 className="text-[13px] font-bold text-white mb-4">Lecture Notes</h2>
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
              Record or upload audio
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-bold text-red-400">
                Recording
              </span>
            </div>
          </div>
          {/* Waveform */}
          <div className="flex items-end gap-0.5 h-8 justify-center">
            {[
              3, 5, 8, 6, 9, 4, 7, 5, 10, 6, 8, 3, 7, 9, 5, 6, 4, 8, 6, 7, 5, 9,
              4,
            ].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-violet-500/40"
                style={{ height: `${h * 3}px` }}
              />
            ))}
          </div>
          <p className="text-center text-[9px] text-white/30 mt-2">
            00:02:34 recorded
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-white/70">
              AI-Generated Notes
            </p>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Ready
            </span>
          </div>
          <div className="space-y-2 text-[9px] text-white/50">
            <p className="font-bold text-white/80 text-[10px]">
              Lecture: Introduction to Thermodynamics
            </p>
            <p>
              • <span className="font-semibold text-white/60">First Law:</span>{" "}
              Energy cannot be created or destroyed, only transferred.
            </p>
            <p>
              • <span className="font-semibold text-white/60">Second Law:</span>{" "}
              Entropy of an isolated system always increases.
            </p>
            <p>
              •{" "}
              <span className="font-semibold text-white/60">Key equation:</span>{" "}
              <span className="font-mono text-violet-300">ΔU = Q − W</span>
            </p>
            <p>• Next lecture: Heat engines and efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("tutor");

  const content: Record<string, React.ReactNode> = {
    tutor: <PreviewTutor />,
    courses: <PreviewCourses />,
    quiz: <PreviewQuiz />,
    notes: <PreviewNotes />,
  };

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60 bg-[#0A0A09]">
      {/* Browser chrome */}
      <div className="bg-[#141412] border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-1 text-[10px] text-white/25 text-center">
          thehighgrader.app/dashboard
        </div>
        {/* Tabs */}
        <div className="flex gap-1 shrink-0">
          {PREVIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* App content */}
      <div className="h-[440px] flex overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 overflow-hidden"
          >
            {content[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Interactive live demo ──────────────────────────────────── */
const DEMO_SUBJECTS = [
  {
    id: "Math",
    icon: Calculator,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "Physics",
    icon: Zap,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
  },
  {
    id: "Chemistry",
    icon: FlaskConical,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "Biology",
    icon: Brain,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
  {
    id: "English",
    icon: PenLine,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
  },
  {
    id: "History",
    icon: BookOpen,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
];

const DEMO_EXAMPLES: Record<string, string[]> = {
  Math: [
    "Solve: x² − 5x + 6 = 0",
    "Differentiate f(x) = 3x² + 2x − 1",
    "What is the quadratic formula?",
  ],
  Physics: [
    "Explain Newton's 3rd Law",
    "Calculate kinetic energy if m=5kg, v=10m/s",
    "What is Ohm's Law?",
  ],
  Chemistry: [
    "What happens in combustion?",
    "Explain ionic vs covalent bonds",
    "Balance: H₂ + O₂ → H₂O",
  ],
  Biology: [
    "Explain photosynthesis",
    "What is DNA replication?",
    "How does osmosis work?",
  ],
  English: [
    "Fix: 'Me and him went to school'",
    "Write a thesis for an essay on climate change",
    "What is a metaphor? Give an example",
  ],
  History: [
    "What caused World War 1?",
    "Explain the French Revolution in 3 points",
    "Who was Napoleon Bonaparte?",
  ],
};

const LS_KEY = "thehighgrader_demo_v1";

function loadDemoState(): { remaining: number; resetAt: number } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw)
      return { remaining: 3, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.resetAt)
      return { remaining: 3, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
    return parsed;
  } catch {
    return { remaining: 3, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
  }
}

function saveDemoState(remaining: number, resetAt: number) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ remaining, resetAt }));
  } catch {}
}

function formatResetTime(resetAt: number): string {
  const ms = resetAt - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m} minute${m !== 1 ? "s" : ""}`;
}

function DemoLockedState({ resetAt }: { resetAt: number }) {
  const [countdown, setCountdown] = useState(() => formatResetTime(resetAt));
  useEffect(() => {
    const t = setInterval(() => setCountdown(formatResetTime(resetAt)), 60000);
    return () => clearInterval(t);
  }, [resetAt]);

  return (
    <div className="h-[320px] flex flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <p className="text-[16px] font-black text-white mb-1">
          Daily demos used up
        </p>
        <p className="text-[13px] text-white/45 leading-relaxed">
          You've used all{" "}
          <span className="text-white font-semibold">3 free demos</span> for
          today.
          <br />
          Resets <span className="text-white/70 font-medium">{countdown}</span>.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500/30"
          />
        ))}
      </div>
      <a
        href="/auth?mode=register"
        className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-[14px] font-bold rounded-2xl transition-all"
      >
        Sign up for unlimited access <ArrowRight className="w-4 h-4" />
      </a>
      <p className="text-[11px] text-white/25">
        Free plan available — no credit card needed
      </p>
    </div>
  );
}

function InteractiveDemo() {
  const [subject, setSubject] = useState("Math");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState(() => loadDemoState().remaining);
  const [resetAt, setResetAt] = useState(() => loadDemoState().resetAt);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/demo/status")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.remaining === "number") {
          setRemaining(data.remaining);
          setResetAt(data.resetAt);
          saveDemoState(data.remaining, data.resetAt);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    setTimeout(
      () =>
        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        }),
      50,
    );
  };

  const askQuestion = async (q: string) => {
    if (!q.trim() || streaming || remaining <= 0) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q.trim() }]);
    setStreaming(true);
    scrollToBottom();

    let aiText = "";
    setMessages((prev) => [...prev, { role: "ai", text: "" }]);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), subject }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => prev.slice(0, -1));
        if (res.status === 429) {
          const newRemaining = 0;
          const newResetAt = err.resetAt || Date.now() + 24 * 60 * 60 * 1000;
          setRemaining(newRemaining);
          setResetAt(newResetAt);
          saveDemoState(newRemaining, newResetAt);
        } else {
          setError(err.error || "Something went wrong. Please try again.");
        }
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buf = "";
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setDone(true);
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.remaining !== undefined) {
              setRemaining(parsed.remaining);
              if (parsed.resetAt) {
                setResetAt(parsed.resetAt);
                saveDemoState(parsed.remaining, parsed.resetAt);
              }
            }
            if (parsed.text) {
              aiText += parsed.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "ai", text: aiText };
                return copy;
              });
              scrollToBottom();
            }
            if (parsed.error) {
              setMessages((prev) => prev.slice(0, -1));
              setError(parsed.error);
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setError("Connection error. Please try again.");
    }
    setStreaming(false);
    scrollToBottom();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion(input);
    }
  };

  const currentSubject = DEMO_SUBJECTS.find((s) => s.id === subject)!;
  const isLocked = remaining <= 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0D0D0C] overflow-hidden shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 bg-[#111110]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">
                Try TheHighGrader AI — no sign up needed
              </p>
              <p className="text-[11px] text-white/35">
                Ask any real question and get an instant AI answer
              </p>
            </div>
          </div>
          {!isLocked ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i < remaining ? "bg-emerald-400" : "bg-white/10"}`}
                />
              ))}
              <span className="text-[11px] font-bold text-white/40 ml-1">
                {remaining}/3 left today
              </span>
            </div>
          ) : (
            <Link href="/auth?mode=register">
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-violet-600 text-white cursor-pointer hover:bg-violet-500 transition-colors">
                Sign up for more →
              </span>
            </Link>
          )}
        </div>

        {/* Subject pills */}
        <div className="flex flex-wrap gap-2">
          {DEMO_SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSubject(s.id);
                setError(null);
              }}
              disabled={isLocked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                subject === s.id
                  ? `${s.bg} ${s.color}`
                  : "border-white/8 text-white/30 hover:text-white/60 hover:border-white/15"
              }`}
            >
              <s.icon className="w-3 h-3" />
              {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area or locked state */}
      {isLocked ? (
        <DemoLockedState resetAt={resetAt} />
      ) : (
        <>
          <div
            ref={chatRef}
            className="h-[320px] overflow-y-auto px-6 py-5 space-y-4 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${currentSubject.bg}`}
                >
                  <currentSubject.icon
                    className={`w-6 h-6 ${currentSubject.color}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-white/50 mb-1">
                    {subject} Tutor Mode
                  </p>
                  <p className="text-[12px] text-white/25">
                    Ask a question or pick an example below
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "ai" && (
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${streaming && i === messages.length - 1 ? "animate-pulse " : ""}${currentSubject.bg}`}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${currentSubject.color}`}
                    />
                  </div>
                )}
                <div
                  className={`max-w-[82%] text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white text-black px-4 py-2.5 rounded-2xl rounded-br-sm font-medium"
                      : "text-white/75"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <div>
                      {renderMathText(msg.text)}
                      {streaming && i === messages.length - 1 && (
                        <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse align-middle rounded-sm" />
                      )}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[13px] text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Example prompts */}
          <div className="px-6 pb-3">
            <div className="flex flex-wrap gap-2">
              {DEMO_EXAMPLES[subject]?.map((ex) => (
                <button
                  key={ex}
                  onClick={() => askQuestion(ex)}
                  disabled={streaming}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-white/40 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-6 pb-5">
            <div className="flex gap-3 items-end bg-white/5 border border-white/10 rounded-2xl p-3 focus-within:border-violet-500/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ask a ${subject} question… (Enter to send)`}
                disabled={streaming}
                rows={1}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 outline-none resize-none disabled:cursor-not-allowed leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={() => askQuestion(input)}
                disabled={streaming || !input.trim()}
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                data-testid="button-demo-send"
              >
                {streaming ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* After answer CTA */}
          {done && remaining < 3 && (
            <div className="mx-6 mb-5 flex items-center justify-between bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-2xl px-5 py-4 gap-3">
              <div>
                <p className="text-[14px] font-bold text-white">
                  Like what you see?
                </p>
                <p className="text-[12px] text-white/40">
                  Unlimited questions, all subjects — free forever plan
                  available.
                </p>
              </div>
              <a
                href="/auth?mode=register"
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-xl transition-all whitespace-nowrap"
              >
                Get started free <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Landing page ───────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A09] text-white overflow-x-hidden">
      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0A0A09]/95 backdrop-blur-md border-b border-white/5 shadow-xl shadow-black/20"
            : ""
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img
                src={logoPath}
                alt="TheHighGrader"
                className="w-8 h-8 rounded-xl object-cover shadow-lg"
              />
              <span className="font-bold text-[16px] tracking-tight text-white">
                TheHighGrader™
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-white/50 hover:text-white transition-colors font-medium"
                data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2.5">
            <a
              href="/auth"
              className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 font-medium"
              data-testid="button-login"
            >
              Sign in
            </a>
            <a
              href="/auth?mode=register"
              className="flex items-center gap-1.5 text-[13px] font-bold bg-white hover:bg-white/90 text-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-white/5"
              data-testid="button-signup"
            >
              Get started free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <button
            className="md:hidden p-2 text-white/50 hover:text-white"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-[#0A0A09]/98 backdrop-blur-md overflow-hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[15px] text-white/70 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="border-white/10" />
                <a
                  href="/auth"
                  className="w-full text-left text-[14px] text-white/50"
                >
                  Sign in
                </a>
                <a
                  href="/auth?mode=register"
                  className="w-full flex items-center justify-center gap-2 text-[14px] font-bold bg-white text-black py-3 rounded-xl"
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-20 left-1/4 w-[600px] h-[500px] bg-violet-600/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 text-[12px] font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI-powered
              education · 2M+ students · Free to start
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-[52px] sm:text-[66px] lg:text-[84px] font-black tracking-tight leading-[0.92] max-w-5xl mx-auto"
          >
            The smarter way
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              to learn anything.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-center text-[17px] sm:text-[19px] text-white/50 leading-relaxed max-w-xl mx-auto"
          >
            Your personal AI tutor — 24/7 for every subject. Solve problems,
            build courses, write essays and actually understand.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center justify-center"
          >
            <a
              href="/auth?mode=register"
              className="flex items-center gap-2 px-9 py-4 bg-white hover:bg-white/90 text-black text-[15px] font-bold rounded-2xl shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5"
              data-testid="button-hero-cta"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-5 flex items-center justify-center gap-6 text-[12px] text-white/30"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> No credit
              card
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> Free forever
              plan
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" /> Instant access
            </span>
          </motion.div>

          {/* Small hero demo */}
          <motion.div
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 max-w-lg mx-auto"
          >
            <HeroDemo />
          </motion.div>
        </div>

        {/* University bar */}
        <div className="mt-20 border-t border-white/5 bg-white/[0.02] py-6">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
            <span className="text-[11px] text-white/20 font-bold uppercase tracking-widest shrink-0">
              Trusted at
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {UNIVERSITIES.map((u) => (
                <span
                  key={u}
                  className="text-[13px] font-bold text-white/15 hover:text-white/40 transition-colors cursor-default"
                >
                  {u}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/5">
            {[
              { label: "Active students", display: "2M+" },
              { label: "Problems solved", display: "4.5M+" },
              { label: "Accuracy rate", display: "95%" },
              { label: "Average rating", display: "4.8★" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp(i * 0.08)}
                className="flex flex-col items-center text-center py-6 px-6"
              >
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-indigo-400 mb-1.5">
                  {s.display}
                </span>
                <span className="text-[12px] text-white/35 font-medium">
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE DEMO ════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5" id="demo">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              Live demo
            </span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              Try it right now.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {" "}
                No signup.
              </span>
            </h2>
            <p className="mt-4 text-[16px] text-white/40 max-w-md mx-auto">
              Pick a subject, ask a real question — get a real AI answer
              instantly.
            </p>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <InteractiveDemo />
          </motion.div>
        </div>
      </section>

      {/* ══ PRODUCT SHOWCASE ════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5" id="product">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              See it in action
            </span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              The actual product.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {" "}
                No fluff.
              </span>
            </h2>
            <p className="mt-4 text-[16px] text-white/40 max-w-lg mx-auto">
              Click a tab to explore the real dashboard — AI Tutor, Course
              Creator, Quiz Generator, and Lecture Notes.
            </p>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <ProductShowcase />
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES BENTO ══════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5" id="features">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              Everything you need
            </span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              One platform,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {" "}
                every subject.
              </span>
            </h2>
            <p className="mt-4 text-[16px] text-white/40 max-w-xl mx-auto leading-relaxed">
              8 powerful tools designed for students from K-12 through graduate
              school — all in one place.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_BENTO.map((f, i) => (
              <motion.div
                key={f.label}
                {...fadeUp(i * 0.06)}
                className={`group relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.bg} p-6 hover:scale-[1.02] transition-all duration-300 overflow-hidden ${i === 0 ? "lg:col-span-2" : ""}`}
                data-testid={`card-feature-${i}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/3 to-transparent" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2">
                    {f.label}
                  </h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SUBJECT MODES ═══════════════════════════════════════ */}
      <section className="py-20 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              Subject coverage
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              15+ subjects. One tutor.
            </h2>
            <p className="mt-3 text-[15px] text-white/40 max-w-md mx-auto">
              Switch between specialist AI modes instantly — each behaves like a
              real subject expert.
            </p>
          </motion.div>
          <motion.div
            {...fadeUp(0.1)}
            className="flex flex-wrap gap-2.5 justify-center"
          >
            {SUBJECTS.map((s, i) => (
              <motion.span
                key={s.label}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-semibold cursor-default hover:scale-105 transition-transform ${s.color}`}
              >
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              How it works
            </span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              From stuck to confident
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                in 3 steps.
              </span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                icon: Upload,
                title: "Upload or ask",
                desc: "Type a question, snap a photo, drag a PDF, or speak — TheHighGrader handles any format from any subject.",
              },
              {
                n: "02",
                icon: Brain,
                title: "AI understands it",
                desc: "Education-specialist AI reads context, picks the right expert mode, and crafts a tailored explanation.",
              },
              {
                n: "03",
                icon: CheckCircle,
                title: "Actually learn",
                desc: "Get step-by-step reasoning — not just answers — so you genuinely understand and can do it yourself.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                {...fadeUp(i * 0.12)}
                className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-8 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <span className="text-[48px] font-black text-white/8 leading-none">
                    {step.n}
                  </span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-[13px] text-white/40 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp(0.3)} className="mt-12 text-center">
            <a
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black text-[15px] font-bold rounded-2xl shadow-2xl shadow-white/5 transition-all hover:-translate-y-0.5"
            >
              Try it free <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5" id="testimonials">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">
              Student stories
            </span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              Loved by students
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {" "}
                at every level.
              </span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp(i * 0.07)}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
                data-testid={`card-testimonial-${i}`}
              >
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-[14px] text-white/55 leading-relaxed flex-1">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/8">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">{t.name}</p>
                    <p className="text-[11px] text-white/30">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            {...fadeUp()}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-fuchsia-600/20 border border-violet-500/20 p-12 md:p-20 text-center"
          >
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-300 text-[11px] font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Start learning today — it's
                free
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-[60px] font-black tracking-tight leading-tight mb-6">
                Your AI tutor
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  is waiting.
                </span>
              </h2>
              <p className="text-[16px] text-white/50 max-w-md mx-auto mb-10 leading-relaxed">
                Join 2 million students who use TheHighGrader to learn faster,
                understand deeper, and get better grades.
              </p>
              <div className="flex items-center justify-center">
                <a
                  href="/auth?mode=register"
                  className="flex items-center gap-2 px-10 py-4 bg-white hover:bg-white/90 text-black text-[16px] font-bold rounded-2xl shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5"
                  data-testid="button-cta-bottom"
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <p className="mt-6 text-[12px] text-white/25">
                No credit card required · Free plan available · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-[#070706] pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Top: brand + columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            {/* Brand column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src={logoPath}
                  alt="TheHighGrader"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="font-bold text-[16px] text-white">
                  TheHighGrader™
                </span>
              </div>
              <p className="text-[13px] text-white/35 leading-relaxed max-w-[220px]">
                Your personal AI tutor — helping students learn faster,
                understand deeper, and get better grades.
              </p>
            </div>
            {/* Product */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-4">
                Product
              </p>
              <ul className="space-y-3">
                {[
                  "AI Tutor",
                  "Quiz Generator",
                  "Essay Writer",
                  "Photo Solver",
                  "Lecture Notes",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/auth?mode=register"
                      className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-4">
                Company
              </p>
              <ul className="space-y-3">
                {[
                  ["Pricing", "/pricing"],
                  ["Demo", "/demo"],
                  ["Sign up", "/auth?mode=register"],
                  ["Sign in", "/auth"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-4">
                Legal
              </p>
              <ul className="space-y-3">
                {[
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                  ["Cookie Policy", "/privacy#8.-cookies"],
                  ["GDPR", "/privacy#7.-your-rights"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[13px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-white/20">
              © {new Date().getFullYear()} TheHighGrader™. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="/privacy"
                className="text-[12px] text-white/20 hover:text-white/50 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-[12px] text-white/20 hover:text-white/50 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/privacy#8.-cookies"
                className="text-[12px] text-white/20 hover:text-white/50 transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
