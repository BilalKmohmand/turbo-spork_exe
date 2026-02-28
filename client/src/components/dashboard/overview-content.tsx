import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Mic, FileText, FileEdit,
  ArrowUpRight, CheckCircle, XCircle,
} from "lucide-react";
import type { User } from "@/hooks/use-auth";

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

interface OverviewContentProps {
  user: User;
  onNavigate: (section: string) => void;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const tools = [
  { id: "solver", icon: MessageSquare, label: "AI Tutor",       desc: "Ask any question",       color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "notes",  icon: Mic,           label: "Lecture Notes",  desc: "Record & summarise",     color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "quiz",   icon: FileText,      label: "Quiz Generator", desc: "Test your knowledge",    color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "essay",  icon: FileEdit,      label: "Essay Writer",   desc: "Draft in seconds",       color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/30" },
];

export default function OverviewContent({ user, onNavigate }: OverviewContentProps) {
  const { data: quizAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  const recentQuizzes = quizAttempts.slice(0, 5);

  return (
    <div className="space-y-10 max-w-5xl mx-auto">

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold text-[#111110] dark:text-white tracking-tight">
          Welcome back, {user.displayName.split(" ")[0]} 👋
        </h2>
        <p className="mt-1 text-[#666660] text-[15px]">What would you like to work on today?</p>
      </div>

      {/* Quick Actions */}
      <section>
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#999990] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group p-5 rounded-2xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A] hover:bg-[#F9F9F8] dark:hover:bg-[#111110] hover:border-[#CCCCCC] dark:hover:border-[#333330] transition-all text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{tool.label}</p>
              <div className="mt-1 flex items-center gap-1 text-[12px] text-[#999990]">
                <span>{tool.desc}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Quizzes */}
      <section className="p-6 rounded-[24px] border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[15px]">Recent Quizzes</h3>
          <button
            onClick={() => onNavigate("quiz")}
            className="text-[13px] text-[#666660] hover:text-black dark:hover:text-white transition-colors"
          >
            View all
          </button>
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-8 h-8 text-[#CCCCCC] mx-auto mb-3" />
            <p className="text-[14px] text-[#999990]">No quizzes yet.</p>
            <button
              onClick={() => onNavigate("quiz")}
              className="mt-3 text-[13px] font-semibold text-black dark:text-white underline underline-offset-2"
            >
              Generate your first quiz →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0] dark:divide-[#1A1A1A]">
            {recentQuizzes.map(q => {
              const passed = q.score >= 60;
              return (
                <div key={q.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${passed ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30"}`}>
                      {passed
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <XCircle    className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-[14px] font-medium truncate max-w-[200px]">{q.topic}</p>
                      <p className="text-[11px] text-[#999990]">{q.correctCount}/{q.totalQuestions} correct · {timeAgo(q.attemptedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[15px] font-bold tabular-nums ${q.score >= 80 ? "text-emerald-600" : q.score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                      {q.score}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-500"}`}>
                      {passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
