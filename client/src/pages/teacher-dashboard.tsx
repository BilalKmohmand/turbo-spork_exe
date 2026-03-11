import { useState, useEffect } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  ClipboardList,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Sparkles,
  LogOut,
  Star,
  Send,
  Eye,
  Database
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Submission, DashboardStats } from "@shared/schema";
import { MathDisplay } from "@/components/math-display";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export default function TeacherDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState(80);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "teacher") {
        navigate("/student");
      } else {
        setUser(parsed);
      }
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/teacher/stats"],
    enabled: !!user,
  });

  const { data: pendingSubmissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/teacher/pending"],
    enabled: !!user,
  });

  const { data: allSubmissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/teacher/submissions"],
    enabled: !!user,
  });

  const evaluateMutation = useMutation({
    mutationFn: async (data: { submissionId: string; score: number; feedback: string }) => {
      const res = await apiRequest("POST", `/api/submissions/${data.submissionId}/evaluate`, {
        score: data.score,
        feedback: data.feedback,
        teacherId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setSelectedSubmission(null);
      setScore(80);
      setFeedback("");
      toast({ title: "Evaluation saved!", description: "The student will be notified." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleEvaluate = () => {
    if (!selectedSubmission || !feedback.trim()) {
      toast({ title: "Missing info", description: "Please provide feedback", variant: "destructive" });
      return;
    }
    evaluateMutation.mutate({
      submissionId: selectedSubmission.id,
      score,
      feedback,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "ai_graded":
        return <Badge className="bg-blue-500"><Sparkles className="w-3 h-3 mr-1" /> Ready for Review</Badge>;
      case "teacher_reviewed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Reviewed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPath} alt="TheHighGrader" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg">TheHighGrader™</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/knowledge">
              <Button variant="outline" size="sm" data-testid="button-knowledge">
                <Database className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Knowledge Base</span>
              </Button>
            </Link>
            <Badge variant="outline" className="hidden sm:flex">
              <Users className="w-3 h-3 mr-1" />
              Teacher
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Review student submissions and provide feedback</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <ClipboardList className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalSubmissions || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingReview || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.teacherReviewed || 0}</p>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.averageScore || 0}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending" data-testid="tab-pending">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending ({pendingSubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  All
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <div className="space-y-3">
                  {pendingSubmissions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3" />
                        <p className="font-medium">All caught up!</p>
                        <p className="text-sm text-muted-foreground">No submissions pending review</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingSubmissions.map((sub) => (
                      <Card 
                        key={sub.id} 
                        className={`cursor-pointer transition-all ${selectedSubmission?.id === sub.id ? 'ring-2 ring-violet-500' : ''}`}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setScore(80);
                          setFeedback("");
                        }}
                        data-testid={`card-pending-${sub.id}`}
                      >
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{sub.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {sub.studentName} - {sub.subject}
                              </p>
                            </div>
                            {getStatusBadge(sub.status)}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="space-y-3">
                  {allSubmissions.map((sub) => (
                    <Card 
                      key={sub.id}
                      className={`cursor-pointer transition-all ${selectedSubmission?.id === sub.id ? 'ring-2 ring-violet-500' : ''}`}
                      onClick={() => setSelectedSubmission(sub)}
                      data-testid={`card-all-${sub.id}`}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{sub.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {sub.studentName} - {new Date(sub.submittedAt!).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            {selectedSubmission ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{selectedSubmission.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedSubmission.studentName} - {selectedSubmission.subject}
                      </p>
                    </div>
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Student's Work</Label>
                    <div className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">
                      {selectedSubmission.content}
                    </div>
                  </div>

                  {selectedSubmission.aiSolution && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        AI Solution
                      </Label>
                      <div className="mt-1 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                        <MathDisplay>{selectedSubmission.aiSolution}</MathDisplay>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.status === "ai_graded" && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                          <span>Score</span>
                          <span className="text-lg font-bold">{score}%</span>
                        </Label>
                        <Slider 
                          value={[score]} 
                          onValueChange={(val) => setScore(val[0])}
                          max={100}
                          step={5}
                          data-testid="slider-score"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="feedback">Teacher Feedback</Label>
                        <Textarea 
                          id="feedback"
                          placeholder="Provide feedback for the student..."
                          rows={4}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          data-testid="input-feedback"
                        />
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                        onClick={handleEvaluate}
                        disabled={evaluateMutation.isPending || !feedback}
                        data-testid="button-submit-evaluation"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {evaluateMutation.isPending ? "Saving..." : "Submit Evaluation"}
                      </Button>
                    </>
                  )}

                  {selectedSubmission.status === "teacher_reviewed" && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Already reviewed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Eye className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Select a submission</p>
                  <p className="text-sm text-muted-foreground">Click on a submission to review it</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
