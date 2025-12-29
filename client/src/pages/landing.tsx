import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";
import { 
  Sparkles, 
  Camera, 
  MessageSquare, 
  CheckCircle,
  BookOpen,
  FileText,
  Lightbulb,
  GraduationCap,
  ChevronRight,
  Star,
  Users,
  Target,
  Zap,
  ArrowRight,
  Play,
  Brain,
  Rocket,
  Shield,
  Cpu,
  Atom
} from "lucide-react";
import { Link } from "wouter";

import hero3d from "@assets/generated_images/3d_floating_geometric_shapes.png";
import sphere3d from "@assets/stock_images/3d_abstract_gradient_e5f5d876.jpg";
import neonAbstract from "@assets/stock_images/glowing_neon_futuris_97441ebd.jpg";
import crystalSphere from "@assets/stock_images/3d_render_crystal_gl_7ef5e3d0.jpg";
import holoInterface from "@assets/stock_images/futuristic_holograph_2b115fe8.jpg";

const features = [
  {
    icon: Camera,
    title: "Photo Math Solver",
    description: "Snap a photo of any problem and get instant step-by-step solutions.",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500"
  },
  {
    icon: MessageSquare,
    title: "Ask Follow-Up Questions",
    description: "Don't understand? Ask until you fully grasp the concept.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500"
  },
  {
    icon: Lightbulb,
    title: "Step-by-Step Explanations",
    description: "Every solution includes detailed reasoning for each step.",
    gradient: "from-amber-500 via-orange-500 to-red-500"
  },
  {
    icon: BookOpen,
    title: "All Subjects",
    description: "Math, science, history, literature - K-12 to graduate level.",
    gradient: "from-emerald-500 via-green-500 to-lime-500"
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Transform notes into practice quizzes instantly.",
    gradient: "from-pink-500 via-rose-500 to-red-500"
  },
  {
    icon: GraduationCap,
    title: "Essay Writer",
    description: "AI-powered essay structuring and writing assistance.",
    gradient: "from-indigo-500 via-violet-500 to-purple-500"
  }
];

const stats = [
  { value: "2M+", label: "Students", icon: Users },
  { value: "4.5M+", label: "Problems Solved", icon: Target },
  { value: "95%", label: "Accuracy", icon: Shield },
  { value: "4.8", label: "Rating", icon: Star }
];

const testimonials = [
  {
    name: "Sarah M.",
    school: "Stanford University",
    text: "This app helped me understand calculus concepts I struggled with for months!",
    subject: "Calculus"
  },
  {
    name: "Michael R.",
    school: "MIT",
    text: "Best homework helper ever. It actually teaches you how to solve problems.",
    subject: "Physics"
  },
  {
    name: "Emily C.",
    school: "Harvard University",
    text: "The quiz generator helped me ace my finals. Game changer!",
    subject: "Chemistry"
  }
];

function MouseParallax({ children, strength = 20 }: { children: React.ReactNode; strength?: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set((e.clientX - centerX) / centerX * strength);
      mouseY.set((e.clientY - centerY) / centerY * strength);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY, strength]);

  return (
    <motion.div style={{ x, y }}>
      {children}
    </motion.div>
  );
}

function Floating3DObject({ 
  children, 
  delay = 0, 
  duration = 6,
  rotateAmount = 15,
  floatAmount = 20
}: { 
  children: React.ReactNode; 
  delay?: number; 
  duration?: number;
  rotateAmount?: number;
  floatAmount?: number;
}) {
  return (
    <motion.div
      animate={{ 
        y: [-floatAmount/2, floatAmount/2, -floatAmount/2],
        rotateY: [-rotateAmount, rotateAmount, -rotateAmount],
        rotateX: [-rotateAmount/2, rotateAmount/2, -rotateAmount/2],
        rotateZ: [-5, 5, -5]
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}

function OrbitingElement({ 
  children, 
  radius = 150, 
  duration = 20,
  delay = 0 
}: { 
  children: React.ReactNode; 
  radius?: number; 
  duration?: number;
  delay?: number;
}) {
  const angle = useMotionValue(0);
  
  useAnimationFrame((t) => {
    angle.set(((t / 1000 + delay) / duration) * Math.PI * 2);
  });

  const x = useTransform(angle, (a) => Math.cos(a) * radius);
  const y = useTransform(angle, (a) => Math.sin(a) * radius * 0.3);
  const scale = useTransform(angle, (a) => 0.8 + Math.sin(a) * 0.2);
  const zIndex = useTransform(angle, (a) => Math.sin(a) > 0 ? 10 : -10);

  return (
    <motion.div 
      style={{ x, y, scale, zIndex, position: "absolute" }}
      className="pointer-events-none"
    >
      {children}
    </motion.div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`relative backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 rounded-2xl shadow-2xl ${className}`}
      whileHover={{ 
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
        boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(139, 92, 246) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(139, 92, 246) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function GlowOrb({ className, delay = 0, color = "violet" }: { className: string; delay?: number; color?: string }) {
  const colorMap: Record<string, string> = {
    violet: "rgba(139, 92, 246, 0.4)",
    blue: "rgba(59, 130, 246, 0.4)",
    purple: "rgba(168, 85, 247, 0.4)",
    pink: "rgba(236, 72, 153, 0.4)"
  };
  
  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] ${className}`}
      style={{ backgroundColor: colorMap[color] || colorMap.violet }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div 
                className="relative w-10 h-10"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/40" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 blur-lg opacity-50" />
                <div className="relative w-full h-full rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <span className="font-bold text-xl tracking-tight">BrainBoost</span>
            </motion.div>
            
            <nav className="hidden md:flex items-center gap-8">
              {[
                { href: "/solver", label: "Homework Help" },
                { href: "/quiz", label: "Quiz Maker" },
                { href: "/essay", label: "Essay Writer" },
                { href: "/pricing", label: "Pricing" }
              ].map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.2 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Log In</Button>
              </Link>
              <Link href="/solver">
                <Button 
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/30"
                  data-testid="button-signup"
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <AnimatedGrid />
        
        <GlowOrb className="top-0 left-0 w-[600px] h-[600px]" delay={0} color="violet" />
        <GlowOrb className="bottom-0 right-0 w-[800px] h-[800px]" delay={1.5} color="blue" />
        <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]" delay={3} color="purple" />

        <motion.div 
          className="absolute top-1/4 right-1/4 hidden xl:block"
          style={{ y: heroY }}
        >
          <OrbitingElement radius={200} duration={25}>
            <motion.div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/30">
              <img src={crystalSphere} alt="" className="w-full h-full object-cover" />
            </motion.div>
          </OrbitingElement>
        </motion.div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Learning Platform
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="relative">
                  Learn
                  <motion.span
                    className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/20 blur-lg"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </span>
                {" "}Smarter,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500">
                  Not Harder
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Tackle any homework problem from K-12 to Graduate School. 
                Get instant AI-powered solutions with step-by-step explanations you'll actually understand.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link href="/solver">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="lg" 
                      className="text-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-xl shadow-violet-500/30 border-0" 
                      data-testid="button-hero-cta"
                    >
                      Start Solving Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg backdrop-blur-sm bg-background/50"
                    data-testid="button-watch-demo"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-8 mt-14"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 border-2 border-background flex items-center justify-center text-white text-sm font-medium shadow-lg"
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 1.2 + i * 0.1, type: "spring" }}
                    >
                      {String.fromCharCode(64 + i)}
                    </motion.div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 1.5 + i * 0.05, type: "spring" }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4.8/5 from 50K+ reviews</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 60, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1200, transformStyle: "preserve-3d" }}
            >
              <MouseParallax strength={15}>
                <div className="relative">
                  <motion.div 
                    className="absolute -inset-8 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl blur-3xl opacity-30"
                    animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <Floating3DObject delay={0} duration={8} rotateAmount={8} floatAmount={15}>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                      <img 
                        src={hero3d} 
                        alt="3D Abstract shapes" 
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  </Floating3DObject>

                  <motion.div 
                    className="absolute -top-6 -right-6 z-20"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                  >
                    <Floating3DObject delay={0.5} duration={5} rotateAmount={10} floatAmount={10}>
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Cpu className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">95%</p>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                          </div>
                        </div>
                      </GlassCard>
                    </Floating3DObject>
                  </motion.div>

                  <motion.div 
                    className="absolute -bottom-4 -left-8 z-20"
                    initial={{ scale: 0, rotate: 20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
                  >
                    <Floating3DObject delay={1} duration={6} rotateAmount={12} floatAmount={12}>
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Atom className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">4.5M+</p>
                            <p className="text-sm text-muted-foreground">Solved</p>
                          </div>
                        </div>
                      </GlassCard>
                    </Floating3DObject>
                  </motion.div>
                </div>
              </MouseParallax>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -8, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <GlassCard className="p-8 text-center bg-background/80">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <stat.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground font-medium">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-28 relative overflow-hidden">
        <GlowOrb className="top-1/4 right-0 w-[400px] h-[400px]" delay={0} color="purple" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">
                <Zap className="w-4 h-4 mr-2" />
                Powerful Features
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Everything You Need to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500">
                  Succeed
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From instant problem solving to essay writing, unlock your full academic potential.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -12, rotateX: 5, rotateY: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                >
                  <Card 
                    className="h-full border-0 bg-background/80 backdrop-blur-xl shadow-xl overflow-hidden group"
                    data-testid={`card-feature-${index}`}
                  >
                    <CardContent className="p-8 relative">
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.1), transparent 70%)`
                        }}
                      />
                      <motion.div 
                        className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-3" data-testid={`text-feature-title-${index}`}>
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={neonAbstract} 
            alt="" 
            className="w-full h-full object-cover opacity-20 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">
                <Rocket className="w-4 h-4 mr-2" />
                How It Works
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Solutions in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">3 Steps</span>
              </h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: 1, icon: Camera, title: "Upload or Type", description: "Snap a photo or type your problem directly.", color: "from-violet-500 to-purple-600" },
              { step: 2, icon: Brain, title: "AI Analyzes", description: "Our AI understands and solves your problem.", color: "from-blue-500 to-cyan-500" },
              { step: 3, icon: Target, title: "Get Solutions", description: "Receive step-by-step explanations instantly.", color: "from-emerald-500 to-teal-500" }
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.2}>
                <motion.div 
                  className="relative text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  {i < 2 && (
                    <div className="absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent hidden md:block" />
                  )}
                  <motion.div 
                    className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-8 shadow-2xl`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-12 h-12 text-white" />
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-background shadow-lg flex items-center justify-center font-bold text-lg border-2 border-violet-500">
                      {item.step}
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${sphere3d})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15
          }}
        />
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            animate={{ 
              background: [
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <Shield className="w-4 h-4 mr-2" />
                Why Choose Us
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-8">
                Higher Accuracy Than ChatGPT
              </h2>
              <div className="space-y-5">
                {[
                  "Step-by-step explanations for every problem",
                  "Ask unlimited follow-up questions",
                  "Higher accuracy on tough math problems",
                  "Specialized for educational content",
                  "FREE to start - no credit card required"
                ].map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-300" />
                    </motion.div>
                    <span className="text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.3}>
              <GlassCard className="p-10 bg-white/10">
                <motion.div 
                  className="text-center mb-10"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="text-8xl font-bold mb-2">95%</div>
                  <div className="text-white/80 text-xl">Overall Accuracy</div>
                </motion.div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "4.5M+", label: "Problems Solved" },
                    { value: "2M+", label: "Happy Students" },
                    { value: "50+", label: "Subjects" },
                    { value: "24/7", label: "Available" }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center"
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                    >
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="text-sm text-white/70">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-28 bg-muted/30 relative overflow-hidden">
        <GlowOrb className="bottom-0 left-1/4 w-[400px] h-[400px]" delay={0} color="pink" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">
                <Users className="w-4 h-4 mr-2" />
                Testimonials
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-500">Students</span>
              </h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <motion.div
                  whileHover={{ y: -10, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card className="h-full border-0 bg-background/80 backdrop-blur-xl shadow-xl" data-testid={`card-testimonial-${index}`}>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed text-lg" data-testid={`text-testimonial-${index}`}>
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="font-bold text-lg" data-testid={`text-author-${index}`}>{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.school}</div>
                        </div>
                        <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30">
                          {testimonial.subject}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]" color="violet" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
              Ready to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500">
                Ace Your Homework?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join millions of students learning smarter, not harder.
            </p>
            <Link href="/solver">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button 
                  size="lg" 
                  className="text-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-2xl shadow-violet-500/40" 
                  data-testid="button-cta-bottom"
                >
                  Get Started - It's Free
                  <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
              </motion.div>
            </Link>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required. Start solving problems instantly.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <footer className="py-16 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg">BrainBoost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered homework help for students of all levels.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Products</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Homework Help</Link>
                <Link href="/quiz" className="block hover:text-foreground transition-colors">Quiz Maker</Link>
                <Link href="/essay" className="block hover:text-foreground transition-colors">Essay Writer</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Tools</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Math Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Photo Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Equation Solver</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">About</a>
                <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            2025 BrainBoost. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
