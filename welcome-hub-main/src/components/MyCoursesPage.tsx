import { useState, useEffect } from "react";
import { BookOpen, Plus, Clock, MoreVertical, ChevronRight, GraduationCap, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  subject?: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  lastAccessed?: string;
  thumbnail?: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  "Math": "bg-blue-500/10 text-blue-500",
  "Science": "bg-green-500/10 text-green-500",
  "English": "bg-purple-500/10 text-purple-500",
  "History": "bg-amber-500/10 text-amber-500",
  "Other": "bg-gray-500/10 text-gray-500",
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({ title: "", subject: "Other" });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>("/api/courses");
      const rawCourses: any[] = Array.isArray(res) ? res : (res?.courses || []);

      const normalized: Course[] = rawCourses.map((c: any) => {
        const progressRows = Array.isArray(c.progress) ? c.progress : [];
        const totalLessons = typeof c.totalLessons === "number" ? c.totalLessons : 0;
        const completedLessons = progressRows.length;
        const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          id: c.id,
          title: c.title,
          subject: c.subject || c.topic || "Other",
          totalLessons,
          completedLessons,
          progress: typeof c.progress === "number" ? c.progress : progressPct,
          lastAccessed: c.updatedAt || c.createdAt,
          thumbnail: c.thumbnail,
        };
      });

      setCourses(normalized);
    } catch {
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDialog(true);
  };

  const handleAddCourse = async () => {
    if (!newCourse.title.trim()) return;
    try {
      const res = await apiFetch<{ course: Course }>("/api/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      });
      setCourses(prev => [res.course, ...prev]);
      setShowAddDialog(false);
      setNewCourse({ title: "", subject: "Other" });
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">My Courses</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="relative z-10">
          <Plus className="w-4 h-4 mr-1" />
          Add Course
        </Button>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Start learning by adding your first course. Track your progress and organize your study materials.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => {
                const subjectColor = SUBJECT_COLORS[course.subject] || SUBJECT_COLORS["Other"];
                return (
                  <Card
                    key={course.id}
                    className="group cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => openCourse(course)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${subjectColor}`}>
                          {course.subject}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {course.lastAccessed ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Last accessed {new Date(course.lastAccessed).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3" />
                            New course
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Course Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course to organize your learning materials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Calculus 101"
                value={newCourse.title}
                onChange={e => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                value={newCourse.subject}
                onChange={e => setNewCourse(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.keys(SUBJECT_COLORS).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddCourse} disabled={!newCourse.title.trim()}>
                Create Course
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCourse && (
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedCourse.title}</DialogTitle>
              <DialogDescription>
                {selectedCourse.subject || "Other"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="text-sm text-muted-foreground">
                Course details view is coming next. For now you can create and manage courses from this page.
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCourseDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
