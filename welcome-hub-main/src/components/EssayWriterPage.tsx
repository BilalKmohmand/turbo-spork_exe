import { useState, useEffect } from "react";
import { FileEdit, Plus, Download, Copy, CheckCircle, Clock, MoreVertical, Sparkles, Wand2, BookOpen, Type, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Essay {
  id: string;
  title: string;
  topic: string;
  subject: string;
  type: string;
  wordCount: number;
  content?: string;
  status: "draft" | "generated" | "completed";
  createdAt: string;
}

const ESSAY_TYPES = [
  { id: "argumentative", label: "Argumentative", description: "Present arguments for and against a topic" },
  { id: "expository", label: "Expository", description: "Explain or describe a topic clearly" },
  { id: "narrative", label: "Narrative", description: "Tell a story with a clear sequence" },
  { id: "descriptive", label: "Descriptive", description: "Paint a picture with words" },
  { id: "persuasive", label: "Persuasive", description: "Convince the reader of your viewpoint" },
];

const SUBJECTS = ["English", "History", "Science", "Philosophy", "Literature", "Other"];

export default function EssayWriterPage() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEssayDialog, setShowEssayDialog] = useState(false);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newEssay, setNewEssay] = useState({
    title: "",
    topic: "",
    subject: "English",
    type: "argumentative",
    wordCount: 500,
  });

  useEffect(() => {
    loadEssays();
  }, []);

  const loadEssays = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ essays: Essay[] }>("/api/essays");
      setEssays(res.essays || []);
    } catch {
      setEssays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEssay = async () => {
    if (!newEssay.title.trim() || !newEssay.topic.trim()) return;
    try {
      const res = await apiFetch<{ essay: Essay }>("/api/essays", {
        method: "POST",
        body: JSON.stringify({
          ...newEssay,
          status: "draft",
        }),
      });
      setEssays(prev => [res.essay, ...prev]);
      setShowCreateDialog(false);
      setNewEssay({ title: "", topic: "", subject: "English", type: "argumentative", wordCount: 500 });
    } catch (error) {
      console.error("Failed to create essay:", error);
    }
  };

  const generateEssay = async (essay: Essay) => {
    setIsGenerating(true);
    try {
      const res = await apiFetch<{ essay: Essay; content: string }>(`/api/essays/${essay.id}/generate`, {
        method: "POST",
      });
      setEssays(prev => prev.map(e => e.id === essay.id ? { ...res.essay, content: res.content } : e));
      if (selectedEssay?.id === essay.id) {
        setSelectedEssay({ ...res.essay, content: res.content });
      }
    } catch (error) {
      console.error("Failed to generate essay:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const openEssay = (essay: Essay) => {
    setSelectedEssay(essay);
    setShowEssayDialog(true);
  };

  const copyEssay = async (content?: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const downloadEssay = (essay: Essay) => {
    if (!essay.content) return;
    const blob = new Blob([essay.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${essay.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500";
      case "generated": return "bg-blue-500/10 text-blue-500";
      default: return "bg-amber-500/10 text-amber-500";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
        <div className="flex items-center gap-3">
          <FileEdit className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Essay Writer</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Essay
        </Button>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : essays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Essay Writer</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Generate well-structured essays with AI assistance. Choose your topic, style, and let the AI help you write.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Start Writing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {essays.map(essay => (
                <Card key={essay.id} className="group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openEssay(essay)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(essay.status)}`}>
                        {essay.status.charAt(0).toUpperCase() + essay.status.slice(1)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{essay.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{essay.topic}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {essay.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Type className="w-3 h-3" />
                        {essay.wordCount} words
                      </span>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="w-3 h-3" />
                        {ESSAY_TYPES.find(t => t.id === essay.type)?.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(essay.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Essay Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Essay</DialogTitle>
            <DialogDescription>
              Set up your essay parameters and the AI will help you write it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Essay Title</Label>
              <Input
                id="title"
                placeholder="e.g., The Impact of Technology on Education"
                value={newEssay.title}
                onChange={e => setNewEssay(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Prompt</Label>
              <Textarea
                id="topic"
                placeholder="Describe what your essay should be about..."
                value={newEssay.topic}
                onChange={e => setNewEssay(prev => ({ ...prev, topic: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  value={newEssay.subject}
                  onChange={e => setNewEssay(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordCount">Word Count</Label>
                <select
                  id="wordCount"
                  value={newEssay.wordCount}
                  onChange={e => setNewEssay(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="300">300 words</option>
                  <option value="500">500 words</option>
                  <option value="750">750 words</option>
                  <option value="1000">1000 words</option>
                  <option value="1500">1500 words</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Essay Type</Label>
              <div className="grid grid-cols-1 gap-2">
                {ESSAY_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setNewEssay(prev => ({ ...prev, type: type.id }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                      newEssay.type === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      newEssay.type === type.id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Type className={cn("w-4 h-4", newEssay.type === type.id ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateEssay}
                disabled={!newEssay.title.trim() || !newEssay.topic.trim()}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Create Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Essay Dialog */}
      {selectedEssay && (
        <Dialog open={showEssayDialog} onOpenChange={setShowEssayDialog}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedEssay.title}</DialogTitle>
              <DialogDescription>
                {selectedEssay.subject} · {selectedEssay.wordCount} words · {ESSAY_TYPES.find(t => t.id === selectedEssay.type)?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {!selectedEssay.content && selectedEssay.status === "draft" ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">Ready to generate your essay</p>
                  <Button onClick={() => generateEssay(selectedEssay)} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-1" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
              ) : selectedEssay.content ? (
                <div className="space-y-4">
                  <ScrollArea className="max-h-[50vh]">
                    <div className="prose prose-sm max-w-none dark:prose-invert p-4 bg-muted/50 rounded-xl">
                      <div className="whitespace-pre-wrap">{selectedEssay.content}</div>
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => copyEssay(selectedEssay.content)}>
                      {copied ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" onClick={() => downloadEssay(selectedEssay)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" onClick={() => setShowEssayDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No content available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
