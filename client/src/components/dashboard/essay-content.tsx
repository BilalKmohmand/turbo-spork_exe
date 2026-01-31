import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Sparkles, FileEdit, Copy, RotateCcw, Check } from "lucide-react";

interface EssayResult {
  title: string;
  essay: string;
  wordCount: number;
  outline: string[];
}

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

  const resetForm = () => {
    setResult(null);
    setTopic("");
    setAdditionalNotes("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">AI Essay Writer</h1>
        <p className="text-muted-foreground">Generate well-structured essays on any topic</p>
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-violet-600" />
              Essay Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="Enter your essay topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                data-testid="input-essay-topic"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Essay Type</Label>
                <Select value={essayType} onValueChange={setEssayType}>
                  <SelectTrigger data-testid="select-essay-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argumentative">Argumentative</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="expository">Expository</SelectItem>
                    <SelectItem value="narrative">Narrative</SelectItem>
                    <SelectItem value="descriptive">Descriptive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Word Count</Label>
                <Select value={wordCount} onValueChange={setWordCount}>
                  <SelectTrigger data-testid="select-word-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">~250 words</SelectItem>
                    <SelectItem value="500">~500 words</SelectItem>
                    <SelectItem value="750">~750 words</SelectItem>
                    <SelectItem value="1000">~1000 words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific points to include, thesis statement ideas, etc..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!topic.trim() || generateMutation.isPending}
              className="w-full gap-2"
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
              <h2 className="text-xl font-semibold">{result.title}</h2>
              <p className="text-muted-foreground">{result.wordCount} words</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyEssay} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                New Essay
              </Button>
            </div>
          </div>

          {result.outline && result.outline.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outline</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.outline.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {result.essay}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
