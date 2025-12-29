import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";

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
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your learning needs. Start free and upgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative ${plan.popular ? 'border-2 border-violet-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : ''}`}
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
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-6 py-3">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span>All plans include a 7-day free trial. No credit card required.</span>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
              2M+
            </div>
            <p className="text-muted-foreground">Students trust BrainBoost</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
              95%
            </div>
            <p className="text-muted-foreground">Accuracy rate</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">
              24/7
            </div>
            <p className="text-muted-foreground">Available anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
