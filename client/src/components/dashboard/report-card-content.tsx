import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, RotateCcw, FileText } from "lucide-react";
import ClassSelector from "./class-selector";

interface ReportCardResult {
  comment: string;
  tone: string;
}

const SUBJECTS = [
  "Mathematics", "English / Literature", "Science", "History",
  "Geography", "Physics", "Chemistry", "Biology", "Computer Science",
  "Art", "Music", "Physical Education", "Economics", "General",
];

const GRADES = [
  { value: "A", label: "A — Excellent" },
  { value: "B", label: "B — Good" },
  { value: "C", label: "C — Satisfactory" },
  { value: "D", label: "D — Needs Improvement" },
  { value: "F", label: "F — Failing" },
];

const TONES = [
  { value: "encouraging", label: "Encouraging" },
  { value: "formal", label: "Formal" },
  { value: "constructive", label: "Constructive" },
  { value: "detailed", label: "Detailed" },
];

export default function ReportCardContent() {
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [tone, setTone] = useState("encouraging");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<ReportCardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/generate-report-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentName, subject, grade, tone, notes, ...(selectedClassId && selectedClassId !== "all" ? { classId: selectedClassId } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      return res.json() as Promise<ReportCardResult>;
    },
    onSuccess: (data) => setResult(data),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.comment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Report Card Comment</h2>
            <p className="text-sm text-[#999990] mt-1">
              {studentName} · {subject} · Grade {grade}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => { setResult(null); setStudentName(""); setSubject(""); setGrade(""); setTone("encouraging"); setNotes(""); }}
            data-testid="button-new-report"
            className="rounded-full h-10 px-4 hover:bg-[#F0F0ED]"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> New Comment
          </Button>
        </div>

        <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F0F0ED] dark:bg-[#1A1A17] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#666660]" />
              </div>
              <div>
                <p className="font-semibold text-[#111110] dark:text-[#F9F9F8]">{studentName}</p>
                <div className="flex gap-2 mt-1">
                  <Badge className="text-[11px] bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0">{subject}</Badge>
                  <Badge className="text-[11px] bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0">Grade {grade}</Badge>
                  <Badge className="text-[11px] bg-[#F0F0ED] dark:bg-[#1A1A17] text-[#666660] border-0 capitalize">{result.tone}</Badge>
                </div>
              </div>
            </div>

            <div className="bg-[#F9F9F8] dark:bg-[#111110] rounded-[16px] p-6">
              <p
                data-testid="text-report-comment"
                className="text-[16px] leading-[1.8] text-[#333330] dark:text-[#D0D0CC] whitespace-pre-wrap"
              >
                {result.comment}
              </p>
            </div>

            <Button
              onClick={handleCopy}
              data-testid="button-copy-comment"
              className="mt-5 w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Comment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">Report Card Writer</h2>
        <p className="text-sm text-[#999990] mt-1">
          AI generates professional, personalised report card comments in seconds
        </p>
      </div>

      <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[24px]">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Class (optional)</Label>
            <ClassSelector
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
              showAllOption
              placeholder="Select class (optional)"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rc-name">Student Name</Label>
              <Input
                id="rc-name"
                data-testid="input-student-name-rc"
                placeholder="e.g. Emma Johnson"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger data-testid="select-subject-rc" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                  <SelectValue placeholder="Select subject…" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Performance Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger data-testid="select-grade-rc" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                  <SelectValue placeholder="Select grade…" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Comment Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger data-testid="select-tone-rc" className="rounded-xl border-[#E5E5E0] dark:border-[#22221F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rc-notes">Additional Notes (optional)</Label>
            <Textarea
              id="rc-notes"
              data-testid="textarea-notes-rc"
              placeholder="e.g. Struggles with fractions but shows great effort. Participates actively in class. Improved significantly since last term."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[100px] rounded-xl border-[#E5E5E0] dark:border-[#22221F] resize-none"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !studentName.trim() || !subject || !grade}
            data-testid="button-generate-report"
            className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black"
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate Report Card Comment</>
            }
          </Button>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Time saved", value: "~5 min", sub: "per student" },
          { label: "Tone options", value: "4", sub: "formal to encouraging" },
          { label: "Subjects", value: "14+", sub: "all disciplines" },
        ].map(stat => (
          <Card key={stat.label} className="border-[#E5E5E0] dark:border-[#22221F] rounded-[20px]">
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-[#111110] dark:text-[#F9F9F8]">{stat.value}</p>
              <p className="text-xs text-[#999990] mt-0.5">{stat.sub}</p>
              <p className="text-xs font-medium text-[#666660] mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
