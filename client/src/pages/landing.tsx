import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Sparkles, Brain, Camera, MessageSquare,
  FileText, Mic, FileEdit, CheckCircle, Star,
  Target, Zap, Shield, ChevronDown, Menu, X,
  GraduationCap, BookOpen, Lightbulb,
} from "lucide-react";
import studentHero from "@assets/stock_images/student_hero.jpg";
import studentsGroup from "@assets/stock_images/students_group.jpg";
import studentPhone from "@assets/stock_images/student_phone_homework.jpg";
import studentNotes from "@assets/stock_images/student_notes.jpg";

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
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: MessageSquare,
    label: "AI Tutor",
    desc: "Chat naturally with our AI tutor across Math, Science, History, Languages and more.",
    iconBg: "bg-fuchsia-50",
    iconColor: "text-fuchsia-600",
  },
  {
    icon: FileText,
    label: "Quiz Generator",
    desc: "Turn any notes or textbook into personalized quizzes with difficulty levels and instant scoring.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Mic,
    label: "Lecture Notes",
    desc: "Record any lecture and get AI-generated, structured study notes in seconds.",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    icon: FileEdit,
    label: "Essay Writer",
    desc: "AI-powered outlines, drafts and feedback to help you write better essays faster.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: GraduationCap,
    label: "Teacher Tools",
    desc: "Grade submissions, give feedback and track student progress — all in one dashboard.",
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
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
          ? "bg-white/90 backdrop-blur-md border-b border-[#E5E5E0] shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[15px] tracking-tight text-[#111110]">Gradeio</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <a
                key={link}
                href={link === "Pricing" ? "/pricing" : `#${link.toLowerCase().replace(" ", "-")}`}
                className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors"
                data-testid={`link-${link.toLowerCase().replace(" ", "-")}`}
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <button className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors px-3 py-1.5" data-testid="button-login">
                Sign in
              </button>
            </Link>
            <Link href="/auth?mode=register">
              <button
                className="flex items-center gap-1.5 text-[13px] font-semibold bg-black hover:bg-[#222] text-white px-4 py-1.5 rounded-lg transition-colors"
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
              className="md:hidden border-t border-[#E5E5E0] bg-white overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-4">
                {NAV_LINKS.map(link => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="text-[14px] text-[#666660] hover:text-[#111110]" onClick={() => setMenuOpen(false)}>
                    {link}
                  </a>
                ))}
                <hr className="border-[#E5E5E0]" />
                <Link href="/auth">
                  <button className="w-full text-left text-[14px] text-[#666660] hover:text-[#111110]">Sign in</button>
                </Link>
                <Link href="/auth?mode=register">
                  <button className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold bg-black text-white py-2.5 rounded-lg">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex flex-col bg-[#F9F9F8] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        <div className="absolute top-32 left-1/3 w-[600px] h-[500px] bg-violet-100/50 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          className="relative z-10 flex-1 flex flex-col justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28 w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-[12px] font-medium mb-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Education · Free to start
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl lg:text-[68px] xl:text-[76px] font-black tracking-tight leading-[0.92] text-[#111110]"
              >
                Make learning
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600">
                  effortless.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 text-[17px] sm:text-lg text-[#666660] leading-relaxed"
              >
                The AI education platform that turns homework into understanding — instant solutions, step-by-step explanations, and personalized tutoring for every subject.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link href="/auth?mode=register">
                  <button
                    className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#222] text-white text-[15px] font-semibold rounded-xl shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5"
                    data-testid="button-hero-cta"
                  >
                    Start free trial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/auth">
                  <button
                    className="flex items-center gap-2 px-6 py-3 text-[#666660] hover:text-[#111110] text-[15px] font-medium border border-[#E5E5E0] hover:border-[#999990] rounded-xl transition-all"
                    data-testid="button-hero-login"
                  >
                    Sign in
                  </button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex items-center gap-2 text-[12px] text-[#999990]"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                No credit card required
                <span className="mx-2 opacity-40">·</span>
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Free forever plan available
              </motion.div>
            </div>

            {/* Right — hero image */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-violet-200/50 border border-white/60">
                <img
                  src={studentHero}
                  alt="Student studying with Gradeio"
                  className="w-full h-[520px] object-cover"
                />
                {/* Overlay gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Floating stat badge */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                    <p className="text-[11px] font-bold text-[#999990] uppercase tracking-wider">AI solved</p>
                    <p className="text-[22px] font-black text-[#111110] leading-none">4.5M+ problems</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-[13px] font-bold text-[#111110]">4.8 / 5.0</p>
                  </div>
                </div>
              </div>
              {/* Decorative dot grid */}
              <div className="absolute -top-6 -right-6 w-32 h-32 opacity-30"
                style={{ backgroundImage: "radial-gradient(circle, #8B5CF6 1px, transparent 1px)", backgroundSize: "12px 12px" }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-[#CCCCCC]"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* Universities bar */}
        <div className="relative z-10 border-t border-[#E5E5E0] bg-white/60 backdrop-blur-sm py-5">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-10">
            <span className="text-[11px] text-[#999990] font-medium shrink-0">Trusted by students at</span>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {UNIVERSITIES.map(u => (
                <span key={u} className="text-[12px] font-semibold text-[#C0C0BB] hover:text-[#666660] transition-colors">{u}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <section className="py-20 border-b border-[#E5E5E0] bg-white" id="features">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#E5E5E0]">
            {STATS.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.1)} className="flex flex-col items-center text-center py-4 px-8">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-2">{s.value}</span>
                <span className="text-[13px] text-[#999990] font-medium">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES BENTO GRID ═════════════════════════════════ */}
      <section className="py-28 bg-[#F9F9F8]" id="features">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Everything you need</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">
              One platform,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600"> every subject.</span>
            </h2>
            <p className="mt-4 text-[15px] text-[#666660] max-w-xl mx-auto leading-relaxed">
              From instant problem solving to lecture notes — Gradeio has every tool you need to go from stuck to confident.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                {...fadeUp(i * 0.08)}
                className="group relative rounded-2xl border border-[#E5E5E0] bg-white p-6 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all duration-300 overflow-hidden"
                data-testid={`card-feature-${i}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 to-fuchsia-50/0 group-hover:from-violet-50/40 group-hover:to-fuchsia-50/20 transition-all duration-500" />
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#111110] mb-2" data-testid={`text-feature-title-${i}`}>{f.label}</h3>
                  <p className="text-[13px] text-[#666660] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section className="py-28 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Process</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">Done in 3 steps.</h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div className="space-y-12">
              {STEPS.map((step, i) => (
                <motion.div key={step.n} {...fadeUp(i * 0.15)} className="flex items-start gap-6">
                  <div className="relative w-16 h-16 rounded-2xl bg-[#F9F9F8] border border-[#E5E5E0] flex items-center justify-center shrink-0 group hover:border-violet-200 hover:bg-violet-50 transition-all">
                    <step.icon className="w-7 h-7 text-violet-600" />
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600/60 mb-1">{step.n}</p>
                    <h3 className="text-[18px] font-bold text-[#111110] mb-2">{step.title}</h3>
                    <p className="text-[14px] text-[#666660] leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Photo */}
            <motion.div {...fadeUp(0.2)} className="relative hidden lg:block">
              <div className="rounded-[28px] overflow-hidden shadow-2xl shadow-violet-100/60 border border-[#E5E5E0]">
                <img
                  src={studentPhone}
                  alt="Student using Gradeio to solve homework"
                  className="w-full h-[480px] object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-[#E5E5E0] px-5 py-4">
                <p className="text-[11px] font-bold text-[#999990] uppercase tracking-wider mb-1">Avg. solve time</p>
                <p className="text-[28px] font-black text-violet-600 leading-none">3 sec</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON / PERKS ══════════════════════════════════ */}
      <section className="py-28 bg-[#F9F9F8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()}>
              <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Why Gradeio</span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110] mb-8">
                Smarter than
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600"> generic AI chatbots.</span>
              </h2>
              <div className="space-y-4">
                {PERKS.map((perk, i) => (
                  <motion.div key={i} {...fadeUp(i * 0.07)} className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-[14px] text-[#444440]">{perk}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/auth?mode=register">
                  <button className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#222] text-white text-[14px] font-semibold rounded-xl transition-all shadow-lg shadow-black/10">
                    Try it free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.15)} className="relative">
              <div className="rounded-[28px] overflow-hidden shadow-2xl shadow-violet-100/60 border border-[#E5E5E0]">
                <img
                  src={studentNotes}
                  alt="Student taking detailed notes"
                  className="w-full h-[460px] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Floating stat badges */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                  <div className="text-[32px] font-black text-transparent bg-clip-text bg-gradient-to-b from-violet-600 to-fuchsia-600 leading-none">95%</div>
                  <p className="text-[11px] text-[#666660] mt-0.5">AI Accuracy</p>
                </div>
                <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg text-right">
                  <div className="flex gap-0.5 mb-1 justify-end">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-[13px] font-bold text-[#111110]">4.8 / 5.0</p>
                  <p className="text-[11px] text-[#999990]">Student Rating</p>
                </div>
              </div>
              {/* Dot grid decoration */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle, #8B5CF6 1px, transparent 1px)", backgroundSize: "12px 12px" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="py-28 bg-white" id="testimonials">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp()} className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 mb-3 block">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111110]">
              Loved by students
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600"> everywhere.</span>
            </h2>
          </motion.div>

          {/* Group photo banner */}
          <motion.div {...fadeUp(0.1)} className="relative rounded-[28px] overflow-hidden mb-16 shadow-xl shadow-violet-100/40">
            <img
              src={studentsGroup}
              alt="Students studying together at university"
              className="w-full h-64 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center px-10">
              <div>
                <p className="text-white/60 text-[12px] font-semibold uppercase tracking-widest mb-2">Community</p>
                <p className="text-white text-3xl font-black leading-tight">2 million+ students<br/>learning smarter.</p>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.1)}
                className="relative rounded-2xl border border-[#E5E5E0] bg-[#F9F9F8] p-7 hover:border-violet-200 hover:bg-white hover:shadow-lg hover:shadow-violet-50/50 transition-all flex flex-col"
                data-testid={`card-testimonial-${i}`}
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[14px] text-[#444440] leading-relaxed flex-1 mb-6" data-testid={`text-testimonial-${i}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-[11px] font-bold text-violet-700">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111110]" data-testid={`text-author-${i}`}>{t.name}</p>
                    <p className="text-[11px] text-[#999990]">{t.school}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section className="py-28 bg-[#111110] text-white overflow-hidden relative">
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
            <p className="text-[15px] text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
              Join over 2 million students who study smarter with Gradeio every day. Free to start, no credit card needed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth?mode=register">
                <button
                  className="flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-[#F9F9F8] text-black text-[15px] font-semibold rounded-xl shadow-2xl transition-all hover:-translate-y-0.5"
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
      <footer className="border-t border-[#E5E5E0] py-16 bg-[#F9F9F8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[15px] text-[#111110]">Gradeio</span>
              </div>
              <p className="text-[13px] text-[#999990] leading-relaxed max-w-xs">
                AI-powered homework help and learning tools for students of all levels, available 24/7.
              </p>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#999990] mb-4">Product</h4>
              <div className="space-y-3">
                {[
                  { label: "AI Tutor",       href: "/solver" },
                  { label: "Quiz Generator", href: "/quiz" },
                  { label: "Essay Writer",   href: "/essay" },
                  { label: "Lecture Notes",  href: "/notes" },
                ].map(l => (
                  <Link key={l.label} href={l.href}>
                    <p className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors cursor-pointer">{l.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#999990] mb-4">Tools</h4>
              <div className="space-y-3">
                {["Math Solver", "Photo Solver", "Equation Solver", "Science Tutor"].map(t => (
                  <Link key={t} href="/solver">
                    <p className="text-[13px] text-[#666660] hover:text-[#111110] transition-colors cursor-pointer">{t}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#999990] mb-4">Company</h4>
              <div className="space-y-3">
                {["About", "Pricing", "Privacy", "Terms"].map(t => (
                  <a key={t} href={t === "Pricing" ? "/pricing" : "#"} className="block text-[13px] text-[#666660] hover:text-[#111110] transition-colors">{t}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#999990]">
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
