import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sparkles, BookOpen, ChevronDown, ChevronUp, Users,
  ClipboardList, Loader2, Trash2, Clock, Copy, Check,
  FileText, GraduationCap, Save, Plus, X, Award,
  Send, RotateCcw, Globe,
} from "lucide-react";
import ClassSelector from "./class-selector";

/* ─── Types ──────────────────────────────────────────────────── */
interface Criterion { name: string; description: string; maxPoints: number; }
interface RubricCriterion { id: string; rubricId: string; name: string; description: string; maxPoints: number; orderIndex: number; }
interface Assignment {
  id: string; name: string; subject: string; totalPoints: number;
  description?: string | null; gradeLevel?: string | null;
  assignmentType?: string | null; studentInstructions?: string | null;
  estimatedTime?: string | null; createdAt: string; criteria: RubricCriterion[];
  status: string; publishedAt?: string | null; classId?: string | null;
}
interface GeneratedAssignment { title: string; studentInstructions: string; estimatedTime: string; criteria: Criterion[]; }
interface CriterionScore { criterionId: string; criterionName: string; score: number; maxPoints: number; feedback: string; }
interface EvalResult { submissionId: string; overallScore: number; overallFeedback: string; criteriaScores: CriterionScore[]; studentName?: string; error?: string; }
interface StudentEntry { name: string; work: string; }
interface StudentSubmission {
  id: string; rubricId: string; studentId?: string | null; studentName: string;
  title: string; content: string; status: string; submittedAt: string;
  studentDisplayName: string;
  evaluation: { id: string; overallScore: number; overallFeedback: string; criteriaScores: CriterionScore[]; pushedAt?: string | null; } | null;
}

/* ─── Constants ───────────────────────────────────────────────── */
const SUBJECTS = ["Mathematics","English / Literature","Science","History","Geography","Physics","Chemistry","Biology","Computer Science","Art","Music","Physical Education","Economics","Psychology","Other"];
const GRADE_LEVELS = ["K - Grade 2","Grade 3 - 5","Grade 6 - 8","Grade 9 - 10","Grade 11 - 12","College / University"];
const ASSIGNMENT_TYPES = ["Essay","Research Paper","Lab Report","Short Answer","Multiple Choice Quiz","Creative Writing","Math Problem Set","Presentation","Case Study","Book Report","Project","Debate"];

function letterGrade(pct: number) {
  if (pct >= 90) return { letter: "A", color: "text-green-600 dark:text-green-400" };
  if (pct >= 80) return { letter: "B", color: "text-blue-600 dark:text-blue-400" };
  if (pct >= 70) return { letter: "C", color: "text-yellow-600 dark:text-yellow-400" };
  if (pct >= 60) return { letter: "D", color: "text-orange-600 dark:text-orange-400" };
  return { letter: "F", color: "text-red-600 dark:text-red-400" };
}

/* ─── Grading Panel ───────────────────────────────────────────── */
function GradingPanel({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentEntry[]>([{ name: "", work: "" }]);
  const [results, setResults] = useState<EvalResult[] | null>(null);
  const [phase, setPhase] = useState<"input" | "grading" | "done">("input");

  const addStudent = () => setStudents([...students, { name: "", work: "" }]);
  const removeStudent = (i: number) => setStudents(students.filter((_, idx) => idx !== i));
  const updateStudent = (i: number, field: keyof StudentEntry, val: string) => {
    const updated = [...students];
    updated[i] = { ...updated[i], [field]: val };
    setStudents(updated);
  };

  const handleGrade = async () => {
    const valid = students.filter((s) => s.name.trim() && s.work.trim());
    if (valid.length === 0) {
      toast({ title: "Add at least one student with their work.", variant: "destructive" });
      return;
    }
    setPhase("grading");
    try {
      // Step 1: create a submission for each student
      const submissionIds: string[] = [];
      for (const s of valid) {
        const res = await (await apiRequest("POST", "/api/rubric-submissions", {
          rubricId: assignment.id,
          studentName: s.name.trim(),
          title: assignment.name,
          content: s.work.trim(),
          status: "pending",
        })).json();
        submissionIds.push(res.id);
      }

      // Step 2: batch evaluate all submissions
      const batchRes = await (await apiRequest("POST", "/api/rubric-evaluate-batch", {
        submissionIds,
      })).json();

      // Step 3: attach student names to results
      const enriched = (batchRes.results as EvalResult[]).map((r, i) => ({
        ...r,
        studentName: valid[i]?.name || "Student",
      }));

      setResults(enriched);
      setPhase("done");
    } catch (err) {
      setPhase("input");
      toast({ title: "Grading failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setStudents([{ name: "", work: "" }]);
    setResults(null);
    setPhase("input");
  };

  return (
    <div className="border-t border-primary/30 mt-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Grade Students — {assignment.name}
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {phase !== "done" ? (
        <>
          <div className="space-y-3">
            {students.map((s, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2" data-testid={`student-entry-${i}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Student ${i + 1} name`}
                      value={s.name}
                      onChange={(e) => updateStudent(i, "name", e.target.value)}
                      className="h-8 text-sm"
                      data-testid={`input-student-name-${i}`}
                    />
                  </div>
                  {students.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeStudent(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder={`Paste ${s.name || "student"}'s work here…`}
                  value={s.work}
                  onChange={(e) => updateStudent(i, "work", e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                  data-testid={`input-student-work-${i}`}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addStudent} data-testid="button-add-student">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Student
            </Button>
            <Button
              size="sm"
              onClick={handleGrade}
              disabled={phase === "grading"}
              className="flex-1"
              data-testid="button-grade-all"
            >
              {phase === "grading" ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Grading {students.filter(s => s.name && s.work).length} student(s)…</>
              ) : (
                <><Award className="h-3.5 w-3.5 mr-1" /> Grade All Students</>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-3">
            {results?.map((r, i) => {
              const pct = assignment.totalPoints > 0 ? Math.round((r.overallScore / assignment.totalPoints) * 100) : 0;
              const grade = letterGrade(pct);
              return r.error ? (
                <div key={i} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                  <p className="font-medium">{r.studentName}</p>
                  <p className="text-destructive text-xs mt-1">Grading failed: {r.error}</p>
                </div>
              ) : (
                <div key={i} className="bg-muted/40 rounded-lg p-3" data-testid={`result-student-${i}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.overallFeedback}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold ${grade.color}`}>{grade.letter}</p>
                      <p className="text-xs text-muted-foreground">{r.overallScore}/{assignment.totalPoints} ({pct}%)</p>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2 border-t border-border pt-2">
                    {r.criteriaScores?.map((cs, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{cs.criterionName}:</span>{" "}
                          <span className="text-muted-foreground">{cs.feedback}</span>
                        </div>
                        <span className="shrink-0 font-medium">
                          {cs.score}/{cs.maxPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-grade-again">
              Grade More Students
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Done</Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Submissions Panel ───────────────────────────────────────── */
function SubmissionsPanel({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const { toast } = useToast();
  const [reevaluatingId, setReevaluatingId] = useState<string | null>(null);

  const { data: submissions = [], isLoading, refetch } = useQuery<StudentSubmission[]>({
    queryKey: ["/api/teacher/rubric-submissions", assignment.id],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/rubric-submissions?rubricId=${assignment.id}`, { credentials: "include" });
      return res.json();
    },
  });

  const pushMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const res = await apiRequest("PATCH", `/api/teacher/rubric-submissions/${submissionId}/push`);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Result pushed to student!", variant: "success" });
    },
    onError: () => toast({ title: "Failed to push result", variant: "destructive" }),
  });

  const handleReevaluate = async (submissionId: string) => {
    setReevaluatingId(submissionId);
    try {
      await apiRequest("POST", `/api/teacher/rubric-submissions/${submissionId}/reevaluate`);
      refetch();
      toast({ title: "Re-evaluation complete!", variant: "success" });
    } catch {
      toast({ title: "Re-evaluation failed", variant: "destructive" });
    } finally {
      setReevaluatingId(null);
    }
  };

  return (
    <div className="border-t border-primary/30 mt-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Student Submissions ({submissions.length})
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No student submissions yet
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const pct = sub.evaluation && assignment.totalPoints > 0
              ? Math.round((sub.evaluation.overallScore / assignment.totalPoints) * 100)
              : null;
            const grade = pct !== null ? letterGrade(pct) : null;
            const isPushed = sub.status === "pushed";
            return (
              <div key={sub.id} className="bg-muted/40 rounded-lg p-3 space-y-2" data-testid={`submission-row-${sub.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{sub.studentDisplayName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                    <Badge variant={isPushed ? "default" : sub.status === "ai_evaluated" ? "secondary" : "outline"} className="text-[10px] mt-1">
                      {isPushed ? "Pushed to Student" : sub.status === "ai_evaluated" ? "AI Evaluated" : "Submitted"}
                    </Badge>
                    {sub.content && (
                      <div className="mt-2 p-2 bg-background rounded border border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Student Response</p>
                        <p className="text-xs whitespace-pre-wrap text-foreground/80 max-h-32 overflow-y-auto">{sub.content}</p>
                      </div>
                    )}
                  </div>
                  {sub.evaluation && (
                    <div className="text-right shrink-0">
                      {grade && <p className={`text-xl font-bold ${grade.color}`}>{grade.letter}</p>}
                      <p className="text-xs text-muted-foreground">{sub.evaluation.overallScore}/{assignment.totalPoints}</p>
                    </div>
                  )}
                </div>
                {sub.evaluation && (
                  <div className="text-xs text-muted-foreground border-t border-border pt-2 space-y-1">
                    <p className="italic">{sub.evaluation.overallFeedback}</p>
                    {sub.evaluation.criteriaScores?.map((cs, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="font-medium shrink-0">{cs.criterionName}:</span>
                        <span className="flex-1">{cs.feedback}</span>
                        <span className="shrink-0 font-medium">{cs.score}/{cs.maxPoints}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  {sub.evaluation && !isPushed && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => pushMutation.mutate(sub.id)}
                      disabled={pushMutation.isPending}
                      data-testid={`button-push-${sub.id}`}
                    >
                      <Send className="h-3 w-3" /> Push to Student
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleReevaluate(sub.id)}
                    disabled={reevaluatingId === sub.id}
                    data-testid={`button-reevaluate-${sub.id}`}
                  >
                    {reevaluatingId === sub.id
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Re-evaluating…</>
                      : <><RotateCcw className="h-3 w-3" /> Re-evaluate</>
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function AssignmentsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generator form state
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [generated, setGenerated] = useState<GeneratedAssignment | null>(null);
  const [editedCriteria, setEditedCriteria] = useState<Criterion[]>([]);
  const [generatedMeta, setGeneratedMeta] = useState<{ topic: string; subject: string; gradeLevel: string; assignmentType: string; additionalInstructions: string; selectedClassId: string } | null>(null);

  // List state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [submissionsId, setSubmissionsId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [listClassFilter, setListClassFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/rubrics", listClassFilter || null],
    queryFn: async () => {
      const url = listClassFilter && listClassFilter !== "all"
        ? `/api/rubrics?classId=${listClassFilter}`
        : "/api/rubrics";
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const trimmedTopic = topic.trim();
      if (!trimmedTopic) throw new Error("Please enter an assignment topic");
      if (!/[a-zA-Z]/.test(trimmedTopic)) throw new Error("Topic must contain at least one letter");
      const res = await apiRequest("POST", "/api/generate-assignment", { topic: trimmedTopic, subject, gradeLevel, assignmentType, additionalInstructions });
      return res.json();
    },
    onSuccess: (data: GeneratedAssignment) => {
      setGenerated(data);
      setEditedCriteria(data.criteria);
      setGeneratedMeta({ topic: topic.trim(), subject, gradeLevel, assignmentType, additionalInstructions, selectedClassId });
    },
    onError: (e: any) => toast({ title: e.message || "Generation failed", description: e.message ? undefined : "Please try again.", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generated || !generatedMeta) return;
      const res = await apiRequest("POST", "/api/rubrics", {
        name: generated.title,
        subject: generatedMeta.subject,
        criteria: editedCriteria,
        gradeLevel: generatedMeta.gradeLevel,
        assignmentType: generatedMeta.assignmentType,
        studentInstructions: generated.studentInstructions,
        estimatedTime: generated.estimatedTime,
        description: generatedMeta.topic,
        classId: generatedMeta.selectedClassId && generatedMeta.selectedClassId !== "all" ? generatedMeta.selectedClassId : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment saved!", description: "It now appears in your saved list below.", variant: "success" });
      setGenerated(null); setGeneratedMeta(null); setTopic(""); setSubject(""); setGradeLevel(""); setAssignmentType(""); setAdditionalInstructions(""); setEditedCriteria([]);
    },
    onError: () => toast({ title: "Save failed", description: "Please try again.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/rubrics/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] }); toast({ title: "Assignment deleted" }); },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/rubrics/${id}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment published!", description: "Students in the class can now see and submit it.", variant: "success" });
    },
    onError: (err: any) => toast({ title: "Failed to publish", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  const handleCopy = (a: Assignment) => {
    const text = [
      `ASSIGNMENT: ${a.name}`,
      a.gradeLevel ? `Grade Level: ${a.gradeLevel}` : "",
      a.assignmentType ? `Type: ${a.assignmentType}` : "",
      a.estimatedTime ? `Estimated Time: ${a.estimatedTime}` : "",
      "", "STUDENT INSTRUCTIONS:", a.studentInstructions || "",
      "", "GRADING RUBRIC:",
      ...a.criteria.map((c, i) => `${i + 1}. ${c.name} (${c.maxPoints} pts): ${c.description}`),
      "", `Total Points: ${a.totalPoints}`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedId(a.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const totalPts = editedCriteria.reduce((s, c) => s + c.maxPoints, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assignment Generator</h2>
        <p className="text-muted-foreground mt-1">
          Create AI-generated assignments with student instructions and grading rubrics, then grade your students instantly.
        </p>
      </div>

      {/* ── Generator Form ── */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> Generate New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Assignment Topic / Description</Label>
            <Textarea
              data-testid="input-assignment-topic"
              placeholder="e.g. The causes and effects of World War I, Photosynthesis lab experiment, Analyzing a Shakespeare sonnet…"
              value={topic} onChange={(e) => setTopic(e.target.value)}
              rows={3} className="resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger data-testid="select-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger data-testid="select-grade-level"><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>{GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <Select value={assignmentType} onValueChange={setAssignmentType}>
                <SelectTrigger data-testid="select-assignment-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{ASSIGNMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Additional Requirements (optional)</Label>
              <Input
                data-testid="input-additional-instructions"
                placeholder="e.g. Must include citations, minimum 500 words…"
                value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to Class (optional)</Label>
              <ClassSelector
                value={selectedClassId}
                onChange={setSelectedClassId}
                placeholder="No class — save globally"
                showAll={false}
              />
            </div>
          </div>
          <Button
            data-testid="button-generate-assignment"
            onClick={() => generateMutation.mutate()}
            disabled={!topic.trim() || !subject || !gradeLevel || !assignmentType || generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Assignment…</>
              : <><Sparkles className="h-4 w-4 mr-2" /> Generate Assignment</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── Generated Preview ── */}
      {generated && (
        <Card className="border-2 border-primary/40 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{generated.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{generatedMeta?.subject ?? subject}</Badge>
                  <Badge variant="outline">{generatedMeta?.gradeLevel ?? gradeLevel}</Badge>
                  <Badge variant="outline">{generatedMeta?.assignmentType ?? assignmentType}</Badge>
                  {generated.estimatedTime && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{generated.estimatedTime}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setGenerated(null)}>Discard</Button>
                <Button data-testid="button-save-assignment" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-1" />Save Assignment</>}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Student Instructions */}
            <div>
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Student Instructions
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {generated.studentInstructions}
              </div>
            </div>
            {/* Rubric */}
            <div>
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Grading Rubric
                <span className={`ml-auto text-xs font-medium ${totalPts !== 100 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {totalPts} / 100 pts
                </span>
              </h4>
              <div className="space-y-2">
                {editedCriteria.map((c, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input value={c.name} onChange={(e) => { const u=[...editedCriteria]; u[i]={...u[i],name:e.target.value}; setEditedCriteria(u); }} className="h-7 text-sm font-medium bg-background" data-testid={`input-criterion-name-${i}`} />
                      <Input value={c.description} onChange={(e) => { const u=[...editedCriteria]; u[i]={...u[i],description:e.target.value}; setEditedCriteria(u); }} className="h-7 text-xs text-muted-foreground bg-background" data-testid={`input-criterion-desc-${i}`} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input type="number" value={c.maxPoints} onChange={(e) => { const u=[...editedCriteria]; u[i]={...u[i],maxPoints:parseInt(e.target.value)||0}; setEditedCriteria(u); }} className="w-16 h-7 text-sm text-center bg-background" data-testid={`input-criterion-points-${i}`} />
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Saved Assignments ── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Saved Assignments
            {assignments.length > 0 && <Badge variant="secondary" className="ml-1">{assignments.length}</Badge>}
          </h3>
          <div className="w-56 shrink-0">
            <ClassSelector
              selectedClassId={listClassFilter}
              onClassChange={setListClassFilter}
              showAllOption
              placeholder="Filter by class"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No assignments yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Generate your first assignment above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <Card key={a.id} className="border border-border bg-card" data-testid={`card-assignment-${a.id}`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{a.name}</h4>
                        {a.assignmentType && <Badge variant="secondary" className="text-xs">{a.assignmentType}</Badge>}
                        {a.status === "published" && (
                          <Badge className="text-xs bg-green-500 text-white border-0 gap-1 flex items-center" data-testid={`badge-published-${a.id}`}>
                            <Globe className="h-2.5 w-2.5" /> Published
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{a.subject}</span>
                        {a.gradeLevel && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{a.gradeLevel}</span>}
                        {a.estimatedTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.estimatedTime}</span>}
                        <span>{a.totalPoints} pts · {a.criteria.length} criteria</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      {/* Publish button — only for class-assigned, unpublished */}
                      {a.status !== "published" && a.classId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                          onClick={() => publishMutation.mutate(a.id)}
                          disabled={publishMutation.isPending}
                          data-testid={`button-publish-${a.id}`}
                        >
                          {publishMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                          Publish to Class
                        </Button>
                      )}
                      {/* Submissions button — only if published */}
                      {a.status === "published" && (
                        <Button
                          variant={submissionsId === a.id ? "default" : "outline"}
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => {
                            setSubmissionsId(submissionsId === a.id ? null : a.id);
                            setGradingId(null);
                            setExpandedId(null);
                          }}
                          data-testid={`button-submissions-${a.id}`}
                        >
                          <Users className="h-3.5 w-3.5" /> Submissions
                        </Button>
                      )}
                      {/* Grade Students button */}
                      <Button
                        variant={gradingId === a.id ? "default" : "outline"}
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => {
                          setGradingId(gradingId === a.id ? null : a.id);
                          setExpandedId(null);
                          setSubmissionsId(null);
                        }}
                        data-testid={`button-grade-students-${a.id}`}
                      >
                        <Award className="h-3.5 w-3.5" /> Grade
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(a)} title="Copy" data-testid={`button-copy-assignment-${a.id}`}>
                        {copiedId === a.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setExpandedId(expandedId === a.id ? null : a.id); setGradingId(null); setSubmissionsId(null); }} data-testid={`button-expand-assignment-${a.id}`}>
                        {expandedId === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(a.id)} data-testid={`button-delete-assignment-${a.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Assignment details (expanded) */}
                  {expandedId === a.id && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {a.studentInstructions && (
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> Student Instructions
                          </h5>
                          <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {a.studentInstructions}
                          </div>
                        </div>
                      )}
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Grading Rubric
                        </h5>
                        <div className="space-y-2">
                          {a.criteria.map((c) => (
                            <div key={c.id} className="flex items-start gap-3 bg-muted/40 rounded-lg p-3" data-testid={`criterion-${c.id}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-xs">{c.maxPoints} pts</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submissions panel (published assignments) */}
                  {submissionsId === a.id && (
                    <SubmissionsPanel assignment={a} onClose={() => setSubmissionsId(null)} />
                  )}

                  {/* Grading panel */}
                  {gradingId === a.id && (
                    <GradingPanel assignment={a} onClose={() => setGradingId(null)} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This will permanently remove it along with all submissions and evaluations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
