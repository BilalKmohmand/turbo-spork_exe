import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, BookOpen, ChevronDown, ChevronUp,
  ClipboardList, Loader2, X, GripVertical,
} from "lucide-react";

interface Criterion {
  name: string;
  description: string;
  maxPoints: number;
}

interface RubricCriterion {
  id: string;
  rubricId: string;
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

const SUBJECTS = [
  "Mathematics", "English / Literature", "Science", "History",
  "Geography", "Physics", "Chemistry", "Biology", "Computer Science",
  "Art", "Music", "Physical Education", "Economics", "Psychology", "Other",
];

export default function AssignmentsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: "Content & Accuracy", description: "Accuracy and relevance of ideas", maxPoints: 25 },
    { name: "Organization", description: "Clear structure and logical flow", maxPoints: 25 },
    { name: "Writing Quality", description: "Grammar, spelling, and style", maxPoints: 25 },
    { name: "Critical Thinking", description: "Analysis, insight and argumentation", maxPoints: 25 },
  ]);

  const { data: rubrics = [], isLoading } = useQuery<Rubric[]>({
    queryKey: ["/api/rubrics"],
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/rubrics", { name, subject, criteria }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment created!" });
      setShowForm(false);
      setName("");
      setSubject("");
      setCriteria([
        { name: "Content & Accuracy", description: "Accuracy and relevance of ideas", maxPoints: 25 },
        { name: "Organization", description: "Clear structure and logical flow", maxPoints: 25 },
        { name: "Writing Quality", description: "Grammar, spelling, and style", maxPoints: 25 },
        { name: "Critical Thinking", description: "Analysis, insight and argumentation", maxPoints: 25 },
      ]);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/rubrics/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment deleted" });
    },
  });

  function addCriterion() {
    setCriteria(prev => [...prev, { name: "", description: "", maxPoints: 10 }]);
  }

  function removeCriterion(i: number) {
    setCriteria(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateCriterion(i: number, field: keyof Criterion, value: string | number) {
    setCriteria(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  const totalPoints = criteria.reduce((s, c) => s + (Number(c.maxPoints) || 0), 0);

  function letterGrade(pct: number) {
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Assignments</h2>
          <p className="text-sm text-[#999990] mt-1">Create grading rubrics for your class assignments</p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          data-testid="button-new-assignment"
          className="h-10 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Cancel" : "New Assignment"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-[#111110] dark:text-[#F9F9F8]">Create Assignment / Rubric</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assign-name">Assignment Title</Label>
                <Input
                  id="assign-name"
                  data-testid="input-assignment-name"
                  placeholder="e.g. Persuasive Essay — Unit 3"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger data-testid="select-subject" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                    <SelectValue placeholder="Select subject…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Grading Criteria</Label>
                <span className="text-xs text-[#999990]">Total: <strong>{totalPoints} pts</strong></span>
              </div>

              {criteria.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-[#F9F9F8] dark:bg-[#111110] rounded-xl p-3">
                  <div className="col-span-1 flex items-center justify-center pt-2">
                    <GripVertical className="w-4 h-4 text-[#C0C0BB]" />
                  </div>
                  <div className="col-span-4">
                    <Input
                      data-testid={`input-criterion-name-${i}`}
                      placeholder="Criterion name"
                      value={c.name}
                      onChange={e => updateCriterion(i, "name", e.target.value)}
                      className="rounded-lg border-[#E5E5E0] dark:border-[#22221F] text-sm"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      data-testid={`input-criterion-desc-${i}`}
                      placeholder="Description / expectations"
                      value={c.description}
                      onChange={e => updateCriterion(i, "description", e.target.value)}
                      className="rounded-lg border-[#E5E5E0] dark:border-[#22221F] text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      data-testid={`input-criterion-pts-${i}`}
                      type="number"
                      min={1}
                      max={100}
                      value={c.maxPoints}
                      onChange={e => updateCriterion(i, "maxPoints", parseInt(e.target.value) || 0)}
                      className="rounded-lg border-[#E5E5E0] dark:border-[#22221F] text-sm text-center"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-2">
                    <button
                      data-testid={`button-remove-criterion-${i}`}
                      onClick={() => removeCriterion(i)}
                      className="text-[#C0C0BB] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addCriterion}
                data-testid="button-add-criterion"
                className="rounded-xl border-dashed border-[#C0C0BB] text-[#666660]"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Criterion
              </Button>
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !name.trim() || !subject || criteria.length === 0}
              data-testid="button-create-assignment"
              className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardList className="w-4 h-4 mr-2" />}
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#999990]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading assignments…
        </div>
      ) : rubrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[#999990]" />
          </div>
          <p className="font-medium text-[#111110] dark:text-[#F9F9F8]">No assignments yet</p>
          <p className="text-sm text-[#999990] mt-1">Create your first assignment rubric above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rubrics.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <Card
                key={r.id}
                data-testid={`card-assignment-${r.id}`}
                className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px] overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#F9F9F8] dark:hover:bg-[#111110] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  data-testid={`button-expand-assignment-${r.id}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-[#666660]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111110] dark:text-[#F9F9F8] truncate">{r.name}</p>
                    <p className="text-xs text-[#999990] mt-0.5">
                      {r.subject} · {r.criteria?.length ?? 0} criteria · {r.totalPoints} pts total
                    </p>
                  </div>
                  <Badge className="text-[11px] shrink-0 border-[#E5E5E0] dark:border-[#22221F] bg-transparent text-[#666660]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Badge>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#999990] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#999990] shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-[#E5E5E0] dark:border-[#22221F] px-5 pb-5 pt-4 space-y-3">
                    <div className="grid gap-2">
                      {r.criteria?.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 bg-[#F9F9F8] dark:bg-[#111110] rounded-xl p-3">
                          <div className="w-7 h-7 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                            {c.maxPoints}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111110] dark:text-[#F9F9F8]">{c.name}</p>
                            <p className="text-xs text-[#999990] mt-0.5">{c.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-assignment-${r.id}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
