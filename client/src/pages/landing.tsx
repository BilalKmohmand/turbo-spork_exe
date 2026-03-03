import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Sparkles, Brain, Camera, MessageSquare,
  FileText, Mic, FileEdit, CheckCircle, Star,
  Zap, Shield, ChevronRight, Menu, X,
  GraduationCap, BookOpen, Users, PenLine, Eye,
  AlignLeft, Calculator, FlaskConical, Globe, RefreshCw,
  BookMarked, Volume2, Upload, Award, Database,
} from "lucide-react";

/* ─── Animated counter ───────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); return; }
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Typing animation hook ──────────────────────────────────── */
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
  { label: "Features",    href: "#features"    },
  { label: "How it works",href: "#how-it-works"},
  { label: "Testimonials",href: "#testimonials"},
  { label: "Pricing",     href: "/pricing"     },
];

const UNIVERSITIES = ["Stanford","MIT","Harvard","Yale","Princeton","Oxford","Cambridge","Columbia","UCL","ETH Zürich"];

const DEMO_QUESTIONS = [
  { q: "Solve: x² + 5x + 6 = 0",       subject: "Math",    color: "text-blue-400"  },
  { q: "Explain photosynthesis",          subject: "Biology", color: "text-green-400" },
  { q: "Check my essay grammar",          subject: "English", color: "text-violet-400"},
  { q: "Translate 'bonjour' to English",  subject: "French",  color: "text-orange-400"},
];

const FEATURES_BENTO = [
  {
    icon: MessageSquare, label: "AI Tutor Chat", size: "col-span-2",
    color: "text-violet-400", bg: "from-violet-900/40 to-violet-800/20", border: "border-violet-500/20",
    desc: "Chat with a specialist tutor 24/7. Subject modes for Math, Science, English, History, Languages. Voice input, drag-and-drop files.",
  },
  {
    icon: GraduationCap, label: "AI Course Creator", size: "col-span-1",
    color: "text-indigo-400", bg: "from-indigo-900/40 to-indigo-800/20", border: "border-indigo-500/20",
    desc: "Generate full structured courses with chapters, lessons and quizzes — on any topic, in seconds.",
  },
  {
    icon: Camera, label: "Photo & PDF Solver", size: "col-span-1",
    color: "text-fuchsia-400", bg: "from-fuchsia-900/40 to-fuchsia-800/20", border: "border-fuchsia-500/20",
    desc: "Snap or upload any problem — handwritten, printed, or PDF — and get an instant step-by-step solution.",
  },
  {
    icon: FileText, label: "Quiz Generator", size: "col-span-1",
    color: "text-emerald-400", bg: "from-emerald-900/40 to-emerald-800/20", border: "border-emerald-500/20",
    desc: "Turn notes, textbooks or PDFs into full practice quizzes with instant scoring.",
  },
  {
    icon: Mic, label: "Lecture Notes", size: "col-span-1",
    color: "text-sky-400", bg: "from-sky-900/40 to-sky-800/20", border: "border-sky-500/20",
    desc: "Record any lecture and get AI-structured study notes, summaries and key takeaways.",
  },
  {
    icon: FileEdit, label: "Essay Writer", size: "col-span-1",
    color: "text-amber-400", bg: "from-amber-900/40 to-amber-800/20", border: "border-amber-500/20",
    desc: "Plan, draft and improve essays with AI feedback on structure, argument and style.",
  },
  {
    icon: Database, label: "RAG Knowledge Base", size: "col-span-1",
    color: "text-blue-400", bg: "from-blue-900/40 to-blue-800/20", border: "border-blue-500/20",
    desc: "Answers grounded in verified textbooks with full citations — not just guesses.",
  },
  {
    icon: Award, label: "AI Evaluator", size: "col-span-1",
    color: "text-rose-400", bg: "from-rose-900/40 to-rose-800/20", border: "border-rose-500/20",
    desc: "Submit your work and get a scored, detailed review from an AI teacher perspective.",
  },
];

const SUBJECTS = [
  { icon: Calculator, label: "Mathematics",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20"    },
  { icon: FlaskConical,label: "Physics",       color: "bg-sky-500/10 text-sky-400 border-sky-500/20"       },
  { icon: Brain,       label: "Biology",       color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { icon: Zap,         label: "Chemistry",     color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { icon: PenLine,     label: "Grammar",       color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { icon: Eye,         label: "Comprehension", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { icon: FileEdit,    label: "Essay Writing", color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" },
  { icon: AlignLeft,   label: "Summarise",     color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { icon: Globe,       label: "Languages",     color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { icon: BookMarked,  label: "History",       color: "bg-rose-500/10 text-rose-400 border-rose-500/20"   },
  { icon: BookOpen,    label: "Literature",    color: "bg-pink-500/10 text-pink-400 border-pink-500/20"   },
  { icon: RefreshCw,   label: "Paraphrase",    color: "bg-teal-500/10 text-teal-400 border-teal-500/20"   },
  { icon: Volume2,     label: "Pronunciation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"   },
  { icon: Upload,      label: "File Upload",   color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { icon: GraduationCap,label:"Courses",       color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

const COMPARISON = [
  { feature: "Subject specialist AI modes",   gradeio: true,  chatgpt: false, generic: false },
  { feature: "AI Course Creator",             gradeio: true,  chatgpt: false, generic: false },
  { feature: "Photo & PDF solver",            gradeio: true,  chatgpt: "partial", generic: false },
  { feature: "Voice input",                   gradeio: true,  chatgpt: false, generic: false },
  { feature: "Lecture notes from audio",      gradeio: true,  chatgpt: false, generic: false },
  { feature: "Teacher grading dashboard",     gradeio: true,  chatgpt: false, generic: false },
  { feature: "Drag & drop any file type",     gradeio: true,  chatgpt: false, generic: false },
  { feature: "Knowledge base with citations", gradeio: true,  chatgpt: false, generic: false },
  { feature: "Free to start",                 gradeio: true,  chatgpt: "partial", generic: false },
];

const TESTIMONIALS = [
  { name: "Sarah M.",   school: "Stanford",  avatar: "SM", color: "from-violet-500 to-indigo-600", rating: 5, text: "Gradeio helped me understand calculus concepts I'd struggled with for months. The step-by-step explanations are unlike anything else." },
  { name: "Michael R.", school: "MIT",       avatar: "MR", color: "from-blue-500 to-cyan-600",     rating: 5, text: "I went from failing physics to getting an A. The AI tutor explains things in a way textbooks never could." },
  { name: "Emily C.",   school: "Harvard",   avatar: "EC", color: "from-fuchsia-500 to-pink-600",  rating: 5, text: "The quiz generator is insane. I paste my notes and 30 seconds later I have a full practice test ready." },
  { name: "James T.",   school: "Oxford",    avatar: "JT", color: "from-emerald-500 to-teal-600",  rating: 5, text: "The AI Course Creator is a game-changer. I built an entire Python course in minutes. Actual lessons, quizzes, everything." },
  { name: "Priya S.",   school: "Cambridge", avatar: "PS", color: "from-amber-500 to-orange-600",  rating: 5, text: "As an ESL student, the Grammar Check and Comprehension modes saved my essays. Better than any human editor." },
  { name: "Lucas B.",   school: "Yale",      avatar: "LB", color: "from-rose-500 to-red-600",      rating: 5, text: "Lecture notes from my recorded lectures — automatically structured. This is the future of studying." },
];

const STEPS = [
  { n: "01", icon: Upload,       title: "Upload or ask",    desc: "Type a question, snap a photo, drag a PDF, or speak — Gradeio handles any format from any subject." },
  { n: "02", icon: Brain,        title: "AI understands it", desc: "Education-specialist AI reads context, picks the right expert mode, and crafts a tailored explanation." },
  { n: "03", icon: CheckCircle,  title: "Actually learn",   desc: "Get step-by-step reasoning — not just answers — so you genuinely understand and can do it yourself next time." },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── Animated hero chat demo ────────────────────────────────── */
function HeroDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "answer" | "pause">("typing");
  const current = DEMO_QUESTIONS[idx];

  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(() => setPhase("answer"), current.q.length * 32 + 200);
      return () => clearTimeout(t);
    }
    if (phase === "answer") {
      const t = setTimeout(() => setPhase("pause"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "pause") {
      const t = setTimeout(() => {
        setIdx(i => (i + 1) % DEMO_QUESTIONS.length);
        setPhase("typing");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, current.q.length]);

  const typed = useTyping(phase !== "typing" ? current.q : current.q, 32);
  const displayText = phase === "typing" ? typed : current.q;

  const answers: Record<string, { steps: string[]; result: string }> = {
    "Solve: x² + 5x + 6 = 0":        { steps: ["Factor: (x+2)(x+3) = 0","Set each factor to 0"], result: "x = −2  or  x = −3" },
    "Explain photosynthesis":          { steps: ["Plants absorb CO₂ + H₂O + sunlight","Chloroplasts convert to glucose"], result: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
    "Check my essay grammar":          { steps: ["Analyse sentence structure","Identify grammar errors"], result: "✓ 3 corrections applied — essay improved!" },
    "Translate 'bonjour' to English":  { steps: ["French → English lookup","Context: casual greeting"], result: '"Hello" / "Good day"' },
  };
  const ans = answers[current.q];

  return (
    <div className="bg-[#111110] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A18] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-1.5 mx-auto">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[11px] font-semibold text-white/40">Gradeio AI Tutor</span>
        </div>
      </div>

      {/* Subject badge */}
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

      {/* Messages */}
      <div className="px-4 py-3 space-y-3 min-h-[160px]">
        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-white text-black text-[12px] px-3 py-2 rounded-xl rounded-br-sm max-w-[80%] font-medium">
            {displayText}
            {phase === "typing" && <span className="inline-block w-0.5 h-3 bg-black ml-0.5 animate-pulse" />}
          </div>
        </div>

        {/* AI response */}
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
                    <span className="text-violet-400 shrink-0 font-bold">→</span> {s}
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

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-[11px] text-white/20 flex-1">Ask anything…</span>
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
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0A0A09]/95 backdrop-blur-md border-b border-white/5 shadow-xl shadow-black/20" : ""
      }`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-[16px] tracking-tight text-white">Gradeio</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="text-[13px] text-white/50 hover:text-white transition-colors font-medium" data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/auth">
              <button className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 font-medium" data-testid="button-login">
                Sign in
              </button>
            </Link>
            <Link href="/auth?mode=register">
              <button className="flex items-center gap-1.5 text-[13px] font-bold bg-white hover:bg-white/90 text-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-white/5" data-testid="button-signup">
                Get started free <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-white/50 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-[#0A0A09]/98 backdrop-blur-md overflow-hidden">
              <div className="px-5 py-5 flex flex-col gap-4">
                {NAV_LINKS.map(link => (
                  <a key={link.label} href={link.href} className="text-[15px] text-white/70 font-medium" onClick={() => setMenuOpen(false)}>{link.label}</a>
                ))}
                <hr className="border-white/10" />
                <Link href="/auth"><button className="w-full text-left text-[14px] text-white/50">Sign in</button></Link>
                <Link href="/auth?mode=register">
                  <button className="w-full flex items-center justify-center gap-2 text-[14px] font-bold bg-white text-black py-3 rounded-xl">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* BG grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-[600px] h-[500px] bg-violet-600/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 text-[12px] font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI-powered education · 2M+ students · Free to start
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-[52px] sm:text-[66px] lg:text-[84px] font-black tracking-tight leading-[0.92] max-w-5xl mx-auto"
          >
            The smarter way<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              to learn anything.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-center text-[17px] sm:text-[19px] text-white/50 leading-relaxed max-w-xl mx-auto"
          >
            Your personal AI tutor — available 24/7 for every subject. Solve problems, build courses, write essays, take quizzes and actually understand.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth?mode=register">
              <button className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black text-[15px] font-bold rounded-2xl shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5" data-testid="button-hero-cta">
                Start learning for free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/auth">
              <button className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-[15px] font-semibold rounded-2xl transition-all" data-testid="button-hero-login">
                Sign in
              </button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-5 flex items-center justify-center gap-6 text-[12px] text-white/30">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-500" /> Instant access</span>
          </motion.div>

          {/* Hero demo */}
          <motion.div
            initial={{ opacity: 0, y: 56 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 max-w-lg mx-auto"
          >
            <HeroDemo />
          </motion.div>
        </div>

        {/* University bar */}
        <div className="mt-20 border-t border-white/5 bg-white/[0.02] py-6">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
            <span className="text-[11px] text-white/20 font-bold uppercase tracking-widest shrink-0">Trusted at</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {UNIVERSITIES.map(u => (
                <span key={u} className="text-[13px] font-bold text-white/15 hover:text-white/40 transition-colors cursor-default">{u}</span>
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
              { label: "Active students",  to: 2000000,  suffix: "+",  display: "2M+"   },
              { label: "Problems solved",  to: 4500000,  suffix: "+",  display: "4.5M+" },
              { label: "Accuracy rate",    to: 95,       suffix: "%",  display: "95%"   },
              { label: "Average rating",   to: 48,       suffix: "",   display: "4.8★"  },
            ].map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.08)} className="flex flex-col items-center text-center py-6 px-6">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-indigo-400 mb-1.5">
                  {s.display}
                </span>
                <span className="text-[12px] text-white/35 font-medium">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES BENTO ══════════════════════════════════════ */}
      <section className="py-28" id="features">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">Everything you need</span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              One platform,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"> every subject.</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/40 max-w-xl mx-auto leading-relaxed">
              8 powerful tools designed for students from K-12 through graduate school — all in one place.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_BENTO.map((f, i) => (
              <motion.div
                key={f.label}
                {...fadeUp(i * 0.06)}
                className={`group relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.bg} p-6 hover:scale-[1.02] transition-all duration-300 overflow-hidden ${i === 0 ? "lg:col-span-2" : ""}`}
                data-testid={`card-feature-${i}`}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/3 to-transparent" />
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2">{f.label}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SUBJECT MODES SHOWCASE ══════════════════════════════ */}
      <section className="py-20 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">Subject coverage</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              15+ subjects. One tutor.
            </h2>
            <p className="mt-3 text-[15px] text-white/40 max-w-md mx-auto">
              Switch between specialist AI modes instantly — each one behaves like a real subject expert.
            </p>
          </motion.div>
          <motion.div {...fadeUp(0.1)} className="flex flex-wrap gap-2.5 justify-center">
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
      <section className="py-28" id="how-it-works">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">How it works</span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              From stuck to confident
              <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">in 3 steps.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} {...fadeUp(i * 0.12)}
                className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-8 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <span className="text-[48px] font-black text-white/8 leading-none">{step.n}</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-2">{step.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.3)} className="mt-12 text-center">
            <Link href="/auth?mode=register">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black text-[15px] font-bold rounded-2xl shadow-2xl shadow-white/5 transition-all hover:-translate-y-0.5">
                Try it free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">Why Gradeio</span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              Built for education,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"> not just chat.</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/40 max-w-lg mx-auto">
              Generic AI chatbots aren't built for learning. Gradeio is.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-white/5 border-b border-white/10 px-6 py-4 text-[12px] font-bold">
              <div className="text-white/40 uppercase tracking-widest">Feature</div>
              <div className="text-center text-violet-400 uppercase tracking-widest">Gradeio</div>
              <div className="text-center text-white/30 uppercase tracking-widest">ChatGPT</div>
              <div className="text-center text-white/30 uppercase tracking-widest">Generic AI</div>
            </div>
            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <motion.div
                key={row.feature}
                {...fadeUp(i * 0.04)}
                className={`grid grid-cols-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
              >
                <div className="text-[13px] text-white/60 font-medium flex items-center">{row.feature}</div>
                <div className="flex items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  {row.chatgpt === true ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  ) : row.chatgpt === "partial" ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Partial</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <X className="w-3 h-3 text-white/20" />
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  {row.generic === true ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <X className="w-3 h-3 text-white/20" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5" id="testimonials">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3 block">Student stories</span>
            <h2 className="text-4xl sm:text-[52px] font-black tracking-tight">
              Loved by students
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"> at every level.</span>
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
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[14px] text-white/55 leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/8">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
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

      {/* ══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            {...fadeUp()}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-fuchsia-600/20 border border-violet-500/20 p-12 md:p-20 text-center"
          >
            {/* BG decoration */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 text-violet-300 text-[11px] font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Start learning today — it's free
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-[60px] font-black tracking-tight leading-tight mb-6">
                Your AI tutor
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">is waiting.</span>
              </h2>
              <p className="text-[16px] text-white/50 max-w-md mx-auto mb-10 leading-relaxed">
                Join 2 million students who use Gradeio to learn faster, understand deeper, and get better grades.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth?mode=register">
                  <button className="flex items-center gap-2 px-9 py-4 bg-white hover:bg-white/90 text-black text-[16px] font-bold rounded-2xl shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5" data-testid="button-cta-bottom">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="flex items-center gap-2 px-9 py-4 border border-white/15 hover:border-white/30 text-white/60 hover:text-white text-[16px] font-semibold rounded-2xl transition-all">
                    View pricing <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <p className="mt-6 text-[12px] text-white/25">No credit card required · Free plan available · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-[15px] text-white">Gradeio</span>
            </div>
            <div className="flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-[12px] text-white/25 hover:text-white/60 transition-colors">{link.label}</a>
              ))}
            </div>
            <p className="text-[12px] text-white/20">© {new Date().getFullYear()} Gradeio. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
