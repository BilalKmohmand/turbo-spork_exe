import { useState, useRef, useEffect } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { renderMathText } from "@/components/math-display";
import {
  Sparkles, MessageSquare, GraduationCap, FileText, Mic, FileEdit,
  LayoutDashboard, ArrowRight, Calculator, FlaskConical, BookOpen,
  Globe, BookMarked, ChevronRight, Send, User, CheckCircle, XCircle,
  Play, Trophy, RotateCcw, Download, Lightbulb, Brain, Clock, Star,
  PenLine, AlignLeft, AlertCircle, Zap, Menu, X,
} from "lucide-react";

/* ─── Demo subject modes ─────────────────────────────────────── */
const DEMO_SUBJECTS = [
  { id: "Math",    icon: Calculator,   color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30"   },
  { id: "Science", icon: FlaskConical, color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30" },
  { id: "English", icon: PenLine,      color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
  { id: "History", icon: BookMarked,   color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
];
const SUBJECT_EXAMPLES: Record<string, string[]> = {
  Math:    ["Solve: x² − 7x + 12 = 0", "Differentiate y = 4x³ − 2x", "Explain the Pythagorean theorem"],
  Science: ["Explain Newton's 2nd Law", "What is oxidation?", "How does osmosis work?"],
  English: ["Fix: 'I seen him yesterday'", "Write a thesis on climate change", "What is dramatic irony?"],
  History: ["What caused WW1?", "Who was Napoleon Bonaparte?", "Explain the Cold War in 3 points"],
};

/* ─── Demo quiz data ─────────────────────────────────────────── */
const QUIZ_QUESTIONS = [
  {
    q: "What is the powerhouse of the cell?",
    opts: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    correct: 2,
    explanation: "The mitochondria produces ATP through cellular respiration, making it the cell's energy factory.",
  },
  {
    q: "Which gas do plants absorb during photosynthesis?",
    opts: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    correct: 1,
    explanation: "Plants absorb CO₂ and water, using sunlight to convert them into glucose and oxygen.",
  },
  {
    q: "What is the chemical formula for water?",
    opts: ["HO", "H₂O₂", "H₂O", "OH"],
    correct: 2,
    explanation: "Water (H₂O) consists of two hydrogen atoms and one oxygen atom bonded covalently.",
  },
  {
    q: "What does DNA stand for?",
    opts: ["Deoxyribose Nucleic Acid", "Deoxyribonucleic Acid", "Diribonucleic Acid", "Deoxyribose Nitrogen Acid"],
    correct: 1,
    explanation: "DNA (Deoxyribonucleic Acid) is the hereditary material that carries genetic instructions.",
  },
  {
    q: "How many chromosomes does a human cell have?",
    opts: ["23", "46", "44", "48"],
    correct: 1,
    explanation: "Human cells have 46 chromosomes arranged in 23 pairs (one pair from each parent).",
  },
];

/* ─── Demo courses data ──────────────────────────────────────── */
const DEMO_COURSES = [
  {
    emoji: "📐", title: "Algebra Fundamentals", diff: "Beginner", progress: 65, lessons: 12,
    chapters: [
      { title: "Introduction to Variables", lessons: ["What is a variable?", "Writing algebraic expressions", "Evaluating expressions"] },
      { title: "Solving Equations", lessons: ["One-step equations", "Two-step equations", "Multi-step equations"] },
      { title: "Linear Functions", lessons: ["Slope & gradient", "Graphing lines", "Systems of equations"] },
    ],
    sampleLesson: {
      title: "What is a variable?",
      content: `A **variable** is a letter or symbol used to represent an unknown or changing value in mathematics.

## Why do we use variables?

Variables allow us to write general rules and formulas that work for any number. For example:

- Instead of saying "add 5 to some number", we write: **x + 5**
- Instead of writing the area formula separately for every rectangle, we write: **A = l × w**

## Common variable names

| Variable | Often used for |
|----------|---------------|
| x, y, z  | Unknown values |
| n        | Natural numbers |
| t        | Time |
| A        | Area |

## Quick Check ✓

If x = 4, what is the value of **3x + 2**?

→ 3(4) + 2 = 12 + 2 = **14**`,
    },
  },
  {
    emoji: "⚗️", title: "Organic Chemistry", diff: "Intermediate", progress: 30, lessons: 18,
    chapters: [
      { title: "Carbon & Hydrocarbons", lessons: ["Carbon bonding", "Alkanes", "Alkenes & alkynes"] },
      { title: "Functional Groups", lessons: ["Alcohols", "Aldehydes & ketones", "Carboxylic acids"] },
    ],
    sampleLesson: {
      title: "Carbon bonding",
      content: `Carbon is unique because it can form **4 covalent bonds**, giving it extraordinary versatility.

## Why carbon is special

- Forms stable bonds with itself → long carbon chains
- Bonds with H, O, N, S, halogens
- Creates rings, chains and branched structures

## Types of carbon bonds

**Single bond (C-C):** Freely rotating, found in alkanes
**Double bond (C=C):** Restricted rotation, found in alkenes  
**Triple bond (C≡C):** Found in alkynes

## Hybridisation

- **sp³** → 4 single bonds → tetrahedral geometry (109.5°)
- **sp²** → 1 double + 2 single bonds → trigonal planar (120°)
- **sp** → 1 triple + 1 single bond → linear (180°)`,
    },
  },
  {
    emoji: "📜", title: "World History 101", diff: "Beginner", progress: 80, lessons: 10,
    chapters: [
      { title: "Ancient Civilisations", lessons: ["Mesopotamia", "Ancient Egypt", "Ancient Greece"] },
      { title: "Medieval World", lessons: ["The feudal system", "Crusades", "Black Death"] },
    ],
    sampleLesson: {
      title: "Mesopotamia",
      content: `Mesopotamia, meaning **"Land between the rivers"** (Tigris & Euphrates), is often called the **Cradle of Civilisation**.

## Key Achievements

🏛️ **Writing:** Invented cuneiform script (~3200 BCE)
⚖️ **Law:** Hammurabi's Code — one of the first legal systems
🌾 **Agriculture:** Developed irrigation for farming in arid land
🌆 **Cities:** Built Ur, Babylon, Nineveh

## Timeline

| ~3500 BCE | Sumerians establish first city-states |
|-----------|---------------------------------------|
| ~2334 BCE | Akkadian Empire under Sargon          |
| ~1750 BCE | Hammurabi's Code written              |
| ~539 BCE  | Babylon falls to the Persians         |

## Why it matters

Mesopotamian innovations in writing, law, mathematics and astronomy laid the groundwork for all later civilisations.`,
    },
  },
];

/* ─── Demo notes sample ──────────────────────────────────────── */
const DEMO_NOTES = `# Lecture Notes: Introduction to Thermodynamics

**Date recorded:** Today · Duration: 47 minutes · AI-generated summary

---

## Key Concepts Covered

### 1. The Laws of Thermodynamics

**Zeroth Law:** If A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C. This defines temperature.

**First Law (Conservation of Energy):**
> ΔU = Q − W

Where ΔU = change in internal energy, Q = heat added, W = work done by the system.

**Second Law:** The entropy of an isolated system always increases over time. Heat flows from hot → cold spontaneously.

**Third Law:** As temperature approaches absolute zero (0 K), entropy approaches a constant minimum.

---

### 2. Heat Engines

A heat engine converts thermal energy into mechanical work:
- Takes in heat **Q_H** from a hot reservoir
- Does work **W**
- Releases heat **Q_C** to a cold reservoir

**Efficiency:** η = W / Q_H = 1 − (T_C / T_H)  *(Carnot efficiency)*

---

### 3. Key Vocabulary

| Term | Definition |
|------|-----------|
| Entropy | Measure of disorder/randomness |
| Enthalpy | Total heat content of a system |
| Adiabatic | No heat exchange with surroundings |
| Isothermal | Constant temperature process |

---

## Summary

Thermodynamics governs energy transfer in all physical and chemical processes. The four laws set fundamental constraints on what is physically possible — no engine can be 100% efficient, and energy is always conserved.

**Next lecture:** Heat engines and refrigerators (Carnot cycle in depth)`;

/* ─── Demo essay sample ──────────────────────────────────────── */
const DEMO_ESSAY_PROMPT = "The impact of social media on academic performance";
const DEMO_ESSAY = `# The Impact of Social Media on Academic Performance

**Generated by TheHighGrader Essay Writer · 850 words**

---

## Introduction

In the digital age, social media platforms such as Instagram, TikTok and X (formerly Twitter) have become deeply embedded in the daily lives of students worldwide. While these platforms offer undeniable social benefits, a growing body of research suggests that excessive social media use correlates with diminished academic performance. This essay argues that, although social media can serve as a valuable educational tool when used appropriately, its unregulated use poses significant risks to students' focus, sleep quality and long-term academic outcomes.

---

## Body Paragraph 1: The Distraction Effect

The most immediate impact of social media on academic performance is its capacity for distraction. A 2023 study by the University of Michigan found that students who accessed social media during study sessions took an average of 23 minutes to regain full concentration after each interruption. This "attention residue" — the cognitive cost of task-switching — significantly reduces the quality of learning. Furthermore, the infinite scroll mechanism is deliberately engineered to maximise engagement, making it exceptionally difficult for students to self-regulate their usage without conscious effort.

---

## Body Paragraph 2: Sleep Deprivation

Beyond distraction during study hours, social media contributes to sleep deprivation — a well-established detriment to academic performance. The blue light emitted by screens suppresses melatonin production, delaying sleep onset. Research by the National Sleep Foundation indicates that teenagers who use social media for more than three hours daily are twice as likely to report insufficient sleep. Given that memory consolidation occurs primarily during sleep, students who sacrifice rest for social media inadvertently impair their ability to retain and apply academic knowledge.

---

## Body Paragraph 3: Educational Benefits

However, to dismiss social media entirely would be an oversimplification. Platforms such as YouTube host millions of educational videos, while study communities on Reddit and Discord facilitate peer learning and resource sharing. A 2022 UNESCO report highlighted that students who used social media for collaborative academic purposes — sharing notes, discussing assignments and accessing expert content — outperformed their peers by 12% in standardised assessments. The variable, therefore, is not social media itself but the intentionality with which it is used.

---

## Conclusion

Social media's impact on academic performance is neither uniformly negative nor positive; it is determined by the manner and extent of use. Institutions and educators must equip students with digital literacy skills that enable purposeful, time-limited social media engagement. With appropriate self-regulation strategies and school-wide policies, social media can transition from academic adversary to powerful learning ally.`;

/* ─── Sidebar ────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "overview", label: "Overview",       icon: LayoutDashboard },
  { id: "tutor",    label: "AI Tutor",       icon: MessageSquare,  badge: "Live AI" },
  { id: "courses",  label: "My Courses",     icon: GraduationCap  },
  { id: "quiz",     label: "Quiz Generator", icon: FileText       },
  { id: "notes",    label: "Lecture Notes",  icon: Mic            },
  { id: "essay",    label: "Essay Writer",   icon: FileEdit       },
];

function DemoSidebar({ active, setActive, collapsed }: { active: string; setActive: (s: string) => void; collapsed: boolean }) {
  return (
    <aside className={`flex flex-col bg-[#0D0D0C] border-r border-white/5 transition-all duration-300 shrink-0 ${collapsed ? "w-0 overflow-hidden" : "w-[220px]"}`}>
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/5 shrink-0">
        <img src={logoPath} alt="TheHighGrader" className="w-7 h-7 rounded-lg object-cover shrink-0" />
        <span className="font-bold text-[15px] text-white">TheHighGrader™</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-3 mb-2 mt-1">Platform</p>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              active === item.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {"badge" in item && item.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 p-2">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">GU</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/70 truncate">Guest User</p>
            <p className="text-[10px] text-white/30">Demo mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Overview tab ───────────────────────────────────────────── */
function DemoOverview({ setActive }: { setActive: (s: string) => void }) {
  const tools = [
    { id: "tutor",   icon: MessageSquare, label: "AI Tutor",       desc: "Ask any question",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"   },
    { id: "courses", icon: GraduationCap, label: "My Courses",     desc: "Build & learn",       color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { id: "quiz",    icon: FileText,      label: "Quiz Generator", desc: "Test your knowledge", color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
    { id: "notes",   icon: Mic,           label: "Lecture Notes",  desc: "AI from audio",       color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { id: "essay",   icon: FileEdit,      label: "Essay Writer",   desc: "Draft & improve",     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20"  },
  ];
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Welcome to TheHighGrader 👋</h2>
        <p className="text-white/40 text-[15px]">You're in demo mode. Explore all features — no account needed.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tools.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`group p-4 rounded-2xl border ${t.bg} hover:scale-[1.03] transition-all text-left`}>
            <t.icon className={`w-6 h-6 ${t.color} mb-3 group-hover:scale-110 transition-transform`} />
            <p className="text-[13px] font-bold text-white/80">{t.label}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { n: "2M+",  label: "Active students",   icon: Star,  color: "text-amber-400" },
          { n: "4.5M+",label: "Problems solved",   icon: Zap,   color: "text-violet-400" },
          { n: "95%",  label: "AI accuracy rate",  icon: CheckCircle, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.n} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <p className="text-3xl font-black text-white">{s.n}</p>
            <p className="text-[12px] text-white/35 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[16px] font-bold text-white mb-1">Ready for the real thing?</p>
          <p className="text-[13px] text-white/45">Sign up free — no credit card needed. Unlimited access starts now.</p>
        </div>
        <a href="/auth?mode=register" className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-white/90 text-black text-[14px] font-bold rounded-xl transition-all whitespace-nowrap shrink-0">
          Get started free <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

/* ─── AI Tutor tab ───────────────────────────────────────────── */
function DemoTutor() {
  const [subject, setSubject] = useState("Math");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "👋 Hi! I'm your TheHighGrader AI Tutor. Ask me anything — maths problems, science questions, essay help, or any subject. I'll give you step-by-step explanations.\n\nWhat would you like to learn today?" }
  ]);
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const scroll = () => setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 60);

  const ask = async (q: string) => {
    if (!q.trim() || streaming || remaining <= 0) return;
    setError(null);
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q.trim() }, { role: "ai", text: "" }]);
    setStreaming(true);
    scroll();
    let aiText = "";
    try {
      const res = await fetch("/api/demo-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), subject }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages(prev => prev.slice(0, -1));
        setError(err.error || "Error. Please try again.");
        if (res.status === 429) setRemaining(0);
        setStreaming(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const p = JSON.parse(payload);
            if (p.remaining !== undefined) setRemaining(p.remaining);
            if (p.text) { aiText += p.text; setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: "ai", text: aiText }; return c; }); scroll(); }
            if (p.error) { setMessages(prev => prev.slice(0, -1)); setError(p.error); }
          } catch {}
        }
      }
    } catch { setMessages(prev => prev.slice(0, -1)); setError("Connection error. Please try again."); }
    setStreaming(false);
    scroll();
  };

  const curSubject = DEMO_SUBJECTS.find(s => s.id === subject)!;

  return (
    <div className="flex flex-col h-full">
      {/* Subject + remaining */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {DEMO_SUBJECTS.map(s => (
            <button key={s.id} onClick={() => setSubject(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all ${subject === s.id ? `${s.bg} ${s.color}` : "border-white/8 text-white/30 hover:text-white/60"}`}>
              <s.icon className="w-3 h-3" />{s.id}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          {remaining > 0
            ? <span className="text-[11px] text-white/25 font-medium">{remaining} AI responses left in demo</span>
            : <Link href="/auth?mode=register"><span className="text-[11px] font-bold text-violet-400 cursor-pointer">Sign up for unlimited →</span></Link>
          }
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "ai" && (
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${streaming && i === messages.length - 1 ? "animate-pulse " : ""}${curSubject.bg}`}>
                <Sparkles className={`w-4 h-4 ${curSubject.color}`} />
              </div>
            )}
            {msg.role === "user" ? (
              <div className="max-w-[80%] text-[14px] leading-relaxed bg-white text-black px-4 py-3 rounded-2xl rounded-br-sm font-medium">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-[80%] text-[14px] leading-relaxed text-white/80">
                {renderMathText(msg.text)}
                {streaming && i === messages.length - 1 && (
                  <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse align-middle rounded-sm" />
                )}
              </div>
            )}
          </div>
        ))}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[13px] text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            {remaining === 0 && <Link href="/auth?mode=register"><span className="ml-2 font-bold underline cursor-pointer">Create free account →</span></Link>}
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-6 pb-3 flex flex-wrap gap-2">
        {(SUBJECT_EXAMPLES[subject] || []).map(ex => (
          <button key={ex} onClick={() => ask(ex)} disabled={streaming || remaining <= 0}
            className="text-[11px] px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-white/40 hover:text-white/70 transition-all disabled:opacity-30">
            {ex}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 pb-5">
        <div className="flex gap-3 items-end bg-white/5 border border-white/10 rounded-2xl p-3 focus-within:border-violet-500/40 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder={remaining > 0 ? `Ask a ${subject} question…` : "Sign up for unlimited access"}
            disabled={streaming || remaining <= 0}
            rows={1}
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/20 outline-none resize-none leading-relaxed"
          />
          <button onClick={() => ask(input)} disabled={streaming || !input.trim() || remaining <= 0}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 flex items-center justify-center transition-all shrink-0">
            {streaming ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Courses tab ────────────────────────────────────────────── */
function DemoCourses() {
  const [selected, setSelected] = useState<number | null>(null);
  const [openLesson, setOpenLesson] = useState(false);

  if (openLesson && selected !== null) {
    const course = DEMO_COURSES[selected];
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <button onClick={() => setOpenLesson(false)} className="text-white/40 hover:text-white transition-colors text-[13px] flex items-center gap-1">
            ← Back to courses
          </button>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span className="text-[13px] text-white/60">{course.title}</span>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span className="text-[13px] text-white/80 font-semibold">{course.sampleLesson.title}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-black text-white mb-6">{course.sampleLesson.title}</h1>
          <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed whitespace-pre-wrap text-[14px]">
            {course.sampleLesson.content}
          </div>
          <div className="mt-8 p-5 bg-violet-600/10 border border-violet-500/20 rounded-2xl">
            <p className="text-[13px] font-bold text-violet-300 mb-1 flex items-center gap-2"><Lightbulb className="w-4 h-4" />Want more lessons like this?</p>
            <p className="text-[12px] text-white/40 mb-3">Sign up free to access all lessons, quizzes and generate your own courses on any topic.</p>
            <a href="/auth?mode=register" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-bold rounded-xl transition-all">
              Continue learning free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (selected !== null) {
    const course = DEMO_COURSES[selected];
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors text-[13px]">← All courses</button>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span className="text-[13px] text-white/60">{course.title}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">{course.emoji}</div>
            <div>
              <h2 className="text-xl font-black text-white">{course.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${course.diff === "Beginner" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{course.diff}</span>
                <span className="text-[11px] text-white/30">{course.lessons} lessons</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {course.chapters.map((ch, ci) => (
              <div key={ci} className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <p className="text-[14px] font-bold text-white">Chapter {ci + 1}: {ch.title}</p>
                </div>
                <div className="divide-y divide-white/5">
                  {ch.lessons.map((lesson, li) => (
                    <button key={li} onClick={() => setOpenLesson(true)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/5 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${ci === 0 && li === 0 ? "bg-violet-600 text-white" : "bg-white/8 text-white/30"}`}>
                        {ci === 0 && li === 0 ? <Play className="w-3 h-3" /> : li + 1}
                      </div>
                      <span className={`text-[13px] font-medium ${ci === 0 && li === 0 ? "text-white" : "text-white/50"}`}>{lesson}</span>
                      {ci === 0 && li === 0 && <span className="ml-auto text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Preview</span>}
                      {!(ci === 0 && li === 0) && <span className="ml-auto text-[10px] text-white/20">Sign up →</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white">My Courses</h2>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 rounded-xl text-[13px] font-bold text-white cursor-not-allowed opacity-70">
          <Sparkles className="w-4 h-4" /> New Course
        </div>
      </div>
      <p className="text-[13px] text-white/35 mb-6">Sample courses — sign up to generate your own on any topic.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_COURSES.map((c, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className="group text-left p-5 bg-white/[0.03] border border-white/8 rounded-2xl hover:bg-white/[0.06] hover:border-white/15 transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">{c.emoji}</div>
              <div>
                <p className="text-[14px] font-bold text-white leading-tight">{c.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${c.diff === "Beginner" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{c.diff}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-white/30 mb-1">
                <span>Progress</span><span>{c.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${c.progress}%` }} />
              </div>
            </div>
            <p className="text-[11px] text-white/30 mt-3">{c.lessons} lessons</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Quiz tab ───────────────────────────────────────────────── */
function DemoQuiz() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showExp, setShowExp] = useState(false);

  const score = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].correct).length;
  const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);

  const pick = (opt: number) => {
    if (submitted) return;
    const newAns = [...answers];
    newAns[current] = opt;
    setAnswers(newAns);
  };

  const reset = () => { setStarted(false); setCurrent(0); setAnswers(Array(QUIZ_QUESTIONS.length).fill(null)); setSubmitted(false); setShowExp(false); };

  if (!started) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white">Cell Biology Quiz</h2>
        <p className="text-[15px] text-white/45">5 questions · Multiple choice · Auto-scored</p>
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-left space-y-2">
          {[`${QUIZ_QUESTIONS.length} multiple choice questions`, "Instant scoring & explanations", "Try again as many times as you like"].map(f => (
            <p key={f} className="flex items-center gap-2.5 text-[13px] text-white/55">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />{f}
            </p>
          ))}
        </div>
        <button onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all text-[15px]">
          <Play className="w-5 h-5" /> Start Quiz
        </button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${pct >= 80 ? "bg-emerald-500/20 border-2 border-emerald-500/30" : pct >= 60 ? "bg-amber-500/20 border-2 border-amber-500/30" : "bg-red-500/20 border-2 border-red-500/30"}`}>
            <Trophy className={`w-10 h-10 ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`} />
          </div>
          <h2 className="text-3xl font-black text-white">{pct}%</h2>
          <p className="text-[15px] text-white/45 mt-1">{score} / {QUIZ_QUESTIONS.length} correct</p>
          <p className={`text-[14px] font-bold mt-2 ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
            {pct >= 80 ? "Excellent! 🎉" : pct >= 60 ? "Good effort! Keep going 💪" : "Keep practising — you've got this! 📚"}
          </p>
        </div>
        <div className="space-y-3">
          {QUIZ_QUESTIONS.map((q, i) => {
            const correct = answers[i] === q.correct;
            return (
              <div key={i} className={`p-4 rounded-2xl border ${correct ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-start gap-2.5 mb-2">
                  {correct ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <p className="text-[13px] font-semibold text-white/80">{q.q}</p>
                </div>
                {!correct && <p className="text-[12px] text-white/40 ml-6">Correct: <span className="text-emerald-400 font-medium">{q.opts[q.correct]}</span></p>}
                <p className="text-[11px] text-white/30 ml-6 mt-1">{q.explanation}</p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/8 border border-white/10 text-white font-semibold rounded-2xl transition-all text-[14px] hover:bg-white/15">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <a href="/auth?mode=register" className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all text-[14px]">
            Generate my own quizzes <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );

  const q = QUIZ_QUESTIONS[current];
  return (
    <div className="flex flex-col h-full p-6">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${((current) / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="text-[12px] text-white/35 shrink-0 font-medium">{current + 1} / {QUIZ_QUESTIONS.length}</span>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <h3 className="text-[19px] font-bold text-white mb-6">{q.q}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {q.opts.map((opt, oi) => {
            const picked = answers[current] === oi;
            return (
              <button key={oi} onClick={() => pick(oi)}
                className={`p-4 rounded-2xl border text-left text-[14px] font-medium transition-all ${picked ? "bg-violet-600/20 border-violet-500/40 text-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/8 hover:text-white hover:border-white/20"}`}>
                <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold mr-2 ${picked ? "bg-violet-600 text-white" : "bg-white/10 text-white/40"}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-auto">
          {current > 0 && (
            <button onClick={() => setCurrent(c => c - 1)} className="px-5 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-2xl hover:bg-white/10 transition-all">
              ← Back
            </button>
          )}
          {current < QUIZ_QUESTIONS.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} disabled={answers[current] === null}
              className="flex-1 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all disabled:opacity-30">
              Next →
            </button>
          ) : (
            <button onClick={() => setSubmitted(true)} disabled={answers.some(a => a === null)}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all disabled:opacity-30">
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Notes tab ──────────────────────────────────────────────── */
function DemoNotes() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-white">Lecture Notes</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">Sample output</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 border border-white/10 text-white/60 text-[12px] font-medium rounded-xl hover:bg-white/15 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download .txt
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-[13px] text-violet-300 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
            <span>In the real app, record any lecture with your microphone and TheHighGrader automatically generates structured notes like these. <Link href="/auth?mode=register"><span className="font-bold underline cursor-pointer">Sign up free to try it →</span></Link></span>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 font-mono text-[13px] text-white/65 leading-relaxed whitespace-pre-wrap">
            {DEMO_NOTES}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Essay tab ──────────────────────────────────────────────── */
function DemoEssay() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-white">Essay Writer</h2>
        <span className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">Sample output</span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">Essay prompt</p>
            <p className="text-[15px] font-semibold text-white">"{DEMO_ESSAY_PROMPT}"</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[13px] text-amber-300 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Sign up to generate essays on any topic — choose word count, academic level and essay type. <Link href="/auth?mode=register"><span className="font-bold underline cursor-pointer">Start free →</span></Link></span>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 text-[14px] text-white/65 leading-relaxed whitespace-pre-wrap">
            {DEMO_ESSAY}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main demo page ─────────────────────────────────────────── */
export default function DemoPage() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find(i => i.id === active)?.label ?? "Overview";

  const content: Record<string, React.ReactNode> = {
    overview: <DemoOverview setActive={setActive} />,
    tutor:    <DemoTutor />,
    courses:  <DemoCourses />,
    quiz:     <DemoQuiz />,
    notes:    <DemoNotes />,
    essay:    <DemoEssay />,
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A09] text-white overflow-hidden">

      {/* ── Demo banner ── */}
      <div className="bg-violet-600 text-white text-center py-2.5 px-4 flex items-center justify-center gap-3 shrink-0 text-[13px] font-medium">
        <Sparkles className="w-4 h-4" />
        You're exploring the TheHighGrader demo — all features available, no account needed.
        <Link href="/auth?mode=register">
          <span className="font-bold underline cursor-pointer hover:text-violet-200 transition-colors">Sign up free for full access →</span>
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (desktop) ── */}
        <DemoSidebar active={active} setActive={id => { setActive(id); setSidebarOpen(false); }} collapsed={false} />

        {/* ── Mobile sidebar overlay ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} transition={{ type: "spring", damping: 25 }}
                className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
                <DemoSidebar active={active} setActive={id => { setActive(id); setSidebarOpen(false); }} collapsed={false} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-[#0A0A09]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-white/40 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-[15px] font-semibold text-white">{activeLabel}</h1>
              {active === "tutor" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Live AI</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-[13px] text-white/40 hover:text-white transition-colors">← Back to site</a>
              <a href="/auth?mode=register" className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/90 text-black text-[13px] font-bold rounded-xl transition-all">
                Sign up free <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </header>

          {/* Tab content */}
          <main className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden flex flex-col"
              >
                {content[active]}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
