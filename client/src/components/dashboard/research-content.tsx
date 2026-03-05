import { useState, useRef } from "react";
import {
  Search, FileSearch, CheckSquare, Globe, ExternalLink,
  RotateCcw, Sparkles, ChevronRight, Paperclip,
  FileText, File, FileSpreadsheet, Image, X, Upload,
} from "lucide-react";
import { renderMathText } from "@/components/math-display";
import { useToast } from "@/hooks/use-toast";

type AssessmentType = "topic" | "essay" | "factcheck";

const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif," +
  "application/pdf," +
  ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,text/csv,.xls,.xlsx," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const IMAGE_MIMES = ["image/jpeg","image/png","image/webp","image/gif"];

interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  file: File;
  preview?: string;
}

function fileMeta(mime: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_MIMES.includes(mime)) return { icon: Image, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", label: "IMG" };
  if (mime === "application/pdf" || ext === "pdf") return { icon: FileText, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", label: "PDF" };
  if (mime.includes("word") || ["doc","docx"].includes(ext)) return { icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", label: "DOC" };
  if (mime.includes("excel") || mime.includes("spreadsheet") || ["xls","xlsx","csv"].includes(ext)) return { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", label: "XLS" };
  return { icon: File, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/30", label: "TXT" };
}

const TYPES: { id: AssessmentType; label: string; icon: typeof Search; desc: string; placeholder: string; hasText: boolean }[] = [
  { id: "topic",     label: "Topic Research", icon: Search,      desc: "Deep-dive into any topic with live web sources",           placeholder: "e.g. The effects of social media on teenage mental health", hasText: false },
  { id: "essay",     label: "Essay Review",   icon: FileSearch,  desc: "Evaluate a research essay or paper with web-backed feedback", placeholder: "e.g. Climate change mitigation strategies",               hasText: true  },
  { id: "factcheck", label: "Fact Check",     icon: CheckSquare, desc: "Verify claims or statements against authoritative sources",  placeholder: "e.g. Vaccines cause autism",                             hasText: true  },
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
  filesProcessed?: number;
}

export default function ResearchContent() {
  const { toast } = useToast();
  const [activeType, setActiveType]   = useState<AssessmentType>("topic");
  const [topic, setTopic]             = useState("");
  const [text, setText]               = useState("");
  const [files, setFiles]             = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<Result | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const curType = TYPES.find(t => t.id === activeType)!;
  const MAX_FILES = 5;

  function addFiles(raw: File[]) {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: `Max ${MAX_FILES} files.`, variant: "destructive" });
      return;
    }
    const toAdd: AttachedFile[] = [];
    for (const f of raw.slice(0, remaining)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const allowed = FILE_ACCEPT.includes(f.type) || ["pdf","doc","docx","txt","csv","xls","xlsx","jpg","jpeg","png","webp","gif","md"].includes(ext);
      if (!allowed) {
        toast({ title: `${f.name} not supported`, description: "Upload images, PDF, Word, Excel, or TXT files.", variant: "destructive" });
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        toast({ title: `${f.name} too large`, description: "Max 25 MB per file.", variant: "destructive" });
        continue;
      }
      const isImage = IMAGE_MIMES.includes(f.type);
      const af: AttachedFile = { id: `${Date.now()}-${Math.random()}`, name: f.name, mimeType: f.type || "application/octet-stream", file: f };
      if (isImage) af.preview = URL.createObjectURL(f);
      toAdd.push(af);
    }
    if (toAdd.length) setFiles(prev => [...prev, ...toAdd]);
  }

  function removeFile(id: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = Array.from(e.target.files || []);
    e.target.value = "";
    addFiles(sel);
  };

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); };
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  async function handleSubmit() {
    if (!topic.trim() && !files.length) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let res: Response;

      if (files.length > 0) {
        const fd = new FormData();
        fd.append("topic", topic.trim() || "Research project (see uploaded files)");
        fd.append("type", activeType);
        if (text.trim()) fd.append("text", text.trim());
        files.forEach(f => fd.append("files", f.file, f.name));
        res = await fetch("/api/research-assess-file", { method: "POST", body: fd, credentials: "include" });
      } else {
        res = await fetch("/api/research-assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topic.trim(), text: text.trim() || undefined, type: activeType }),
          credentials: "include",
        });
      }

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Assessment failed");
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
    files.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
            <button key={t.id} onClick={() => { setActiveType(t.id); setResult(null); setError(null); }}
              data-testid={`button-type-${t.id}`}
              className={`text-left p-4 rounded-xl border transition-all ${active ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-[#E5E5E0] dark:border-[#22221F] hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-[#111110]"}`}>
              <Icon className={`w-4 h-4 mb-2 ${active ? "text-blue-600 dark:text-blue-400" : "text-[#666660]"}`} />
              <p className={`text-[13px] font-semibold mb-0.5 ${active ? "text-blue-700 dark:text-blue-300" : "text-[#111110] dark:text-white"}`}>{t.label}</p>
              <p className="text-[11px] text-[#999990] leading-snug">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Input form */}
      {!result && (
        <div
          className={`bg-white dark:bg-[#111110] border rounded-2xl p-6 transition-all ${isDragging ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/10" : "border-[#E5E5E0] dark:border-[#22221F]"}`}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        >
          <input ref={fileInputRef} type="file" multiple accept={FILE_ACCEPT} className="hidden" onChange={handleFileInput} />

          {/* Drag overlay hint */}
          {isDragging && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-blue-500">
              <Upload className="w-10 h-10" />
              <p className="font-semibold text-[14px]">Drop files to attach</p>
            </div>
          )}

          {!isDragging && (
            <>
              {/* Topic input */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[#111110] dark:text-white mb-2">
                  {activeType === "factcheck" ? "Claims or statements to verify" : "Research topic or question"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !curType.hasText && !files.length && handleSubmit()}
                  placeholder={curType.placeholder}
                  data-testid="input-research-topic"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-[#F9F9F8] dark:bg-[#0A0A0A] text-[14px] text-[#111110] dark:text-white placeholder:text-[#BBBBB5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              {/* Text area (essay / factcheck) */}
              {curType.hasText && (
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#111110] dark:text-white mb-2">
                    {activeType === "essay" ? "Paste your essay or paper" : "Paste the text to fact-check"}
                    <span className="ml-1.5 text-[11px] font-normal text-[#999990]">(optional)</span>
                  </label>
                  <textarea
                    value={text} onChange={e => setText(e.target.value)} rows={6}
                    placeholder={activeType === "essay" ? "Paste your research essay here, or upload a file below..." : "Paste the claims or article text here, or upload a file..."}
                    data-testid="textarea-research-text"
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-[#F9F9F8] dark:bg-[#0A0A0A] text-[14px] text-[#111110] dark:text-white placeholder:text-[#BBBBB5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
                  />
                </div>
              )}

              {/* Attached files */}
              {files.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {files.map(f => {
                    const meta = fileMeta(f.mimeType, f.name);
                    const isImg = !!f.preview;
                    return (
                      <div key={f.id} className="relative group flex-shrink-0">
                        {isImg ? (
                          <>
                            <img src={f.preview} alt={f.name} className="h-16 w-16 object-cover rounded-xl border border-[#E5E5E0] dark:border-[#22221F]" data-testid={`img-research-${f.id}`} />
                            <button onClick={() => removeFile(f.id)} className="absolute -top-1.5 -right-1.5 bg-[#111110] dark:bg-white text-white dark:text-black rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">×</button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] bg-white dark:bg-[#0A0A0A] max-w-[200px]">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                              <meta.icon className={`w-4 h-4 ${meta.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-[#111110] dark:text-white truncate">{f.name}</p>
                              <p className={`text-[10px] font-bold uppercase ${meta.color}`}>{meta.label}</p>
                            </div>
                            <button onClick={() => removeFile(f.id)} className="ml-1 text-[#999] hover:text-[#111110] dark:hover:text-white shrink-0" data-testid={`button-remove-${f.id}`}><X className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Attach file button */}
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                  data-testid="button-attach-files"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#D5D5D0] dark:border-[#333330] text-[#666660] hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-600 text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Paperclip className="w-4 h-4" />
                  {files.length ? `${files.length}/${MAX_FILES} files attached — add more` : "Attach research files"}&ensp;
                  <span className="text-[11px] text-[#BBBBB5]">PDF, Word, Excel, TXT, images · up to 25 MB</span>
                </button>
              </div>

              {/* Example topics */}
              {activeType === "topic" && !topic && !files.length && (
                <div className="mb-4">
                  <p className="text-[11px] font-medium text-[#999990] uppercase tracking-wide mb-2">Try an example</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map(ex => (
                      <button key={ex} onClick={() => setTopic(ex)}
                        className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E5E5E0] dark:border-[#22221F] text-[#666660] hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-transparent">
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
                disabled={loading || (!topic.trim() && !files.length)}
                data-testid="button-research-submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching the web and analysing...</>
                ) : (
                  <><Search className="w-4 h-4" /> Run Assessment {files.length > 0 ? `(${files.length} file${files.length > 1 ? "s" : ""})` : ""}</>
                )}
              </button>

              {loading && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Globe className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
                  <p className="text-[12px] text-blue-600 dark:text-blue-400">
                    <span className="font-semibold">Searching the web</span> for authoritative sources{files.length ? " and reading your uploaded files" : ""} — this takes 15–40 seconds.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-[14px] font-semibold text-[#111110] dark:text-white">Assessment Complete</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                {TYPES.find(t => t.id === result.type)?.label}
              </span>
              {result.filesProcessed ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium">
                  {result.filesProcessed} file{result.filesProcessed > 1 ? "s" : ""} analysed
                </span>
              ) : null}
            </div>
            <button onClick={reset} data-testid="button-research-reset"
              className="flex items-center gap-1.5 text-[12px] text-[#666660] hover:text-[#111110] dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0F0EF] dark:hover:bg-[#1A1A18]">
              <RotateCcw className="w-3.5 h-3.5" /> New assessment
            </button>
          </div>

          {topic && (
            <div className="px-4 py-3 rounded-xl bg-[#F9F9F8] dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F]">
              <p className="text-[11px] font-medium text-[#999990] uppercase tracking-wide mb-0.5">Topic</p>
              <p className="text-[14px] font-semibold text-[#111110] dark:text-white">{topic}</p>
            </div>
          )}

          <div className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-6">
            <div className="text-[14px] leading-relaxed text-[#111110] dark:text-white/85">
              {renderMathText(result.assessment)}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="bg-white dark:bg-[#111110] border border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="text-[13px] font-semibold text-[#111110] dark:text-white">Web Sources Used ({result.sources.length})</h3>
              </div>
              <div className="space-y-1">
                {result.sources.map((src, i) => (
                  <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" data-testid={`link-source-${i}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F5F4] dark:hover:bg-[#1A1A18] transition-colors group">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111110] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{src.title}</p>
                      <p className="text-[11px] text-[#999990] truncate">{src.url}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#BBBBB5] group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E5E5E0] dark:border-[#22221F] text-[#666660] hover:text-[#111110] dark:hover:text-white hover:bg-[#F5F5F4] dark:hover:bg-[#1A1A18] text-[14px] font-medium transition-all">
            <ChevronRight className="w-4 h-4" /> Assess another topic
          </button>
        </div>
      )}
    </div>
  );
}
