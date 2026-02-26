import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, ShieldCheck, GraduationCap, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Invalid credentials");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation(data.user.role === "teacher" ? "/teacher" : "/dashboard");
    },
    onError: (err: Error) => {
      setLoginError(err.message || "Invalid email or password.");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string; role: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      setLocation(data.user.role === "teacher" ? "/teacher" : "/dashboard");
    },
    onError: (err: Error) => {
      setRegisterError(err.message || "Could not create account.");
    },
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    loginMutation.mutate({
      email: fd.get("email") as string,
      password: fd.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    const fd = new FormData(e.currentTarget);
    registerMutation.mutate({
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      displayName: fd.get("displayName") as string,
      role,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8] p-6">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto shadow-xl shadow-black/10">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111110]">Welcome to Gradeio</h1>
          <p className="text-[#666660]">The AI classroom for modern learning.</p>
        </div>

        <Card className="border-[#E5E5E0] rounded-[32px] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#F0F0F0] p-1 rounded-xl h-11">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[13px] font-semibold"
                  data-testid="tab-login"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[13px] font-semibold"
                  data-testid="tab-register"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#111110]">Email Address</Label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="name@school.edu"
                      className="h-12 rounded-xl border-[#E5E5E0] focus-visible:ring-0 focus-visible:border-black transition-all"
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#111110]">Password</Label>
                    <Input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-[#E5E5E0] focus-visible:ring-0 focus-visible:border-black transition-all"
                      data-testid="input-login-password"
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{loginError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#111110]">Full Name</Label>
                    <Input
                      name="displayName"
                      required
                      placeholder="Alex Johnson"
                      className="h-12 rounded-xl border-[#E5E5E0] focus-visible:ring-0 focus-visible:border-black transition-all"
                      data-testid="input-register-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#111110]">Email Address</Label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="name@school.edu"
                      className="h-12 rounded-xl border-[#E5E5E0] focus-visible:ring-0 focus-visible:border-black transition-all"
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-[#111110]">Password</Label>
                    <Input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-[#E5E5E0] focus-visible:ring-0 focus-visible:border-black transition-all"
                      data-testid="input-register-password"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[13px] font-semibold text-[#111110]">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all font-medium text-sm ${
                          role === "student"
                            ? "bg-black text-white border-black"
                            : "bg-white text-[#666660] border-[#E5E5E0] hover:border-[#999990]"
                        }`}
                        data-testid="button-role-student"
                      >
                        <GraduationCap className="w-4 h-4" /> Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all font-medium text-sm ${
                          role === "teacher"
                            ? "bg-black text-white border-black"
                            : "bg-white text-[#666660] border-[#E5E5E0] hover:border-[#999990]"
                        }`}
                        data-testid="button-role-teacher"
                      >
                        <ShieldCheck className="w-4 h-4" /> Teacher
                      </button>
                    </div>
                  </div>

                  {registerError && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{registerError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-[12px] text-[#999990] px-8 leading-relaxed">
          By continuing, you agree to Gradeio's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
