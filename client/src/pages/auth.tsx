import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Brain, 
  GraduationCap, 
  BookOpen, 
  Mic, 
  FileText, 
  Calculator,
  Sparkles,
  CheckCircle,
  Play,
  Zap
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const features = [
  {
    icon: Mic,
    title: "AI Lecture Notes",
    description: "Record lectures and get instant AI-generated study notes",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Calculator,
    title: "Homework Solver",
    description: "Upload any problem and get step-by-step solutions",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Turn any text into interactive practice quizzes",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "Essay Writer",
    description: "AI-powered essay assistance with outlines",
    color: "from-orange-500 to-amber-500",
  },
];

export default function Auth() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const searchString = useSearch();
  const [activeFeature, setActiveFeature] = useState(0);
  
  const urlParams = new URLSearchParams(searchString);
  const initialMode = urlParams.get("mode") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState(initialMode);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      email: "", 
      displayName: "", 
      password: "", 
      confirmPassword: "",
      role: "student" 
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      navigate(data.user.role === "teacher" ? "/teacher" : "/student");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials",
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...payload } = data;
      const res = await apiRequest("POST", "/api/auth/register", payload);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Account created!", description: "Welcome to Gradeio." });
      navigate(data.user.role === "teacher" ? "/teacher" : "/student");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Could not create account",
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12 w-full">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-3xl text-white">Gradeio</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Learn smarter with
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"> AI-powered </span>
            education
          </h1>
          <p className="text-lg text-white/60 mb-12 max-w-lg">
            Join thousands of students using AI to ace their classes. Get instant help with homework, notes, quizzes, and essays.
          </p>

          <div className="space-y-4 mb-12">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  activeFeature === index 
                    ? 'bg-white/10 border border-white/20 shadow-lg' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.description}</p>
                </div>
                {activeFeature === index && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm">Instant AI responses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">No credit card</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">Gradeio</span>
          </div>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {activeTab === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-white/50 text-sm">
                  {activeTab === "login" 
                    ? "Sign in to continue learning" 
                    : "Start your AI learning journey today"}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                  <TabsTrigger 
                    value="login" 
                    data-testid="tab-login"
                    className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    data-testid="tab-register"
                    className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white/80">Email</Label>
                      <Input 
                        id="login-email"
                        type="email" 
                        placeholder="you@example.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                        data-testid="input-login-email"
                        {...loginForm.register("email")} 
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-white/80">Password</Label>
                      <Input 
                        id="login-password"
                        type="password" 
                        placeholder="Enter your password"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                        data-testid="input-login-password"
                        {...loginForm.register("password")} 
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium h-11"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">I am a...</Label>
                      <RadioGroup 
                        defaultValue="student" 
                        onValueChange={(val) => registerForm.setValue("role", val as "student" | "teacher")}
                        className="grid grid-cols-2 gap-3"
                      >
                        <Label 
                          htmlFor="role-student" 
                          className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors [&:has([data-state=checked])]:border-violet-500 [&:has([data-state=checked])]:bg-violet-500/10"
                        >
                          <RadioGroupItem value="student" id="role-student" data-testid="radio-student" className="sr-only" />
                          <GraduationCap className="w-5 h-5 text-violet-400" />
                          <span className="text-white font-medium">Student</span>
                        </Label>
                        <Label 
                          htmlFor="role-teacher" 
                          className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors [&:has([data-state=checked])]:border-violet-500 [&:has([data-state=checked])]:bg-violet-500/10"
                        >
                          <RadioGroupItem value="teacher" id="role-teacher" data-testid="radio-teacher" className="sr-only" />
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          <span className="text-white font-medium">Teacher</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-white/80">Full Name</Label>
                      <Input 
                        id="register-name"
                        placeholder="Your name"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                        data-testid="input-register-name"
                        {...registerForm.register("displayName")} 
                      />
                      {registerForm.formState.errors.displayName && (
                        <p className="text-sm text-red-400">{registerForm.formState.errors.displayName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-white/80">Email</Label>
                      <Input 
                        id="register-email"
                        type="email" 
                        placeholder="you@example.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                        data-testid="input-register-email"
                        {...registerForm.register("email")} 
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-400">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-white/80">Password</Label>
                        <Input 
                          id="register-password"
                          type="password" 
                          placeholder="Create password"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                          data-testid="input-register-password"
                          {...registerForm.register("password")} 
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-400">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm" className="text-white/80">Confirm</Label>
                        <Input 
                          id="register-confirm"
                          type="password" 
                          placeholder="Confirm password"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                          data-testid="input-register-confirm"
                          {...registerForm.register("confirmPassword")} 
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium h-11"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Free Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="text-center text-white/40 text-xs mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>

          <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
            {features.slice(0, 2).map((feature) => (
              <div key={feature.title} className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white/80 font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
