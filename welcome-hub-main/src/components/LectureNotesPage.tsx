import { useState, useEffect, useRef } from "react";
import { Mic, FileText, Plus, Play, Pause, Download, Trash2, Clock, Search, Folder, MoreVertical, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  duration?: number;
  createdAt: string;
  tags: string[];
  hasTranscript: boolean;
}

export default function LectureNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ notes: Note[] }>("/api/notes");
      setNotes(res.notes || []);
    } catch {
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSaveNoteWithAudio(audioUrl, recordingTime);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSaveNoteWithAudio = async (audioUrl: string, duration: number) => {
    try {
      const res = await apiFetch<{ note: Note }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          title: newNote.title || `Recording ${new Date().toLocaleString()}`,
          content: newNote.content,
          audioUrl,
          duration,
        }),
      });
      setNotes(prev => [res.note, ...prev]);
      setShowCreateDialog(false);
      setNewNote({ title: "", content: "" });
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleCreateTextNote = async () => {
    if (!newNote.title.trim()) return;
    try {
      const res = await apiFetch<{ note: Note }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title: newNote.title, content: newNote.content }),
      });
      setNotes(prev => [res.note, ...prev]);
      setShowCreateDialog(false);
      setNewNote({ title: "", content: "" });
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setShowNoteDialog(false);
        setSelectedNote(null);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setShowNoteDialog(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Lecture Notes</h2>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm" className="relative z-10">
          <Plus className="w-4 h-4 mr-1" />
          New Note
        </Button>
      </header>

      {/* Search */}
      <div className="px-6 py-3 border-b border-border bg-card/20">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Record lectures or write notes. AI can help transcribe and organize your recordings.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create First Note
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => (
                <Card key={note.id} className="group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openNote(note)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {note.audioUrl ? (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Volume2 className="w-4 h-4 text-primary" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="font-semibold line-clamp-1">{note.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {note.content || (note.hasTranscript ? "Transcript available" : "No content")}
                      </p>
                    </div>
                    {note.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(note.duration)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Write a note or record audio from your lecture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="e.g., Calculus Lecture 1"
                value={newNote.title}
                onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content (optional)</label>
              <Textarea
                placeholder="Write your notes here..."
                value={newNote.content}
                onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Recording UI */}
            {isRecording ? (
              <div className="p-4 border rounded-xl bg-destructive/5 border-destructive/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="font-medium">Recording...</span>
                  </div>
                  <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                </div>
                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={stopRecording}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Stop Recording
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={startRecording}
              >
                <Mic className="w-4 h-4 mr-1" />
                Record Audio
              </Button>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateTextNote}
                disabled={!newNote.title.trim() || isRecording}
              >
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      {selectedNote && (
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedNote.title}</DialogTitle>
              <DialogDescription>
                {new Date(selectedNote.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4">
                {selectedNote.audioUrl && (
                  <div className="p-4 bg-muted rounded-xl">
                    <audio controls className="w-full">
                      <source src={selectedNote.audioUrl} type="audio/webm" />
                    </audio>
                    {selectedNote.duration && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Duration: {formatTime(selectedNote.duration)}
                      </p>
                    )}
                  </div>
                )}
                {selectedNote.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                  </div>
                ) : selectedNote.hasTranscript ? (
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Transcript available</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No content</p>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowNoteDialog(false)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteNote(selectedNote.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
