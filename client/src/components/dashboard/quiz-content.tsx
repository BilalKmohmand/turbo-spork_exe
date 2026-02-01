import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles, CheckCircle, XCircle, RotateCcw, FileText, Trophy, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizSection {
  name: string;
  questions: QuizQuestion[];
}

interface QuizResult {
  sections: QuizSection[];
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

  // Flatten all questions with global index for answer tracking
  const getAllQuestions = () => {
    if (!quiz) return [];
    const all: { question: QuizQuestion; sectionIndex: number; questionIndex: number; globalIndex: number }[] = [];
    let globalIndex = 0;
    quiz.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        all.push({ question, sectionIndex, questionIndex, globalIndex });
        globalIndex++;
      });
    });
    return all;
  };

  const allQuestions = getAllQuestions();
  const totalQuestions = allQuestions.length;

  const getScore = () => {
    if (!quiz) return 0;
    return allQuestions.filter(({ question, globalIndex }) => 
      userAnswers[globalIndex] === question.correctAnswer
    ).length;
  };

  const getScorePercent = () => {
    if (!quiz || totalQuestions === 0) return 0;
    return Math.round((getScore() / totalQuestions) * 100);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSourceText("");
    setUserAnswers({});
    setShowResults(false);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = quiz ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Quiz Generator</h1>
        <p className="text-muted-foreground">Transform any text into interactive practice quizzes</p>
      </div>

      {!quiz ? (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <Label className="text-sm font-medium mb-3 block">Paste your study material</Label>
            <Textarea
              placeholder="Paste your notes, textbook excerpts, or any text you want to study from..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[200px] resize-none mb-4 border-border/50"
              data-testid="input-quiz-source"
            />
            <Button
              onClick={() => generateMutation.mutate(sourceText)}
              disabled={!sourceText.trim() || generateMutation.isPending}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{quiz.topic}</h2>
              <p className="text-sm text-muted-foreground">{quiz.sections.length} sections · {totalQuestions} questions</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetQuiz} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </Button>
          </div>

          {!showResults && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{answeredCount}/{totalQuestions}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </CardContent>
            </Card>
          )}

          {showResults && (
            <Card className={`border-0 ${getScorePercent() >= 70 ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-amber-600 to-orange-600"} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5" />
                      <span className="text-sm font-medium opacity-90">Your Score</span>
                    </div>
                    <p className="text-3xl font-bold">
                      {getScore()} / {totalQuestions}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold">{getScorePercent()}%</p>
                    <p className="text-sm opacity-80">
                      {getScorePercent() >= 90 ? "Excellent!" : getScorePercent() >= 70 ? "Good job!" : "Keep practicing!"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {quiz.sections.map((section, sectionIndex) => {
            // Calculate global index offset for this section
            const sectionStartIndex = quiz.sections
              .slice(0, sectionIndex)
              .reduce((acc, s) => acc + s.questions.length, 0);
            
            return (
              <div key={sectionIndex} className="space-y-3">
                <div className="flex items-center gap-2 mt-6 first:mt-0">
                  <Badge variant="outline" className="text-xs font-medium">
                    Section {sectionIndex + 1}
                  </Badge>
                  <h3 className="font-semibold text-sm text-muted-foreground">{section.name}</h3>
                </div>
                
                {section.questions.map((question, qIndex) => {
                  const globalIndex = sectionStartIndex + qIndex;
                  return (
                    <Card key={qIndex} className="border-border/50 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 border-b border-border/50 bg-muted/30">
                          <div className="flex items-start gap-3">
                            <Badge 
                              className={`mt-0.5 ${
                                showResults 
                                  ? userAnswers[globalIndex] === question.correctAnswer 
                                    ? "bg-emerald-600" 
                                    : "bg-red-600"
                                  : "bg-violet-600"
                              }`}
                            >
                              {globalIndex + 1}
                            </Badge>
                            <p className="font-medium text-sm">{question.question}</p>
                          </div>
                        </div>

                        <div className="p-4">
                          <RadioGroup
                            value={userAnswers[globalIndex]?.toString()}
                            onValueChange={(val) => setUserAnswers(prev => ({ ...prev, [globalIndex]: parseInt(val) }))}
                            disabled={showResults}
                            className="space-y-2"
                          >
                            {question.options.map((option, oIndex) => (
                              <div 
                                key={oIndex} 
                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                                  showResults 
                                    ? oIndex === question.correctAnswer 
                                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" 
                                      : userAnswers[globalIndex] === oIndex 
                                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" 
                                        : "border-border/50"
                                    : userAnswers[globalIndex] === oIndex
                                      ? "border-violet-300 bg-violet-50 dark:bg-violet-950/20"
                                      : "border-border/50 hover:border-border"
                                }`}
                              >
                                <RadioGroupItem value={oIndex.toString()} id={`q${globalIndex}-o${oIndex}`} />
                                <Label htmlFor={`q${globalIndex}-o${oIndex}`} className="flex-1 cursor-pointer text-sm">
                                  {option}
                                </Label>
                                {showResults && oIndex === question.correctAnswer && (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                )}
                                {showResults && userAnswers[globalIndex] === oIndex && oIndex !== question.correctAnswer && (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            ))}
                          </RadioGroup>

                          {showResults && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Explanation</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}

          {!showResults && (
            <Button 
              onClick={handleSubmitQuiz} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={answeredCount !== totalQuestions}
              data-testid="button-submit-quiz"
            >
              <Target className="w-4 h-4 mr-2" />
              Submit Quiz
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
