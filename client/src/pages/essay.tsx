import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Loader2, 
  Sparkles,
  FileEdit,
  Copy,
  RotateCcw
} from "lucide-react";

interface EssayResult {
  title: string;
  essay: string;
  wordCount: number;
  outline: string[];
}

export default function Essay() {
  useAuth(true);
  const [topic, setTopic] = useState("");
  const [essayType, setEssayType] = useState("argumentative");
  const [wordCount, setWordCount] = useState("500");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [result, setResult] = useState<EssayResult | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-essay", { 
        topic: topic.trim(),
        type: essayType,
        wordCount: parseInt(wordCount),
        notes: additionalNotes.trim()
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate essay");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate essay.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter an essay topic.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const handleCopy = () => {
    if (result?.essay) {
      navigator.clipboard.writeText(result.essay);
      toast({
        title: "Copied",
        description: "Essay copied to clipboard",
      });
    }
  };

  const handleReset = () => {
    setResult(null);
    setTopic("");
    setAdditionalNotes("");
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!result && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <FileEdit className="w-7 h-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Essay Writer
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Get help structuring and writing essays with AI-powered assistance. Perfect for overcoming writer's block.
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="topic" className="text-base font-medium">
                    Essay Topic
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., The impact of social media on modern communication"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-2"
                    data-testid="input-essay-topic"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-base font-medium">
                      Essay Type
                    </Label>
                    <Select value={essayType} onValueChange={setEssayType}>
                      <SelectTrigger className="mt-2" data-testid="select-essay-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="argumentative">Argumentative</SelectItem>
                        <SelectItem value="expository">Expository</SelectItem>
                        <SelectItem value="narrative">Narrative</SelectItem>
                        <SelectItem value="descriptive">Descriptive</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                        <SelectItem value="compare-contrast">Compare & Contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="wordcount" className="text-base font-medium">
                      Word Count
                    </Label>
                    <Select value={wordCount} onValueChange={setWordCount}>
                      <SelectTrigger className="mt-2" data-testid="select-word-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">300 words</SelectItem>
                        <SelectItem value="500">500 words</SelectItem>
                        <SelectItem value="750">750 words</SelectItem>
                        <SelectItem value="1000">1000 words</SelectItem>
                        <SelectItem value="1500">1500 words</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-base font-medium">
                    Additional Notes (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Include any specific points, thesis ideas, or sources you want to incorporate
                  </p>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Focus on how social media affects teen mental health. Include statistics about usage."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="min-h-[100px] resize-none"
                    data-testid="input-essay-notes"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !topic.trim()}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                    data-testid="button-generate-essay"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Writing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Essay
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">{result.title}</h1>
                <p className="text-muted-foreground">{result.wordCount} words</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy} className="gap-2" data-testid="button-copy-essay">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2" data-testid="button-new-essay">
                  <RotateCcw className="w-4 h-4" />
                  New Essay
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Outline</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-6">
                  {result.outline.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Essay</h3>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                    data-testid="text-essay-content"
                  >
                    {result.essay}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
