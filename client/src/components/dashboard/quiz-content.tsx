import { useState, useRef, useCallback } from "react";
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

  const badges = [
    { name: "Quick Learner", icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", earned: quizAttempts.length >= 1 },
    { name: "Quiz Master", icon: Trophy, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20", earned: quizAttempts.length >= 10 },
    { name: "Top Student", icon: Star, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", earned: quizAttempts.some(a => a.score >= 80) },
    { name: "Problem Solver", icon: Target, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", earned: levelStats.every(l => l.count > 0) },
  ];

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
    let scoreChange = 0;
    if (isCorrect) {
      scoreChange = 10 + Math.min(streak * 2, 10);
    } else {
      scoreChange = -Math.min(15 + incorrectCount * 3, 30);
    }
    const newScore = Math.max(0, Math.min(100, smartScore + scoreChange));

    const newAnswers = { ...answers, [currentIndex]: { value: answerValue, correct: isCorrect } };
    setAnswers(newAnswers);
    setSmartScore(newScore);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setShowFeedback(true);

    // If it's the last question, save the attempt
    if (currentIndex + 1 === totalQuestions) {
      const finalCorrectCount = Object.values(newAnswers).filter(a => a.correct).length;
      saveAttemptMutation.mutate({
        topic: quiz?.topic || "Quiz",
        score: newScore,
        totalQuestions: totalQuestions,
        correctCount: finalCorrectCount,
        difficulty: level,
        quizType: quizType,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      resetInputState();
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSourceText("");
    setUploadedFile(null);
    setSourceTab("document");
    setCurrentIndex(0);
    setAnswers({});
    resetInputState();
    setSmartScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  const retryQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    resetInputState();
    setSmartScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  const scoreColor = smartScore >= 80 ? "text-emerald-600" : smartScore >= 50 ? "text-amber-600" : smartScore > 0 ? "text-orange-600" : "text-muted-foreground";
  const scoreBarColor = smartScore >= 80 ? "bg-emerald-500" : smartScore >= 50 ? "bg-amber-500" : "bg-orange-500";

  const canSubmit = (() => {
    if (currentType === "single_choice") return selectedOption !== null;
    if (currentType === "multiple_choice") return selectedMulti.size > 0;
    if (currentType === "true_false") return tfChoice !== null;
    if (currentType === "fill_blank" || currentType === "short_answer") return textInput.trim().length > 0;
    return false;
  })();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" data-testid="text-quiz-title">AI Quiz Generator</h1>
        <p className="text-muted-foreground">Transform any text into interactive practice quizzes</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {badges.map((badge) => (
          <Card key={badge.name} className={`border-0 ${badge.bg} ${!badge.earned ? "opacity-40 grayscale" : ""} transition-all`}>
            <CardContent className="p-3 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-background shadow-sm flex items-center justify-center mb-2">
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-tight leading-tight">{badge.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{badge.earned ? "Earned" : "Locked"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {levelStats.map(({ diff, count, avgScore, best }) => {
          const colors: Record<string, { bar: string; label: string; text: string }> = {
            basic: { bar: "bg-emerald-500", label: "Basic", text: "text-emerald-600" },
            intermediate: { bar: "bg-amber-500", label: "Intermediate", text: "text-amber-600" },
            advanced: { bar: "bg-red-500", label: "Advanced", text: "text-red-600" },
          };
          const c = colors[diff];
          return (
            <Card key={diff} className="border-border/50">
              <CardContent className="p-3">
                <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${c.text}`}>{c.label}</p>
                {count === 0 ? (
                  <p className="text-xs text-muted-foreground">No attempts yet</p>
                ) : (
                  <>
                    <p className="text-xl font-black">{avgScore}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">avg score · {count} {count === 1 ? "quiz" : "quizzes"}</p>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${avgScore}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Best: {best}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!quiz ? (
        <div className="space-y-5">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center border-b border-border/50 mb-4 -mx-5 px-5">
                {([
                  { key: "document" as SourceTab, label: "Document", icon: FileText },
                  { key: "text" as SourceTab, label: "Text", icon: Type },
                  { key: "image" as SourceTab, label: "Image", icon: ImageIcon },
                ]).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setSourceTab(tab.key); clearUpload(); }}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        sourceTab === tab.key
                          ? "border-emerald-600 text-emerald-600"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`tab-source-${tab.key}`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {sourceTab === "text" && (
                <>
                  <Label className="text-sm font-medium mb-3 block">Paste your study material</Label>
                  <Textarea
                    placeholder="Paste your notes, textbook excerpts, or any text you want to study from..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="min-h-[160px] resize-none border-border/50"
                    data-testid="input-quiz-source"
                  />
                </>
              )}

              {sourceTab === "document" && (
                <>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileInputChange} data-testid="input-file-upload" />
                  {!uploadedFile && !extracting ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                        dragOver ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border/60 hover:border-emerald-300"
                      }`}
                      data-testid="dropzone-document"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="font-medium mb-1">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">Supports PDF, Word, and text files up to 10MB</p>
                    </div>
                  ) : extracting ? (
                    <div className="border-2 border-dashed border-emerald-300 rounded-xl p-10 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">Extracting text from {uploadedFile?.name}...</p>
                      <p className="text-sm text-muted-foreground mt-1">This may take a moment for scanned documents</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile?.name}</p>
                          <p className="text-xs text-muted-foreground">{sourceText.length} characters extracted</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); clearUpload(); }} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors" data-testid="button-clear-upload">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        className="min-h-[100px] resize-none border-border/50 text-sm"
                        placeholder="Extracted text will appear here..."
                        data-testid="input-extracted-text"
                      />
                    </div>
                  )}
                </>
              )}

              {sourceTab === "image" && (
                <>
                  <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileInputChange} data-testid="input-image-upload" />
                  {!uploadedFile && !extracting ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => imageInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                        dragOver ? "border-violet-400 bg-violet-50/50 dark:bg-violet-950/20" : "border-border/60 hover:border-violet-300"
                      }`}
                      data-testid="dropzone-image"
                    >
                      <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-6 h-6 text-violet-600" />
                      </div>
                      <p className="font-medium mb-1">Drop an image here or click to browse</p>
                      <p className="text-sm text-muted-foreground">Upload a photo of your notes, textbook page, or whiteboard</p>
                    </div>
                  ) : extracting ? (
                    <div className="border-2 border-dashed border-violet-300 rounded-xl p-10 text-center bg-violet-50/30 dark:bg-violet-950/10">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
                      <p className="font-medium text-violet-700 dark:text-violet-300">Reading text from image...</p>
                      <p className="text-sm text-muted-foreground mt-1">AI is extracting text from your image</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uploadedFile?.name}</p>
                          <p className="text-xs text-muted-foreground">{sourceText.length} characters extracted</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); clearUpload(); }} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors" data-testid="button-clear-image">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        className="min-h-[100px] resize-none border-border/50 text-sm"
                        placeholder="Extracted text will appear here..."
                        data-testid="input-extracted-image-text"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <Label className="font-semibold text-sm">Difficulty Level</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                      level === l.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm"
                        : "border-border/50 hover:border-border"
                    }`}
                    data-testid={`button-level-${l.value}`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${l.color} flex items-center justify-center mx-auto mb-2`}>
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold">{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                    {level === l.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-4 h-4 text-violet-600" />
                <Label className="font-semibold text-sm">Quiz Type</Label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {QUIZ_TYPES.map((qt) => {
                  const Icon = qt.icon;
                  return (
                    <button
                      key={qt.value}
                      onClick={() => setQuizType(qt.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        quizType === qt.value
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                          : "border-border/50 hover:border-border"
                      }`}
                      data-testid={`button-type-${qt.value}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        quizType === qt.value ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{qt.label}</p>
                        <p className="text-xs text-muted-foreground">{qt.desc}</p>
                      </div>
                      {quizType === qt.value && <CheckCircle className="w-4 h-4 text-violet-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  <Label className="font-semibold text-sm">Number of Questions</Label>
                </div>
                <Badge variant="outline" className="text-xs font-bold">{questionCount} questions</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6">5</span>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-emerald-600"
                  data-testid="input-question-count"
                />
                <span className="text-xs text-muted-foreground w-6">50</span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!sourceText.trim() || generateMutation.isPending}
            className="w-full gap-2 h-12 text-base bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20 border-0"
            data-testid="button-generate-quiz"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {questionCount} Questions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Quiz
              </>
            )}
          </Button>
        </div>
      ) : finished ? (
        <ResultsScreen
          smartScore={smartScore}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          totalQuestions={totalQuestions}
          bestStreak={bestStreak}
          answers={answers}
          allQuestions={allQuestions}
          quizType={quiz.quizType}
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
            level={quiz.level}
          />

          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionType={currentType}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              sectionInfo={getSectionForIndex(currentIndex)}
              selectedOption={selectedOption}
              selectedMulti={selectedMulti}
              tfChoice={tfChoice}
              textInput={textInput}
              showFeedback={showFeedback}
              answer={answers[currentIndex]}
              onSelectOption={setSelectedOption}
              onToggleMulti={(idx) => {
                setSelectedMulti((prev) => {
                  const next = new Set(prev);
                  if (next.has(idx)) next.delete(idx); else next.add(idx);
                  return next;
                });
              }}
              onSetTf={setTfChoice}
              onSetText={setTextInput}
              canSubmit={canSubmit}
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

function ScoreBar({ smartScore, streak, scoreColor, scoreBarColor, progressPercent, answeredCount, totalQuestions, topic, level }: {
  smartScore: number; streak: number; scoreColor: string; scoreBarColor: string; progressPercent: number;
  answeredCount: number; totalQuestions: number; topic: string; level: string;
}) {
  const levelColors: Record<string, string> = { basic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">{topic}</h2>
            <Badge className={`text-xs border-0 ${levelColors[level] || levelColors.intermediate}`}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
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
            <div className={`h-full rounded-full transition-all duration-500 ${scoreBarColor}`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionCard({ question, questionType, questionNumber, totalQuestions, sectionInfo, selectedOption, selectedMulti, tfChoice, textInput, showFeedback, answer, onSelectOption, onToggleMulti, onSetTf, onSetText, canSubmit, onSubmit, onNext, isLast }: {
  question: QuizQuestion; questionType: QuizType; questionNumber: number; totalQuestions: number;
  sectionInfo: { sectionName: string; questionInSection: number };
  selectedOption: number | null; selectedMulti: Set<number>; tfChoice: boolean | null; textInput: string;
  showFeedback: boolean; answer: AnswerRecord | undefined;
  onSelectOption: (idx: number) => void; onToggleMulti: (idx: number) => void;
  onSetTf: (v: boolean) => void; onSetText: (v: string) => void;
  canSubmit: boolean; onSubmit: () => void; onNext: () => void; isLast: boolean;
}) {
  const typeLabels: Record<string, string> = { single_choice: "Single Choice", multiple_choice: "Multiple Choice", true_false: "True / False", fill_blank: "Fill in Blank", short_answer: "Short Answer" };

  return (
    <Card className="border-border/50" data-testid={`card-question-${questionNumber}`}>
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{sectionInfo.sectionName}</Badge>
              <Badge variant="secondary" className="text-xs">{typeLabels[questionType] || questionType}</Badge>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Question {questionNumber} of {totalQuestions}</span>
          </div>
          <p className="font-medium" data-testid="text-question">{question.question}</p>
        </div>

        <div className="p-4 space-y-2">
          {(questionType === "single_choice") && question.options?.map((option, oIndex) => {
            const isSelected = selectedOption === oIndex;
            const isCorrectAnswer = oIndex === question.correctAnswer;
            const wasChosen = answer?.value === oIndex;
            let optionClasses = "border-border/50";
            let letterClasses = "bg-muted text-muted-foreground";
            if (showFeedback && answer) {
              if (isCorrectAnswer) { optionClasses = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700"; letterClasses = "bg-emerald-600 text-white"; }
              else if (wasChosen && !answer.correct) { optionClasses = "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700"; letterClasses = "bg-red-600 text-white"; }
            } else if (isSelected) { optionClasses = "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700"; letterClasses = "bg-violet-600 text-white"; }
            return (
              <button key={oIndex} onClick={() => onSelectOption(oIndex)} disabled={showFeedback}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${optionClasses} ${!showFeedback ? "cursor-pointer" : ""}`}
                data-testid={`button-option-${OPTION_LETTERS[oIndex]}`}>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${letterClasses}`}>{OPTION_LETTERS[oIndex]}</div>
                <span className="text-sm flex-1">{option}</span>
                {showFeedback && isCorrectAnswer && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                {showFeedback && wasChosen && !answer?.correct && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              </button>
            );
          })}

          {(questionType === "multiple_choice") && question.options?.map((option, oIndex) => {
            const isSelected = selectedMulti.has(oIndex);
            const correctSet = new Set(question.correctAnswers || []);
            const isCorrectAnswer = correctSet.has(oIndex);
            const wasChosen = Array.isArray(answer?.value) && answer.value.includes(oIndex);
            let optionClasses = "border-border/50";
            let letterClasses = "bg-muted text-muted-foreground";
            if (showFeedback && answer) {
              if (isCorrectAnswer) { optionClasses = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700"; letterClasses = "bg-emerald-600 text-white"; }
              else if (wasChosen) { optionClasses = "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700"; letterClasses = "bg-red-600 text-white"; }
            } else if (isSelected) { optionClasses = "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700"; letterClasses = "bg-violet-600 text-white"; }
            return (
              <button key={oIndex} onClick={() => onToggleMulti(oIndex)} disabled={showFeedback}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${optionClasses} ${!showFeedback ? "cursor-pointer" : ""}`}
                data-testid={`button-option-${OPTION_LETTERS[oIndex]}`}>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${letterClasses}`}>
                  {isSelected || (showFeedback && isCorrectAnswer) ? <CheckSquare className="w-4 h-4" /> : OPTION_LETTERS[oIndex]}
                </div>
                <span className="text-sm flex-1">{option}</span>
                {showFeedback && isCorrectAnswer && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                {showFeedback && wasChosen && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              </button>
            );
          })}

          {questionType === "true_false" && (
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((val) => {
                const isSelected = tfChoice === val;
                const isCorrectAnswer = question.correctAnswer === val;
                const wasChosen = answer?.value === val;
                let classes = "border-border/50";
                if (showFeedback && answer) {
                  if (isCorrectAnswer) classes = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700";
                  else if (wasChosen && !answer.correct) classes = "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700";
                } else if (isSelected) classes = "border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700";
                return (
                  <button key={String(val)} onClick={() => onSetTf(val)} disabled={showFeedback}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${classes} ${!showFeedback ? "cursor-pointer" : ""}`}
                    data-testid={`button-tf-${val}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${val ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {val ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                    </div>
                    <span className="text-sm font-bold">{val ? "True" : "False"}</span>
                    {showFeedback && isCorrectAnswer && <Badge className="bg-emerald-600 text-white border-0 text-xs">Correct</Badge>}
                    {showFeedback && wasChosen && !answer?.correct && <Badge className="bg-red-600 text-white border-0 text-xs">Wrong</Badge>}
                  </button>
                );
              })}
            </div>
          )}

          {(questionType === "fill_blank" || questionType === "short_answer") && (
            <div className="space-y-3">
              {questionType === "short_answer" ? (
                <Textarea
                  value={textInput}
                  onChange={(e) => onSetText(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={showFeedback}
                  className="min-h-[100px] resize-none border-border/50"
                  data-testid="input-text-answer"
                />
              ) : (
                <Input
                  value={textInput}
                  onChange={(e) => onSetText(e.target.value)}
                  placeholder="Type the missing word..."
                  disabled={showFeedback}
                  className="text-lg border-border/50 h-12"
                  data-testid="input-text-answer"
                  onKeyDown={(e) => { if (e.key === "Enter" && canSubmit && !showFeedback) onSubmit(); }}
                />
              )}
              {showFeedback && (
                <div className={`p-3 rounded-lg border ${answer?.correct ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"}`}>
                  <p className="text-sm font-medium mb-1">{answer?.correct ? "Correct!" : "Expected answer:"}</p>
                  <p className="text-sm font-bold">{String(question.correctAnswer)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {showFeedback && questionType !== "fill_blank" && questionType !== "short_answer" && (
          <div className={`mx-4 mb-4 p-3.5 rounded-lg border ${answer?.correct ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`} data-testid="text-explanation">
            <div className="flex items-center gap-2 mb-1">
              {answer?.correct ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
              <span className={`text-sm font-semibold ${answer?.correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {answer?.correct ? "Correct!" : "Incorrect"}
              </span>
            </div>
            <p className={`text-sm ${answer?.correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{question.explanation}</p>
          </div>
        )}

        {showFeedback && (questionType === "fill_blank" || questionType === "short_answer") && (
          <div className={`mx-4 mb-4 p-3.5 rounded-lg border ${answer?.correct ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}`} data-testid="text-explanation">
            <p className={`text-sm ${answer?.correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{question.explanation}</p>
          </div>
        )}

        <div className="p-4 pt-0">
          {!showFeedback ? (
            <Button onClick={onSubmit} disabled={!canSubmit} className="w-full gap-2 bg-emerald-600" data-testid="button-check-answer">
              <Target className="w-4 h-4" />
              Check Answer
            </Button>
          ) : (
            <Button onClick={onNext} className="w-full gap-2 bg-violet-600" data-testid="button-next-question">
              {isLast ? <><Trophy className="w-4 h-4" />See Results</> : <><ArrowRight className="w-4 h-4" />Next Question</>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsScreen({ smartScore, correctCount, incorrectCount, totalQuestions, bestStreak, answers, allQuestions, quizType, getSectionForIndex, onRetry, onNewQuiz }: {
  smartScore: number; correctCount: number; incorrectCount: number; totalQuestions: number; bestStreak: number;
  answers: Record<number, AnswerRecord>; allQuestions: QuizQuestion[]; quizType: QuizType;
  getSectionForIndex: (idx: number) => { sectionName: string; questionInSection: number };
  onRetry: () => void; onNewQuiz: () => void;
}) {
  const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const gradeLabel = pct >= 90 ? "Outstanding!" : pct >= 80 ? "Great job!" : pct >= 70 ? "Good work!" : pct >= 50 ? "Keep practicing!" : "Needs more study";
  const gradeColor = pct >= 80 ? "from-emerald-600 to-teal-600" : pct >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-orange-500";

  return (
    <div className="space-y-4">
      <Card className={`border-0 bg-gradient-to-br ${gradeColor} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><Trophy className="w-6 h-6" /><span className="font-semibold">Quiz Complete</span></div>
              <p className="text-3xl font-bold" data-testid="text-final-score">{correctCount}/{totalQuestions}</p>
              <p className="text-sm opacity-80 mt-1">{gradeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold" data-testid="text-final-percent">{pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-violet-600" />
          <p className="text-2xl font-bold" data-testid="text-smart-score-final">{smartScore}</p>
          <p className="text-xs text-muted-foreground">SmartScore</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold" data-testid="text-best-streak">{bestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center">
          <Star className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-2xl font-bold">{correctCount}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">Question Review</h3>
          <div className="space-y-2">
            {allQuestions.map((q, idx) => {
              const a = answers[idx];
              return (
                <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg border ${a?.correct ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"}`} data-testid={`review-question-${idx + 1}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${a?.correct ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {a?.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.question}</p>
                    {!a?.correct && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.type === "single_choice" && q.options ? `Your answer: ${OPTION_LETTERS[a?.value ?? 0]}. Correct: ${OPTION_LETTERS[typeof q.correctAnswer === "number" ? q.correctAnswer : 0]}` :
                         q.type === "true_false" ? `Your answer: ${a?.value ? "True" : "False"}. Correct: ${q.correctAnswer ? "True" : "False"}` :
                         q.type === "multiple_choice" && q.options ? `Correct: ${(q.correctAnswers || []).map((i: number) => OPTION_LETTERS[i]).join(", ")}` :
                         `Correct: ${q.correctAnswer}`}
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
        <Button variant="outline" onClick={onRetry} className="flex-1 gap-2" data-testid="button-retry-quiz"><RotateCcw className="w-4 h-4" />Retry Quiz</Button>
        <Button onClick={onNewQuiz} className="flex-1 gap-2 bg-emerald-600" data-testid="button-new-quiz"><Sparkles className="w-4 h-4" />New Quiz</Button>
      </div>
    </div>
  );
}
