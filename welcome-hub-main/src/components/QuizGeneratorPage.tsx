import { useState, useEffect } from "react";
import { FileText, Plus, Play, Copy, CheckCircle, MoreVertical, Clock, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  attempts: number;
  questions?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }[];
}

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/10 text-green-500",
  medium: "bg-amber-500/10 text-amber-500",
  hard: "bg-red-500/10 text-red-500",
};

const SUBJECTS = ["Mathematics", "Science", "English", "History", "Geography", "Physics", "Chemistry", "Biology", "Other"];

export default function QuizGeneratorPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [copied, setCopied] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    subject: "Mathematics",
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    questionCount: 5,
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ quizzes: Quiz[] }>("/api/quizzes");
      setQuizzes(res.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim() || !newQuiz.topic.trim()) return;
    setCreateError(null);
    try {
      const res = await apiFetch<{ quiz: Quiz }>("/api/quizzes/generate", {
        method: "POST",
        body: JSON.stringify(newQuiz),
      });

      if (!Array.isArray(res.quiz?.questions) || res.quiz.questions.length === 0) {
        setCreateError("Quiz generated but no questions were returned. Try again with a simpler topic.");
        return;
      }

      setQuizzes(prev => [res.quiz, ...prev]);
      setShowCreateDialog(false);
      setNewQuiz({ title: "", subject: "Mathematics", topic: "", difficulty: "medium", questionCount: 5 });
    } catch (error) {
      console.error("Failed to create quiz:", error);
      setCreateError(error instanceof Error ? error.message : "Failed to create quiz");
    }
  };

  const openQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizDialog(true);
  };

  const copyQuiz = async (quiz: Quiz) => {
    try {
      await navigator.clipboard.writeText(`Quiz: ${quiz.title}\nSubject: ${quiz.subject}\nDifficulty: ${quiz.difficulty}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Quiz Generator</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm" className="relative z-10">
          <Plus className="w-4 h-4 mr-1" />
          Create Quiz
        </Button>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Generate your first quiz</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                AI-powered quiz generator creates custom questions on any topic. Perfect for test prep and practice.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create Quiz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map(quiz => (
                <Card key={quiz.id} className="group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openQuiz(quiz)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
                        {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); copyQuiz(quiz); }}
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground">{quiz.subject}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        {quiz.questionCount} questions
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {quiz.attempts > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {quiz.attempts} attempt{quiz.attempts !== 1 ? "s" : ""}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Quiz Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>
              Enter a topic and the AI will generate custom quiz questions for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {createError && (
              <div className="text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="e.g., Algebra Basics"
                value={newQuiz.title}
                onChange={e => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  value={newQuiz.subject}
                  onChange={e => setNewQuiz(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={newQuiz.difficulty}
                  onChange={e => setNewQuiz(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Content</Label>
              <Textarea
                id="topic"
                placeholder="Describe what the quiz should cover..."
                value={newQuiz.topic}
                onChange={e => setNewQuiz(prev => ({ ...prev, topic: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions ({newQuiz.questionCount})</Label>
              <input
                id="count"
                type="range"
                min="3"
                max="20"
                value={newQuiz.questionCount}
                onChange={e => setNewQuiz(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateQuiz}
                disabled={!newQuiz.title.trim() || !newQuiz.topic.trim()}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Quiz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Take Quiz Dialog */}
      {selectedQuiz && (
        <TakeQuizDialog
          quiz={selectedQuiz}
          open={showQuizDialog}
          onOpenChange={setShowQuizDialog}
        />
      )}
    </div>
  );
}

// Interactive quiz-taking component
function TakeQuizDialog({
  quiz,
  open,
  onOpenChange,
}: {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions?.length || 0).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const questions = quiz.questions || [];

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleSubmit = () => setSubmitted(true);
  const handleReset = () => {
    setAnswers(new Array(questions.length).fill(-1));
    setSubmitted(false);
  };

  const correctCount = answers.reduce((sum, ans, idx) => {
    return sum + (ans === questions[idx]?.correctIndex ? 1 : 0);
  }, 0);
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
          <DialogDescription>
            {quiz.subject} · {quiz.questionCount} questions · {quiz.difficulty} difficulty
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4">
            {questions.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <p>No questions available for this quiz.</p>
              </div>
            ) : (
              questions.map((q, idx) => {
                const selected = answers[idx];
                const isCorrect = selected === q.correctIndex;
                return (
                  <div key={idx} className="border border-border rounded-xl p-4">
                    <div className="font-medium mb-3">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === optIdx;
                        const isCorrectOption = optIdx === q.correctIndex;
                        const showCorrectness = submitted && (isCorrectOption || isSelected);
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelect(idx, optIdx)}
                            disabled={submitted}
                            className={cn(
                              "w-full text-left text-sm rounded-lg px-3 py-2 border transition-colors",
                              showCorrectness
                                ? isCorrectOption
                                  ? "border-green-500/50 bg-green-500/10"
                                  : isSelected
                                    ? "border-red-500/50 bg-red-500/10"
                                    : "border-border bg-muted/30"
                                : isSelected
                                  ? "border-primary/50 bg-primary/10"
                                  : "border-border bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {submitted && q.explanation && (
                      <div className="text-xs text-muted-foreground mt-3">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="flex flex-col gap-3 pt-4 border-t">
          {submitted ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Score: <span className="font-semibold text-primary">{correctCount}/{questions.length}</span> ({score}%)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Retake
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {answers.filter(a => a !== -1).length} of {questions.length} answered
              </div>
              <Button
                onClick={handleSubmit}
                disabled={answers.some(a => a === -1)}
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
