import { useState } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Sparkles, X, Zap, Shield, Star, Menu } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

const PLANS = [
  {
    name: "Free",
    price: { monthly: "$0", annual: "$0" },
    period: "forever",
    desc: "Perfect for trying out TheHighGrader",
    highlight: false,
    border: "border-white/10",
    bg: "bg-white/[0.03]",
    cta: "Get started free",
    ctaStyle: "bg-white/8 hover:bg-white/15 text-white border border-white/15",
    href: "/auth?mode=register",
    features: [
      { text: "5 AI Tutor messages per day",   included: true  },
      { text: "Basic subject modes",            included: true  },
      { text: "Photo & PDF solver",             included: true  },
      { text: "Quiz Generator (3/day)",         included: true  },
      { text: "Lecture Notes (1/day)",          included: true  },
      { text: "AI Course Creator",              included: false },
      { text: "Unlimited follow-up questions",  included: false },
      { text: "Essay Writer",                   included: false },
      { text: "RAG Knowledge Base",             included: false },
      { text: "AI Evaluator (Teacher)",         included: false },
    ],
  },
  {
    name: "Pro",
    price: { monthly: "$9.99", annual: "$7.99" },
    period: "/ month",
    desc: "Everything you need to excel at every subject",
    highlight: true,
    border: "border-violet-500/40",
    bg: "bg-gradient-to-b from-violet-600/15 to-indigo-600/10",
    cta: "Start free trial",
    ctaStyle: "bg-white text-black hover:bg-white/90 font-bold shadow-xl shadow-violet-500/20",
    href: "/auth?mode=register",
    features: [
      { text: "Unlimited AI Tutor messages",    included: true },
      { text: "All 15+ subject modes",          included: true },
      { text: "Photo & PDF solver",             included: true },
      { text: "Unlimited Quiz Generator",       included: true },
      { text: "Unlimited Lecture Notes",        included: true },
      { text: "AI Course Creator",              included: true },
      { text: "Unlimited follow-up questions",  included: true },
      { text: "Essay Writer",                   included: true },
      { text: "RAG Knowledge Base",             included: true },
      { text: "Priority support",               included: true },
    ],
  },
  {
    name: "Team",
    price: { monthly: "$19.99", annual: "$15.99" },
    period: "/ month",
    desc: "For study groups, tutors and small institutions",
    highlight: false,
    border: "border-white/10",
    bg: "bg-white/[0.03]",
    cta: "Contact sales",
    ctaStyle: "bg-white/8 hover:bg-white/15 text-white border border-white/15",
    href: "/auth?mode=register",
    features: [
      { text: "Everything in Pro",              included: true },
      { text: "Up to 10 users",                 included: true },
      { text: "AI Evaluator (Teacher tools)",   included: true },
      { text: "Shared course library",          included: true },
      { text: "Progress analytics dashboard",   included: true },
      { text: "Team knowledge base",            included: true },
      { text: "Admin controls",                 included: true },
      { text: "API access",                     included: true },
      { text: "Dedicated support",              included: true },
      { text: "Custom onboarding",              included: true },
    ],
  },
];

const FAQS = [
  { q: "Is there a free plan?", a: "Yes — TheHighGrader's Free plan is available forever with no credit card required. You get 5 AI Tutor messages per day, basic subject modes, and access to the Photo Solver and Quiz Generator." },
  { q: "Can I cancel anytime?", a: "Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees or lock-in periods." },
  { q: "What subjects does TheHighGrader support?", a: "TheHighGrader supports 15+ subjects including Mathematics, Physics, Chemistry, Biology, English (Grammar, Essay, Comprehension), History, Literature, and multiple Languages." },
  { q: "Is TheHighGrader suitable for teachers?", a: "Yes! The Team plan includes the AI Evaluator, which lets teachers review and grade student submissions with AI-assisted scoring and feedback. You can also build a shared course library." },
  { q: "How does billing work?", a: "You'll be billed monthly or annually depending on your chosen plan. Annual billing saves up to 20%. All payments are processed securely." },
];

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A09] text-white overflow-x-hidden">
      {/* BG grid */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="fixed top-0 left-1/3 w-[700px] h-[500px] bg-violet-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-white/5 bg-[#0A0A09]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoPath} alt="TheHighGrader" className="w-8 h-8 rounded-xl object-cover shadow-lg" />
              <span className="font-bold text-[16px] tracking-tight">TheHighGrader™</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth"><button className="text-[13px] text-white/50 hover:text-white px-3 py-1.5" data-testid="button-pricing-login">Sign in</button></Link>
            <Link href="/auth?mode=register">
              <button className="flex items-center gap-1.5 text-[13px] font-bold bg-white hover:bg-white/90 text-black px-4 py-2 rounded-xl transition-all" data-testid="button-pricing-trial">
                Start free <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">

        {/* ── Hero ── */}
        <div className="pt-20 pb-16 text-center px-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 text-[12px] font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> 7-day free trial · No credit card required
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
            className="text-[52px] sm:text-[64px] font-black tracking-tight leading-tight mb-4">
            Simple, honest<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">pricing.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[18px] text-white/45 max-w-md mx-auto mb-8">
            Start free. Upgrade when you're ready. Cancel anytime.
          </motion.p>

          {/* Billing toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all ${billing === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2 ${billing === "annual" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">-20%</span>
            </button>
          </motion.div>
        </div>

        {/* ── Plan cards ── */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name} {...fadeUp(i * 0.1)}
                className={`relative rounded-3xl border ${plan.border} ${plan.bg} p-8 ${plan.highlight ? "ring-1 ring-violet-500/30 shadow-2xl shadow-violet-500/10" : ""}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 rounded-full text-[11px] font-bold text-white shadow-lg shadow-violet-500/30">
                      <Star className="w-3 h-3 fill-white" /> Most popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-[13px] font-bold text-white/50 uppercase tracking-wider mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-[44px] font-black text-white leading-none">{plan.price[billing]}</span>
                    {plan.name !== "Free" && <span className="text-[14px] text-white/40 mb-1.5">{plan.period}</span>}
                  </div>
                  {plan.name !== "Free" && billing === "annual" && (
                    <p className="text-[11px] text-emerald-400 font-semibold">Save 20% with annual billing</p>
                  )}
                  <p className="text-[13px] text-white/40 mt-2">{plan.desc}</p>
                </div>
                <Link href={plan.href}>
                  <button className={`w-full py-3 rounded-2xl text-[14px] font-bold transition-all mb-6 ${plan.ctaStyle}`} data-testid={`button-plan-${plan.name.toLowerCase()}`}>
                    {plan.cta}
                  </button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5">
                      {f.included ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 shrink-0" />
                      )}
                      <span className={`text-[13px] ${f.included ? "text-white/70" : "text-white/25 line-through"}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div {...fadeUp(0.3)} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/35">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> 256-bit SSL encryption</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Cancel anytime</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" /> 7-day free trial</span>
            <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8 / 5 average rating</span>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(0.35)} className="mt-16 grid grid-cols-3 gap-0 border border-white/10 rounded-2xl overflow-hidden divide-x divide-white/10">
            {[
              { n: "2M+", label: "Active students" },
              { n: "95%", label: "AI accuracy rate" },
              { n: "24/7", label: "Always available"  },
            ].map(s => (
              <div key={s.n} className="py-8 px-6 text-center bg-white/[0.02]">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-indigo-400 mb-1">{s.n}</p>
                <p className="text-[12px] text-white/35 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* FAQ */}
          <motion.div {...fadeUp(0.2)} className="mt-24">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-12">
              Frequently asked
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"> questions.</span>
            </h2>
            <div className="max-w-2xl mx-auto space-y-3">
              {FAQS.map((faq, i) => (
                <motion.div key={i} {...fadeUp(i * 0.06)} className="border border-white/8 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                    data-testid={`faq-${i}`}
                  >
                    <span className="text-[15px] font-semibold text-white/80">{faq.q}</span>
                    <span className={`ml-4 shrink-0 w-5 h-5 rounded-full border border-white/15 flex items-center justify-center transition-transform ${openFaq === i ? "rotate-45" : ""}`}>
                      <span className="text-white/50 text-[14px] font-light leading-none">+</span>
                    </span>
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-6 pb-5">
                      <p className="text-[14px] text-white/45 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div {...fadeUp(0.2)} className="mt-24 relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-fuchsia-600/20 border border-violet-500/20 p-12 text-center">
            <div className="absolute top-0 left-1/4 w-[400px] h-[200px] bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Ready to start learning?
              </h2>
              <p className="text-[16px] text-white/50 mb-8 max-w-md mx-auto">
                Join 2 million students. Start free — no credit card required.
              </p>
              <Link href="/auth?mode=register">
                <button className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-white/90 text-black text-[15px] font-bold rounded-2xl shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5 mx-auto" data-testid="button-cta-pricing">
                  Get started for free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070706] pt-12 pb-6 mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={logoPath} alt="TheHighGrader" className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-bold text-[14px] text-white">TheHighGrader™</span>
              </div>
              <p className="text-[12px] text-white/30 leading-relaxed">AI-powered education for every student.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Product</p>
              <ul className="space-y-2">
                {["AI Tutor","Quiz Generator","Essay Writer","Photo Solver"].map(item => (
                  <li key={item}><a href="/auth?mode=register" className="text-[12px] text-white/35 hover:text-white/70 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Company</p>
              <ul className="space-y-2">
                {[["Home","/"],["Demo","/demo"],["Sign up","/auth?mode=register"]].map(([label, href]) => (
                  <li key={label}><a href={href} className="text-[12px] text-white/35 hover:text-white/70 transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Legal</p>
              <ul className="space-y-2">
                {["Privacy Policy","Terms of Service","Cookie Policy"].map(item => (
                  <li key={item}><a href="#" className="text-[12px] text-white/35 hover:text-white/70 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-white/20">© {new Date().getFullYear()} TheHighGrader™. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-[11px] text-white/20 hover:text-white/45 transition-colors">Privacy Policy</a>
              <a href="#" className="text-[11px] text-white/20 hover:text-white/45 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
