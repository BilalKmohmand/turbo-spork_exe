import { Card, CardContent } from "@/components/ui/card";
import { 
  HelpCircle, 
  MessageSquare, 
  Mic, 
  FileText, 
  FileEdit,
  BookOpen,
  Lightbulb,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How do I solve a math problem?",
    answer: "Go to AI Tutor, type your question or upload a photo of your homework, and click send. The AI will provide a step-by-step solution."
  },
  {
    question: "How do I record lecture notes?",
    answer: "Go to Lecture Notes, click 'Start Recording' to capture audio, then click 'Generate Study Notes' to create AI-powered notes from the transcript."
  },
  {
    question: "How do I create a quiz?",
    answer: "Go to Quiz Generator, paste your study material or notes into the text box, and click 'Generate Quiz'. Answer the questions and submit to see your score."
  },
  {
    question: "How do I write an essay?",
    answer: "Go to Essay Writer, enter your topic, select the essay type and length, then click 'Generate Essay'. You can copy or download the result."
  },
  {
    question: "Is there a limit to how many problems I can solve?",
    answer: "Free plan users have unlimited access to all AI features. Upgrade for priority support and additional features."
  },
];

const features = [
  { icon: MessageSquare, title: "AI Tutor", description: "Get instant help with any homework problem" },
  { icon: Mic, title: "Lecture Notes", description: "Record and transcribe lectures into study notes" },
  { icon: FileText, title: "Quiz Generator", description: "Create practice quizzes from any text" },
  { icon: FileEdit, title: "Essay Writer", description: "AI-powered essay writing assistance" },
];

export default function HelpContent() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
          <HelpCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground">Learn how to use TheHighGrader's AI tools</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-600" />
          Available Features
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-6 text-center">
          <Mail className="w-8 h-8 text-violet-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Need more help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contact our support team for personalized assistance
          </p>
          <Button
            variant="outline"
            onClick={() => window.open("mailto:support@thehighgrader.com?subject=Help%20Request", "_blank")}
            data-testid="button-contact-support"
          >
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
