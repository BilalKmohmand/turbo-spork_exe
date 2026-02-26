import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { BackgroundVideo } from "@/components/background-video";
import {
  ArrowRight, Sparkles, Brain, Camera, MessageSquare,
  FileText, Mic, FileEdit, CheckCircle, Star,
  Target, Zap, Shield, ChevronDown, Menu, X,
  GraduationCap, BookOpen, Lightbulb,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = ["Features", "How it works", "Testimonials", "Pricing"];

const STATS = [
  { value: "2M+",  label: "Students" },
  { value: "4.5M+",label: "Problems Solved" },
  { value: "95%",  label: "AI Accuracy" },
  { value: "4.8★", label: "Rating" },
];

const FEATURES = [
  {
    icon: Camera,
    label: "Photo Solver",
    desc: "Snap a photo of any problem — handwritten or printed — and get an instant, step-by-step solution.",
    span: "col-span-1 row-span-1",
    accent: "from-violet-500/20 to-indigo-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: MessageSquare,
    label: "AI Tutor",
    desc: "Chat naturally with our AI tutor across Math, Science, History, Languages and more. Ask follow-up questions until everything clicks.",
    span: "col-span-1 row-span-1 md:col-span-2",
    accent: "from-fuchsia-500/20 to-violet-500/10",
    iconColor: "text-fuchsia-400",
  },
  {
    icon: FileText,
    label: "Quiz Generator",
    desc: "Turn any notes or textbook into personalized quizzes with difficulty levels and instant scoring.",
    span: "col-span-1 row-span-1 md:col-span-2",
    accent: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Mic,
    label: "Lecture Notes",
    desc: "Record any lecture and get AI-generated, structured study notes in seconds.",
    span: "col-span-1 row-span-1",
    accent: "from-sky-500/20 to-cyan-500/10",
    iconColor: "text-sky-400",
  },
  {
    icon: FileEdit,
    label: "Essay Writer",
    desc: "AI-powered outlines, drafts and feedback to help you write better essays faster.",
    span: "col-span-1 row-span-1",
    accent: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
  },
  {
    icon: GraduationCap,
    label: "Teacher Tools",
    desc: "Grade submissions, give feedback and track student progress — all in one dashboard.",
    span: "col-span-1 row-span-1",
    accent: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
  },
];

const STEPS = [
  { n: "01", icon: Camera,    title: "Upload or type",   desc: "Snap a photo of your problem or type it in directly. Any format works." },
  { n: "02", icon: Brain,     title: "AI analyses it",   desc: "Our specialized education AI understands context, subject, and difficulty." },
  { n: "03", icon: Target,    title: "Get the solution",  desc: "Receive clear, step-by-step explanations you can actually learn from." },
];

const TESTIMONIALS = [
  { name: "Sarah M.", school: "Stanford University", avatar: "SM", rating: 5, text: "Gradeio helped me understand calculus concepts I'd struggled with for months. The step-by-step explanations are unlike anything else." },
  { name: "Michael R.", school: "MIT",               avatar: "MR", rating: 5, text: "I went from failing physics to getting an A. The AI tutor explains things in a way textbooks never could." },
  { name: "Emily C.", school: "Harvard University",  avatar: "EC", rating: 5, text: "The quiz generator is insane. I paste my notes and 30 seconds later I have a full practice test ready to go." },
];

const UNIVERSITIES = ["Stanford", "MIT", "Harvard", "Yale", "Princeton", "Columbia", "Oxford", "Cambridge"];

const PERKS = [
  "Step-by-step explanations for every answer",
  "Unlimited follow-up questions",
  "Works on photos, text, and documents",
  "Specialized for K-12 through graduate school",
  "Free to start — no credit card required",
  "Available 24 hours a day, 7 days a week",
];

/* ─── Helpers ────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── Landing ────────────────────────────────────────────────── */
export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20" : ""
      }`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-600/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[15px] tracking-tight">Gradeio</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <a
                key={link}
                href={link === "Pricing" ? "/pricing" : `#${link.toLowerCase().replace(" ", "-")}`}
                className="text-[13px] text-white/50 hover:text-white/90 transition-colors"
                data-testid={`link-${link.toLowerCase().replace(" ", "-")}`}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <button className="text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5" data-testid="button-login">
                Sign in
              </button>
            </Link>
            <Link href="/auth?mode=register">
              <button
                className="flex items-center gap-1.5 text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors shadow-md shadow-violet-600/30"
                data-testid="button-signup"
              >
                Get started free
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[#09090b]/95 backdrop-blur-md overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-4">
                {NAV_LINKS.map(link => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="text-[14px] text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>
                    {link}
                  </a>
                ))}
                <hr className="border-white/10" />
                <Link href="/auth">
                  <button className="w-full text-left text-[14px] text-white/60 hover:text-white">Sign in</button>
                </Link>
                <Link href="/auth?mode=register">
                  <button className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold bg-violet-600 text-white py-2.5 rounded-lg">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col overflow-hidden">
        <BackgroundVideo video="library" overlay="darkest" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="relative z-10 flex-1 flex flex-col justify-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28 w-full">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[12px] font-medium mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Education · Free to start
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-[80px] xl:text-[88px] font-black tracking-tight leading-[0.92] max-w-4xl"
            >
              Make learning
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                effortless.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-[17px] sm:text-lg text-white/50 max-w-xl leading-relaxed"
            >
              The AI education platform that turns homework into understanding — instant solutions, step-by-step explanations, and personalized tutoring for every subject.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href="/auth?mode=register">
                <button
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-[15px] font-semibold rounded-xl shadow-xl shadow-violet-600/30 transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5"
                  data-testid="button-hero-cta"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/auth">
                <button
                  className="flex items-center gap-2 px-6 py-3 text-white/70 hover:text-white text-[15px] font-medium border border-white/15 hover:border-white/30 rounded-xl transition-all"
                  data-testid="button-hero-login"
                >
                  Sign in
                </button>
              </Link>
            </motion.div>

            {/* Micro trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex items-center gap-2 text-[12px] text-white/30"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              No credit card required
              <span className="mx-2 opacity-30">·</span>
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Free forever plan available
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/20"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* Universities bar */}
        <div className="relative z-10 border-t border-white/8 bg-white/3 backdrop-blur-sm py-5">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
            <span className="text-[11px] text-white/30 font-medium shrink-0">Trusted by students at</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {UNIVERSITIES.map(u => (
                <span key={u} className="text-[12px] font-semibold text-white/20 hover:text-white/40 transition-colors">{u}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden" id="features">
        <BackgroundVideo video="math" overlay="darkest" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/10">
            {STATS.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.1)} className="flex flex-col items-center text-center py-4 md:px-8">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-fuchsia-300 mb-2">{s.value}</span>
                <span className="text-[13px] text-white/40 font-medium">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES BENTO GRID ═════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden" id="features">
        <BackgroundVideo video="typing" overlay="darkest" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400/80 mb-3 block">Everything you need</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              One platform,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> every subject.</span>
            </h2>
            <p className="mt-4 text-[15px] text-white/40 max-w-xl mx-auto leading-relaxed">
              From instant problem solving to lecture notes — Gradeio has every tool you need to go from stuck to confident.
            </p>
          </motion.div>

          {/* Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                {...fadeUp(i * 0.08)}
                className={`group relative rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm p-6 hover:border-white/20 hover:bg-white/5 transition-all duration-300 overflow-hidden ${f.span}`}
                data-testid={`card-feature-${i}`}
              >
                {/* Gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white mb-2" data-testid={`text-feature-title-${i}`}>{f.label}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden" id="how-it-works">
        <BackgroundVideo video="neural" overlay="darkest" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-700/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400/80 mb-3 block">Process</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Done in 3 steps.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} {...fadeUp(i * 0.15)} className="relative flex flex-col items-center text-center">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] right-[-40%] h-px border-t border-dashed border-white/15" />
                )}
                <div className="relative w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                  <step.icon className="w-8 h-8 text-violet-400" />
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-violet-600 border-2 border-[#09090b] flex items-center justify-center text-[11px] font-black text-white">
                    {i + 1}
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60 mb-2">{step.n}</p>
                <h3 className="text-[17px] font-bold text-white mb-2">{step.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARISON / PERKS ══════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <BackgroundVideo video="classroom" overlay="darkest" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div {...fadeUp()}>
              <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400/80 mb-3 block">Why Gradeio</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-8">
                Smarter than
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> generic AI chatbots.</span>
              </h2>
              <div className="space-y-4">
                {PERKS.map((perk, i) => (
                  <motion.div key={i} {...fadeUp(i * 0.07)} className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-[14px] text-white/65">{perk}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/auth?mode=register">
                  <button className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-[14px] font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/25">
                    Try it free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Right — stat card */}
            <motion.div {...fadeUp(0.15)}>
              <div className="relative rounded-3xl border border-white/10 bg-white/3 backdrop-blur-md p-8 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/20 blur-[60px]" />
                <div className="relative z-10 text-center mb-8">
                  <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-violet-300 to-fuchsia-300 mb-2">95%</div>
                  <p className="text-white/40 text-[15px]">Overall Accuracy Rate</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    <span className="text-white/40 text-[13px] ml-1.5">4.8 / 5.0</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "4.5M+", label: "Problems Solved", icon: Target },
                    { value: "2M+",   label: "Happy Students",  icon: GraduationCap },
                    { value: "50+",   label: "Subjects",        icon: BookOpen },
                    { value: "24/7",  label: "Available",       icon: Zap },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 text-center border border-white/8">
                      <s.icon className="w-4 h-4 text-violet-400 mx-auto mb-2" />
                      <div className="text-[22px] font-bold text-white">{s.value}</div>
                      <div className="text-[11px] text-white/35 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden" id="testimonials">
        <BackgroundVideo video="library" overlay="darkest" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400/80 mb-3 block">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              Loved by students
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> everywhere.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.1)}
                className="relative rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm p-7 hover:border-white/20 hover:bg-white/5 transition-all flex flex-col"
                data-testid={`card-testimonial-${i}`}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[14px] text-white/60 leading-relaxed flex-1 mb-6" data-testid={`text-testimonial-${i}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-[11px] font-bold text-violet-300">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white" data-testid={`text-author-${i}`}>{t.name}</p>
                    <p className="text-[11px] text-white/35">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <BackgroundVideo video="math" overlay="darkest" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[12px] font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Start learning smarter today
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Ready to ace
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
                your studies?
              </span>
            </h2>
            <p className="text-[15px] text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
              Join over 2 million students who study smarter with Gradeio every day. Free to start, no credit card needed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth?mode=register">
                <button
                  className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white text-[15px] font-semibold rounded-xl shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
                  data-testid="button-cta-bottom"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/auth">
                <button className="flex items-center gap-2 px-7 py-3.5 text-white/60 hover:text-white text-[15px] font-medium border border-white/15 hover:border-white/30 rounded-xl transition-all">
                  Sign in
                </button>
              </Link>
            </div>
            <p className="text-[12px] text-white/20 mt-6">No credit card required · Free plan available · Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="relative border-t border-white/8 py-16 overflow-hidden">
        <BackgroundVideo video="typing" overlay="darkest" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[15px]">Gradeio</span>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed max-w-xs">
                AI-powered homework help and learning tools for students of all levels, available 24/7.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/40 mb-4">Product</h4>
              <div className="space-y-3">
                {[
                  { label: "AI Tutor",       href: "/solver" },
                  { label: "Quiz Generator", href: "/quiz" },
                  { label: "Essay Writer",   href: "/essay" },
                  { label: "Lecture Notes",  href: "/notes" },
                ].map(l => (
                  <Link key={l.label} href={l.href}>
                    <p className="text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">{l.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/40 mb-4">Tools</h4>
              <div className="space-y-3">
                {["Math Solver", "Photo Solver", "Equation Solver", "Science Tutor"].map(t => (
                  <Link key={t} href="/solver">
                    <p className="text-[13px] text-white/35 hover:text-white/70 transition-colors cursor-pointer">{t}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/40 mb-4">Company</h4>
              <div className="space-y-3">
                {["About", "Pricing", "Privacy", "Terms"].map(t => (
                  <a key={t} href={t === "Pricing" ? "/pricing" : "#"} className="block text-[13px] text-white/35 hover:text-white/70 transition-colors">{t}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
            <p>© 2025 Gradeio. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
