import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  ClipboardCheck,
  FileText,
  History,
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Users,
  Download,
} from "lucide-react";
import type { CriterionScore } from "@shared/schema";

interface RubricCriterion {
  id?: string;
  name: string;
  description: string;
  maxPoints: number;
  orderIndex?: number;
}

interface Rubric {
  id: string;
  name: string;
  subject: string;
  totalPoints: number;
  criteria: RubricCriterion[];
  createdAt: string;
}

interface RubricSubmissionItem {
  id: string;
  rubricId: string;
  studentName: string;
  title: string;
  content: string;
  status: string;
  submittedAt: string;
}

interface EvalHistoryItem {
  id: string;
  submissionId: string;
  overallScore: number;
  overallFeedback: string;
  criteriaScores: CriterionScore[];
  evaluatedAt: string;
  studentName: string;
  submissionTitle: string;
}

type View = "rubrics" | "create-rubric" | "rubric-detail" | "history";

export default function EvaluateContent() {
  const [view, setView] = useState<View>("rubrics");
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const { toast } = useToast();

  const openRubric = (id: string) => {
    setSelectedRubricId(id);
    setView("rubric-detail");
  };

  const openHistory = (id: string) => {
    setSelectedRubricId(id);
    setView("history");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
          <ClipboardCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Rubric Evaluator</h1>
        <p className="text-muted-foreground">Create rubrics, add submissions, and evaluate with AI</p>
      </div>

      {view === "rubrics" && (
        <RubricsList
          onCreateNew={() => setView("create-rubric")}
          onOpenRubric={openRubric}
          onOpenHistory={openHistory}
        />
      )}
      {view === "create-rubric" && (
        <CreateRubricForm onBack={() => setView("rubrics")} />
      )}
      {view === "rubric-detail" && selectedRubricId && (
        <RubricDetail rubricId={selectedRubricId} onBack={() => setView("rubrics")} />
      )}
      {view === "history" && selectedRubricId && (
        <EvaluationHistory rubricId={selectedRubricId} onBack={() => setView("rubrics")} />
      )}
    </div>
  );
}

function RubricsList({ onCreateNew, onOpenRubric, onOpenHistory }: { onCreateNew: () => void; onOpenRubric: (id: string) => void; onOpenHistory: (id: string) => void }) {
  const { data: rubrics, isLoading } = useQuery<Rubric[]>({ queryKey: ["/api/rubrics"] });
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/rubrics/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Deleted", description: "Rubric removed." });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Rubrics</h2>
        <Button onClick={onCreateNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-create-rubric">
          <Plus className="w-4 h-4" /> New Rubric
        </Button>
      </div>

      {!rubrics || rubrics.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">No rubrics yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first rubric to start evaluating student work</p>
            <Button onClick={onCreateNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Create Rubric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rubrics.map((r) => (
            <Card key={r.id} className="border-border/50 hover-elevate cursor-pointer" data-testid={`rubric-card-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0" onClick={() => onOpenRubric(r.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{r.name}</h3>
                      <Badge variant="secondary" className="text-xs">{r.subject}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {r.criteria.length} criteria | {r.totalPoints} total points
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenHistory(r.id)} className="gap-1" data-testid={`button-history-${r.id}`}>
                      <History className="w-3.5 h-3.5" /> History
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenRubric(r.id)} className="gap-1">
                      <FileText className="w-3.5 h-3.5" /> Open
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-rubric-${r.id}`}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRubricForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [criteria, setCriteria] = useState<{ name: string; description: string; maxPoints: number }[]>([
    { name: "", description: "", maxPoints: 20 },
  ]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rubrics", { name, subject, criteria });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Created", description: "Rubric created successfully." });
      onBack();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addCriterion = () => setCriteria([...criteria, { name: "", description: "", maxPoints: 20 }]);
  const removeCriterion = (i: number) => setCriteria(criteria.filter((_, idx) => idx !== i));
  const updateCriterion = (i: number, field: string, value: any) => {
    const updated = [...criteria];
    (updated[i] as any)[field] = value;
    setCriteria(updated);
  };

  const totalPoints = criteria.reduce((s, c) => s + (c.maxPoints || 0), 0);
  const isValid = name.trim() && subject.trim() && criteria.every(c => c.name.trim() && c.description.trim() && c.maxPoints > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-lg font-semibold">Create New Rubric</h2>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rubric Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Essay Grading Rubric" data-testid="input-rubric-name" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., English, Math" data-testid="input-rubric-subject" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Criteria ({criteria.length})</Label>
              <Badge variant="outline">Total: {totalPoints} pts</Badge>
            </div>

            {criteria.map((c, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Criterion {i + 1}</span>
                    {criteria.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCriterion(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_80px] gap-3">
                    <Input value={c.name} onChange={e => updateCriterion(i, "name", e.target.value)} placeholder="Criterion name" data-testid={`input-criterion-name-${i}`} />
                    <Input type="number" value={c.maxPoints} onChange={e => updateCriterion(i, "maxPoints", parseInt(e.target.value) || 0)} placeholder="Pts" data-testid={`input-criterion-points-${i}`} />
                  </div>
                  <Input value={c.description} onChange={e => updateCriterion(i, "description", e.target.value)} placeholder="What does this criterion evaluate?" data-testid={`input-criterion-desc-${i}`} />
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addCriterion} className="w-full gap-2" data-testid="button-add-criterion">
              <Plus className="w-4 h-4" /> Add Criterion
            </Button>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-save-rubric"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {createMutation.isPending ? "Creating..." : "Create Rubric"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RubricDetail({ rubricId, onBack }: { rubricId: string; onBack: () => void }) {
  const [studentName, setStudentName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: rubric } = useQuery<Rubric>({ queryKey: ["/api/rubrics", rubricId] });
  const { data: submissions, isLoading: subsLoading } = useQuery<RubricSubmissionItem[]>({ queryKey: ["/api/rubric-submissions", rubricId] });

  const addSubMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rubric-submissions", { rubricId, studentName, title, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubric-submissions", rubricId] });
      setStudentName(""); setTitle(""); setContent("");
      toast({ title: "Added", description: "Submission added." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const evaluateMutation = useMutation({
    mutationFn: async (subId: string) => {
      const res = await apiRequest("POST", `/api/rubric-evaluate/${subId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubric-submissions", rubricId] });
      toast({ title: "Evaluated", description: "Submission evaluated by AI." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rubric-evaluate-batch", { submissionIds: Array.from(selectedIds) });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubric-submissions", rubricId] });
      setSelectedIds(new Set());
      toast({ title: "Batch Complete", description: `${data.evaluated}/${data.total} evaluated.` });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectAllPending = () => {
    const pending = submissions?.filter(s => s.status === "pending").map(s => s.id) || [];
    setSelectedIds(new Set(pending));
  };

  const pendingCount = submissions?.filter(s => s.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-lg font-semibold">{rubric?.name || "Loading..."}</h2>
          {rubric && <p className="text-sm text-muted-foreground">{rubric.subject} | {rubric.totalPoints} pts | {rubric.criteria.length} criteria</p>}
        </div>
      </div>

      {rubric && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Rubric Criteria</h3>
            <div className="space-y-1">
              {rubric.criteria.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/50">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground ml-2">- {c.description}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{c.maxPoints} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-medium">Add Student Submission</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Student name" data-testid="input-student-name" />
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Submission title" data-testid="input-submission-title" />
          </div>
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Paste student work here..." className="min-h-[120px]" data-testid="input-submission-content" />
          <Button
            onClick={() => addSubMutation.mutate()}
            disabled={!studentName.trim() || !title.trim() || !content.trim() || addSubMutation.isPending}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-add-submission"
          >
            {addSubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Submission
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Submissions ({submissions?.length || 0})
          </h3>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={selectAllPending} className="text-xs" data-testid="button-select-all">
                  Select All Pending ({pendingCount})
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => batchMutation.mutate()}
                    disabled={batchMutation.isPending}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                    data-testid="button-batch-evaluate"
                  >
                    {batchMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Evaluate Selected ({selectedIds.size})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {subsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !submissions || submissions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No submissions yet. Add student work above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {submissions.map((sub) => (
              <Card key={sub.id} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {sub.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        className="w-4 h-4 accent-emerald-600"
                        data-testid={`checkbox-sub-${sub.id}`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{sub.studentName}</span>
                        <span className="text-muted-foreground text-xs">-</span>
                        <span className="text-sm truncate">{sub.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{sub.content.slice(0, 100)}...</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sub.status === "evaluated" ? (
                        <Badge variant="secondary" className="gap-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Evaluated
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-xs gap-1">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => evaluateMutation.mutate(sub.id)}
                            disabled={evaluateMutation.isPending}
                            className="gap-1 text-xs"
                            data-testid={`button-evaluate-${sub.id}`}
                          >
                            {evaluateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Evaluate
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EvaluationHistory({ rubricId, onBack }: { rubricId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery<{ history: EvalHistoryItem[]; criteria: RubricCriterion[] }>({
    queryKey: ["/api/rubric-evaluations", rubricId],
  });
  const { data: rubric } = useQuery<Rubric>({ queryKey: ["/api/rubrics", rubricId] });

  const downloadCSV = () => {
    if (!data || !data.history.length) return;
    const cols = ["Student", "Title", "Overall Score", ...data.criteria.map(c => `${c.name} (/${c.maxPoints})`), "Feedback", "Date"];
    const rows = data.history.map(ev => {
      const scores = data.criteria.map(c => {
        const cs = (ev.criteriaScores as CriterionScore[]).find(s => s.criterionName === c.name);
        return cs ? cs.score : 0;
      });
      return [ev.studentName, ev.submissionTitle, ev.overallScore, ...scores, `"${ev.overallFeedback.replace(/"/g, '""')}"`, new Date(ev.evaluatedAt).toLocaleDateString()];
    });
    const csv = [cols.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluations-${rubric?.name || "rubric"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h2 className="text-lg font-semibold">Evaluation History</h2>
            <p className="text-sm text-muted-foreground">{rubric?.name} | {data?.history.length || 0} evaluations</p>
          </div>
        </div>
        {data && data.history.length > 0 && (
          <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2" data-testid="button-download-csv">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.history.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">No evaluations yet</h3>
            <p className="text-sm text-muted-foreground">Evaluate submissions to see results here</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="evaluation-spreadsheet">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                    {data.criteria.map(c => (
                      <th key={c.id || c.name} className="text-center p-3 font-medium text-muted-foreground whitespace-nowrap">
                        {c.name}<br /><span className="text-xs font-normal">/{c.maxPoints}</span>
                      </th>
                    ))}
                    <th className="text-center p-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Feedback</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((ev) => {
                    const totalMax = data.criteria.reduce((s, c) => s + c.maxPoints, 0);
                    const pct = totalMax > 0 ? Math.round((ev.overallScore / totalMax) * 100) : 0;
                    return (
                      <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{ev.studentName}</td>
                        <td className="p-3 text-muted-foreground">{ev.submissionTitle}</td>
                        {data.criteria.map(c => {
                          const cs = (ev.criteriaScores as CriterionScore[]).find(s => s.criterionName === c.name);
                          const score = cs?.score ?? 0;
                          const scorePct = c.maxPoints > 0 ? (score / c.maxPoints) * 100 : 0;
                          return (
                            <td key={c.id || c.name} className="p-3 text-center" title={cs?.feedback || ""}>
                              <span className={`font-medium ${scorePct >= 80 ? "text-emerald-600" : scorePct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                {score}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          <Badge variant={pct >= 80 ? "secondary" : pct >= 50 ? "outline" : "destructive"} className={`text-xs ${pct >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}`}>
                            {ev.overallScore}/{totalMax} ({pct}%)
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={ev.overallFeedback}>{ev.overallFeedback}</td>
                        <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(ev.evaluatedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
