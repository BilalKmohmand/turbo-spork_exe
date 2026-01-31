import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles, CheckCircle, XCircle, RotateCcw, FileText } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResult {
  questions: QuizQuestion[];
  topic: string;
}

export default function QuizContent() {
  const [sourceText, setSourceText] = useState("");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/generate-quiz", { text });
      return response.json();
    },
    onSuccess: (data) => {
      setQuiz(data);
      setUserAnswers({});
      setShowResults(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuiz = () => {
    setShowResults(true);
  };

  const getScore = () => {
    if (!quiz) return 0;
    return quiz.questions.filter((q, i) => userAnswers[i] === q.correctAnswer).length;
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSourceText("");
    setUserAnswers({});
    setShowResults(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">AI Quiz Generator</h1>
        <p className="text-muted-foreground">Turn any text into an interactive quiz</p>
      </div>

      {!quiz ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Source Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your study material, textbook excerpt, or notes here..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[200px]"
              data-testid="input-quiz-source"
            />
            <Button
              onClick={() => generateMutation.mutate(sourceText)}
              disabled={!sourceText.trim() || generateMutation.isPending}
              className="w-full gap-2"
              data-testid="button-generate-quiz"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{quiz.topic}</h2>
              <p className="text-muted-foreground">{quiz.questions.length} questions</p>
            </div>
            <Button variant="outline" onClick={resetQuiz} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </Button>
          </div>

          {showResults && (
            <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  Score: {getScore()} / {quiz.questions.length}
                </p>
                <p className="text-white/80">
                  {Math.round((getScore() / quiz.questions.length) * 100)}% correct
                </p>
              </CardContent>
            </Card>
          )}

          {quiz.questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">Q{qIndex + 1}</Badge>
                  <p className="font-medium">{question.question}</p>
                </div>

                <RadioGroup
                  value={userAnswers[qIndex]?.toString()}
                  onValueChange={(val) => setUserAnswers(prev => ({ ...prev, [qIndex]: parseInt(val) }))}
                  disabled={showResults}
                >
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className={`flex items-center space-x-2 p-2 rounded-lg ${
                      showResults 
                        ? oIndex === question.correctAnswer 
                          ? "bg-emerald-500/10" 
                          : userAnswers[qIndex] === oIndex 
                            ? "bg-red-500/10" 
                            : ""
                        : "hover:bg-muted"
                    }`}>
                      <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                      <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                      {showResults && oIndex === question.correctAnswer && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      {showResults && userAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </RadioGroup>

                {showResults && (
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium text-muted-foreground">Explanation:</p>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!showResults && (
            <Button 
              onClick={handleSubmitQuiz} 
              className="w-full"
              disabled={Object.keys(userAnswers).length !== quiz.questions.length}
              data-testid="button-submit-quiz"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
