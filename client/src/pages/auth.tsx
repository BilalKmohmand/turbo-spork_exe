import { useState } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Loader2, Sparkles, ShieldCheck, GraduationCap, AlertCircle,
  MessageSquare, FileText, Mic, CheckCircle, Star, BookOpen, ArrowRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PERKS = [
  { icon: MessageSquare, text: "AI Tutor for every subject, 24/7" },
  { icon: GraduationCap, text: "AI Course Creator — any topic" },
  { icon: FileText,      text: "Quiz Generator from your notes" },
  { icon: Mic,          text: "Lecture notes from audio recordings" },
  { icon: BookOpen,     text: "Essay Writer with AI feedback" },
  { icon: CheckCircle,  text: "AI Evaluator for teachers" },
];

const TESTIMONIALS_MINI = [
  { avatar: "SM", text: "Best study tool I've ever used.", name: "Sarah M.", school: "Stanford" },
  { avatar: "MR", text: "Went from C to A in physics.", name: "Michael R.", school: "MIT" },
  { avatar: "EC", text: "My quiz generator is insane.", name: "Emily C.", school: "Harvard" },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get("mode") === "register" ? "register" : "login";
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Invalid email or password.");
      return json;
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation(data.user.role === "teacher" ? "/teacher" : "/dashboard");
    },
    onError: (err: Error) => { setLoginError(err.message || "Invalid email or password."); },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; role: string }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Registration failed");
      return json;
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation(data.user.role === "teacher" ? "/teacher" : "/dashboard");
    },
    onError: (err: Error) => { setRegisterError(err.message || "Could not create account."); },
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    loginMutation.mutate({ email: fd.get("email") as string, password: fd.get("password") as string });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    const fd = new FormData(e.currentTarget);
    registerMutation.mutate({ email: fd.get("email") as string, password: fd.get("password") as string, displayName: fd.get("displayName") as string, role });
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A09]">

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-violet-950/80 via-indigo-950/60 to-[#0A0A09] border-r border-white/5 p-10 relative overflow-hidden">
        {/* BG decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-20 left-20 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 mb-12">
            <img src={logoPath} alt="TheHighGrader" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
            <span className="font-bold text-[18px] text-white">TheHighGrader™</span>
          </a>

          {/* Headline */}
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            Your personal AI tutor,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">24/7.</span>
          </h2>
          <p className="text-[15px] text-white/45 mb-10 leading-relaxed">
            Join 2 million students getting better grades with TheHighGrader's AI education platform.
          </p>

          {/* Feature list */}
          <ul className="space-y-3.5 mb-12">
            {PERKS.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-[14px] text-white/60 font-medium">{p.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Mini testimonials */}
        <div className="relative z-10 space-y-3">
          {TESTIMONIALS_MINI.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3 bg-white/[0.04] border border-white/8 rounded-2xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {t.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/60 truncate">"{t.text}"</p>
                <p className="text-[10px] text-white/30">{t.name} · {t.school}</p>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right panel — auth form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* BG glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <img src={logoPath} alt="TheHighGrader" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-bold text-[16px] text-white">TheHighGrader™</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-black/30">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-7 bg-white/5 border border-white/10 p-1 rounded-2xl h-11">
                  <TabsTrigger value="login"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-[13px] font-semibold text-white/50 data-[state=active]:font-bold transition-all"
                    data-testid="tab-login">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-[13px] font-semibold text-white/50 data-[state=active]:font-bold transition-all"
                    data-testid="tab-register">
                    Register
                  </TabsTrigger>
                </TabsList>

                {/* ── Login ── */}
                <TabsContent value="login">
                  <div className="mb-6">
                    <h1 className="text-[22px] font-black text-white mb-1">Welcome back</h1>
                    <p className="text-[13px] text-white/40">Sign in to your TheHighGrader account</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Email</Label>
                      <Input name="email" type="email" autoComplete="email" required placeholder="name@school.edu"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-violet-500/50 transition-all"
                        data-testid="input-login-email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Password</Label>
                      <Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-violet-500/50 transition-all"
                        data-testid="input-login-password" />
                    </div>
                    {loginError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-[13px] border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" />{loginError}
                      </div>
                    )}
                    <button type="submit" disabled={loginMutation.isPending}
                      className="w-full h-12 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      data-testid="button-login-submit">
                      {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotMsg(!showForgotMsg)}
                        className="text-[12px] text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
                        data-testid="button-forgot-password"
                      >
                        Forgot password?
                      </button>
                    </div>
                    {showForgotMsg && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 text-violet-300 text-[12px] border border-violet-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Password reset is coming soon. For now, please contact your school admin or email us at <span className="font-semibold">support@thehighgrader.com</span> for account recovery help.</span>
                      </div>
                    )}
                  </form>
                </TabsContent>

                {/* ── Register ── */}
                <TabsContent value="register">
                  <div className="mb-6">
                    <h1 className="text-[22px] font-black text-white mb-1">Create account</h1>
                    <p className="text-[13px] text-white/40">Free forever — no credit card needed</p>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Full Name</Label>
                      <Input name="displayName" autoComplete="name" required placeholder="Alex Johnson"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-violet-500/50 transition-all"
                        data-testid="input-register-name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Email</Label>
                      <Input name="email" type="email" autoComplete="email" required placeholder="name@school.edu"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-violet-500/50 transition-all"
                        data-testid="input-register-email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Password</Label>
                      <Input name="password" type="password" autoComplete="new-password" required placeholder="••••••••"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-violet-500/50 transition-all"
                        data-testid="input-register-password" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-bold text-white/50 uppercase tracking-wider">I am a...</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setRole("student")}
                          className={`flex items-center justify-center gap-2 h-11 rounded-xl border transition-all font-semibold text-[13px] ${
                            role === "student" ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-white/50 border-white/10 hover:border-white/25"
                          }`} data-testid="button-role-student">
                          <GraduationCap className="w-4 h-4" /> Student
                        </button>
                        <button type="button" onClick={() => setRole("teacher")}
                          className={`flex items-center justify-center gap-2 h-11 rounded-xl border transition-all font-semibold text-[13px] ${
                            role === "teacher" ? "bg-violet-600 text-white border-violet-500" : "bg-white/5 text-white/50 border-white/10 hover:border-white/25"
                          }`} data-testid="button-role-teacher">
                          <ShieldCheck className="w-4 h-4" /> Teacher
                        </button>
                      </div>
                    </div>
                    {registerError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-[13px] border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" />{registerError}
                      </div>
                    )}
                    <button type="submit" disabled={registerMutation.isPending}
                      className="w-full h-12 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      data-testid="button-register-submit">
                      {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          <p className="text-center text-[11px] text-white/20 mt-5 px-4 leading-relaxed">
            By continuing, you agree to TheHighGrader's{" "}
            <a href="#" className="underline underline-offset-2 hover:text-white/40 transition-colors">Terms of Service</a>{" "}and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-white/40 transition-colors">Privacy Policy</a>.
          </p>
          <p className="text-center text-[11px] text-white/15 mt-3">
            © {new Date().getFullYear()} TheHighGrader™. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
