import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, ShieldCheck, GraduationCap, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"student" | "teacher">("student");

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    
    try {
      await loginMutation.mutateAsync({ username, password });
    } catch (error: any) {}
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;
    
    try {
      await registerMutation.mutateAsync({ username, password, displayName, role });
    } catch (error: any) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8] p-6 selection:bg-black/5">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto shadow-xl shadow-black/10">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111110]">Welcome to Gradeio</h1>
          <p className="text-[#666660]">The sophisticated AI classroom for modern learning.</p>
        </div>

        <Card className="border-[#E5E5E0] rounded-[32px] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8 lg:p-10">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#F0F0F0] p-1 rounded-xl h-11">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Email Address</Label>
                    <Input name="username" type="email" required placeholder="name@school.edu" className="h-12 rounded-xl border-[#E5E5E0] focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Password</Label>
                    <Input name="password" type="password" required className="h-12 rounded-xl border-[#E5E5E0] focus:border-black transition-all" />
                  </div>
                  
                  {loginMutation.error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Invalid email or password. Please try again.</p>
                    </div>
                  )}

                  <Button type="submit" disabled={loginMutation.isPending} className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98]">
                    {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Full Name</Label>
                    <Input name="displayName" required placeholder="Alex Johnson" className="h-12 rounded-xl border-[#E5E5E0]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Email Address</Label>
                    <Input name="username" type="email" required placeholder="name@school.edu" className="h-12 rounded-xl border-[#E5E5E0]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Password</Label>
                    <Input name="password" type="password" required className="h-12 rounded-xl border-[#E5E5E0]" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all font-medium text-sm ${role === 'student' ? 'bg-black text-white border-black' : 'bg-white text-[#666660] border-[#E5E5E0]'}`}
                      >
                        <GraduationCap className="w-4 h-4" /> Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("teacher")}
                        className={`flex items-center justify-center gap-2 h-12 rounded-xl border transition-all font-medium text-sm ${role === 'teacher' ? 'bg-black text-white border-black' : 'bg-white text-[#666660] border-[#E5E5E0]'}`}
                      >
                        <ShieldCheck className="w-4 h-4" /> Teacher
                      </button>
                    </div>
                  </div>

                  {registerMutation.error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Registration failed. This email might already be in use.</p>
                    </div>
                  )}

                  <Button type="submit" disabled={registerMutation.isPending} className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98]">
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
