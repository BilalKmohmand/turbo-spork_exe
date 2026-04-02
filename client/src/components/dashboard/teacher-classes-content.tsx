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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, Copy, Check, Users, BookOpen, GraduationCap,
  Loader2, UserPlus, Globe, Lock,
} from "lucide-react";

const SUBJECTS = ["Mathematics","English / Literature","Science","History","Geography",
  "Physics","Chemistry","Biology","Computer Science","Art","Music","Economics","Psychology","Other"];
const GRADE_LEVELS = ["K - Grade 2","Grade 3 - 5","Grade 6 - 8","Grade 9 - 10","Grade 11 - 12","College / University"];

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string | null;
  classCode: string;
  studentCount: number;
  createdAt: string;
  isPublic?: boolean;
  description?: string | null;
}

interface StudentItem {
  id: string;
  displayName: string;
  email: string;
  joinedAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function TeacherClassesContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate]   = useState(false);
  const [newName, setNewName]         = useState("");
  const [newSubject, setNewSubject]   = useState("");
  const [newGrade, setNewGrade]       = useState("");
  const [copiedCode, setCopiedCode]   = useState<string | null>(null);
  const [rosterClassId, setRosterClassId] = useState<string | null>(null);

  const { data: classList = [], isLoading } = useQuery<ClassItem[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: rosterStudents = [], isLoading: rosterLoading } = useQuery<StudentItem[]>({
    queryKey: ["/api/teacher/classes", rosterClassId, "students"],
    queryFn: async () => {
      if (!rosterClassId) return [];
      const res = await apiRequest("GET", `/api/teacher/classes/${rosterClassId}/students`);
      return res.json();
    },
    enabled: !!rosterClassId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Class name is required");
      const res = await apiRequest("POST", "/api/teacher/classes", {
        name: newName.trim(),
        subject: newSubject || "General",
        gradeLevel: newGrade || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      setShowCreate(false);
      setNewName(""); setNewSubject(""); setNewGrade("");
      toast({ title: "Class created!", variant: "success" });
    },
    onError: (e: any) => toast({ title: "Failed to create class", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/teacher/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      toast({ title: "Class deleted" });
    },
    onError: () => toast({ title: "Failed to delete class", variant: "destructive" }),
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await apiRequest("PATCH", `/api/teacher/classes/${id}`, { isPublic });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/classes"] });
      toast({ title: vars.isPublic ? "Class is now publicly discoverable" : "Class is now private" });
    },
    onError: () => toast({ title: "Failed to update class", variant: "destructive" }),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Class code copied!" });
  };

  const rosterClass = classList.find(c => c.id === rosterClassId);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">My Classes</h2>
          <p className="text-sm text-[#999990] mt-1">Create classes and share the code with students to join</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-black dark:bg-white text-white dark:text-black"
          data-testid="button-create-class"
        >
          <Plus className="w-4 h-4 mr-2" /> New Class
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#999990]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading classes…
        </div>
      ) : classList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[#999990]" />
          </div>
          <p className="font-semibold text-[#111110] dark:text-[#F9F9F8] text-lg">No classes yet</p>
          <p className="text-sm text-[#999990] mt-1 mb-6">Create your first class and invite students with a code</p>
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-black dark:bg-white text-white dark:text-black"
          >
            <Plus className="w-4 h-4 mr-2" /> Create First Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classList.map(cls => (
            <Card
              key={cls.id}
              data-testid={`card-class-${cls.id}`}
              className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px] overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#111110] dark:text-[#F9F9F8] truncate">{cls.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge className="text-xs bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0">
                        <BookOpen className="w-3 h-3 mr-1" />{cls.subject}
                      </Badge>
                      {cls.gradeLevel && (
                        <Badge className="text-xs bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0">
                          <GraduationCap className="w-3 h-3 mr-1" />{cls.gradeLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(cls.id)}
                    className="text-[#CCCCCC] hover:text-red-500 transition-colors p-1 shrink-0"
                    title="Delete class"
                    data-testid={`button-delete-class-${cls.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Class Code */}
                <div className="bg-[#F9F9F8] dark:bg-[#111110] rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999990] mb-1.5">Class Code</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-black tracking-[0.15em] text-[#111110] dark:text-[#F9F9F8] font-mono">
                      {cls.classCode}
                    </span>
                    <button
                      onClick={() => copyCode(cls.classCode)}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-[#666660] hover:text-[#111110] dark:hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#E8E8E4] dark:hover:bg-[#22221F]"
                      data-testid={`button-copy-code-${cls.id}`}
                    >
                      {copiedCode === cls.classCode
                        ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy</>
                      }
                    </button>
                  </div>
                </div>

                {/* Discoverable toggle */}
                <div className="flex items-center justify-between bg-[#F9F9F8] dark:bg-[#111110] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {cls.isPublic
                      ? <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      : <Lock className="w-3.5 h-3.5 text-[#999990]" />
                    }
                    <span className="text-[12px] font-medium text-[#666660]">
                      {cls.isPublic ? "Students can discover & enroll" : "Private — code required"}
                    </span>
                  </div>
                  <Switch
                    checked={!!cls.isPublic}
                    onCheckedChange={val => togglePublicMutation.mutate({ id: cls.id, isPublic: val })}
                    data-testid={`switch-public-${cls.id}`}
                  />
                </div>

                {/* Stats & Roster */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-[#666660]">
                    <Users className="w-4 h-4" />
                    <span>{cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}</span>
                  </div>
                  <button
                    onClick={() => setRosterClassId(cls.id)}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-[#666660] hover:text-[#111110] dark:hover:text-white transition-colors"
                    data-testid={`button-view-roster-${cls.id}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> View Roster
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl border border-[#E5E5E0] dark:border-[#22221F]">
          <DialogHeader>
            <DialogTitle>Create a New Class</DialogTitle>
            <DialogDescription>Students will use the class code to join.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Class Name</Label>
              <Input
                data-testid="input-class-name"
                placeholder="e.g. Period 3 — Algebra II"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createMutation.mutate()}
                className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={newSubject} onValueChange={setNewSubject}>
                  <SelectTrigger className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Select value={newGrade} onValueChange={setNewGrade}>
                  <SelectTrigger className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-black"
              data-testid="button-confirm-create-class"
            >
              {createMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                : <><Plus className="w-4 h-4 mr-2" /> Create Class</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog open={!!rosterClassId} onOpenChange={open => !open && setRosterClassId(null)}>
        <DialogContent className="max-w-md rounded-2xl border border-[#E5E5E0] dark:border-[#22221F]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{rosterClass?.name || "Class Roster"}</DialogTitle>
            </div>
            <DialogDescription>
              {rosterClass?.studentCount ?? 0} student{(rosterClass?.studentCount ?? 0) !== 1 ? "s" : ""} enrolled · Code: <span className="font-mono font-bold text-[#111110] dark:text-white">{rosterClass?.classCode}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 max-h-80 overflow-y-auto space-y-2">
            {rosterLoading ? (
              <div className="flex items-center justify-center py-10 text-[#999990]">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
              </div>
            ) : rosterStudents.length === 0 ? (
              <div className="text-center py-10 text-[#999990]">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No students yet</p>
                <p className="text-xs mt-1">Share the class code: <span className="font-mono font-bold">{rosterClass?.classCode}</span></p>
              </div>
            ) : (
              rosterStudents.map((student, i) => (
                <div
                  key={student.id}
                  data-testid={`row-student-${i}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F9F9F8] dark:bg-[#111110]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#111110] dark:bg-white flex items-center justify-center shrink-0">
                    <span className="text-white dark:text-black text-[11px] font-bold">
                      {student.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111110] dark:text-[#F9F9F8] truncate">{student.displayName}</p>
                    <p className="text-[11px] text-[#999990] truncate">{student.email}</p>
                  </div>
                  <span className="text-[11px] text-[#999990] shrink-0">{timeAgo(student.joinedAt)}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
