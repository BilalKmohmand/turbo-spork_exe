import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  Trophy,
  Target,
  ArrowRight,
  Zap,
  TrendingUp,
  Star,
} from "lucide-react";

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

interface AnswerRecord {
  selected: number;
  correct: boolean;
  correctAnswer: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QuizContent() {
  const [sourceText, setSourceText] = useState("");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [smartScore, setSmartScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/generate-quiz", { text });
      return response.json();
    },
    onSuccess: (data) => {
      setQuiz(data);
      setCurrentIndex(0);
      setAnswers({});
      setSelectedOption(null);
      setShowFeedback(false);
      setSmartScore(0);
      setStreak(0);
      setBestStreak(0);
      setFinished(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz",
        variant: "destructive",
      });
    },
  });

  const allQuestions = quiz
    ? quiz.sections.flatMap((s) => s.questions)
    : [];
  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentIndex] || null;

  const getSectionForIndex = (idx: number) => {
    if (!quiz) return { sectionName: "", questionInSection: 0 };
    let count = 0;
    for (const section of quiz.sections) {
      if (idx < count + section.questions.length) {
        return { sectionName: section.name, questionInSection: idx - count + 1 };
      }
      count += section.questions.length;
    }
    return { sectionName: "", questionInSection: 0 };
  };

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const incorrectCount = Object.values(answers).filter((a) => !a.correct).length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleSelectOption = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newStreak = isCorrect ? streak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);

    let scoreChange = 0;
    if (isCorrect) {
      scoreChange = 10 + Math.min(streak * 2, 10);
    } else {
      const penalty = Math.min(15 + incorrectCount * 3, 30);
      scoreChange = -penalty;
    }
    const newScore = Math.max(0, Math.min(100, smartScore + scoreChange));

    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        selected: selectedOption,
        correct: isCorrect,
        correctAnswer: currentQuestion.correctAnswer,
      },
    }));
    setSmartScore(newScore);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSourceText("");
    setCurrentIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setShowFeedback(false);
    setSmartScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  const retryQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setShowFeedback(false);
    setSmartScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  const scoreColor =
    smartScore >= 80
      ? "text-emerald-600"
      : smartScore >= 50
        ? "text-amber-600"
        : smartScore > 0
          ? "text-orange-600"
          : "text-muted-foreground";

  const scoreBarColor =
    smartScore >= 80
      ? "bg-emerald-500"
      : smartScore >= 50
        ? "bg-amber-500"
        : "bg-orange-500";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" data-testid="text-quiz-title">AI Quiz Generator</h1>
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
      ) : finished ? (
        <ResultsScreen
          smartScore={smartScore}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          totalQuestions={totalQuestions}
          bestStreak={bestStreak}
          answers={answers}
          allQuestions={allQuestions}
          getSectionForIndex={getSectionForIndex}
          onRetry={retryQuiz}
          onNewQuiz={resetQuiz}
        />
      ) : (
        <div className="space-y-4">
          <ScoreBar
            smartScore={smartScore}
            streak={streak}
            scoreColor={scoreColor}
            scoreBarColor={scoreBarColor}
            progressPercent={progressPercent}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            topic={quiz.topic}
          />

          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              sectionInfo={getSectionForIndex(currentIndex)}
              selectedOption={selectedOption}
              showFeedback={showFeedback}
              answer={answers[currentIndex]}
              onSelectOption={handleSelectOption}
              onSubmit={handleSubmitAnswer}
              onNext={handleNext}
              isLast={currentIndex + 1 >= totalQuestions}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  smartScore,
  streak,
  scoreColor,
  scoreBarColor,
  progressPercent,
  answeredCount,
  totalQuestions,
  topic,
}: {
  smartScore: number;
  streak: number;
  scoreColor: string;
  scoreBarColor: string;
  progressPercent: number;
  answeredCount: number;
  totalQuestions: number;
  topic: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm">{topic}</h2>
          </div>
          <div className="flex items-center gap-4">
            {streak >= 2 && (
              <div className="flex items-center gap-1.5" data-testid="text-streak">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600">{streak} streak</span>
              </div>
            )}
            <div className="flex items-center gap-1.5" data-testid="text-smart-score">
              <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
              <span className={`text-lg font-bold ${scoreColor}`}>{smartScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{answeredCount}/{totalQuestions} questions</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  sectionInfo,
  selectedOption,
  showFeedback,
  answer,
  onSelectOption,
  onSubmit,
  onNext,
  isLast,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  sectionInfo: { sectionName: string; questionInSection: number };
  selectedOption: number | null;
  showFeedback: boolean;
  answer: AnswerRecord | undefined;
  onSelectOption: (idx: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <Card className="border-border/50" data-testid={`card-question-${questionNumber}`}>
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{sectionInfo.sectionName}</Badge>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <p className="font-medium" data-testid="text-question">{question.question}</p>
        </div>

        <div className="p-4 space-y-2">
          {question.options.map((option, oIndex) => {
            const isSelected = selectedOption === oIndex;
            const isCorrectAnswer = oIndex === question.correctAnswer;
            const wasChosen = answer?.selected === oIndex;

            let optionClasses = "border-border/50";
            let letterClasses = "bg-muted text-muted-foreground";

            if (showFeedback && answer) {
              if (isCorrectAnswer) {
                optionClasses = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700";
                letterClasses = "bg-emerald-600 text-white";
              } else if (wasChosen && !answer.correct) {
                optionClasses = "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700";
                letterClasses = "bg-red-600 text-white";
              }
            } else if (isSelected) {
              optionClasses = "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700";
              letterClasses = "bg-violet-600 text-white";
            }

            return (
              <button
                key={oIndex}
                onClick={() => onSelectOption(oIndex)}
                disabled={showFeedback}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${optionClasses} ${
                  !showFeedback ? "hover-elevate cursor-pointer" : ""
                }`}
                data-testid={`button-option-${OPTION_LETTERS[oIndex]}`}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${letterClasses}`}>
                  {OPTION_LETTERS[oIndex]}
                </div>
                <span className="text-sm flex-1">{option}</span>
                {showFeedback && isCorrectAnswer && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                {showFeedback && wasChosen && !answer?.correct && (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`mx-4 mb-4 p-3.5 rounded-lg border ${
            answer?.correct
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
              : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
          }`} data-testid="text-explanation">
            <div className="flex items-center gap-2 mb-1">
              {answer?.correct ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${answer?.correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {answer?.correct ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className={`text-sm ${answer?.correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
              {question.explanation}
            </p>
          </div>
        )}

        <div className="p-4 pt-0">
          {!showFeedback ? (
            <Button
              onClick={onSubmit}
              disabled={selectedOption === null}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-check-answer"
            >
              <Target className="w-4 h-4" />
              Check Answer
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
              data-testid="button-next-question"
            >
              {isLast ? (
                <>
                  <Trophy className="w-4 h-4" />
                  See Results
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Next Question
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsScreen({
  smartScore,
  correctCount,
  incorrectCount,
  totalQuestions,
  bestStreak,
  answers,
  allQuestions,
  getSectionForIndex,
  onRetry,
  onNewQuiz,
}: {
  smartScore: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  bestStreak: number;
  answers: Record<number, AnswerRecord>;
  allQuestions: QuizQuestion[];
  getSectionForIndex: (idx: number) => { sectionName: string; questionInSection: number };
  onRetry: () => void;
  onNewQuiz: () => void;
}) {
  const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const gradeLabel =
    pct >= 90
      ? "Outstanding!"
      : pct >= 80
        ? "Great job!"
        : pct >= 70
          ? "Good work!"
          : pct >= 50
            ? "Keep practicing!"
            : "Needs more study";

  const gradeColor =
    pct >= 80
      ? "from-emerald-600 to-teal-600"
      : pct >= 50
        ? "from-amber-500 to-orange-500"
        : "from-red-500 to-orange-500";

  return (
    <div className="space-y-4">
      <Card className={`border-0 bg-gradient-to-br ${gradeColor} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6" />
                <span className="font-semibold">Quiz Complete</span>
              </div>
              <p className="text-3xl font-bold" data-testid="text-final-score">
                {correctCount}/{totalQuestions}
              </p>
              <p className="text-sm opacity-80 mt-1">{gradeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold" data-testid="text-final-percent">{pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-violet-600" />
            <p className="text-2xl font-bold" data-testid="text-smart-score-final">{smartScore}</p>
            <p className="text-xs text-muted-foreground">SmartScore</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold" data-testid="text-best-streak">{bestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold">{correctCount}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">Question Review</h3>
          <div className="space-y-2">
            {allQuestions.map((q, idx) => {
              const a = answers[idx];
              const info = getSectionForIndex(idx);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    a?.correct
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  }`}
                  data-testid={`review-question-${idx + 1}`}
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    a?.correct ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                  }`}>
                    {a?.correct ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.question}</p>
                    {!a?.correct && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your answer: {OPTION_LETTERS[a?.selected ?? 0]}. Correct: {OPTION_LETTERS[q.correctAnswer]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="flex-1 gap-2" data-testid="button-retry-quiz">
          <RotateCcw className="w-4 h-4" />
          Retry Quiz
        </Button>
        <Button onClick={onNewQuiz} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-new-quiz">
          <Sparkles className="w-4 h-4" />
          New Quiz
        </Button>
      </div>
    </div>
  );
}
