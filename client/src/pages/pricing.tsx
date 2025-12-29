import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Brain, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { BackgroundVideo } from "@/components/background-video";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out BrainBoost",
    features: [
      "5 problems per day",
      "Step-by-step solutions",
      "Basic subjects support",
      "Community support"
    ],
    cta: "Get Started",
    href: "/solver",
    popular: false
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "For students who want unlimited access",
    features: [
      "Unlimited problems",
      "Step-by-step solutions",
      "All subjects supported",
      "Follow-up questions",
      "Quiz Generator",
      "Essay Writer",
      "Priority support",
      "No ads"
    ],
    cta: "Start Free Trial",
    href: "/solver",
    popular: true
  },
  {
    name: "Team",
    price: "$19.99",
    period: "per month",
    description: "For study groups and tutors",
    features: [
      "Everything in Pro",
      "Up to 5 users",
      "Shared problem history",
      "Progress tracking",
      "Admin dashboard",
      "API access"
    ],
    cta: "Contact Sales",
    href: "/solver",
    popular: false
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden">
      <BackgroundVideo video="neural" overlay="darkest" />
      
      <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">BrainBoost</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" data-testid="button-pricing-login">
                Sign In
              </Button>
            </Link>
            <Link href="/solver">
              <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white" data-testid="button-pricing-trial">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30">Pricing</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Choose the plan that fits your learning needs. Start free and upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative bg-black/40 backdrop-blur-md border-white/10 ${plan.popular ? 'border-2 border-[#3b82f6]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#3b82f6]">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/60 ml-2">{plan.period}</span>
                </div>
                <p className="text-sm text-white/60 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-[#3b82f6] hover:bg-[#2563eb]' : 'border-white/20 text-white hover:bg-white/10'}`}
                    variant={plan.popular ? "default" : "outline"}
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-6 py-3 border border-white/10">
            <Sparkles className="w-5 h-5 text-[#3b82f6]" />
            <span className="text-white/80">All plans include a 7-day free trial. No credit card required.</span>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[#3b82f6] mb-2">
              2M+
            </div>
            <p className="text-white/60">Students trust BrainBoost</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#3b82f6] mb-2">
              95%
            </div>
            <p className="text-white/60">Accuracy rate</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#3b82f6] mb-2">
              24/7
            </div>
            <p className="text-white/60">Available anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
