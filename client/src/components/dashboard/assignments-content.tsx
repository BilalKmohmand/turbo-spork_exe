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
  Sparkles, BookOpen, ChevronDown, ChevronUp,
  ClipboardList, Loader2, Trash2, Clock, Copy, Check,
  FileText, GraduationCap, Save,
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

interface Assignment {
  id: string;
  name: string;
  subject: string;
  totalPoints: number;
  description?: string | null;
  gradeLevel?: string | null;
  assignmentType?: string | null;
  studentInstructions?: string | null;
  estimatedTime?: string | null;
  createdAt: string;
  criteria: RubricCriterion[];
}

const SUBJECTS = [
  "Mathematics", "English / Literature", "Science", "History",
  "Geography", "Physics", "Chemistry", "Biology", "Computer Science",
  "Art", "Music", "Physical Education", "Economics", "Psychology", "Other",
];

const GRADE_LEVELS = [
  "K - Grade 2", "Grade 3 - 5", "Grade 6 - 8",
  "Grade 9 - 10", "Grade 11 - 12", "College / University",
];

const ASSIGNMENT_TYPES = [
  "Essay", "Research Paper", "Lab Report", "Short Answer",
  "Multiple Choice Quiz", "Creative Writing", "Math Problem Set",
  "Presentation", "Case Study", "Book Report", "Project", "Debate",
];

interface GeneratedAssignment {
  title: string;
  studentInstructions: string;
  estimatedTime: string;
  criteria: Criterion[];
}

export default function AssignmentsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const [generated, setGenerated] = useState<GeneratedAssignment | null>(null);
  const [editedCriteria, setEditedCriteria] = useState<Criterion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/rubrics"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generate-assignment", {
        topic, subject, gradeLevel, assignmentType, additionalInstructions,
      });
      return res.json();
    },
    onSuccess: (data: GeneratedAssignment) => {
      setGenerated(data);
      setEditedCriteria(data.criteria);
    },
    onError: () => {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generated) return;
      const res = await apiRequest("POST", "/api/rubrics", {
        name: generated.title,
        subject,
        criteria: editedCriteria,
        gradeLevel,
        assignmentType,
        studentInstructions: generated.studentInstructions,
        estimatedTime: generated.estimatedTime,
        description: topic,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment saved!", description: "It now appears in your saved list below." });
      setGenerated(null);
      setTopic("");
      setSubject("");
      setGradeLevel("");
      setAssignmentType("");
      setAdditionalInstructions("");
      setEditedCriteria([]);
    },
    onError: () => {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rubrics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rubrics"] });
      toast({ title: "Assignment deleted" });
    },
  });

  const handleCopyInstructions = (assignment: Assignment) => {
    const text = [
      `ASSIGNMENT: ${assignment.name}`,
      assignment.gradeLevel ? `Grade Level: ${assignment.gradeLevel}` : "",
      assignment.assignmentType ? `Type: ${assignment.assignmentType}` : "",
      assignment.estimatedTime ? `Estimated Time: ${assignment.estimatedTime}` : "",
      "",
      "STUDENT INSTRUCTIONS:",
      assignment.studentInstructions || "",
      "",
      "GRADING RUBRIC:",
      ...assignment.criteria.map((c, i) => `${i + 1}. ${c.name} (${c.maxPoints} pts): ${c.description}`),
      "",
      `Total Points: ${assignment.totalPoints}`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text);
    setCopiedId(assignment.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const totalEditedPoints = editedCriteria.reduce((s, c) => s + c.maxPoints, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assignment Generator</h2>
        <p className="text-muted-foreground mt-1">
          Describe your topic and let AI create a complete assignment with student instructions and a grading rubric.
        </p>
      </div>

      {/* Generator Form */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-input">Assignment Topic / Description</Label>
            <Textarea
              id="topic-input"
              data-testid="input-assignment-topic"
              placeholder="e.g. The causes and effects of World War I, Photosynthesis lab experiment, Analyzing a Shakespeare sonnet..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger data-testid="select-grade-level">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <Select value={assignmentType} onValueChange={setAssignmentType}>
                <SelectTrigger data-testid="select-assignment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-instructions">Additional Requirements (optional)</Label>
            <Input
              id="extra-instructions"
              data-testid="input-additional-instructions"
              placeholder="e.g. Must include citations, minimum 500 words, group project..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
            />
          </div>

          <Button
            data-testid="button-generate-assignment"
            onClick={() => generateMutation.mutate()}
            disabled={!topic || !subject || !gradeLevel || !assignmentType || generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Assignment…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Assignment</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Preview */}
      {generated && (
        <Card className="border-2 border-primary/40 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-foreground">{generated.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{subject}</Badge>
                  <Badge variant="outline">{gradeLevel}</Badge>
                  <Badge variant="outline">{assignmentType}</Badge>
                  {generated.estimatedTime && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {generated.estimatedTime}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGenerated(null)}
                >
                  Discard
                </Button>
                <Button
                  data-testid="button-save-assignment"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="h-4 w-4 mr-1" /> Save Assignment</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Student Instructions */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Student Instructions
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {generated.studentInstructions}
              </div>
            </div>

            {/* Rubric */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Grading Rubric
                <span className={`ml-auto text-xs font-medium ${totalEditedPoints !== 100 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {totalEditedPoints} / 100 pts
                </span>
              </h4>
              <div className="space-y-2">
                {editedCriteria.map((c, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...editedCriteria];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setEditedCriteria(updated);
                        }}
                        className="h-7 text-sm font-medium mb-1 bg-background"
                        data-testid={`input-criterion-name-${i}`}
                      />
                      <Input
                        value={c.description}
                        onChange={(e) => {
                          const updated = [...editedCriteria];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setEditedCriteria(updated);
                        }}
                        className="h-7 text-xs text-muted-foreground bg-background"
                        data-testid={`input-criterion-desc-${i}`}
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        value={c.maxPoints}
                        onChange={(e) => {
                          const updated = [...editedCriteria];
                          updated[i] = { ...updated[i], maxPoints: parseInt(e.target.value) || 0 };
                          setEditedCriteria(updated);
                        }}
                        className="w-16 h-7 text-sm text-center bg-background"
                        data-testid={`input-criterion-points-${i}`}
                      />
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Assignments List */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Saved Assignments
          {assignments.length > 0 && (
            <Badge variant="secondary" className="ml-1">{assignments.length}</Badge>
          )}
        </h3>

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
              <Card
                key={a.id}
                className="border border-border bg-card"
                data-testid={`card-assignment-${a.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{a.name}</h4>
                        {a.assignmentType && <Badge variant="secondary" className="text-xs">{a.assignmentType}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />{a.subject}
                        </span>
                        {a.gradeLevel && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />{a.gradeLevel}
                          </span>
                        )}
                        {a.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{a.estimatedTime}
                          </span>
                        )}
                        <span>{a.totalPoints} pts total</span>
                        <span>{a.criteria.length} criteria</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyInstructions(a)}
                        title="Copy full assignment"
                        data-testid={`button-copy-assignment-${a.id}`}
                      >
                        {copiedId === a.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        data-testid={`button-expand-assignment-${a.id}`}
                      >
                        {expandedId === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(a.id)}
                        data-testid={`button-delete-assignment-${a.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {/* Student Instructions */}
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

                      {/* Rubric Criteria */}
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Grading Rubric
                        </h5>
                        <div className="space-y-2">
                          {a.criteria.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-start gap-3 bg-muted/40 rounded-lg p-3"
                              data-testid={`criterion-${c.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{c.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {c.maxPoints} pts
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
