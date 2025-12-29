import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Camera, 
  MessageSquare, 
  CheckCircle,
  BookOpen,
  FileText,
  Lightbulb,
  GraduationCap,
  Star,
  Users,
  Target,
  ArrowRight,
  Brain,
  Shield,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

import heroImage from "@assets/stock_images/student_with_laptop__70884f08.jpg";

const features = [
  {
    icon: Camera,
    title: "Photo Solver",
    description: "Snap a photo of any problem. Get instant solutions."
  },
  {
    icon: MessageSquare,
    title: "Follow-Up Questions",
    description: "Don't understand? Keep asking until it clicks."
  },
  {
    icon: Lightbulb,
    title: "Step-by-Step",
    description: "Detailed explanations for every problem."
  },
  {
    icon: BookOpen,
    title: "All Subjects",
    description: "Math, science, history - K-12 to grad school."
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Transform notes into practice quizzes."
  },
  {
    icon: GraduationCap,
    title: "Essay Writer",
    description: "AI-powered essay structuring."
  }
];

const stats = [
  { value: "2M+", label: "Students" },
  { value: "4.5M+", label: "Problems Solved" },
  { value: "95%", label: "Accuracy" },
  { value: "4.8", label: "Rating" }
];

const testimonials = [
  {
    name: "Sarah M.",
    school: "Stanford University",
    text: "This app helped me understand calculus concepts I struggled with for months.",
    avatar: "S"
  },
  {
    name: "Michael R.",
    school: "MIT",
    text: "Best homework helper ever. It actually teaches you how to solve problems.",
    avatar: "M"
  },
  {
    name: "Emily C.",
    school: "Harvard University",
    text: "The quiz generator helped me ace my finals. Game changer.",
    avatar: "E"
  }
];

const trustedLogos = [
  "Stanford", "MIT", "Harvard", "Yale", "Princeton", "Columbia"
];

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-20">
            <motion.div 
              className="flex items-center gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-10 h-10 rounded-lg bg-[#3b82f6] flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">BrainBoost</span>
            </motion.div>
            
            <nav className="hidden md:flex items-center gap-8">
              {["Features", "Pricing", "About"].map((link, i) => (
                <motion.a
                  key={link}
                  href={link === "Pricing" ? "/pricing" : "#"}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  data-testid={`link-${link.toLowerCase()}`}
                >
                  {link}
                </motion.a>
              ))}
            </nav>
            
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" data-testid="button-login">
                  Sign In
                </Button>
              </Link>
              <Link href="/solver">
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white" data-testid="button-signup">
                  Start Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          style={{ scale: heroScale }}
        >
          <img 
            src={heroImage} 
            alt="Student learning" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-[#0a0a0b]/40" />
        </motion.div>

        <motion.div 
          className="relative z-10 min-h-screen flex flex-col"
          style={{ opacity: heroOpacity }}
        >
          <div className="flex-1 flex items-center">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-32 w-full">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-2 mb-8">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-white/60">4.8 on App Store</span>
                    <span className="text-white/30 mx-2">|</span>
                    <span className="text-sm text-white/60">50K+ reviews</span>
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-[6.5rem] font-bold tracking-tight leading-[0.95] mb-8">
                    Make learning
                    <span className="block text-[#3b82f6]">effortless.</span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-white/60 max-w-lg mb-10 leading-relaxed">
                    The AI education platform with power and precision — turning homework into understanding and questions into knowledge.
                  </p>
                  
                  <Link href="/solver">
                    <Button 
                      size="lg" 
                      className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                      data-testid="button-hero-cta"
                    >
                      Start free trial
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  className="hidden lg:block"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="relative">
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[#3b82f6]" />
                        <span className="text-xs text-white/50 uppercase tracking-wider">Live Demo</span>
                      </div>
                      <p className="text-white/80 mb-4">Solve: What is the derivative of f(x) = 3x² + 2x - 5?</p>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-white/60 mb-2">Solution:</p>
                        <p className="text-white font-mono">f'(x) = 6x + 2</p>
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/40">Step-by-step explanation available</p>
                        </div>
                      </div>
                    </Card>

                    <motion.div 
                      className="absolute -top-4 -right-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        95% Accuracy
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div 
            className="border-t border-white/10 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-sm text-white/40">Trusted by students at</p>
                <div className="flex items-center gap-8 flex-wrap justify-center">
                  {trustedLogos.map((logo) => (
                    <span key={logo} className="text-white/30 font-semibold text-sm tracking-wide">
                      {logo}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-24 bg-[#0a0a0b]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl sm:text-5xl font-bold text-[#3b82f6] mb-2">
                  {stat.value}
                </div>
                <div className="text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0f0f10]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Everything you need
              <span className="block text-[#3b82f6]">to succeed.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              From instant problem solving to essay writing, unlock your full academic potential.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="bg-white/[0.02] border-white/10 hover:bg-white/[0.04] transition-colors h-full"
                  data-testid={`card-feature-${index}`}
                >
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-[#3b82f6]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white" data-testid={`text-feature-title-${index}`}>
                      {feature.title}
                    </h3>
                    <p className="text-white/50">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0a0a0b]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How it works
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: 1, icon: Camera, title: "Upload or type", description: "Snap a photo or type your problem directly." },
              { step: 2, icon: Brain, title: "AI analyzes", description: "Our AI understands and solves your problem." },
              { step: 3, icon: Target, title: "Get solutions", description: "Receive step-by-step explanations instantly." }
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="relative w-20 h-20 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center mx-auto mb-8">
                  <item.icon className="w-8 h-8 text-[#3b82f6]" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                <p className="text-white/50">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0f0f10]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-8">
                Higher accuracy
                <span className="block text-[#3b82f6]">than ChatGPT.</span>
              </h2>
              <div className="space-y-5">
                {[
                  "Step-by-step explanations for every problem",
                  "Ask unlimited follow-up questions",
                  "Higher accuracy on tough math problems",
                  "Specialized for educational content",
                  "Free to start - no credit card required"
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/70">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/[0.02] border-white/10 p-10">
                <div className="text-center mb-8">
                  <div className="text-7xl font-bold text-[#3b82f6] mb-2">95%</div>
                  <div className="text-white/50 text-lg">Overall Accuracy</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "4.5M+", label: "Problems Solved" },
                    { value: "2M+", label: "Happy Students" },
                    { value: "50+", label: "Subjects" },
                    { value: "24/7", label: "Available" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-5 text-center">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0a0a0b]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Loved by students
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/[0.02] border-white/10 h-full" data-testid={`card-testimonial-${index}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-0.5 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/70 mb-6 leading-relaxed" data-testid={`text-testimonial-${index}`}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white" data-testid={`text-author-${index}`}>{testimonial.name}</div>
                        <div className="text-sm text-white/40">{testimonial.school}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0f0f10] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/10 to-transparent" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ready to ace your
              <span className="block text-[#3b82f6]">homework?</span>
            </h2>
            <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
              Join millions of students learning smarter, not harder.
            </p>
            <Link href="/solver">
              <Button 
                size="lg" 
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                data-testid="button-cta-bottom"
              >
                Start free trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-white/30 mt-6">
              No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="py-16 bg-[#0a0a0b] border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">BrainBoost</span>
              </div>
              <p className="text-sm text-white/40">
                AI-powered homework help for students of all levels.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Products</h4>
              <div className="space-y-3 text-sm text-white/40">
                <Link href="/solver" className="block hover:text-white transition-colors">Homework Help</Link>
                <Link href="/quiz" className="block hover:text-white transition-colors">Quiz Maker</Link>
                <Link href="/essay" className="block hover:text-white transition-colors">Essay Writer</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Tools</h4>
              <div className="space-y-3 text-sm text-white/40">
                <Link href="/solver" className="block hover:text-white transition-colors">Math Solver</Link>
                <Link href="/solver" className="block hover:text-white transition-colors">Photo Solver</Link>
                <Link href="/solver" className="block hover:text-white transition-colors">Equation Solver</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <div className="space-y-3 text-sm text-white/40">
                <a href="#" className="block hover:text-white transition-colors">About</a>
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/30">
            2025 BrainBoost. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
