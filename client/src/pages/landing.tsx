import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Sparkles, Brain, Camera, MessageSquare,
  FileText, Mic, FileEdit, CheckCircle, Star,
  Zap, Shield, ChevronRight, Menu, X,
  GraduationCap, BookOpen, Play, Users, Clock,
  PenLine, Eye, AlignLeft, Calculator, FlaskConical,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "/pricing" },
];

const STATS = [
  { value: "2M+",   label: "Active students",    icon: Users },
  { value: "4.5M+", label: "Problems solved",    icon: CheckCircle },
  { value: "95%",   label: "Accuracy rate",      icon: Zap },
  { value: "4.8★",  label: "Average rating",     icon: Star },
];

const FEATURES = [
  {
    icon: MessageSquare,
    label: "AI Tutor",
    desc: "Chat with a specialist AI tutor across Math, Science, English, History and Languages. Voice input, multi-image upload, and drag-and-drop files — all in one chat.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    size: "large",
    preview: "chat",
  },
  {
    icon: GraduationCap,
    label: "AI Course Creator",
    desc: "Enter any topic and get a fully structured 4–6 chapter course with lessons, quizzes and progress tracking — generated in seconds.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    size: "large",
    preview: "courses",
  },
  {
    icon: Camera,
    label: "Photo Solver",
    desc: "Snap or upload any problem — handwritten, printed or in a PDF — and get an instant step-by-step solution.",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-100",
    size: "small",
  },
  {
    icon: FileText,
    label: "Quiz Generator",
    desc: "Turn any notes, PDF or textbook into a custom quiz in seconds.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    size: "small",
  },
  {
    icon: Mic,
    label: "Lecture Notes",
    desc: "Record any lecture and get AI-structured study notes instantly.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    size: "small",
  },
  {
    icon: FileEdit,
    label: "Essay Writer",
    desc: "AI-powered outlines, drafts and feedback for better essays.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    size: "small",
  },
];

const ENGLISH_MODES = [
  { icon: PenLine,    label: "Grammar Check",    color: "text-violet-600" },
  { icon: Eye,        label: "Comprehension",    color: "text-sky-600"    },
  { icon: FileEdit,   label: "Essay Writing",    color: "text-emerald-600"},
  { icon: AlignLeft,  label: "Summarise",        color: "text-amber-600"  },
];

const SAMPLE_COURSE = {
  emoji: "📐",
  title: "Algebra Fundamentals",
  difficulty: "Beginner",
  chapters: 5,
  lessons: 20,
  progress: 40,
};

const COURSES_PREVIEW = [
  { emoji: "🧮", title: "Calculus Mastery",      difficulty: "Advanced",      progress: 70 },
  { emoji: "⚗️", title: "Organic Chemistry",    difficulty: "Intermediate",  progress: 30 },
  { emoji: "📜", title: "World History 101",    difficulty: "Beginner",      progress: 55 },
  { emoji: "✍️", title: "Creative Writing",     difficulty: "Intermediate",  progress: 20 },
];

const STEPS = [
  { n: "01", icon: Camera,  title: "Upload or type",   desc: "Snap a photo, drag-and-drop a PDF, or type your question directly. Any format works." },
  { n: "02", icon: Brain,   title: "AI analyses it",   desc: "Our education-specialist AI understands context, subject, and exactly how to explain it to you." },
  { n: "03", icon: CheckCircle, title: "Learn from it",desc: "Get clear, step-by-step explanations — not just answers — so you actually understand." },
];

const TESTIMONIALS = [
  { name: "Sarah M.",    school: "Stanford University",  avatar: "SM", rating: 5, text: "Gradeio helped me understand calculus concepts I'd struggled with for months. The step-by-step explanations are unlike anything else." },
  { name: "Michael R.",  school: "MIT",                  avatar: "MR", rating: 5, text: "I went from failing physics to getting an A. The AI tutor explains things in a way textbooks never could." },
  { name: "Emily C.",    school: "Harvard University",   avatar: "EC", rating: 5, text: "The quiz generator is insane. I paste my notes and 30 seconds later I have a full practice test ready to go." },
  { name: "James T.",    school: "Oxford University",    avatar: "JT", rating: 5, text: "The AI Course Creator is a game-changer. I created an entire Python programming course in minutes." },
];

const UNIVERSITIES = ["Stanford", "MIT", "Harvard", "Yale", "Princeton", "Oxford", "Cambridge", "Columbia"];

/* ─── Helpers ────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── Product Mock — AI Chat ─────────────────────────────────── */
function ChatMock() {
  const messages = [
    { role: "user",      text: "Solve x² + 5x + 6 = 0" },
    { role: "assistant", lines: [
        { type: "heading", text: "Step 1 — Factor the equation" },
        { type: "body",    text: "Find two numbers that multiply to 6 and add to 5 → that's 2 and 3." },
        { type: "math",    text: "(x + 2)(x + 3) = 0" },
        { type: "heading", text: "Step 2 — Solve each factor" },
        { type: "math",    text: "x = −2   or   x = −3" },
      ]
    },
  ];
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl shadow-violet-100/40 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F0EE] bg-[#FAFAF8]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-1.5 mx-auto">
          <Sparkles className="w-3 h-3 text-violet-500" />
          <span className="text-[11px] font-semibold text-[#666660]">Gradeio AI Tutor</span>
        </div>
      </div>
      {/* Mode badge */}
      <div className="px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
          <Calculator className="w-3 h-3" /> Math Tutor Mode
        </span>
      </div>
      {/* Messages */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex justify-end">
          <div className="bg-black text-white text-[12px] px-3 py-2 rounded-xl rounded-br-sm max-w-[75%]">
            Solve x² + 5x + 6 = 0
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-violet-600" />
          </div>
          <div className="bg-[#F9F9F8] rounded-xl rounded-bl-sm px-3 py-2.5 text-[11px] text-[#222] space-y-1.5 flex-1">
            <p className="font-bold text-[#111110]">Step 1 — Factor the equation</p>
            <p className="text-[#555550]">Find two numbers that multiply to 6 and add to 5 → that's 2 and 3.</p>
            <div className="bg-white border border-[#E5E5E0] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-violet-700">(x + 2)(x + 3) = 0</div>
            <p className="font-bold text-[#111110] pt-1">Step 2 — Solve each factor</p>
            <div className="bg-white border border-[#E5E5E0] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-violet-700">x = −2 &nbsp;&nbsp; or &nbsp;&nbsp; x = −3</div>
          </div>
        </div>
      </div>
      {/* Subject pills */}
      <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
        {[
          { icon: Calculator, label: "Math",     c: "bg-blue-50 text-blue-600 border-blue-100"    },
          { icon: FlaskConical, label: "Science", c: "bg-emerald-50 text-emerald-600 border-emerald-100" },
          { icon: BookOpen,   label: "English",  c: "bg-violet-50 text-violet-600 border-violet-100" },
        ].map(p => (
          <span key={p.label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${p.c}`}>
            <p.icon className="w-2.5 h-2.5" /> {p.label}
          </span>
        ))}
      </div>
      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-[#F5F5F3] rounded-xl px-3 py-2 border border-[#E5E5E0]">
          <span className="text-[11px] text-[#AAAAAA] flex-1">Ask a follow-up question…</span>
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center">
            <ArrowRight className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Course Mock ────────────────────────────────────────────── */
function CourseMock() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E0] shadow-2xl shadow-indigo-100/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F0EE] bg-[#FAFAF8]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex items-center gap-1.5 mx-auto">
          <GraduationCap className="w-3 h-3 text-indigo-500" />
          <span className="text-[11px] font-semibold text-[#666660]">My Courses</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {[SAMPLE_COURSE, ...COURSES_PREVIEW].slice(0, 4).map((c, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? "bg-indigo-50 border-indigo-100" : "bg-white border-[#F0F0EE]"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${i === 0 ? "bg-white shadow-sm" : "bg-[#F5F5F3]"}`}>
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#111110] truncate">{c.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-[#E5E5E0] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-[10px] text-[#999990] shrink-0">{c.progress}%</span>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              c.difficulty === "Beginner" ? "bg-emerald-100 text-emerald-700"
              : c.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
            }`}>{c.difficulty}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl px-3 py-2.5 cursor-pointer hover:bg-indigo-700 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          Generate new course with AI
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </div>
      </div>
    </div>
  );
}

/* ─── Landing ────────────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111110] overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E8E8E3] shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[16px] tracking-tight text-[#111110]">Gradeio</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors font-medium"
                data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/auth">
              <button className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors px-3 py-1.5 font-medium" data-testid="button-login">
                Sign in
              </button>
            </Link>
            <Link href="/auth?mode=register">
              <button
                className="flex items-center gap-1.5 text-[13px] font-semibold bg-black hover:bg-[#1A1A1A] text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                data-testid="button-signup"
              >
                Get started free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-[#666660] hover:text-[#111110]" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#E5E5E0] bg-white/98 backdrop-blur-md overflow-hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-4">
                {NAV_LINKS.map(link => (
                  <a key={link.label} href={link.href} className="text-[15px] text-[#333330] font-medium" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <hr className="border-[#E5E5E0]" />
                <Link href="/auth"><button className="w-full text-left text-[14px] text-[#666660]">Sign in</button></Link>
                <Link href="/auth?mode=register">
                  <button className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold bg-black text-white py-3 rounded-xl">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-0 bg-[#FAFAF8] overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
        <div className="absolute top-20 left-1/4 w-[500px] h-[400px] bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-[12px] font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered education · Free to start
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center text-[52px] sm:text-[64px] lg:text-[80px] font-black tracking-tight leading-[0.93] text-[#111110] max-w-4xl mx-auto"
          >
            Your personal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600">
              AI tutor
            </span>
            , 24/7
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-center text-[17px] sm:text-[18px] text-[#666660] leading-relaxed max-w-xl mx-auto"
          >
            Ask questions, solve problems, build custom courses and understand anything — across every subject, at your own pace.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/auth?mode=register">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-black hover:bg-[#1A1A1A] text-white text-[15px] font-bold rounded-2xl shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5"
                data-testid="button-hero-cta"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/auth">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 text-[#444440] text-[15px] font-semibold border border-[#E5E5E0] hover:border-[#BBBBBB] bg-white rounded-2xl transition-all hover:shadow-sm"
                data-testid="button-hero-login"
              >
                Sign in
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-5 flex items-center justify-center gap-5 text-[12px] text-[#AAAAAA]"
          >
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Free plan available</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-emerald-500" /> Instant access</span>
          </motion.div>

          {/* Product preview — two mocks side by side */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto"
          >
            <ChatMock />
            <CourseMock />
          </motion.div>
        </div>

        {/* Universities bar */}
        <div className="mt-16 border-t border-[#E8E8E3] bg-white py-5">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
            <span className="text-[11px] text-[#BBBBBB] font-semibold uppercase tracking-wider shrink-0">Trusted at</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {UNIVERSITIES.map(u => (
                <span key={u} className="text-[13px] font-bold text-[#CCCCCA] hover:text-[#888880] transition-colors">{u}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-[#E8E8E3]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#E8E8E3]">
            {STATS.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.08)} className="flex flex-col items-center text-center py-4 px-6">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-indigo-600 mb-1.5">{s.value}</span>
                <span className="text-[12px] text-[#999990] font-medium">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <section className="py-28 bg-[#FAFAF8]" id="features">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Everything you need</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">
              One platform,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600"> every subject.</span>
            </h2>
            <p className="mt-4 text-[16px] text-[#666660] max-w-xl mx-auto leading-relaxed">
              From instant homework help to full AI-generated courses — Gradeio has every tool to take you from stuck to confident.
            </p>
          </motion.div>

          {/* Large feature rows */}
          <div className="space-y-5">
            {/* Row 1 — two large cards */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* AI Tutor card */}
              <motion.div {...fadeUp(0.05)} className="group rounded-3xl border border-violet-100 bg-white p-8 hover:shadow-xl hover:shadow-violet-50 transition-all duration-300 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 to-fuchsia-50/0 group-hover:from-violet-50/60 group-hover:to-fuchsia-50/30 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#111110] mb-2">AI Tutor Chat</h3>
                  <p className="text-[14px] text-[#666660] leading-relaxed mb-6">
                    Chat with a specialist AI tutor across every subject. Voice input, drag-and-drop files, multi-image upload — and subject modes that make the AI behave like a real expert.
                  </p>
                  {/* English mode pills */}
                  <div className="flex flex-wrap gap-2">
                    {ENGLISH_MODES.map(m => (
                      <span key={m.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F3] border border-[#E5E5E0] text-[11px] font-semibold ${m.color}`}>
                        <m.icon className="w-3 h-3" />{m.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* AI Course Creator card */}
              <motion.div {...fadeUp(0.1)} className="group rounded-3xl border border-indigo-100 bg-white p-8 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-violet-50/0 group-hover:from-indigo-50/60 group-hover:to-violet-50/30 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#111110] mb-2">AI Course Creator</h3>
                  <p className="text-[14px] text-[#666660] leading-relaxed mb-6">
                    Enter any topic and get a fully structured course — chapters, lessons, knowledge-check quizzes, and progress tracking — all generated in seconds.
                  </p>
                  {/* Mini course cards */}
                  <div className="space-y-2">
                    {COURSES_PREVIEW.slice(0, 2).map((c, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#F9F9F8] rounded-xl px-3 py-2.5 border border-[#F0F0EE]">
                        <span className="text-lg">{c.emoji}</span>
                        <span className="text-[12px] font-semibold text-[#222] flex-1">{c.title}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E5E5E0] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-[#999990]">{c.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Row 2 — four small cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.filter(f => f.size === "small").map((f, i) => (
                <motion.div
                  key={f.label}
                  {...fadeUp(i * 0.07)}
                  className="group rounded-2xl border border-[#E8E8E3] bg-white p-6 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50/50 transition-all duration-300 overflow-hidden relative"
                  data-testid={`card-feature-${i}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 to-fuchsia-50/0 group-hover:from-violet-50/30 group-hover:to-fuchsia-50/10 transition-all duration-500" />
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="text-[14px] font-bold text-[#111110] mb-1.5">{f.label}</h3>
                    <p className="text-[12px] text-[#777770] leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="py-28 bg-white" id="how-it-works">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">How it works</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">
              From stuck to confident<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">in 3 steps.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} {...fadeUp(i * 0.12)} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+4px)] w-[calc(100%-8px)] h-px bg-gradient-to-r from-violet-200 to-indigo-100 z-10" />
                )}
                <div className="bg-[#FAFAF8] rounded-3xl border border-[#E8E8E3] p-8 h-full hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8E8E3] shadow-sm flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-violet-600" />
                    </div>
                    <span className="text-[40px] font-black text-[#F0F0EE]">{step.n}</span>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#111110] mb-2">{step.title}</h3>
                  <p className="text-[13px] text-[#666660] leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.3)} className="mt-12 text-center">
            <Link href="/auth?mode=register">
              <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-black hover:bg-[#1A1A1A] text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5">
                Try it for free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-28 bg-[#FAFAF8]" id="testimonials">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Student stories</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">
              Loved by students<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">everywhere.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                {...fadeUp(i * 0.08)}
                className="bg-white rounded-2xl border border-[#E8E8E3] p-6 flex flex-col gap-4 hover:shadow-lg hover:shadow-violet-50 hover:border-violet-100 transition-all duration-300"
                data-testid={`card-testimonial-${i}`}
              >
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[13px] text-[#444440] leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#F0F0EE]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#111110]">{t.name}</p>
                    <p className="text-[10px] text-[#999990]">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section className="py-28 bg-white border-t border-[#E8E8E3]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            {...fadeUp()}
            className="relative rounded-3xl bg-black text-white overflow-hidden p-12 md:p-20 text-center"
          >
            {/* BG glow */}
            <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-indigo-600/20 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 text-white/80 text-[11px] font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Start learning today
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-tight mb-6">
                Your personal AI tutor<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">is waiting.</span>
              </h2>
              <p className="text-[16px] text-white/60 max-w-md mx-auto mb-10 leading-relaxed">
                Join 2 million students who use Gradeio to learn faster, understand deeper, and get better grades.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth?mode=register">
                  <button className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-[#F5F5F5] text-black text-[15px] font-bold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5" data-testid="button-cta-bottom">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="flex items-center gap-2 px-8 py-4 border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-[15px] font-semibold rounded-2xl transition-all">
                    View pricing
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <p className="mt-6 text-[12px] text-white/40">No credit card required · Free plan available · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="bg-[#FAFAF8] border-t border-[#E8E8E3] py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-[15px] text-[#111110]">Gradeio</span>
            </div>
            <div className="flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-[12px] text-[#999990] hover:text-[#444440] transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
            <p className="text-[12px] text-[#BBBBBB]">© {new Date().getFullYear()} Gradeio. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
