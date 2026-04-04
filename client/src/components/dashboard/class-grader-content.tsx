import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ClassSelector from "./class-selector";
import {
  Plus, Trash2, Users, Zap, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, AlertCircle, DownloadIcon, RefreshCw,
} from "lucide-react";

interface ClassStudent {
  id: string;
  displayName: string;
  email: string;
}

interface StudentEntry {
  id: string;
  name: string;
  content: string;
}

interface CriteriaScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface GradeResult {
  submissionId?: string;
  studentName?: string;
  overallScore: number;
  overallFeedback: string;
  criteriaScores: CriteriaScore[];
  error?: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

interface Rubric {
  id: string;
  name: string;
  subject: string;
  totalPoints: number;
  createdAt: string;
  criteria: RubricCriterion[];
}

function letterGrade(score: number, total: number) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

function gradeColor(letter: string) {
  if (letter === "A") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (letter === "B") return "text-blue-600 bg-blue-50 border-blue-200";
  if (letter === "C") return "text-amber-600 bg-amber-50 border-amber-200";
  if (letter === "D") return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

let idCounter = 0;
function makeId() { return `student-${++idCounter}-${Date.now()}`; }

export default function ClassGraderContent() {
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [rubricId, setRubricId]   = useState("");
  const [students, setStudents]   = useState<StudentEntry[]>([{ id: makeId(), name: "", content: "" }]);
  const [results, setResults]     = useState<GradeResult[] | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [step, setStep]           = useState<"setup" | "results">("setup");

  const { data: rubrics = [] } = useQuery<Rubric[]>({
    queryKey: ["/api/rubrics", selectedClassId || null],
    queryFn: async () => {
      const url = selectedClassId && selectedClassId !== "all"
        ? `/api/rubrics?classId=${selectedClassId}`
        : "/api/rubrics";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const { data: classStudents = [], isLoading: studentsLoading } = useQuery<ClassStudent[]>({
    queryKey: ["/api/teacher/classes", selectedClassId, "students"],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const res = await apiRequest("GET", `/api/teacher/classes/${selectedClassId}/students`);
      return res.json();
    },
    enabled: !!selectedClassId,
  });

  const selectedRubric = rubrics.find(r => r.id === rubricId);

  function loadRosterStudents() {
    if (!classStudents.length) {
      toast({ title: "No students in this class yet", variant: "destructive" });
      return;
    }
    setStudents(classStudents.map(s => ({ id: makeId(), name: s.displayName, content: "" })));
    toast({ title: `Loaded ${classStudents.length} student${classStudents.length !== 1 ? "s" : ""} from class roster` });
  }

  function addStudent() {
    setStudents(prev => [...prev, { id: makeId(), name: "", content: "" }]);
  }

  function removeStudent(id: string) {
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  function updateStudent(id: string, field: "name" | "content", value: string) {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const valid = students.filter(s => s.name.trim() && s.content.trim());
      if (!rubricId) throw new Error("Please select an assignment");
      if (valid.length === 0) throw new Error("Please add at least one student with content");

      const submissionIds: string[] = [];
      for (const s of valid) {
        const subRes = await apiRequest("POST", "/api/rubric-submissions", {
          rubricId,
          studentName: s.name.trim(),
          title: s.name.trim() + "'s Submission",
          content: s.content.trim(),
        });
        const sub = await subRes.json();
        submissionIds.push(sub.id);
      }

      const batchResponse = await apiRequest("POST", "/api/rubric-evaluate-batch", { submissionIds });
      const batchRes = await batchResponse.json();

      const enriched = batchRes.results.map((r: any, i: number) => ({
        ...r,
        studentName: valid[i]?.name || r.studentName || "Student",
      }));
      return enriched;
    },
    onSuccess: (data) => {
      setResults(data);
      setStep("results");
    },
    onError: (e: any) => toast({ title: "Grading failed", description: e.message, variant: "destructive" }),
  });

  function exportCSV() {
    if (!results || !selectedRubric) return;
    const titleRow = `"Assignment: ${selectedRubric.name}"`;
    const header = ["Student", "Score", "Total", "%", "Grade", "Feedback",
      ...(results[0]?.criteriaScores?.map(c => c.criterionName) ?? [])].join(",");
    const rows = results.map(r => {
      const pct = selectedRubric.totalPoints > 0 ? Math.round((r.overallScore / selectedRubric.totalPoints) * 100) : 0;
      const grade = letterGrade(r.overallScore, selectedRubric.totalPoints);
      const criteriaVals = r.criteriaScores?.map(c => c.score) ?? [];
      return [
        `"${r.studentName}"`, r.overallScore, selectedRubric.totalPoints, `${pct}%`, grade,
        `"${(r.overallFeedback ?? "").split('"').join("'")}"`, ...criteriaVals,
      ].join(",");
    });
    const csv = [titleRow, header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = selectedRubric.name.split(/\s+/).join("_");
    a.download = safeName + "_grades.csv";
    a.click();
  }

  if (step === "results" && results) {
    const avg = results.length > 0
      ? Math.round(results.reduce((s, r) => s + (r.overallScore || 0), 0) / results.length)
      : 0;
    const total = selectedRubric?.totalPoints ?? 100;
    const avgPct = Math.round((avg / total) * 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Grading Results</h2>
            <p className="text-sm text-[#999990] mt-1">{selectedRubric?.name} · {results.length} students graded</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportCSV}
              data-testid="button-export-csv"
              className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
            >
              <DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button
              onClick={() => { setStep("setup"); setResults(null); setStudents([{ id: makeId(), name: "", content: "" }]); setRubricId(""); setSelectedClassId(""); }}
              data-testid="button-grade-again"
              className="rounded-xl bg-black dark:bg-white text-white dark:text-black"
            >
              Grade Another Class
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-[#111110] dark:text-[#F9F9F8]">{avgPct}%</p>
              <p className="text-xs text-[#999990] mt-1">Class Average</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {results.filter(r => letterGrade(r.overallScore, total) === "A").length}
              </p>
              <p className="text-xs text-[#999990] mt-1">A Grades</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-red-500">
                {results.filter(r => letterGrade(r.overallScore, total) === "F").length}
              </p>
              <p className="text-xs text-[#999990] mt-1">Needs Support</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {results.map((r, i) => {
            const pct = Math.round((r.overallScore / total) * 100);
            const grade = letterGrade(r.overallScore, total);
            const isOpen = expandedResult === i;
            return (
              <Card
                key={i}
                data-testid={`card-result-${i}`}
                className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px] overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#F9F9F8] dark:hover:bg-[#111110] transition-colors"
                  onClick={() => setExpandedResult(isOpen ? null : i)}
                >
                  <span className={`text-sm font-bold w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${gradeColor(grade)}`}>
                    {grade}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111110] dark:text-[#F9F9F8]">{r.studentName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-[#999990] shrink-0">{r.overallScore}/{total} pts</span>
                    </div>
                  </div>
                  {r.error ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> : null}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#999990] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999990] shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-[#E5E5E0] dark:border-[#22221F] p-4 space-y-3">
                    {r.error ? (
                      <p className="text-sm text-red-500">{r.error}</p>
                    ) : (
                      <>
                        <p className="text-sm text-[#666660] italic">"{r.overallFeedback}"</p>
                        <div className="space-y-2">
                          {r.criteriaScores?.map((c, ci) => (
                            <div key={ci} className="bg-[#F9F9F8] dark:bg-[#111110] rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-[#111110] dark:text-[#F9F9F8]">{c.criterionName}</span>
                                <span className="text-xs text-[#999990]">{c.score}/{c.maxPoints}</span>
                              </div>
                              <Progress value={(c.score / c.maxPoints) * 100} className="h-1 mb-1.5" />
                              <p className="text-xs text-[#666660]">{c.feedback}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Class Grader</h2>
        <p className="text-sm text-[#999990] mt-1">AI grades your entire class against a rubric in seconds</p>
      </div>

      <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
        <CardContent className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Class <span className="text-[#999990] text-xs">(optional — filter assignments)</span></Label>
              <ClassSelector
                value={selectedClassId}
                onChange={(id) => { setSelectedClassId(id); setRubricId(""); }}
                placeholder="All classes"
                showAll
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assignment / Rubric</Label>
              {rubrics.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  No assignments found. Create one in the Assignments tab first.
                </p>
              ) : (
                <Select value={rubricId} onValueChange={setRubricId}>
                  <SelectTrigger data-testid="select-rubric" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                    <SelectValue placeholder="Select an assignment…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rubrics.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} — {r.subject} ({r.totalPoints} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {selectedRubric && (
            <div className="flex flex-wrap gap-2">
              {selectedRubric.criteria.map(c => (
                <Badge key={c.id} className="text-xs bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0">
                  {c.name} ({c.maxPoints}pts)
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Students ({students.length})</Label>
          <div className="flex gap-2">
            {selectedClassId && selectedClassId !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadRosterStudents}
                disabled={studentsLoading}
                data-testid="button-load-roster"
                className="rounded-xl border-[#E5E5E0] dark:border-[#22221F] text-[13px]"
              >
                {studentsLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Load from Roster
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={addStudent}
              data-testid="button-add-student"
              className="rounded-xl border-dashed border-[#C0C0BB]"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Student
            </Button>
          </div>
        </div>

        {students.map((s, i) => (
          <Card key={s.id} className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center text-xs font-bold text-[#666660] shrink-0">
                  {i + 1}
                </div>
                <Input
                  data-testid={`input-student-name-${i}`}
                  placeholder="Student name"
                  value={s.name}
                  onChange={e => updateStudent(s.id, "name", e.target.value)}
                  className="flex-1 rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
                />
                {students.length > 1 && (
                  <button
                    data-testid={`button-remove-student-${i}`}
                    onClick={() => removeStudent(s.id)}
                    className="text-[#C0C0BB] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Textarea
                data-testid={`textarea-student-content-${i}`}
                placeholder="Paste student's essay or work here…"
                value={s.content}
                onChange={e => updateStudent(s.id, "content", e.target.value)}
                className="min-h-[100px] rounded-xl border-[#E5E5E0] dark:border-[#22221F] text-sm resize-none"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => gradeMutation.mutate()}
        disabled={gradeMutation.isPending || !rubricId || students.every(s => !s.name.trim() || !s.content.trim()) || students.some(s => s.name.trim() && !s.content.trim())}
        data-testid="button-grade-all"
        className="w-full h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black text-base font-semibold"
      >
        {gradeMutation.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Grading {students.filter(s => s.name.trim() && s.content.trim()).length} students…</>
          : <><Zap className="w-4 h-4 mr-2" /> Grade All Students</>
        }
      </Button>
    </div>
  );
}
