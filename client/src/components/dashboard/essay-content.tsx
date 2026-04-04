import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles, FileEdit, Copy, RotateCcw, Check, Download, BookOpen, AlignLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EssayResult {
  title: string;
  essay: string;
  wordCount: number;
  outline: string[];
}

const essayTypes = [
  { value: "argumentative", label: "Argumentative", description: "Defend a position" },
  { value: "persuasive", label: "Persuasive", description: "Convince the reader" },
  { value: "expository", label: "Expository", description: "Explain clearly" },
  { value: "narrative", label: "Narrative", description: "Tell a story" },
];

export default function EssayContent() {
  const [topic, setTopic] = useState("");
  const [essayType, setEssayType] = useState("argumentative");
  const [wordCount, setWordCount] = useState("500");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [result, setResult] = useState<EssayResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-essay", {
        topic,
        essayType,
        wordCount: parseInt(wordCount),
        additionalNotes,
      });
      return response.json();
    },
    onSuccess: (data) => setResult(data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to generate essay", variant: "destructive" });
    },
  });

  const copyEssay = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.essay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Essay copied to clipboard." });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 rounded-[22px] bg-[#111110] dark:bg-white flex items-center justify-center mx-auto mb-6">
          <FileEdit className="w-8 h-8 text-white dark:text-black" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Essay Writer</h2>
        <p className="text-[#666660]">Generate structured, high-quality academic writing</p>
      </header>

      {!result ? (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] overflow-hidden">
              <CardContent className="p-8 lg:p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Topic or Prompt</Label>
                  <Textarea
                    placeholder="Describe your essay topic in detail..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[160px] border-none focus-visible:ring-0 p-0 text-xl placeholder:text-[#999990] no-scrollbar resize-none"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">Additional Notes</Label>
                  <Textarea
                    placeholder="Add specific points or requirements..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="min-h-[100px] bg-[#F9F9F8] dark:bg-[#111110] border-[#E5E5E0] dark:border-[#22221F] rounded-2xl p-4 text-[15px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] bg-[#F9F9F8] dark:bg-[#111110]">
              <CardContent className="p-8 space-y-8">
                <div>
                  <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-4 block">Style & Format</Label>
                  <div className="space-y-2">
                    {essayTypes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setEssayType(t.value)}
                        className={`w-full flex flex-col p-4 rounded-2xl border transition-all text-left ${essayType === t.value ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "bg-white dark:bg-[#1A1A1A] text-[#111110] dark:text-white border-[#E5E5E0] dark:border-[#22221F]"}`}
                      >
                        <span className="text-sm font-semibold">{t.label}</span>
                        <span className={`text-[11px] opacity-60 ${essayType === t.value ? 'text-white/80 dark:text-black/80' : 'text-[#666660]'}`}>{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-4 block">Length</Label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-[#1A1A1A] border-[#E5E5E0] dark:border-[#22221F]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">Short (250 words)</SelectItem>
                      <SelectItem value="500">Medium (500 words)</SelectItem>
                      <SelectItem value="1000">Long (1000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => generateMutation.mutate()}
                  disabled={!topic.trim() || generateMutation.isPending}
                  className="w-full h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg"
                >
                  {generateMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Draft Essay"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{result.title}</h3>
            <Button variant="ghost" onClick={() => { setResult(null); setTopic(""); setEssayType("argumentative"); setWordCount("500"); setAdditionalNotes(""); }} className="rounded-full h-10 px-4 text-[#111110] dark:text-[#E5E5E0] hover:bg-[#F0F0F0] dark:hover:bg-[#1A1A1A] hover:text-[#111110] dark:hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" /> Start New
            </Button>
          </div>
          
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px]">
                <CardContent className="p-8 lg:p-12">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-[1.8] text-[17px] text-[#111110] dark:text-[#E5E5E0]">
                      {result.essay}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px] bg-[#F9F9F8] dark:bg-[#111110]">
                <CardContent className="p-6">
                  <h4 className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-4">Structure</h4>
                  <ul className="space-y-4">
                    {result.outline.map((o, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium">
                        <span className="w-6 h-6 rounded bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i+1}</span>
                        <span className="text-[#666660]">{o}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button onClick={copyEssay} className="flex-1 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
