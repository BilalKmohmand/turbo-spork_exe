import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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
  Shield
} from "lucide-react";
import { Link } from "wouter";

import heroImage from "@assets/stock_images/university_students__3e49c435.jpg";
import studentImage from "@assets/stock_images/student_using_smartp_4a6f339b.jpg";
import classroomImage from "@assets/stock_images/university_students__701c69b4.jpg";
import examImage from "@assets/stock_images/woman_writing_exam_t_582912d5.jpg";
import abstractBg from "@assets/stock_images/glowing_abstract_tec_6bb91dc1.jpg";

const features = [
  {
    icon: Camera,
    title: "Photo Math Solver",
    description: "Snap a photo of any problem and get instant step-by-step solutions with detailed explanations.",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    icon: MessageSquare,
    title: "Ask Follow-Up Questions",
    description: "Don't understand a step? Ask until you fully understand the concept.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Lightbulb,
    title: "Step-by-Step Explanations",
    description: "Every solution includes detailed reasoning explaining WHY each step is taken.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: BookOpen,
    title: "All Subjects",
    description: "From math and science to history and literature, we cover K-12 to graduate level.",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Transform any text or notes into practice quizzes to test your understanding.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: GraduationCap,
    title: "Essay Writer",
    description: "Get help structuring and writing essays with AI-powered assistance.",
    gradient: "from-indigo-500 to-violet-500"
  }
];

const stats = [
  { value: "2M+", label: "Students Helped", icon: Users },
  { value: "4.5M+", label: "Problems Solved", icon: Target },
  { value: "95%", label: "Accuracy Rate", icon: Shield },
  { value: "4.8", label: "App Rating", icon: Star }
];

const testimonials = [
  {
    name: "Sarah M.",
    school: "Stanford University",
    text: "This app helped me understand calculus concepts I struggled with for months. The step-by-step explanations are incredible!",
    subject: "Calculus",
    image: studentImage
  },
  {
    name: "Michael R.",
    school: "MIT",
    text: "Best homework helper I've ever used. It doesn't just give answers - it actually teaches you how to solve problems.",
    subject: "Physics",
    image: classroomImage
  },
  {
    name: "Emily C.",
    school: "Harvard University",
    text: "The quiz generator helped me ace my finals. I created practice tests from my notes and it was a game changer!",
    subject: "Chemistry",
    image: examImage
  }
];

const logos = [
  "Stanford", "MIT", "Harvard", "Yale", "Princeton", "Columbia", "Berkeley", "UCLA"
];

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}

function FloatingElement({ children, delay = 0, duration = 3 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  return (
    <motion.div
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, 2, 0, -2, 0]
      }}
      transition={{ 
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

function GlowOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
}

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Brain className="w-6 h-6 text-white" />
              </div>
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
                  transition={{ delay: 0.1 * i }}
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
              transition={{ duration: 0.5 }}
            >
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Log In</Button>
              </Link>
              <Link href="/solver">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25" data-testid="button-signup">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-background to-indigo-50 dark:from-violet-950/30 dark:via-background dark:to-indigo-950/30" />
          <GlowOrb className="top-20 left-10 w-96 h-96 bg-violet-500/30" delay={0} />
          <GlowOrb className="bottom-20 right-10 w-[500px] h-[500px] bg-indigo-500/30" delay={1} />
          <GlowOrb className="top-1/2 left-1/2 w-72 h-72 bg-purple-500/20" delay={2} />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="absolute top-20 right-10 hidden xl:block"
        >
          <FloatingElement delay={0.5}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/50 flex items-center justify-center rotate-12">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </FloatingElement>
        </motion.div>

        <motion.div
          style={{ y: heroY }}
          className="absolute bottom-40 left-20 hidden xl:block"
        >
          <FloatingElement delay={1} duration={4}>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/50 flex items-center justify-center -rotate-12">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </FloatingElement>
        </motion.div>

        <motion.div
          style={{ y: heroY }}
          className="absolute top-40 left-1/4 hidden xl:block"
        >
          <FloatingElement delay={1.5} duration={5}>
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-2xl shadow-pink-500/50 flex items-center justify-center rotate-6">
              <Target className="w-7 h-7 text-white" />
            </div>
          </FloatingElement>
        </motion.div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 px-4 py-2 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                  <Rocket className="w-4 h-4 mr-2" />
                  Trusted by 2M+ students worldwide
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Solve, Study,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                  Succeed
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-xl mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Tackle homework and ace any course from K-12 to Graduate School. 
                Get instant step-by-step solutions with explanations you'll actually understand.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link href="/solver">
                  <Button 
                    size="lg" 
                    className="text-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/30" 
                    data-testid="button-hero-cta"
                  >
                    Start Solving Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </motion.div>

              <motion.div 
                className="flex items-center gap-8 mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 border-2 border-background flex items-center justify-center text-white text-sm font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">4.8/5 from 50K+ reviews</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            >
              <div className="relative">
                <motion.div 
                  className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur-2xl opacity-30"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img 
                    src={heroImage} 
                    alt="Students studying together" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Problem Solved!</p>
                          <p className="text-sm text-muted-foreground">Calculus - Integration by Parts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div 
                  className="absolute -top-8 -right-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 border"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <FloatingElement delay={0.3} duration={3}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">95%</p>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                      </div>
                    </div>
                  </FloatingElement>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-4 -left-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 border"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  <FloatingElement delay={0.8} duration={4}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">4.5M+</p>
                        <p className="text-sm text-muted-foreground">Solved</p>
                      </div>
                    </div>
                  </FloatingElement>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p 
            className="text-center text-muted-foreground mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Trusted by students at top universities worldwide
          </motion.p>
          <motion.div 
            className="flex items-center justify-center gap-12 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {logos.map((logo, i) => (
              <motion.span 
                key={logo}
                className="text-xl font-semibold text-muted-foreground/60"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {logo}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <GlowOrb className="top-1/4 right-0 w-96 h-96 bg-violet-500/10" delay={0} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <Card className="text-center border-0 bg-gradient-to-br from-white to-violet-50/50 dark:from-gray-900 dark:to-violet-950/30 shadow-xl">
                  <CardContent className="p-8">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <stat.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600"> Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From instant problem solving to essay writing, we've got all the tools to help you learn better.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -8, rotateX: 2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card 
                    className="h-full border-0 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-visible"
                    data-testid={`card-feature-${index}`}
                  >
                    <CardContent className="p-8">
                      <motion.div 
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-3" data-testid={`text-feature-title-${index}`}>
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={abstractBg} 
            alt="" 
            className="w-full h-full object-cover opacity-10 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <Zap className="w-4 h-4 mr-2" />
              How It Works
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Get Solutions in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">3 Simple Steps</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Camera, title: "Upload or Type", description: "Take a photo of your problem or type it directly into our solver.", color: "from-violet-500 to-purple-600" },
              { step: 2, icon: Brain, title: "AI Analyzes", description: "Our advanced AI understands your problem and works through the solution.", color: "from-blue-500 to-cyan-500" },
              { step: 3, icon: Target, title: "Get Step-by-Step", description: "Receive detailed explanations that help you understand, not just memorize.", color: "from-emerald-500 to-teal-500" }
            ].map((item, i) => (
              <AnimatedCard key={item.step} delay={i * 0.2}>
                <motion.div 
                  className="relative text-center"
                  whileHover={{ scale: 1.02 }}
                >
                  {i < 2 && (
                    <div className="absolute top-16 left-1/2 w-full h-1 bg-gradient-to-r from-violet-200 to-indigo-200 dark:from-violet-800 dark:to-indigo-800 hidden md:block" />
                  )}
                  <motion.div 
                    className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 shadow-xl`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <item.icon className="w-10 h-10 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-white/20 text-white border-white/20 mb-6">
                <Shield className="w-4 h-4 mr-2" />
                Why Choose BrainBoost
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
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                  <motion.div 
                    className="text-7xl font-bold mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    95%
                  </motion.div>
                  <div className="text-white/80 text-lg">Overall accuracy on complex problems</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "4.5M+", label: "Problems Solved" },
                    { value: "2M+", label: "Happy Students" },
                    { value: "50+", label: "Subjects Covered" },
                    { value: "24/7", label: "Available" }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      className="bg-white/10 rounded-xl p-5 text-center"
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                    >
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="text-sm text-white/70">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <Users className="w-4 h-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Students Everywhere</span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedCard key={index} delay={index * 0.15}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-0 bg-white dark:bg-gray-900 shadow-xl overflow-hidden" data-testid={`card-testimonial-${index}`}>
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={testimonial.image} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed" data-testid={`text-testimonial-${index}`}>
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="font-semibold" data-testid={`text-author-${index}`}>{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.school}</div>
                        </div>
                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                          {testimonial.subject}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/20" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Ace Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                Homework?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join millions of students who are learning smarter, not harder.
            </p>
            <Link href="/solver">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="text-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30" 
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
          </motion.div>
        </div>
      </section>

      <footer className="py-16 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg">BrainBoost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered homework help for students of all levels.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Homework Help</Link>
                <Link href="/quiz" className="block hover:text-foreground transition-colors">Quiz Maker</Link>
                <Link href="/essay" className="block hover:text-foreground transition-colors">Essay Writer</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tools</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Math Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Photo Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Equation Solver</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
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
