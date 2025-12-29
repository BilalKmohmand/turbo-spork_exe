import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
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
  Shield
} from "lucide-react";
import { Link } from "wouter";

import studentStudying from "@assets/stock_images/student_studying_lap_fedc219b.jpg";
import educationWorkspace from "@assets/stock_images/education_learning_b_dafb0435.jpg";

const features = [
  {
    icon: Camera,
    title: "Photo Math Solver",
    description: "Snap a photo of any problem and get instant step-by-step solutions."
  },
  {
    icon: MessageSquare,
    title: "Ask Follow-Up Questions",
    description: "Don't understand? Ask until you fully grasp the concept."
  },
  {
    icon: Lightbulb,
    title: "Step-by-Step Explanations",
    description: "Every solution includes detailed reasoning for each step."
  },
  {
    icon: BookOpen,
    title: "All Subjects",
    description: "Math, science, history, literature - K-12 to graduate level."
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Transform notes into practice quizzes instantly."
  },
  {
    icon: GraduationCap,
    title: "Essay Writer",
    description: "AI-powered essay structuring and writing assistance."
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">BrainBoost</span>
            </motion.div>
            
            <nav className="hidden md:flex items-center gap-6">
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
                  transition={{ delay: 0.05 * i + 0.2 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-${link.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">Log In</Button>
              </Link>
              <Link href="/solver">
                <Button size="sm" data-testid="button-signup">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background pointer-events-none" />
        
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Badge variant="secondary" className="mb-4" data-testid="badge-hero">
                <Sparkles className="w-3 h-3 mr-1.5" />
                AI-Powered Learning
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
                Learn Smarter,
                <span className="block text-primary">
                  Not Harder
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Tackle any homework problem from K-12 to Graduate School. 
                Get instant AI-powered solutions with step-by-step explanations.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/solver">
                  <Button size="lg" data-testid="button-hero-cta">
                    Start Solving Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" data-testid="button-watch-demo">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">4.8/5 from 50K+ reviews</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border">
                <img 
                  src={studentStudying} 
                  alt="Student studying with laptop" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              <motion.div 
                className="absolute -bottom-4 -left-4 bg-card border rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">95% Accuracy</p>
                    <p className="text-xs text-muted-foreground">On math problems</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -top-4 -right-4 bg-card border rounded-xl p-4 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">4.5M+ Solved</p>
                    <p className="text-xs text-muted-foreground">Problems helped</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <motion.div 
              className="w-1 h-1 rounded-full bg-muted-foreground"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center" data-testid={`card-stat-${index}`}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-3">
              <Zap className="w-3 h-3 mr-1.5" />
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From instant problem solving to essay writing, unlock your full academic potential.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card 
                  className="h-full hover-elevate"
                  data-testid={`card-feature-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2" data-testid={`text-feature-title-${index}`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-3">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Solutions in 3 Simple Steps
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { step: 1, icon: Camera, title: "Upload or Type", description: "Snap a photo or type your problem directly." },
              { step: 2, icon: Brain, title: "AI Analyzes", description: "Our AI understands and solves your problem." },
              { step: 3, icon: Target, title: "Get Solutions", description: "Receive step-by-step explanations instantly." }
            ].map((item, i) => (
              <motion.div 
                key={item.step} 
                className="relative text-center"
                variants={fadeInUp}
              >
                {i < 2 && (
                  <div className="absolute top-10 left-1/2 w-full h-px bg-border hidden md:block" />
                )}
                <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-primary" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src={educationWorkspace} 
                  alt="Education workspace" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                <Shield className="w-3 h-3 mr-1.5" />
                Why Choose Us
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Higher Accuracy Than ChatGPT
              </h2>
              <div className="space-y-4">
                {[
                  "Step-by-step explanations for every problem",
                  "Ask unlimited follow-up questions",
                  "Higher accuracy on tough math problems",
                  "Specialized for educational content",
                  "Free to start - no credit card required"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link href="/solver">
                  <Button data-testid="button-try-free">
                    Try It Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-3">
              <Users className="w-3 h-3 mr-1.5" />
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by Students
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-0.5 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4" data-testid={`text-testimonial-${index}`}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-semibold text-sm" data-testid={`text-author-${index}`}>{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.school}</div>
                      </div>
                      <Badge variant="secondary">
                        {testimonial.subject}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Ace Your Homework?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join millions of students learning smarter, not harder.
            </p>
            <Link href="/solver">
              <Button size="lg" data-testid="button-cta-bottom">
                Get Started - It's Free
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">BrainBoost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered homework help for students of all levels.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Products</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Homework Help</Link>
                <Link href="/quiz" className="block hover:text-foreground transition-colors">Quiz Maker</Link>
                <Link href="/essay" className="block hover:text-foreground transition-colors">Essay Writer</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Tools</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground transition-colors">Math Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Photo Solver</Link>
                <Link href="/solver" className="block hover:text-foreground transition-colors">Equation Solver</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">About</a>
                <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            2025 BrainBoost. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
