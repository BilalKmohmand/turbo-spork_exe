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
  { value: "argumentative", label: "Argumentative", description: "Present and defend a position" },
  { value: "persuasive", label: "Persuasive", description: "Convince the reader" },
  { value: "expository", label: "Expository", description: "Explain a topic clearly" },
  { value: "narrative", label: "Narrative", description: "Tell a story" },
  { value: "descriptive", label: "Descriptive", description: "Paint a picture with words" },
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
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate essay",
        variant: "destructive",
      });
    },
  });

  const copyEssay = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.essay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Essay copied to clipboard." });
  };

  const downloadEssay = () => {
    if (!result) return;
    const blob = new Blob([`${result.title}\n\n${result.essay}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setResult(null);
    setTopic("");
    setAdditionalNotes("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/20">
          <FileEdit className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Essay Writer</h1>
        <p className="text-muted-foreground">Generate well-structured essays on any topic</p>
      </div>

      {!result ? (
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">Essay Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The impact of social media on modern communication"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="border-border/50"
                data-testid="input-essay-topic"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Essay Type</Label>
                <Select value={essayType} onValueChange={setEssayType}>
                  <SelectTrigger className="border-border/50" data-testid="select-essay-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {essayTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="text-muted-foreground text-xs ml-2">- {type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Length</Label>
                <Select value={wordCount} onValueChange={setWordCount}>
                  <SelectTrigger className="border-border/50" data-testid="select-word-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">Short (~250 words)</SelectItem>
                    <SelectItem value="500">Medium (~500 words)</SelectItem>
                    <SelectItem value="750">Long (~750 words)</SelectItem>
                    <SelectItem value="1000">Extended (~1000 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific points to include, thesis ideas, required sources, etc..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="min-h-[100px] resize-none border-border/50"
              />
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!topic.trim() || generateMutation.isPending}
              className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
              data-testid="button-generate-essay"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Essay...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Essay
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{result.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1">
                  <AlignLeft className="w-3 h-3" />
                  {result.wordCount} words
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {essayTypes.find(t => t.value === essayType)?.label}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Essay
            </Button>
          </div>

          {result.outline && result.outline.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-medium">Outline</h3>
                </div>
                <ul className="space-y-1.5">
                  {result.outline.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {result.essay}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyEssay} className="flex-1 gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Essay"}
            </Button>
            <Button variant="outline" onClick={downloadEssay} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
