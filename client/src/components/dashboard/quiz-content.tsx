import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2, Sparkles, FileText, Trophy, Target,
  Zap, TrendingUp, ToggleLeft, PenLine, MessageSquare,
  CheckSquare, Upload, Clock, ArrowRight, CheckCircle,
  XCircle, ChevronRight, BarChart2, RefreshCw,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────── */
type QuizType = "single_choice" | "multiple_choice" | "true_false" | "fill_blank" | "short_answer";
type DifficultyLevel = "basic" | "intermediate" | "advanced";

interface QuizQuestion {
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer?: number | boolean | string;
  correctAnswers?: number[];
  explanation: string;
}
interface QuizSection { name: string; questions: QuizQuestion[]; }
interface QuizResult { sections: QuizSection[]; topic: string; level: DifficultyLevel; quizType: QuizType; }
interface AnswerRecord { value: any; correct: boolean; }
interface QuizAttempt {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  difficulty: string;
  quizType: string;
  attemptedAt: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

const QUIZ_TYPES: { value: QuizType; label: string; icon: any }[] = [
  { value: "single_choice",   label: "Single Choice",   icon: Target },
  { value: "multiple_choice", label: "Multiple Choice",  icon: CheckSquare },
  { value: "true_false",      label: "True / False",     icon: ToggleLeft },
  { value: "fill_blank",      label: "Fill in Blank",    icon: PenLine },
  { value: "short_answer",    label: "Short Answer",     icon: MessageSquare },
];

const LEVELS: { value: DifficultyLevel; label: string; bar: string; badge: string }[] = [
  { value: "basic",        label: "Basic",        bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "intermediate", label: "Intermediate", bar: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "advanced",     label: "Advanced",     bar: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200" },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

/* ─── Stats Header ──────────────────────────────────────────────── */
function StatsPanel({ attempts }: { attempts: QuizAttempt[] }) {
  const total = attempts.length;
  const avgScore = total > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / total)
    : 0;
  const bestScore = total > 0 ? Math.max(...attempts.map(a => a.score)) : 0;

  const byDiff = LEVELS.map(l => {
    const group = attempts.filter(a => a.difficulty === l.value);
    const avg = group.length > 0 ? Math.round(group.reduce((s, a) => s + a.score, 0) / group.length) : 0;
    return { ...l, count: group.length, avg };
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total */}
      <div className="p-5 rounded-2xl border border-[#E5E5E0] bg-white flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#999990]">Total Quizzes</span>
        <span className="text-3xl font-black text-[#111110]">{total}</span>
        <span className="text-[12px] text-[#666660]">attempts so far</span>
      </div>
      {/* Avg Score */}
      <div className="p-5 rounded-2xl border border-[#E5E5E0] bg-white flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#999990]">Avg Score</span>
        <span className={`text-3xl font-black ${scoreColor(avgScore)}`}>{total > 0 ? `${avgScore}%` : "—"}</span>
        <span className="text-[12px] text-[#666660]">across all attempts</span>
      </div>
      {/* Best */}
      <div className="p-5 rounded-2xl border border-[#E5E5E0] bg-white flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#999990]">Best Score</span>
        <span className={`text-3xl font-black ${scoreColor(bestScore)}`}>{total > 0 ? `${bestScore}%` : "—"}</span>
        <span className="text-[12px] text-[#666660]">personal best</span>
      </div>
      {/* Difficulty breakdown */}
      <div className="p-5 rounded-2xl border border-[#E5E5E0] bg-white flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#999990] mb-1">By Difficulty</span>
        {byDiff.map(d => (
          <div key={d.value} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-[#444440]">{d.label}</span>
                <span className="text-[11px] text-[#999990]">{d.count} done{d.count > 0 ? ` · ${d.avg}%` : ""}</span>
              </div>
              <div className="h-1.5 w-full bg-[#F0F0F0] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.bar} transition-all duration-700`} style={{ width: d.count > 0 ? `${d.avg}%` : "0%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Recent Attempts ───────────────────────────────────────────── */
function RecentAttempts({ attempts, onRetry }: { attempts: QuizAttempt[]; onRetry: (a: QuizAttempt) => void }) {
  if (attempts.length === 0) return null;

  const recent = attempts.slice(0, 5);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Recent Attempts</h3>
        <span className="text-[12px] text-[#999990]">{attempts.length} total</span>
      </div>
      <div className="space-y-3">
        {recent.map((a) => {
          const diffInfo = LEVELS.find(l => l.value === a.difficulty);
          const passed = a.score >= 60;
          return (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl border border-[#E5E5E0] bg-white hover:border-[#CCCCCC] transition-colors group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${passed ? "bg-emerald-50" : "bg-red-50"}`}>
                {passed
                  ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                  : <XCircle    className="w-5 h-5 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-semibold text-[#111110] truncate">{a.topic}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${diffInfo?.badge}`}>
                    {diffInfo?.label}
                  </span>
                </div>
                <p className="text-[12px] text-[#999990]">
                  {a.correctCount}/{a.totalQuestions} correct · {timeAgo(a.attemptedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xl font-black ${scoreColor(a.score)}`}>{a.score}%</span>
                <button
                  onClick={() => onRetry(a)}
                  title="Retry this quiz"
                  className="p-2 rounded-lg text-[#999990] hover:text-[#111110] hover:bg-[#F0F0F0] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function QuizContent() {
  const [sourceTab, setSourceTab] = useState<"document" | "text">("document");
  const [sourceText, setSourceText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quizType, setQuizType] = useState<QuizType>("single_choice");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<number>>(new Set());
  const [textInput, setTextInput] = useState("");
  const [tfChoice, setTfChoice] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [smartScore, setSmartScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const { toast } = useToast();

  const { data: quizAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
    refetchInterval: 30000,
  });

  /* File upload */
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setExtracting(true);
    setUploadedFile({ name: file.name });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/extract-text", { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to extract text");
      setSourceText(data.text);
      setSourceTab("text");
      toast({ title: "Text extracted", description: `Ready to generate a quiz from ${file.name}` });
    } catch (err: any) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  }, [handleFileUpload]);

  /* Generate quiz */
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-quiz", {
        text: sourceText, level, questionCount: 10, quizType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuiz(data);
      setCurrentIndex(0);
      setAnswers({});
      resetInputState();
      setSmartScore(0);
      setStreak(0);
      setBestStreak(0);
      setFinished(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  /* Retry a past attempt's topic */
  const handleRetry = (attempt: QuizAttempt) => {
    setLevel(attempt.difficulty as DifficultyLevel);
    setQuizType(attempt.quizType as QuizType);
    setSourceText(`Retry quiz on topic: ${attempt.topic}`);
    setSourceTab("text");
  };

  function resetInputState() {
    setSelectedOption(null);
    setSelectedMulti(new Set());
    setTextInput("");
    setTfChoice(null);
    setShowFeedback(false);
  }

  const allQuestions = quiz ? quiz.sections.flatMap(s => s.questions) : [];
  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentIndex] || null;
  const currentType = currentQuestion?.type || quiz?.quizType || "single_choice";
  const progressPercent = totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0;

  /* Save attempt */
  const saveAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      await apiRequest("POST", "/api/quiz-attempts", attemptData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
    },
  });

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    let isCorrect = false;
    let answerValue: any = null;

    if (currentType === "single_choice") {
      if (selectedOption === null) return;
      isCorrect = selectedOption === currentQuestion.correctAnswer;
      answerValue = selectedOption;
    } else if (currentType === "multiple_choice") {
      if (selectedMulti.size === 0) return;
      const correctSet = new Set(currentQuestion.correctAnswers || []);
      isCorrect = selectedMulti.size === correctSet.size && [...selectedMulti].every(v => correctSet.has(v));
      answerValue = [...selectedMulti];
    } else if (currentType === "true_false") {
      if (tfChoice === null) return;
      isCorrect = tfChoice === currentQuestion.correctAnswer;
      answerValue = tfChoice;
    } else {
      if (!textInput.trim()) return;
      const userAns    = textInput.trim().toLowerCase();
      const correctAns = String(currentQuestion.correctAnswer || "").toLowerCase();
      if (currentType === "fill_blank") {
        isCorrect = userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns);
      } else {
        const words = correctAns.split(/\s+/);
        isCorrect = words.filter(w => userAns.includes(w)).length >= Math.ceil(words.length * 0.5);
      }
      answerValue = textInput.trim();
    }

    const newStreak     = isCorrect ? streak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    const incorrectSoFar = Object.values(answers).filter(a => !a.correct).length;
    const scoreChange   = isCorrect
      ? (10 + Math.min(streak * 2, 10))
      : -Math.min(15 + incorrectSoFar * 3, 30);
    const newScore = Math.max(0, Math.min(100, smartScore + scoreChange));

    const newAnswers = { ...answers, [currentIndex]: { value: answerValue, correct: isCorrect } };
    setAnswers(newAnswers);
    setSmartScore(newScore);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setShowFeedback(true);

    if (currentIndex + 1 === totalQuestions) {
      saveAttemptMutation.mutate({
        topic: quiz?.topic || "Quiz",
        score: newScore,
        totalQuestions,
        correctCount: Object.values(newAnswers).filter(a => a.correct).length,
        difficulty: level,
        quizType,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) setFinished(true);
    else { setCurrentIndex(currentIndex + 1); resetInputState(); }
  };

  /* ── Finished screen ─────────────────────────────────────── */
  if (finished) {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/10">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-[#666660] mb-8">Here's how you performed:</p>
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="p-6 rounded-3xl bg-[#F9F9F8] border border-[#E5E5E0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#999990] mb-1">Score</p>
            <p className={`text-4xl font-black ${scoreColor(smartScore)}`}>{smartScore}%</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#F9F9F8] border border-[#E5E5E0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#999990] mb-1">Correct</p>
            <p className="text-4xl font-black text-[#111110]">{correctCount}/{totalQuestions}</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#F9F9F8] border border-[#E5E5E0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#999990] mb-1">Best Streak</p>
            <p className="text-4xl font-black text-[#111110]">{bestStreak}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { setQuiz(null); setFinished(false); }} variant="outline" className="flex-1 h-14 rounded-2xl border-[#E5E5E0] font-semibold">
            New Quiz
          </Button>
          <Button onClick={() => {
            setCurrentIndex(0);
            setAnswers({});
            resetInputState();
            setSmartScore(0);
            setStreak(0);
            setBestStreak(0);
            setFinished(false);
          }} className="flex-1 h-14 rounded-2xl bg-black text-white font-semibold">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  /* ── Quiz player ─────────────────────────────────────────── */
  if (quiz) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{quiz.topic}</h2>
            <p className="text-sm text-[#666660]">Question {currentIndex + 1} of {totalQuestions}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#999990]">Score</p>
            <p className={`text-2xl font-black ${scoreColor(smartScore)}`}>{smartScore}</p>
          </div>
        </div>

        <div className="h-2 w-full bg-[#F0F0F0] rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-black transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <Card className="border-[#E5E5E0] rounded-[28px] shadow-sm">
          <CardContent className="p-8 lg:p-10">
            <h3 className="text-xl font-semibold mb-8 leading-snug">{currentQuestion?.question}</h3>

            <div className="space-y-3">
              {currentType === "single_choice" && currentQuestion?.options?.map((opt, i) => (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                    showFeedback && i === currentQuestion.correctAnswer
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : showFeedback && selectedOption === i && i !== currentQuestion.correctAnswer
                      ? "border-red-400 bg-red-50 text-red-800"
                      : selectedOption === i
                      ? "border-black bg-[#F9F9F8]"
                      : "border-[#E5E5E0] hover:bg-[#F9F9F8]"
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#F0F0F0] flex items-center justify-center text-xs font-bold shrink-0">{OPTION_LETTERS[i]}</span>
                  <span className="text-[15px]">{opt}</span>
                </button>
              ))}

              {currentType === "true_false" && (
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      disabled={showFeedback}
                      onClick={() => setTfChoice(val)}
                      className={`p-4 rounded-2xl border text-center font-semibold transition-all ${
                        showFeedback && val === currentQuestion.correctAnswer
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : showFeedback && tfChoice === val && val !== currentQuestion.correctAnswer
                          ? "border-red-400 bg-red-50 text-red-800"
                          : tfChoice === val
                          ? "border-black bg-[#F9F9F8]"
                          : "border-[#E5E5E0] hover:bg-[#F9F9F8]"
                      }`}
                    >
                      {val ? "True" : "False"}
                    </button>
                  ))}
                </div>
              )}

              {(currentType === "fill_blank" || currentType === "short_answer") && (
                <input
                  disabled={showFeedback}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !showFeedback && handleSubmitAnswer()}
                  placeholder={currentType === "fill_blank" ? "Fill in the blank..." : "Write your answer..."}
                  className="w-full p-4 rounded-2xl border border-[#E5E5E0] focus:border-black focus:outline-none text-[15px] transition-all"
                />
              )}
            </div>

            {showFeedback && (
              <div className="mt-6 p-5 rounded-2xl bg-[#F9F9F8] border border-[#E5E5E0]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#999990] mb-2">Explanation</p>
                <p className="text-[15px] leading-relaxed text-[#444440]">{currentQuestion?.explanation}</p>
              </div>
            )}

            <div className="mt-8">
              {!showFeedback ? (
                <Button onClick={handleSubmitAnswer} className="w-full h-14 rounded-2xl bg-black text-white font-semibold text-base">
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full h-14 rounded-2xl bg-black text-white font-semibold text-base">
                  {currentIndex + 1 === totalQuestions ? "See Results" : "Next Question →"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Home / Generator screen ─────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="w-16 h-16 rounded-[22px] bg-black flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Quiz Generator</h2>
        <p className="text-[#666660]">Transform study materials into interactive practice</p>
      </header>

      {/* Stats + History */}
      <StatsPanel attempts={quizAttempts} />
      <RecentAttempts attempts={quizAttempts} onRetry={handleRetry} />

      {/* Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Source input */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-[#F0F0F0] w-fit">
            {(["document", "text"] as const).map(t => (
              <button
                key={t}
                onClick={() => setSourceTab(t)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                  sourceTab === t
                    ? "bg-white shadow-sm text-[#111110]"
                    : "text-[#999990] hover:text-[#666660]"
                }`}
              >
                {t === "document" ? "Upload File" : "Paste Text"}
              </button>
            ))}
          </div>

          <Card className="border-[#E5E5E0] rounded-[28px] shadow-sm">
            <CardContent className="p-8">
              {sourceTab === "text" ? (
                <>
                  <Textarea
                    placeholder="Paste your study notes, textbook excerpts, or any text to quiz yourself on..."
                    value={sourceText}
                    onChange={e => setSourceText(e.target.value)}
                    className="min-h-[240px] border-none focus-visible:ring-0 p-0 text-[16px] placeholder:text-[#BBBBBB] no-scrollbar resize-none"
                  />
                  {sourceText && (
                    <p className="text-[12px] text-[#999990] mt-3">{sourceText.length} characters</p>
                  )}
                </>
              ) : (
                <div>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                  {!uploadedFile && !extracting ? (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-[20px] p-14 text-center cursor-pointer transition-colors ${
                        dragOver ? "border-black bg-[#F9F9F8]" : "border-[#E5E5E0] hover:border-[#CCCCCC] hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <Upload className="w-10 h-10 text-[#CCCCCC] mx-auto mb-4" />
                      <p className="text-[16px] font-semibold text-[#444440] mb-1">Drop file or click to browse</p>
                      <p className="text-sm text-[#999990]">PDF, Word, or Text files · Max 10 MB</p>
                    </div>
                  ) : extracting ? (
                    <div className="p-14 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#999990] mx-auto mb-3" />
                      <p className="text-sm text-[#666660]">Extracting text from {uploadedFile?.name}...</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-semibold text-[#111110] mb-1">{uploadedFile?.name}</p>
                      <p className="text-sm text-[#666660] mb-4">{sourceText.length} characters extracted</p>
                      <button onClick={() => { setUploadedFile(null); setSourceText(""); }} className="text-sm text-[#999990] hover:text-[#666660] underline">Remove</button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings panel */}
        <div className="lg:col-span-5">
          <Card className="border-[#E5E5E0] rounded-[28px] bg-[#F9F9F8]">
            <CardContent className="p-8 space-y-8">
              {/* Difficulty */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#999990] mb-3">Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        level === l.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-[#666660] border-[#E5E5E0] hover:border-[#CCCCCC]"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question type */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#999990] mb-3">Question Type</p>
                <div className="space-y-2">
                  {QUIZ_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setQuizType(t.value)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        quizType === t.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-[#444440] border-[#E5E5E0] hover:border-[#CCCCCC]"
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{t.label}</span>
                      <t.icon className="w-4 h-4 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!sourceText.trim() || generateMutation.isPending}
                className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {generateMutation.isPending
                  ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating...</>
                  : <><Sparkles className="w-5 h-5 mr-2" /> Generate Quiz</>
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
