import { useState } from "react";
import { Search, FileSearch, CheckSquare, Globe, ExternalLink, RotateCcw, Sparkles, ChevronRight } from "lucide-react";
import { renderMathText } from "@/components/math-display";
import { apiRequest } from "@/lib/queryClient";

type AssessmentType = "topic" | "essay" | "factcheck";

const TYPES: { id: AssessmentType; label: string; icon: typeof Search; desc: string; placeholder: string; hasText: boolean }[] = [
  {
    id: "topic",
    label: "Topic Research",
    icon: Search,
    desc: "Deep-dive into any research topic with live web sources",
    placeholder: "e.g. The effects of social media on teenage mental health",
    hasText: false,
  },
  {
    id: "essay",
    label: "Essay Review",
    icon: FileSearch,
    desc: "Evaluate a research essay or paper with web-backed feedback",
    placeholder: "e.g. Climate change mitigation strategies",
    hasText: true,
  },
  {
    id: "factcheck",
    label: "Fact Check",
    icon: CheckSquare,
    desc: "Verify claims or statements against authoritative sources",
    placeholder: "e.g. Vaccines cause autism",
    hasText: true,
  },
];

const EXAMPLES = [
  "The impact of AI on employment in the next decade",
  "CRISPR gene editing: current capabilities and ethical issues",
  "Effectiveness of mindfulness-based therapy for anxiety",
  "Ocean acidification and coral reef destruction",
];

interface Result {
  assessment: string;
  sources: { title: string; url: string }[];
  type: string;
}

export default function ResearchContent() {
  const [activeType, setActiveType] = useState<AssessmentType>("topic");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const curType = TYPES.find(t => t.id === activeType)!;

  async function handleSubmit() {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await apiRequest("POST", "/api/research-assess", {
        topic: topic.trim(),
        text: text.trim() || undefined,
        type: activeType,
      });
      const json = await data.json();
      if (json.error) throw new Error(json.error);
      setResult(json);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setTopic("");
    setText("");
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#111110] dark:text-white">Research Assessment</h1>
            <p className="text-[13px] text-[#666660]">AI-powered research analysis backed by live web search</p>
          </div>
        </div>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {TYPES.map(t => {
          const Icon = t.icon;
          const active = activeType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveType(t.id); setResult(null); setError(null); }}
              data-testid={`button-type-${t.id}`}
              className={`text-left p-4 rounded-xl border transition-all ${
                active
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-[#E5E5E0] dark:border-[#22221F] hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#111110]"
              }`}
            >
              <Icon className={`w-4 h-4 mb-2 ${active ? "text-blue-600 dark:text-blue-400" : "text-[#666660]"}`} />
              <p className={`text-[13px] font-semibold mb-0.5 ${active ? "text-blue-700 dark:text-blue-300" : "text-[#111110] dark:text-white"}`}>{t.label}</p>
              <p className="text-[11px] text-[#999990] leading-snug">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Input form */}
      {!result && (
        <div className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-6">
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#111110] dark:text-white mb-2">
              {activeType === "factcheck" ? "Claims or statements to verify" : "Research topic or question"}
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !curType.hasText && handleSubmit()}
              placeholder={curType.placeholder}
              data-testid="input-research-topic"
              className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-[#F9F9F8] dark:bg-[#0A0A0A] text-[14px] text-[#111110] dark:text-white placeholder:text-[#BBBBB5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {curType.hasText && (
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-[#111110] dark:text-white mb-2">
                {activeType === "essay" ? "Paste your essay or paper" : "Paste the text to fact-check"}
                <span className="ml-1.5 text-[11px] font-normal text-[#999990]">(optional)</span>
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                placeholder={activeType === "essay" ? "Paste your research essay here for detailed feedback..." : "Paste the claims, article, or statements you want verified..."}
                data-testid="textarea-research-text"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-[#F9F9F8] dark:bg-[#0A0A0A] text-[14px] text-[#111110] dark:text-white placeholder:text-[#BBBBB5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
              />
            </div>
          )}

          {/* Example topics */}
          {activeType === "topic" && !topic && (
            <div className="mb-4">
              <p className="text-[11px] font-medium text-[#999990] uppercase tracking-wide mb-2">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setTopic(ex)}
                    className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E5E5E0] dark:border-[#22221F] text-[#666660] hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-transparent"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !topic.trim()}
            data-testid="button-research-submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching the web and analysing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Run Assessment
              </>
            )}
          </button>

          {loading && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Globe className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
              <div className="text-[12px] text-blue-600 dark:text-blue-400">
                <span className="font-semibold">Searching the web</span> for authoritative sources and analysing your research topic — this takes 10–30 seconds.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-[14px] font-semibold text-[#111110] dark:text-white">Assessment Complete</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                {TYPES.find(t => t.id === result.type)?.label}
              </span>
            </div>
            <button
              onClick={reset}
              data-testid="button-research-reset"
              className="flex items-center gap-1.5 text-[12px] text-[#666660] hover:text-[#111110] dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F0EF] dark:hover:bg-[#1A1A18]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New assessment
            </button>
          </div>

          {/* Topic badge */}
          <div className="px-4 py-3 rounded-xl bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F]">
            <p className="text-[11px] font-medium text-[#999990] uppercase tracking-wide mb-0.5">Topic</p>
            <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{topic}</p>
          </div>

          {/* Assessment body */}
          <div className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed text-[#111110] dark:text-white/85">
              {renderMathText(result.assessment)}
            </div>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="text-[13px] font-semibold text-[#111110] dark:text-white">
                  Web Sources Used ({result.sources.length})
                </h3>
              </div>
              <div className="space-y-2">
                {result.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-source-${i}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F5F4] dark:hover:bg-[#1A1A18] transition-colors group"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111110] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {source.title}
                      </p>
                      <p className="text-[11px] text-[#999990] truncate">{source.url}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#BBBBB5] group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Run again CTA */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] text-[#666660] hover:text-[#111110] dark:hover:text-white hover:bg-[#F5F5F4] dark:hover:bg-[#1A1A18] text-[14px] font-medium transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            Assess another topic
          </button>
        </div>
      )}
    </div>
  );
}
