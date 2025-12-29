import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: Camera,
    title: "Photo Math Solver",
    description: "Snap a photo of any problem and get instant step-by-step solutions with detailed explanations."
  },
  {
    icon: MessageSquare,
    title: "Ask Follow-Up Questions",
    description: "Don't understand a step? Ask until you fully understand the concept."
  },
  {
    icon: Lightbulb,
    title: "Step-by-Step Explanations",
    description: "Every solution includes detailed reasoning explaining WHY each step is taken."
  },
  {
    icon: BookOpen,
    title: "All Subjects",
    description: "From math and science to history and literature, we cover K-12 to graduate level."
  },
  {
    icon: FileText,
    title: "Quiz Generator",
    description: "Transform any text or notes into practice quizzes to test your understanding."
  },
  {
    icon: GraduationCap,
    title: "Essay Writer",
    description: "Get help structuring and writing essays with AI-powered assistance."
  }
];

const stats = [
  { value: "2M+", label: "Students Helped" },
  { value: "4.5M+", label: "Problems Solved" },
  { value: "95%", label: "Accuracy Rate" },
  { value: "4.8", label: "App Rating" }
];

const testimonials = [
  {
    name: "Sarah M.",
    school: "Stanford University",
    text: "This app helped me understand calculus concepts I struggled with for months. The step-by-step explanations are incredible!",
    subject: "Calculus"
  },
  {
    name: "Michael R.",
    school: "MIT",
    text: "Best homework helper I've ever used. It doesn't just give answers - it actually teaches you how to solve problems.",
    subject: "Physics"
  },
  {
    name: "Emily C.",
    school: "Harvard University",
    text: "The quiz generator helped me ace my finals. I created practice tests from my notes and it was a game changer!",
    subject: "Chemistry"
  }
];

const subjects = [
  "Algebra", "Calculus", "Statistics", "Geometry", "Physics", 
  "Chemistry", "Biology", "Economics", "Computer Science"
];

export default function Landing() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">BrainBoost</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/solver" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-homework">Homework Help</Link>
              <Link href="/quiz" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-quiz">Quiz Maker</Link>
              <Link href="/essay" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-essay">Essay Writer</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Log In</Button>
              </Link>
              <Link href="/solver">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" data-testid="button-signup">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-background to-indigo-50 dark:from-violet-950/20 dark:via-background dark:to-indigo-950/20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Trusted by 2M+ students worldwide
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Solve, Study, Succeed
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              All in One Place
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tackle homework and ace any course from K-12 to Graduate School. 
            Get instant step-by-step solutions with explanations you'll actually understand.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/solver">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-violet-600 to-indigo-600" data-testid="button-hero-cta">
                Start Solving Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {subjects.map((subject) => (
              <Badge key={subject} variant="outline" className="text-sm px-3 py-1">
                {subject}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                  {stat.value}
                </div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From instant problem solving to essay writing, we've got all the tools to help you learn better.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`transition-all duration-300 ${hoveredFeature === index ? 'shadow-lg border-violet-200 dark:border-violet-800' : ''}`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                data-testid={`card-feature-${index}`}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get Solutions in 3 Simple Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Camera, title: "Upload or Type", description: "Take a photo of your problem or type it directly into our solver." },
              { step: 2, icon: Zap, title: "AI Analyzes", description: "Our advanced AI understands your problem and works through the solution." },
              { step: 3, icon: Target, title: "Get Step-by-Step", description: "Receive detailed explanations that help you understand, not just memorize." }
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-200 to-indigo-200 dark:from-violet-800 dark:to-indigo-800 hidden md:block first:hidden last:hidden" style={{ transform: 'translateX(50%)', display: item.step === 3 ? 'none' : undefined }} />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 text-white mb-4">Why Choose BrainBoost</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Higher Accuracy Than ChatGPT
              </h2>
              <div className="space-y-4">
                {[
                  "Step-by-step explanations for every problem",
                  "Ask unlimited follow-up questions",
                  "Higher accuracy on tough math problems",
                  "Specialized for educational content",
                  "FREE to start - no credit card required"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">95%</div>
                <div className="text-white/80">Overall accuracy on complex problems</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">4.5M+</div>
                  <div className="text-sm text-white/70">Problems Solved</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold">2M+</div>
                  <div className="text-sm text-white/70">Happy Students</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Users className="w-4 h-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by Students Everywhere
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} data-testid={`card-testimonial-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4" data-testid={`text-testimonial-${index}`}>"{testimonial.text}"</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold" data-testid={`text-author-${index}`}>{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.school}</div>
                    </div>
                    <Badge variant="secondary">{testimonial.subject}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Ace Your Homework?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join millions of students who are learning smarter, not harder.
          </p>
          <Link href="/solver">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-violet-600 to-indigo-600" data-testid="button-cta-bottom">
              Get Started - It's Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Start solving problems instantly.
          </p>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">BrainBoost</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered homework help for students of all levels.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Products</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground">Homework Help</Link>
                <Link href="/quiz" className="block hover:text-foreground">Quiz Maker</Link>
                <Link href="/essay" className="block hover:text-foreground">Essay Writer</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Tools</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/solver" className="block hover:text-foreground">Math Solver</Link>
                <Link href="/solver" className="block hover:text-foreground">Photo Solver</Link>
                <Link href="/solver" className="block hover:text-foreground">Equation Solver</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground">About</a>
                <a href="#" className="block hover:text-foreground">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground">Terms of Service</a>
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
