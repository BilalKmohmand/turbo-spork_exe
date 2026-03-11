import { useState } from "react";
import logoPath from "@assets/generated_images/thehighgrader_logo.png";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Database, 
  Search, 
  BookOpen, 
  FileText, 
  Sparkles,
  ChevronLeft,
  Loader2,
  BookMarked,
  GraduationCap,
  Calculator,
  Lightbulb,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

interface KnowledgeStats {
  totalChunks: number;
  byTopic: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}

interface SearchResult {
  id: string;
  content: string;
  sourceBook: string;
  chapter: string | null;
  section: string | null;
  page: number | null;
  topic: string;
  contentType: string;
  difficulty: string;
  similarity: number;
  citation: string;
  keywords: string[];
  relatedFormulas: string[];
}

export default function Knowledge() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  
  const [singleUpload, setSingleUpload] = useState({
    content: "",
    sourceBook: "",
    chapter: "",
    section: "",
    page: "",
    topic: "",
    subtopic: "",
    contentType: "general" as const,
    difficulty: "intermediate" as const,
    keywords: "",
    relatedFormulas: "",
    commonMisconceptions: "",
  });
  
  const [bulkUpload, setBulkUpload] = useState({
    content: "",
    sourceBook: "",
    chapter: "",
    section: "",
    startPage: "",
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    topic: "",
    contentType: "",
    difficulty: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<KnowledgeStats>({
    queryKey: ["/api/knowledge/stats"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof singleUpload) => {
      const response = await apiRequest("POST", "/api/knowledge/upload", {
        ...data,
        page: data.page ? parseInt(data.page) : undefined,
        keywords: data.keywords ? data.keywords.split(",").map(k => k.trim()) : [],
        relatedFormulas: data.relatedFormulas ? data.relatedFormulas.split(",").map(f => f.trim()) : [],
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Knowledge chunk uploaded successfully" });
      setSingleUpload({
        content: "",
        sourceBook: singleUpload.sourceBook,
        chapter: singleUpload.chapter,
        section: "",
        page: "",
        topic: singleUpload.topic,
        subtopic: "",
        contentType: "general",
        difficulty: "intermediate",
        keywords: "",
        relatedFormulas: "",
        commonMisconceptions: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/stats"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to upload", variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: typeof bulkUpload) => {
      const response = await apiRequest("POST", "/api/knowledge/bulk-upload", {
        ...data,
        startPage: data.startPage ? parseInt(data.startPage) : undefined,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Success", 
        description: `Created ${data.chunksCreated} knowledge chunks` 
      });
      setBulkUpload({
        content: "",
        sourceBook: bulkUpload.sourceBook,
        chapter: "",
        section: "",
        startPage: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/stats"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to bulk upload", variant: "destructive" });
    },
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/knowledge/search", {
        query: searchQuery,
        ...searchFilters,
        topK: 10,
      });
      return response.json() as Promise<{ results: SearchResult[] }>;
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Search failed", variant: "destructive" });
    },
  });

  const handleSingleUpload = () => {
    if (!singleUpload.content || !singleUpload.sourceBook || !singleUpload.topic) {
      toast({ title: "Error", description: "Content, source book, and topic are required", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(singleUpload);
  };

  const handleBulkUpload = () => {
    if (!bulkUpload.content || !bulkUpload.sourceBook) {
      toast({ title: "Error", description: "Content and source book are required", variant: "destructive" });
      return;
    }
    bulkUploadMutation.mutate(bulkUpload);
  };

  const contentTypeIcons: Record<string, any> = {
    definition: BookMarked,
    theorem: GraduationCap,
    formula: Calculator,
    example: Lightbulb,
    exercise: FileText,
    explanation: BookOpen,
    general: FileText,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/teacher">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPath} alt="TheHighGrader" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg hidden sm:inline">TheHighGrader™</span>
          </Link>
          <Badge variant="secondary" className="hidden sm:flex">Knowledge Base</Badge>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Knowledge Base Management</h1>
          <p className="text-muted-foreground">
            Upload educational content to power AI-grounded answers with citations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-chunks">
                {statsLoading ? "..." : stats?.totalChunks || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-topics-count">
                {statsLoading ? "..." : Object.keys(stats?.byTopic || {}).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Content Types</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-types-count">
                {statsLoading ? "..." : Object.keys(stats?.byType || {}).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Difficulty Levels</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-difficulty-count">
                {statsLoading ? "..." : Object.keys(stats?.byDifficulty || {}).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" data-testid="tab-upload">
              <Upload className="w-4 h-4 mr-2" />
              Single Upload
            </TabsTrigger>
            <TabsTrigger value="bulk" data-testid="tab-bulk">
              <Database className="w-4 h-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Knowledge Chunk</CardTitle>
                <CardDescription>
                  Add a single piece of educational content with metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceBook">Source Book *</Label>
                    <Input
                      id="sourceBook"
                      placeholder="e.g., Stewart's Calculus (8th Ed.)"
                      value={singleUpload.sourceBook}
                      onChange={(e) => setSingleUpload({ ...singleUpload, sourceBook: e.target.value })}
                      data-testid="input-source-book"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic *</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Calculus, Algebra, Geometry"
                      value={singleUpload.topic}
                      onChange={(e) => setSingleUpload({ ...singleUpload, topic: e.target.value })}
                      data-testid="input-topic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter</Label>
                    <Input
                      id="chapter"
                      placeholder="e.g., 3"
                      value={singleUpload.chapter}
                      onChange={(e) => setSingleUpload({ ...singleUpload, chapter: e.target.value })}
                      data-testid="input-chapter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="e.g., 3.3"
                      value={singleUpload.section}
                      onChange={(e) => setSingleUpload({ ...singleUpload, section: e.target.value })}
                      data-testid="input-section"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page">Page</Label>
                    <Input
                      id="page"
                      type="number"
                      placeholder="e.g., 156"
                      value={singleUpload.page}
                      onChange={(e) => setSingleUpload({ ...singleUpload, page: e.target.value })}
                      data-testid="input-page"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtopic">Subtopic</Label>
                    <Input
                      id="subtopic"
                      placeholder="e.g., Product Rule"
                      value={singleUpload.subtopic}
                      onChange={(e) => setSingleUpload({ ...singleUpload, subtopic: e.target.value })}
                      data-testid="input-subtopic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentType">Content Type *</Label>
                    <Select
                      value={singleUpload.contentType}
                      onValueChange={(value) => setSingleUpload({ ...singleUpload, contentType: value as any })}
                    >
                      <SelectTrigger data-testid="select-content-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="definition">Definition</SelectItem>
                        <SelectItem value="theorem">Theorem / Proof</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                        <SelectItem value="example">Worked Example</SelectItem>
                        <SelectItem value="exercise">Exercise / Problem</SelectItem>
                        <SelectItem value="explanation">Explanation</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={singleUpload.difficulty}
                      onValueChange={(value) => setSingleUpload({ ...singleUpload, difficulty: value as any })}
                    >
                      <SelectTrigger data-testid="select-difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the educational content here. Include formulas, definitions, theorems, examples, etc."
                    className="min-h-[200px]"
                    value={singleUpload.content}
                    onChange={(e) => setSingleUpload({ ...singleUpload, content: e.target.value })}
                    data-testid="textarea-content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      placeholder="e.g., derivative, product rule, calculus"
                      value={singleUpload.keywords}
                      onChange={(e) => setSingleUpload({ ...singleUpload, keywords: e.target.value })}
                      data-testid="input-keywords"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relatedFormulas">Related Formulas (comma-separated)</Label>
                    <Input
                      id="relatedFormulas"
                      placeholder="e.g., d/dx[uv] = u'v + uv'"
                      value={singleUpload.relatedFormulas}
                      onChange={(e) => setSingleUpload({ ...singleUpload, relatedFormulas: e.target.value })}
                      data-testid="input-formulas"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="misconceptions">Common Misconceptions</Label>
                  <Input
                    id="misconceptions"
                    placeholder="e.g., Students often forget to apply the chain rule when differentiating composite functions"
                    value={singleUpload.commonMisconceptions}
                    onChange={(e) => setSingleUpload({ ...singleUpload, commonMisconceptions: e.target.value })}
                    data-testid="input-misconceptions"
                  />
                </div>

                <Button 
                  onClick={handleSingleUpload} 
                  disabled={uploadMutation.isPending}
                  className="w-full"
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Knowledge Chunk
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Content</CardTitle>
                <CardDescription>
                  Paste large sections of text and the system will automatically chunk and categorize it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkSourceBook">Source Book *</Label>
                    <Input
                      id="bulkSourceBook"
                      placeholder="e.g., Stewart's Calculus (8th Ed.)"
                      value={bulkUpload.sourceBook}
                      onChange={(e) => setBulkUpload({ ...bulkUpload, sourceBook: e.target.value })}
                      data-testid="input-bulk-source"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkChapter">Chapter</Label>
                    <Input
                      id="bulkChapter"
                      placeholder="e.g., 3"
                      value={bulkUpload.chapter}
                      onChange={(e) => setBulkUpload({ ...bulkUpload, chapter: e.target.value })}
                      data-testid="input-bulk-chapter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkSection">Section</Label>
                    <Input
                      id="bulkSection"
                      placeholder="e.g., 3.3 Product Rule"
                      value={bulkUpload.section}
                      onChange={(e) => setBulkUpload({ ...bulkUpload, section: e.target.value })}
                      data-testid="input-bulk-section"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulkStartPage">Starting Page</Label>
                    <Input
                      id="bulkStartPage"
                      type="number"
                      placeholder="e.g., 156"
                      value={bulkUpload.startPage}
                      onChange={(e) => setBulkUpload({ ...bulkUpload, startPage: e.target.value })}
                      data-testid="input-bulk-page"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulkContent">Content *</Label>
                  <Textarea
                    id="bulkContent"
                    placeholder="Paste large sections of textbook content here. The system will automatically:
- Split content into logical chunks
- Detect content types (definitions, theorems, examples, etc.)
- Extract keywords and formulas
- Determine difficulty level
- Generate embeddings for similarity search"
                    className="min-h-[300px]"
                    value={bulkUpload.content}
                    onChange={(e) => setBulkUpload({ ...bulkUpload, content: e.target.value })}
                    data-testid="textarea-bulk-content"
                  />
                </div>

                <Button 
                  onClick={handleBulkUpload} 
                  disabled={bulkUploadMutation.isPending}
                  className="w-full"
                  data-testid="button-bulk-upload"
                >
                  {bulkUploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing and Uploading...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Process and Upload Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Knowledge Base</CardTitle>
                <CardDescription>
                  Test the RAG retrieval system by searching for content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for math concepts, formulas, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchMutation.mutate()}
                    data-testid="input-search"
                  />
                  <Button 
                    onClick={() => searchMutation.mutate()}
                    disabled={searchMutation.isPending}
                    data-testid="button-search"
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Topic Filter</Label>
                    <Input
                      placeholder="e.g., calculus"
                      value={searchFilters.topic}
                      onChange={(e) => setSearchFilters({ ...searchFilters, topic: e.target.value })}
                      data-testid="input-filter-topic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select
                      value={searchFilters.contentType}
                      onValueChange={(value) => setSearchFilters({ ...searchFilters, contentType: value })}
                    >
                      <SelectTrigger data-testid="select-filter-type">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="definition">Definition</SelectItem>
                        <SelectItem value="theorem">Theorem</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                        <SelectItem value="example">Example</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="explanation">Explanation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={searchFilters.difficulty}
                      onValueChange={(value) => setSearchFilters({ ...searchFilters, difficulty: value })}
                    >
                      <SelectTrigger data-testid="select-filter-difficulty">
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Found {searchResults.length} results
                    </h3>
                    {searchResults.map((result) => {
                      const Icon = contentTypeIcons[result.contentType] || FileText;
                      return (
                        <Card key={result.id} className="hover-elevate">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">{result.contentType}</Badge>
                                  <Badge variant="outline">{result.topic}</Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {(result.similarity * 100).toFixed(0)}% match
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{result.citation}</p>
                                <p className="text-sm whitespace-pre-wrap line-clamp-4">{result.content}</p>
                                {result.keywords && result.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {result.keywords.map((kw, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {kw}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {stats && Object.keys(stats.byTopic).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">By Topic</h4>
                  <div className="space-y-1">
                    {Object.entries(stats.byTopic).map(([topic, count]) => (
                      <div key={topic} className="flex justify-between text-sm">
                        <span className="capitalize">{topic}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">By Content Type</h4>
                  <div className="space-y-1">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="capitalize">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">By Difficulty</h4>
                  <div className="space-y-1">
                    {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                      <div key={diff} className="flex justify-between text-sm">
                        <span className="capitalize">{diff}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
