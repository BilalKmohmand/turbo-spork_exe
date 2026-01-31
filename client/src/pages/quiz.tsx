import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  Sparkles,
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight
} from "lucide-react";

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

export default function Quiz() {
  useAuth(true);
  const [sourceText, setSourceText] = useState("");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/generate-quiz", { text });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate quiz");
      }
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
        description: error.message || "Failed to generate quiz.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (sourceText.trim().length < 50) {
      toast({
        title: "Text too short",
        description: "Please provide at least 50 characters of text to generate a quiz.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(sourceText.trim());
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    if (Object.keys(userAnswers).length < quiz.questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    setShowResults(true);
  };

  const handleReset = () => {
    setQuiz(null);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleRetry = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctAnswer) correct++;
    });
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100)
    };
  };

  const score = calculateScore();

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!quiz && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <FileText className="w-7 h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Quiz Generator
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Paste your notes, textbook content, or any educational text and we'll generate a practice quiz to test your understanding.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <Label htmlFor="source-text" className="text-base font-medium">
                  Source Text
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Paste at least 50 characters of text to generate questions from
                </p>
                <Textarea
                  id="source-text"
                  placeholder="Paste your study material, notes, or textbook content here..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-[200px] resize-none text-base"
                  data-testid="input-quiz-source"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {sourceText.length} characters
                  </span>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || sourceText.trim().length < 50}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                    data-testid="button-generate-quiz"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {quiz && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Practice Quiz</h1>
                <p className="text-muted-foreground">Topic: {quiz.topic}</p>
              </div>
              <Button variant="outline" onClick={handleReset} className="gap-2" data-testid="button-new-quiz">
                <RotateCcw className="w-4 h-4" />
                New Quiz
              </Button>
            </div>

            {showResults && (
              <Card className="border-2 border-violet-200 dark:border-violet-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                      {score.percentage}%
                    </div>
                    <p className="text-lg">
                      You got {score.correct} out of {score.total} correct!
                    </p>
                    <Button onClick={handleRetry} variant="outline" className="mt-4 gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {quiz.questions.map((question, qIndex) => {
                const isAnswered = userAnswers[qIndex] !== undefined;
                const isCorrect = userAnswers[qIndex] === question.correctAnswer;
                
                return (
                  <Card 
                    key={qIndex}
                    className={showResults ? (isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800') : ''}
                    data-testid={`card-question-${qIndex}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-0.5">
                          {qIndex + 1}
                        </Badge>
                        <CardTitle className="text-base font-medium">
                          {question.question}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={userAnswers[qIndex]?.toString()}
                        onValueChange={(value) => handleAnswerSelect(qIndex, parseInt(value))}
                        className="space-y-2"
                      >
                        {question.options.map((option, oIndex) => {
                          const isSelected = userAnswers[qIndex] === oIndex;
                          const isCorrectOption = oIndex === question.correctAnswer;
                          
                          let optionClass = "border rounded-lg p-3 cursor-pointer transition-colors";
                          if (showResults) {
                            if (isCorrectOption) {
                              optionClass += " bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700";
                            } else if (isSelected && !isCorrectOption) {
                              optionClass += " bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700";
                            }
                          } else if (isSelected) {
                            optionClass += " border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30";
                          }
                          
                          return (
                            <div key={oIndex} className={optionClass}>
                              <div className="flex items-center gap-3">
                                <RadioGroupItem 
                                  value={oIndex.toString()} 
                                  id={`q${qIndex}-o${oIndex}`}
                                  disabled={showResults}
                                  data-testid={`radio-q${qIndex}-o${oIndex}`}
                                />
                                <Label 
                                  htmlFor={`q${qIndex}-o${oIndex}`} 
                                  className="flex-1 cursor-pointer"
                                >
                                  {option}
                                </Label>
                                {showResults && isCorrectOption && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {showResults && isSelected && !isCorrectOption && (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                      
                      {showResults && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Explanation:</p>
                          <p className="text-sm">{question.explanation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!showResults && (
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmitQuiz}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                  disabled={Object.keys(userAnswers).length < quiz.questions.length}
                  data-testid="button-submit-quiz"
                >
                  Submit Quiz
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
