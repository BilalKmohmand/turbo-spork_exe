import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import ClassSelector from "./class-selector";
import { Loader2, Download, BookOpen, TrendingUp, Users, Award } from "lucide-react";

interface CriteriaScore {
  criterionName: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface GradeRow {
  id: string;
  studentName: string;
  submissionTitle: string;
  overallScore: number;
  overallFeedback: string;
  criteriaScores: CriteriaScore[];
  evaluatedAt: string;
  submittedAt: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
}

interface GradeBookData {
  history: GradeRow[];
  criteria: RubricCriterion[];
}

interface Rubric {
  id: string;
  name: string;
  subject: string;
  totalPoints: number;
  createdAt: string;
}

function letterGrade(score: number, total: number) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

function letterColor(g: string) {
  if (g === "A") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (g === "B") return "bg-blue-50 text-blue-700 border-blue-200";
  if (g === "C") return "bg-amber-50 text-amber-700 border-amber-200";
  if (g === "D") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function GradebookContent() {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rubricId, setRubricId] = useState("");

  const { data: rubrics = [] } = useQuery<Rubric[]>({
    queryKey: ["/api/rubrics", selectedClassId || undefined],
    queryFn: async () => {
      const url = selectedClassId && selectedClassId !== "all"
        ? `/api/rubrics?classId=${selectedClassId}`
        : "/api/rubrics";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const selectedRubric = rubrics.find(r => r.id === rubricId);

  const { data: gradeBook, isLoading } = useQuery<GradeBookData>({
    queryKey: ["/api/rubric-evaluations", rubricId],
    enabled: !!rubricId,
  });

  const rows = gradeBook?.history ?? [];
  const total = selectedRubric?.totalPoints ?? 100;

  const avgScore = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.overallScore, 0) / rows.length)
    : 0;
  const avgPct = total > 0 ? Math.round((avgScore / total) * 100) : 0;

  const highScore = rows.length > 0 ? Math.max(...rows.map(r => r.overallScore)) : 0;
  const lowScore = rows.length > 0 ? Math.min(...rows.map(r => r.overallScore)) : 0;

  const distrib = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  rows.forEach(r => { distrib[letterGrade(r.overallScore, total) as keyof typeof distrib]++; });

  function exportCSV() {
    if (!rows.length || !selectedRubric) return;
    const critNames = gradeBook?.criteria.map(c => c.name) ?? [];
    const header = ["Student", "Title", "Score", "Total", "%", "Grade", "Feedback", ...critNames, "Date"].join(",");
    const dataRows = rows.map(r => {
      const pct = Math.round((r.overallScore / total) * 100);
      const grade = letterGrade(r.overallScore, total);
      const critVals = critNames.map(name => {
        const cs = r.criteriaScores?.find(c => c.criterionName === name);
        return cs ? cs.score : "";
      });
      return [
        `"${r.studentName}"`,
        `"${r.submissionTitle}"`,
        r.overallScore,
        total,
        `${pct}%`,
        grade,
        `"${(r.overallFeedback ?? "").split('"').join("'")}"`,
        ...critVals,
        new Date(r.evaluatedAt).toLocaleDateString(),
      ].join(",");
    });
    const csv = [header, ...dataRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = selectedRubric.name.split(/\s+/).join("_");
    a.download = safeName + "_gradebook.csv";
    a.click();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Grade Book</h2>
          <p className="text-sm text-[#999990] mt-1">View and export student grades by assignment</p>
        </div>
        {rows.length > 0 && (
          <Button
            onClick={exportCSV}
            data-testid="button-export-gradebook"
            variant="outline"
            className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#111110] dark:text-[#F9F9F8]">Filter by Class</p>
          <ClassSelector
            value={selectedClassId}
            onChange={(id) => { setSelectedClassId(id); setRubricId(""); }}
            placeholder="All classes"
            showAll
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#111110] dark:text-[#F9F9F8]">Assignment</p>
          {rubrics.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                No assignments yet. Create one in the Assignments tab, then grade students using Class Grader.
              </p>
            ) : (
              <Select value={rubricId} onValueChange={setRubricId}>
                <SelectTrigger data-testid="select-gradebook-rubric" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                  <SelectValue placeholder="Select assignment to view grades…" />
                </SelectTrigger>
                <SelectContent>
                  {rubrics.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} — {r.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

      {rubricId && isLoading && (
        <div className="flex items-center justify-center py-20 text-[#999990]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading grades…
        </div>
      )}

      {rubricId && !isLoading && rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[#999990]" />
          </div>
          <p className="font-medium text-[#111110] dark:text-[#F9F9F8]">No grades yet for this assignment</p>
          <p className="text-sm text-[#999990] mt-1">Use Class Grader to grade your students</p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 text-[#999990] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">{avgPct}%</p>
                <p className="text-xs text-[#999990]">Class Average</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
              <CardContent className="p-4 text-center">
                <Users className="w-5 h-5 text-[#999990] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">{rows.length}</p>
                <p className="text-xs text-[#999990]">Students Graded</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
              <CardContent className="p-4 text-center">
                <Award className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{highScore}/{total}</p>
                <p className="text-xs text-[#999990]">Highest</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
              <CardContent className="p-4 text-center">
                <Award className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-500">{lowScore}/{total}</p>
                <p className="text-xs text-[#999990]">Lowest</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#999990] mb-4">Grade Distribution</p>
              <div className="space-y-2">
                {(["A", "B", "C", "D", "F"] as const).map(g => {
                  const count = distrib[g];
                  const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center border ${letterColor(g)}`}>{g}</span>
                      <Progress value={pct} className="flex-1 h-2" />
                      <span className="text-xs text-[#999990] w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-[20px] border border-[#E5E5E0] dark:border-[#22221F]">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F8] dark:bg-[#111110]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#999990]">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#999990]">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#999990]">%</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#999990]">Grade</th>
                  {gradeBook?.criteria.map(c => (
                    <th key={c.id} className="text-center px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#999990] max-w-[80px]">
                      <span className="line-clamp-2">{c.name}</span>
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#999990]">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = Math.round((r.overallScore / total) * 100);
                  const grade = letterGrade(r.overallScore, total);
                  return (
                    <tr
                      key={r.id}
                      data-testid={`row-grade-${i}`}
                      className="border-t border-[#E5E5E0] dark:border-[#22221F] hover:bg-[#F9F9F8] dark:hover:bg-[#111110] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#111110] dark:text-[#F9F9F8]">{r.studentName}</td>
                      <td className="px-4 py-3 text-center text-[#666660]">{r.overallScore}/{total}</td>
                      <td className="px-4 py-3 text-center text-[#666660]">{pct}%</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`text-xs border ${letterColor(grade)}`}>{grade}</Badge>
                      </td>
                      {gradeBook?.criteria.map(c => {
                        const cs = r.criteriaScores?.find(s => s.criterionName === c.name);
                        return (
                          <td key={c.id} className="px-3 py-3 text-center text-[#666660]">
                            {cs ? `${cs.score}/${cs.maxPoints}` : "—"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right text-[#999990] text-xs">
                        {new Date(r.evaluatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
