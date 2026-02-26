import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DashboardStats } from "@shared/schema";
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
  GraduationCap,
  BarChart3,
  ListChecks,
  ToggleLeft,
  PenLine,
  MessageSquare,
  CheckSquare,
  Upload,
  Type,
  ImageIcon,
  X,
  File,
} from "lucide-react";

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

interface QuizSection {
  name: string;
  questions: QuizQuestion[];
}

interface QuizResult {
  sections: QuizSection[];
  topic: string;
  level: DifficultyLevel;
  quizType: QuizType;
}

interface AnswerRecord {
  value: any;
  correct: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

const QUIZ_TYPES: { value: QuizType; label: string; icon: any; desc: string }[] = [
  { value: "single_choice", label: "Single Choice", icon: Target, desc: "Pick one correct answer" },
  { value: "multiple_choice", label: "Multiple Choice", icon: CheckSquare, desc: "Select all that apply" },
  { value: "true_false", label: "True / False", icon: ToggleLeft, desc: "Decide if statement is true or false" },
  { value: "fill_blank", label: "Fill in Blank", icon: PenLine, desc: "Type the missing word" },
  { value: "short_answer", label: "Short Answer", icon: MessageSquare, desc: "Write a brief answer" },
];

const LEVELS: { value: DifficultyLevel; label: string; color: string; desc: string }[] = [
  { value: "basic", label: "Basic", color: "from-emerald-500 to-green-500", desc: "Recall & definitions" },
  { value: "intermediate", label: "Intermediate", color: "from-amber-500 to-orange-500", desc: "Application & analysis" },
  { value: "advanced", label: "Advanced", color: "from-red-500 to-rose-500", desc: "Critical thinking" },
];

type SourceTab = "document" | "text" | "image";

export default function QuizContent() {
  const [sourceTab, setSourceTab] = useState<SourceTab>("document");
  const [sourceText, setSourceText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [quizType, setQuizType] = useState<QuizType>("single_choice");
  const [level, setLevel] = useState<DifficultyLevel>("intermediate");
  const [questionCount, setQuestionCount] = useState(10);
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

  const handleFileUpload = useCallback(async (file: globalThis.File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    setExtracting(true);
    setUploadedFile({ name: file.name, size: file.size });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/extract-text", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to extract text");
      setSourceText(data.text);
      toast({ title: "Text extracted", description: `Extracted ${data.text.length} characters from ${file.name}` });
    } catch (err: any) {
      toast({ title: "Extraction failed", description: err.message || "Could not extract text from file", variant: "destructive" });
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

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  }, [handleFileUpload]);

  const clearUpload = useCallback(() => {
    setUploadedFile(null);
    setSourceText("");
  }, []);

  const [topicAnalysis, setTopicAnalysis] = useState<{ topic: string; subtopics: string[]; possibleQuestions: string[]; questionCount: number } | null>(null);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);
  const analyzeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sourceTab !== "text") return;
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    if (sourceText.trim().length < 80) {
      setTopicAnalysis(null);
      return;
    }
    analyzeTimerRef.current = setTimeout(async () => {
      setAnalyzingTopics(true);
      try {
        const res = await fetch("/api/analyze-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceText }),
        });
        if (res.ok) {
          const data = await res.json();
          setTopicAnalysis(data);
        }
      } catch {}
      finally { setAnalyzingTopics(false); }
    }, 1000);
    return () => { if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current); };
  }, [sourceText, sourceTab]);

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: quizAttempts = [] } = useQuery<Array<{ difficulty: string; score: number; correctCount: number; totalQuestions: number }>>({
    queryKey: ["/api/quiz-attempts"],
  });

  const levelStats = ["basic", "intermediate", "advanced"].map((diff) => {
    const attempts = quizAttempts.filter((a) => a.difficulty === diff);
    const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : null;
    const best = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
    return { diff, count: attempts.length, avgScore, best };
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-quiz", {
        text: sourceText,
        level,
        questionCount,
        quizType,
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
      toast({ title: "Error", description: error.message || "Failed to generate quiz", variant: "destructive" });
    },
  });

  function resetInputState() {
    setSelectedOption(null);
    setSelectedMulti(new Set());
    setTextInput("");
    setTfChoice(null);
    setShowFeedback(false);
  }

  const allQuestions = quiz ? quiz.sections.flatMap((s) => s.questions) : [];
  const totalQuestions = allQuestions.length;
  const currentQuestion = allQuestions[currentIndex] || null;
  const currentType = currentQuestion?.type || quiz?.quizType || "single_choice";

  const progressPercent = totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0;

  const saveAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      await apiRequest("POST", "/api/quiz-attempts", attemptData);
    },
    onSuccess: () => {
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
      isCorrect = selectedMulti.size === correctSet.size && [...selectedMulti].every((v) => correctSet.has(v));
      answerValue = [...selectedMulti];
    } else if (currentType === "true_false") {
      if (tfChoice === null) return;
      isCorrect = tfChoice === currentQuestion.correctAnswer;
      answerValue = tfChoice;
    } else if (currentType === "fill_blank" || currentType === "short_answer") {
      if (!textInput.trim()) return;
      const userAns = textInput.trim().toLowerCase();
      const correctAns = String(currentQuestion.correctAnswer || "").toLowerCase();
      if (currentType === "fill_blank") {
        isCorrect = userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns);
      } else {
        const words = correctAns.split(/\s+/);
        const matchCount = words.filter((w) => userAns.includes(w)).length;
        isCorrect = matchCount >= Math.ceil(words.length * 0.5);
      }
      answerValue = textInput.trim();
    }

    const newStreak = isCorrect ? streak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    let scoreChange = isCorrect ? (10 + Math.min(streak * 2, 10)) : -Math.min(15 + Object.values(answers).filter(a => !a.correct).length * 3, 30);
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
        totalQuestions: totalQuestions,
        correctCount: Object.values(newAnswers).filter(a => a.correct).length,
        difficulty: level,
        quizType: quizType,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) setFinished(true);
    else {
      setCurrentIndex(currentIndex + 1);
      resetInputState();
    }
  };

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#111110] dark:bg-white flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Trophy className="w-10 h-10 text-white dark:text-black" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-[#666660] mb-8">You've mastered the material. Here's how you did:</p>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-6 rounded-3xl bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F]">
            <p className="text-sm font-medium text-[#999990] uppercase tracking-wider mb-1">Final Score</p>
            <p className="text-4xl font-bold">{smartScore}%</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F]">
            <p className="text-sm font-medium text-[#999990] uppercase tracking-wider mb-1">Best Streak</p>
            <p className="text-4xl font-bold">{bestStreak}</p>
          </div>
        </div>
        <Button onClick={() => setQuiz(null)} className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-lg">
          Back to Generator
        </Button>
      </div>
    );
  }

  if (quiz) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold">{quiz.topic}</h2>
            <p className="text-sm text-[#666660]">Question {currentIndex + 1} of {totalQuestions}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#999990] uppercase tracking-wider">Smart Score</p>
            <p className="text-2xl font-bold">{smartScore}</p>
          </div>
        </div>
        <div className="h-2 w-full bg-[#F0F0F0] dark:bg-[#1A1A1A] rounded-full mb-10 overflow-hidden">
          <div className="h-full bg-black dark:bg-white transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        
        <Card className="border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A] rounded-[32px] overflow-hidden shadow-sm">
          <CardContent className="p-8 lg:p-10">
            <h3 className="text-2xl font-semibold mb-8 leading-tight">{currentQuestion?.question}</h3>
            
            <div className="space-y-3">
              {currentType === 'single_choice' && currentQuestion?.options?.map((opt, i) => (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 ${
                    selectedOption === i 
                      ? "border-black dark:border-white bg-[#F9F9F8] dark:bg-[#111110]" 
                      : "border-[#E5E5E0] dark:border-[#22221F] hover:bg-[#F9F9F8] dark:hover:bg-[#111110]"
                  } ${showFeedback && i === currentQuestion.correctAnswer ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : ""} ${showFeedback && selectedOption === i && i !== currentQuestion.correctAnswer ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}
                >
                  <span className="w-8 h-8 rounded-lg bg-[#F0F0F0] dark:bg-[#1A1A1A] flex items-center justify-center text-sm font-bold shrink-0">{OPTION_LETTERS[i]}</span>
                  <span className="text-[16px]">{opt}</span>
                </button>
              ))}
            </div>

            {showFeedback && (
              <div className="mt-8 p-6 rounded-2xl bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F]">
                <p className="text-sm font-bold uppercase tracking-wider mb-2 text-[#999990]">Explanation</p>
                <p className="text-[15px] leading-relaxed">{currentQuestion?.explanation}</p>
              </div>
            )}

            <div className="mt-10">
              {!showFeedback ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!Object.values({selectedOption, selectedMulti: selectedMulti.size, tfChoice, textInput: textInput.trim().length}).some(v => v !== null && v !== 0)} 
                  className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold">
                  {currentIndex + 1 === totalQuestions ? "Finish Quiz" : "Next Question"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-10 text-center">
        <div className="w-16 h-16 rounded-[22px] bg-[#111110] dark:bg-white flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-white dark:text-black" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Quiz Generator</h2>
        <p className="text-[#666660]">Transform study materials into interactive practice</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex p-1 rounded-2xl bg-[#F0F0F0] dark:bg-[#111110] w-fit mx-auto lg:mx-0">
            {["document", "text"].map((t) => (
              <button
                key={t}
                onClick={() => setSourceTab(t as SourceTab)}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${sourceTab === t ? "bg-white dark:bg-[#1A1A1A] shadow-sm text-black dark:text-white" : "text-[#999990] hover:text-[#666660]"}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] shadow-sm">
            <CardContent className="p-8">
              {sourceTab === "text" ? (
                <Textarea
                  placeholder="Paste your study notes or textbook text here..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-[240px] border-none focus-visible:ring-0 p-0 text-lg placeholder:text-[#999990] no-scrollbar resize-none"
                />
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E5E0] dark:border-[#22221F] rounded-[24px] p-12 text-center cursor-pointer hover:bg-[#F9F9F8] dark:hover:bg-[#111110] transition-colors"
                >
                  <Upload className="w-10 h-10 text-[#999990] mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-1">Upload Material</p>
                  <p className="text-sm text-[#666660]">PDF, Word or Text files (Max 10MB)</p>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] shadow-sm bg-[#F9F9F8] dark:bg-[#111110]">
            <CardContent className="p-8 space-y-8">
              <div>
                <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-4 block">Difficulty</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${level === l.value ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "bg-white dark:bg-[#1A1A1A] text-[#666660] border-[#E5E5E0] dark:border-[#22221F]"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-4 block">Question Type</Label>
                <div className="space-y-2">
                  {QUIZ_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setQuizType(t.value)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${quizType === t.value ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "bg-white dark:bg-[#1A1A1A] text-[#111110] dark:text-white border-[#E5E5E0] dark:border-[#22221F]"}`}
                    >
                      <span className="text-sm font-semibold">{t.label}</span>
                      <t.icon className="w-4 h-4 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => generateMutation.mutate()}
                disabled={!sourceText.trim() || generateMutation.isPending}
                className="w-full h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {generateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Generate Practice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
