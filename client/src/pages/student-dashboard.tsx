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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Camera, 
  FileText, 
  Clock, 
  CheckCircle,
  BookOpen,
  TrendingUp,
  Send,
  Plus,
  History,
  Sparkles,
  LogOut
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

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Math");
  const [content, setContent] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "student") {
        navigate("/teacher");
      } else {
        setUser(parsed);
      }
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/student/stats"],
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/student/submissions"],
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { title: string; subject: string; content: string }) => {
      const res = await apiRequest("POST", "/api/submissions", {
        ...data,
        studentName: user?.displayName || "Anonymous",
        studentId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      setTitle("");
      setContent("");
      setActiveTab("history");
      toast({ title: "Submitted!", description: "Your work is being processed by AI." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Missing info", description: "Please provide a title and content", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ title, subject, content });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setContent(`[Image uploaded: ${file.name}]\n\nPlease solve this problem.`);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setContent(text);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    toast({ title: "File loaded", description: "You can now submit your work." });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>;
      case "ai_graded":
        return <Badge className="bg-blue-500"><Sparkles className="w-3 h-3 mr-1" /> AI Solved</Badge>;
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
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user.displayName}
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
          <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">Upload homework for AI solutions and track teacher feedback</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <FileText className="w-5 h-5 text-violet-600" />
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
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.aiGraded || 0}</p>
                  <p className="text-sm text-muted-foreground">AI Solved</p>
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
                  <p className="text-sm text-muted-foreground">Teacher Reviewed</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upload" data-testid="tab-upload">
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              My Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Submit Work for AI Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title"
                      placeholder="e.g., Algebra Homework Chapter 5"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-submission-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject" data-testid="select-subject">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Math">Math</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Problem / Question</Label>
                  <Textarea 
                    id="content"
                    placeholder="Type or paste your homework problem here..."
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    data-testid="input-submission-content"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.txt,.pdf"
                        onChange={handleFileUpload}
                        data-testid="input-file-upload"
                      />
                    </label>
                  </Button>
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !title || !content}
                  data-testid="button-submit-work"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit for AI Solution"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No submissions yet</p>
                    <p className="text-muted-foreground mb-4">Upload your first homework to get started</p>
                    <Button onClick={() => setActiveTab("upload")}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Submission
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                submissions.map((sub) => (
                  <Card key={sub.id} data-testid={`card-submission-${sub.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{sub.title}</h3>
                            {getStatusBadge(sub.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {sub.subject} - {new Date(sub.submittedAt!).toLocaleDateString()}
                          </p>
                          <p className="text-sm line-clamp-2">{sub.content}</p>
                        </div>
                        <Link href={`/submission/${sub.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${sub.id}`}>
                            View Solution
                          </Button>
                        </Link>
                      </div>
                      {sub.aiSolution && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50">
                          <p className="text-sm font-medium mb-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            AI Solution
                          </p>
                          <MathDisplay>{sub.aiSolution}</MathDisplay>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
