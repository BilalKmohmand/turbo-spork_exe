import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Plus, BookOpen, Trash2, ChevronRight, ChevronLeft,
  Clock, CheckCircle2, Circle, Loader2, Sparkles,
  BarChart2, GraduationCap, ArrowLeft, Globe, Users, CheckCheck, KeyRound,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
interface CourseLesson { title: string; duration: string; }
interface CourseChapter { title: string; description: string; lessons: CourseLesson[]; }
interface Course {
  id: string; userId: string; title: string; topic: string;
  difficulty: string; audience: string; description: string;
  coverEmoji: string; chapters: CourseChapter[]; totalLessons: number;
  createdAt: string; progress?: ProgressRow[];
}
interface ProgressRow { lessonKey: string; score: number | null; completedAt: string; }
interface QuizQuestion { question: string; options: string[]; correctIndex: number; explanation: string; }
interface LessonData { id: string; content: string; quiz: QuizQuestion[]; }

/* ─── Helpers ───────────────────────────────────────────────────── */
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  advanced: "bg-red-50 text-red-700 border-red-200",
};

function lessonKey(ci: number, li: number) { return `${ci}-${li}`; }

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  const renderInline = (text: string) => {
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return <span key={idx} className="font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-1 rounded">{part}</span>;
      }
      if (part.startsWith("$") && part.endsWith("$")) {
        return <span key={idx} className="font-mono text-violet-600 dark:text-violet-400">{part.slice(1, -1)}</span>;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-[#111110] dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={idx} className="font-mono text-sm bg-[#F0F0F0] dark:bg-[#1A1A1A] px-1 rounded">{part.slice(1, -1)}</code>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-bold text-[#111110] dark:text-white mt-6 mb-3">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-lg font-semibold text-[#111110] dark:text-white mt-5 mb-2">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-[#111110] dark:text-white mt-4 mb-4">{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 ml-2">
          {items.map((item, idx) => <li key={idx} className="text-[15px] leading-relaxed text-[#333330] dark:text-[#CCCCCC]">{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-3 ml-2">
          {items.map((item, idx) => <li key={idx} className="text-[15px] leading-relaxed text-[#333330] dark:text-[#CCCCCC]">{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-[#E5E5E0] dark:border-[#22221F] my-4" />);
    } else {
      elements.push(<p key={i} className="text-[15px] leading-[1.75] text-[#333330] dark:text-[#CCCCCC] my-1">{renderInline(line)}</p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

/* ─── Create Course Form ─────────────────────────────────────────── */
function CreateCourseForm({ onBack, onCreated }: { onBack: () => void; onCreated: (c: Course) => void }) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [audience, setAudience] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/courses/generate", { topic, difficulty, audience: audience || "general learners" }),
    onSuccess: async (res) => {
      const course = await res.json();
      toast({ title: "Course created!", description: `"${course.title}" is ready to study.`, variant: "success" });
      onCreated(course);
    },
    onError: async (err: any) => {
      toast({ title: "Failed to generate course", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-xl mx-auto py-10">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] dark:text-[#888] dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#111110] dark:text-white mb-2">Create a Custom Course</h1>
        <p className="text-[#666] dark:text-[#888]">Tell us what you want to learn and we'll build a personalised course for you.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#111110] dark:text-white mb-1.5">What do you want to learn? <span className="text-red-500">*</span></label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Machine Learning, Spanish Grammar, Organic Chemistry…"
            className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] text-[#111110] dark:text-white placeholder-[#999] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            data-testid="input-course-topic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111110] dark:text-white mb-1.5">Difficulty</label>
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                  difficulty === d
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-[#E5E5E0] dark:border-[#22221F] text-[#666] dark:text-[#888] hover:border-violet-300"
                }`}
                data-testid={`button-difficulty-${d}`}
              >{d}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#111110] dark:text-white mb-1.5">Who is this for? <span className="text-[#999] font-normal">(optional)</span></label>
          <input
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="e.g. High school students, working professionals, complete beginners…"
            className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] text-[#111110] dark:text-white placeholder-[#999] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            data-testid="input-course-audience"
          />
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={!topic.trim() || generateMutation.isPending}
          className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm"
          data-testid="button-generate-course"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating your course…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Course</>
          )}
        </Button>
      </div>

      {generateMutation.isPending && (
        <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 rounded-xl text-sm text-violet-700 dark:text-violet-400 text-center">
          Creating your personalised learning path… This takes about 10–20 seconds.
        </div>
      )}
    </div>
  );
}

/* ─── Course Library ─────────────────────────────────────────────── */
function CourseLibrary({
  courses, onSelect, onNew, onDelete, isDeleting,
}: {
  courses: Course[];
  onSelect: (c: Course) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isDeleting: string | null;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#111110] dark:text-white">My Courses</h2>
          <p className="text-sm text-[#666] dark:text-[#888] mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={onNew}
          className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
          data-testid="button-new-course"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F5F3] dark:bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-[#999]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111110] dark:text-white mb-2">No courses yet</h3>
          <p className="text-sm text-[#666] dark:text-[#888] mb-6 max-w-xs mx-auto">Create your first AI-generated course on any topic you want to learn.</p>
          <Button onClick={onNew} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Create Your First Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(course => {
            const completedCount = (course.progress || []).length;
            const pct = course.totalLessons > 0 ? Math.round((completedCount / course.totalLessons) * 100) : 0;
            return (
              <div
                key={course.id}
                onClick={() => onSelect(course)}
                className="relative group bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-5 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
                data-testid={`card-course-${course.id}`}
              >
                <button
                  onClick={e => { e.stopPropagation(); onDelete(course.id); }}
                  disabled={isDeleting === course.id}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-[#999] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete course"
                  data-testid={`button-delete-course-${course.id}`}
                >
                  {isDeleting === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>

                <div className="text-4xl mb-3">{course.coverEmoji}</div>
                <h3 className="font-semibold text-[#111110] dark:text-white text-[15px] leading-tight mb-1 pr-6">{course.title}</h3>
                <p className="text-xs text-[#666] dark:text-[#888] mb-3 line-clamp-2">{course.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}>
                    {course.difficulty}
                  </span>
                  <span className="text-xs text-[#999]">{course.totalLessons} lessons</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#666] dark:text-[#888]">
                    <span>{completedCount} of {course.totalLessons} completed</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-[#F0F0F0] dark:bg-[#1A1A1A]" />
                </div>

                <div className="flex items-center gap-1 mt-3 text-xs text-violet-600 dark:text-violet-400 font-medium">
                  {pct === 100 ? "Completed" : pct > 0 ? "Continue" : "Start learning"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Course Detail (chapter/lesson list) ───────────────────────── */
function CourseDetail({
  course, progress, onBack, onLesson,
}: {
  course: Course;
  progress: ProgressRow[];
  onBack: () => void;
  onLesson: (ci: number, li: number) => void;
}) {
  const completedKeys = new Set(progress.map(p => p.lessonKey));
  const completedCount = completedKeys.size;
  const pct = course.totalLessons > 0 ? Math.round((completedCount / course.totalLessons) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] dark:text-[#888] dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All courses
      </button>

      {/* Course header */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900 rounded-2xl p-6 mb-6">
        <div className="text-5xl mb-3">{course.coverEmoji}</div>
        <h1 className="text-2xl font-bold text-[#111110] dark:text-white mb-2">{course.title}</h1>
        <p className="text-sm text-[#555] dark:text-[#999] mb-4">{course.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}>
            {course.difficulty}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] text-[#666] dark:text-[#888]">
            {course.totalLessons} lessons
          </span>
          {course.audience && (
            <span className="text-xs px-2.5 py-1 rounded-full border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#111110] text-[#666] dark:text-[#888]">
              {course.audience}
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-[#666] dark:text-[#888]">
            <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" />{completedCount} of {course.totalLessons} lessons completed</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2 bg-white/70 dark:bg-[#1A1A1A]" />
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {course.chapters.map((chapter, ci) => (
          <div key={ci} className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E0] dark:border-[#22221F] bg-[#FAFAFA] dark:bg-[#0F0F0F]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-0.5">Chapter {ci + 1}</p>
                  <h3 className="font-semibold text-[#111110] dark:text-white">{chapter.title}</h3>
                  {chapter.description && <p className="text-xs text-[#666] dark:text-[#888] mt-0.5">{chapter.description}</p>}
                </div>
                <span className="text-xs text-[#999] ml-4 flex-shrink-0">{chapter.lessons.length} lessons</span>
              </div>
            </div>
            <div className="divide-y divide-[#E5E5E0] dark:divide-[#22221F]">
              {chapter.lessons.map((lesson, li) => {
                const key = lessonKey(ci, li);
                const done = completedKeys.has(key);
                const score = progress.find(p => p.lessonKey === key)?.score;
                return (
                  <button
                    key={li}
                    onClick={() => onLesson(ci, li)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F5F3] dark:hover:bg-[#1A1A1A] transition-colors text-left group"
                    data-testid={`button-lesson-${ci}-${li}`}
                  >
                    {done
                      ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                      : <Circle className="w-4.5 h-4.5 text-[#CCC] dark:text-[#444] flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${done ? "text-[#666] dark:text-[#888]" : "text-[#111110] dark:text-white"}`}>
                        {lesson.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {score !== undefined && score !== null && (
                        <span className="text-xs text-emerald-600 font-medium">{score}%</span>
                      )}
                      <span className="text-xs text-[#999] flex items-center gap-1">
                        <Clock className="w-3 h-3" />{lesson.duration}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#CCC] dark:text-[#444] group-hover:text-violet-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Enroll Section ─────────────────────────────────────────────── */
interface PublicClass {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string | null;
  description?: string | null;
  teacherName: string;
  studentCount: number;
  isEnrolled: boolean;
  classCode: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
  Science: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
  "English / Literature": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300",
  History: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
  Physics: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300",
  Chemistry: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300",
  Biology: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300",
};
const subjectColor = (s: string) => SUBJECT_COLORS[s] || "bg-[#F0F0ED] text-[#666660] border-[#E5E5E0]";

interface EnrolledClass {
  id: string; name: string; subject: string; gradeLevel?: string | null; classCode: string;
}

function ClassCard({ cls, onEnroll, enrollingId }: {
  cls: PublicClass;
  onEnroll: (id: string) => void;
  enrollingId: string | null;
}) {
  return (
    <div
      data-testid={`card-available-class-${cls.id}`}
      className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#111110] dark:text-[#F9F9F8] truncate">{cls.name}</h3>
          <p className="text-xs text-[#999990] mt-0.5">by {cls.teacherName}</p>
        </div>
        {cls.isEnrolled && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5 shrink-0">
            <CheckCheck className="w-3 h-3" /> Enrolled
          </span>
        )}
      </div>
      {cls.description && (
        <p className="text-xs text-[#666] dark:text-[#888] line-clamp-2">{cls.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${subjectColor(cls.subject)}`}>
          {cls.subject}
        </span>
        {cls.gradeLevel && (
          <span className="text-[11px] px-2 py-0.5 rounded-full border font-medium bg-[#F0F0ED] text-[#666660] border-[#E5E5E0] dark:bg-[#1A1A17] dark:text-[#999990] dark:border-[#22221F]">
            {cls.gradeLevel}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs text-[#999990]">
          <Users className="w-3.5 h-3.5" /> {cls.studentCount} enrolled
        </span>
        <Button
          size="sm"
          onClick={() => onEnroll(cls.id)}
          disabled={cls.isEnrolled || enrollingId === cls.id}
          className={cls.isEnrolled
            ? "rounded-xl text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"
            : "rounded-xl text-xs bg-[#111110] dark:bg-white text-white dark:text-black hover:bg-[#333]"
          }
          data-testid={`button-enroll-${cls.id}`}
        >
          {enrollingId === cls.id
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : cls.isEnrolled ? "Enrolled" : "Enroll"
          }
        </Button>
      </div>
    </div>
  );
}

function EnrollSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const { data: publicClasses = [], isLoading } = useQuery<PublicClass[]>({
    queryKey: ["/api/classes/available"],
  });

  const { data: myClasses = [] } = useQuery<EnrolledClass[]>({
    queryKey: ["/api/student/classes"],
  });

  const joinMutation = useMutation({
    mutationFn: async (payload: { classId?: string; classCode?: string }) => {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/classes"] });
      setCode("");
      setEnrollingId(null);
      toast({ title: `Enrolled in ${data.class?.name || "class"}!`, description: "Your teacher can now assign you work.", variant: "success" });
    },
    onError: (e: any) => {
      setEnrollingId(null);
      toast({ title: e.message, variant: "destructive", duration: 5000 });
    },
  });

  const handleCodeJoin = () => {
    if (!code.trim()) return;
    joinMutation.mutate({ classCode: code.trim().toUpperCase() });
  };

  const handleEnroll = (classId: string) => {
    setEnrollingId(classId);
    joinMutation.mutate({ classId });
  };

  /* Split classes: not-yet-enrolled public ones */
  const availableToJoin = publicClasses.filter(c => !c.isEnrolled);

  return (
    <div className="space-y-8">
      {/* ── Join by Code ── */}
      <div className="bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#111110] dark:bg-white flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-white dark:text-black" />
          </div>
          <div>
            <p className="font-semibold text-[#111110] dark:text-[#F9F9F8] text-sm">Have a class code?</p>
            <p className="text-xs text-[#999990]">Enter the code your teacher shared with you</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            data-testid="input-class-code"
            placeholder="e.g. ABC123"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleCodeJoin()}
            maxLength={8}
            className="rounded-xl border-[#E5E5E0] dark:border-[#22221F] font-mono uppercase tracking-widest text-center text-lg font-bold max-w-[180px]"
          />
          <Button
            onClick={handleCodeJoin}
            disabled={!code.trim() || joinMutation.isPending}
            className="rounded-xl bg-[#111110] dark:bg-white text-white dark:text-black hover:bg-[#333]"
            data-testid="button-join-by-code"
          >
            {joinMutation.isPending && !enrollingId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
          </Button>
        </div>
      </div>

      {/* ── My Enrolled Classes ── */}
      {myClasses.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[#111110] dark:text-[#F9F9F8]">My Enrolled Classes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {myClasses.map(cls => (
              <div
                key={cls.id}
                data-testid={`card-my-class-${cls.id}`}
                className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111110] dark:text-[#F9F9F8] text-sm truncate">{cls.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${subjectColor(cls.subject)}`}>
                      {cls.subject}
                    </span>
                    {cls.gradeLevel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-[#F0F0ED] text-[#666660] border-[#E5E5E0]">
                        {cls.gradeLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Public Classes Browser ── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#111110] dark:text-[#F9F9F8]">Available Classes</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#999990]" />
          </div>
        ) : availableToJoin.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#E5E5E0] dark:border-[#22221F] rounded-2xl">
            <Globe className="w-8 h-8 mx-auto text-[#CCCCCC] dark:text-[#444] mb-3" />
            <p className="text-sm font-medium text-[#666660]">No public classes available right now</p>
            <p className="text-xs text-[#999990] mt-1">Ask your teacher for a class code and use the field above to join</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableToJoin.map(cls => (
              <ClassCard key={cls.id} cls={cls} onEnroll={handleEnroll} enrollingId={enrollingId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Lesson View ────────────────────────────────────────────────── */
function LessonView({
  course, chapterIdx, lessonIdx, progress, onBack, onComplete, onNext,
}: {
  course: Course;
  chapterIdx: number;
  lessonIdx: number;
  progress: ProgressRow[];
  onBack: () => void;
  onComplete: (score: number) => void;
  onNext: () => void;
}) {
  const { toast } = useToast();
  const key = lessonKey(chapterIdx, lessonIdx);
  const chapter = course.chapters[chapterIdx];
  const lesson = chapter?.lessons[lessonIdx];
  const isDone = progress.some(p => p.lessonKey === key);

  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const { data: lessonData, isLoading, isError } = useQuery<LessonData>({
    queryKey: ["/api/courses", course.id, "lesson", key],
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${course.id}/lesson/${key}`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load lesson");
      }
      return res.json();
    },
    retry: 1,
  });

  const completeMutation = useMutation({
    mutationFn: (score: number) => apiRequest("POST", `/api/courses/${course.id}/lesson/${key}/complete`, { score }),
    onSuccess: (_, score) => {
      onComplete(score);
      toast({ title: "Progress saved!", description: `Lesson marked as complete.`, variant: "success" });
    },
  });

  const handleSubmitQuiz = () => {
    if (!lessonData?.quiz) return;
    const total = lessonData.quiz.length;
    const correct = lessonData.quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length;
    const score = Math.round((correct / total) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    completeMutation.mutate(score);
  };

  const allAnswered = lessonData?.quiz && quizAnswers.length === lessonData.quiz.length && quizAnswers.every(a => a !== null);

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Breadcrumb */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] dark:text-[#888] dark:hover:text-white mb-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> <span className="truncate max-w-[200px]">{course.title}</span>
      </button>
      <div className="flex items-center gap-2 text-xs text-[#999] mb-6">
        <span>{chapter?.title}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#666] dark:text-[#888]">{lesson?.title}</span>
      </div>

      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {isDone && <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><CheckCircle2 className="w-3 h-3" /> Completed</span>}
          <span className="text-xs text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" />{lesson?.duration}</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111110] dark:text-white">{lesson?.title}</h1>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-sm text-[#666] dark:text-[#888]">Generating lesson content…</p>
          <p className="text-xs text-[#999]">This usually takes 10–15 seconds</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          Failed to load lesson content. Please go back and try again.
        </div>
      )}

      {lessonData && (
        <>
          <div className="prose-sm max-w-none mb-8 bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-6">
            <MarkdownRenderer content={lessonData.content} />
          </div>

          {/* Quiz */}
          {lessonData.quiz && lessonData.quiz.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-[#111110] dark:text-white">Knowledge Check</h2>
              </div>

              {quizSubmitted && quizScore !== null && (
                <div className={`mb-4 p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                  quizScore >= 75
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
                    : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400"
                }`}>
                  {quizScore >= 75 ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  You scored {quizScore}% — {quizScore >= 75 ? "Great job!" : "Review the lesson and try again!"}
                </div>
              )}

              <div className="space-y-4">
                {lessonData.quiz.map((q, qi) => {
                  const selected = quizAnswers[qi] ?? null;
                  const isCorrect = quizSubmitted && selected === q.correctIndex;
                  const isWrong = quizSubmitted && selected !== null && selected !== q.correctIndex;
                  return (
                    <div key={qi} className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-xl p-4">
                      <p className="text-sm font-medium text-[#111110] dark:text-white mb-3">
                        <span className="text-[#999] mr-1.5">{qi + 1}.</span>{q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isSelected = selected === oi;
                          const showCorrect = quizSubmitted && oi === q.correctIndex;
                          const showWrong = quizSubmitted && isSelected && oi !== q.correctIndex;
                          return (
                            <button
                              key={oi}
                              disabled={quizSubmitted}
                              onClick={() => {
                                if (quizSubmitted) return;
                                const next = [...quizAnswers];
                                next[qi] = oi;
                                setQuizAnswers(next);
                              }}
                              className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${
                                showCorrect ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-600 dark:text-emerald-400" :
                                showWrong   ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950/20 dark:border-red-600 dark:text-red-400" :
                                isSelected  ? "bg-violet-50 border-violet-400 text-violet-700 dark:bg-violet-950/20 dark:border-violet-600 dark:text-violet-300" :
                                              "border-[#E5E5E0] dark:border-[#22221F] text-[#333] dark:text-[#CCC] hover:border-violet-300 dark:hover:border-violet-700"
                              }`}
                              data-testid={`button-quiz-option-${qi}-${oi}`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className={`mt-2 text-xs px-2 py-1 rounded ${isCorrect ? "text-emerald-600" : isWrong ? "text-red-600" : "text-[#666]"}`}>
                          {isCorrect ? "✓ Correct! " : isWrong ? "✗ Incorrect. " : ""}{q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted && (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered || completeMutation.isPending}
                  className="mt-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
                  data-testid="button-submit-quiz"
                >
                  {completeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Answers
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E0] dark:border-[#22221F]">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#111] dark:text-[#888] dark:hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to course
            </button>
            <div className="flex gap-2">
              {!quizSubmitted && !isDone && (
                <Button
                  onClick={() => completeMutation.mutate(100)}
                  variant="outline"
                  className="rounded-xl text-sm border-[#E5E5E0] dark:border-[#22221F]"
                  disabled={completeMutation.isPending}
                >
                  Mark as Complete
                </Button>
              )}
              <Button
                onClick={onNext}
                className="rounded-xl bg-[#111110] dark:bg-white dark:text-black hover:bg-[#333] text-white text-sm"
              >
                Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main CoursesContent ────────────────────────────────────────── */
type View =
  | { type: "library" }
  | { type: "create" }
  | { type: "course"; courseId: string }
  | { type: "lesson"; courseId: string; ci: number; li: number };

type LibTab = "my-courses" | "enroll";

export default function CoursesContent({ userRole }: { userRole?: string }) {
  const [view, setView] = useState<View>({ type: "library" });
  const [libTab, setLibTab] = useState<LibTab>("my-courses");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/courses/${id}`, undefined),
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted" });
      setView({ type: "library" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    onSettled: () => setDeletingId(null),
  });

  /* Derive active course data */
  const activeCourse = courses.find(c =>
    (view.type === "course" || view.type === "lesson") && c.id === (view as any).courseId
  );

  /* Load fresh progress when viewing a course or lesson */
  const { data: progressData } = useQuery<ProgressRow[]>({
    queryKey: ["/api/courses", (view as any).courseId, "progress"],
    enabled: (view.type === "course" || view.type === "lesson") && !!(view as any).courseId,
  });

  const progress = progressData || activeCourse?.progress || [];

  /* Next lesson helper */
  const goNextLesson = (course: Course, ci: number, li: number) => {
    const chapter = course.chapters[ci];
    if (li + 1 < chapter.lessons.length) {
      setView({ type: "lesson", courseId: course.id, ci, li: li + 1 });
    } else if (ci + 1 < course.chapters.length) {
      setView({ type: "lesson", courseId: course.id, ci: ci + 1, li: 0 });
    } else {
      setView({ type: "course", courseId: course.id });
      toast({ title: "🎉 Course complete!", description: "You've finished all lessons.", variant: "success" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  /* ── Views ── */
  if (view.type === "create") {
    return (
      <CreateCourseForm
        onBack={() => setView({ type: "library" })}
        onCreated={(course) => {
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
          setView({ type: "course", courseId: course.id });
        }}
      />
    );
  }

  if (view.type === "course" && activeCourse) {
    return (
      <CourseDetail
        course={activeCourse}
        progress={progress}
        onBack={() => setView({ type: "library" })}
        onLesson={(ci, li) => setView({ type: "lesson", courseId: activeCourse.id, ci, li })}
      />
    );
  }

  if (view.type === "lesson" && activeCourse) {
    const { ci, li } = view;
    return (
      <LessonView
        key={`lesson-${activeCourse.id}-${ci}-${li}`}
        course={activeCourse}
        chapterIdx={ci}
        lessonIdx={li}
        progress={progress}
        onBack={() => setView({ type: "course", courseId: activeCourse.id })}
        onComplete={(score) => {
          queryClient.invalidateQueries({ queryKey: ["/api/courses", activeCourse.id, "progress"] });
          queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        }}
        onNext={() => goNextLesson(activeCourse, ci, li)}
      />
    );
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 bg-[#F5F5F3] dark:bg-[#111110] rounded-xl p-1 w-fit">
        <button
          onClick={() => setLibTab("my-courses")}
          data-testid="tab-my-courses"
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            libTab === "my-courses"
              ? "bg-white dark:bg-[#1A1A17] text-[#111110] dark:text-[#F9F9F8] shadow-sm"
              : "text-[#666660] hover:text-[#111110] dark:hover:text-white"
          }`}
        >
          My AI Courses
        </button>
        {userRole !== "teacher" && (
          <button
            onClick={() => setLibTab("enroll")}
            data-testid="tab-enroll"
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              libTab === "enroll"
                ? "bg-white dark:bg-[#1A1A17] text-[#111110] dark:text-[#F9F9F8] shadow-sm"
                : "text-[#666660] hover:text-[#111110] dark:hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Discover & Enroll
          </button>
        )}
      </div>

      {libTab === "my-courses" ? (
        <CourseLibrary
          courses={courses}
          onSelect={(c) => setView({ type: "course", courseId: c.id })}
          onNew={() => setView({ type: "create" })}
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deletingId}
        />
      ) : (
        <EnrollSection />
      )}
    </div>
  );
}
