import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Loader2, Download, Copy, Check, Sparkles, FileText, Clock, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TranscriptChunk {
  text: string;
  timestamp: number;
}

export default function NotesContent() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record lectures.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      if (data.text) {
        setTranscriptChunks(prev => [...prev, { text: data.text, timestamp: Date.now() }]);
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: "Could not transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateNotes = async () => {
    const fullTranscript = transcriptChunks.map(c => c.text).join(" ");
    if (!fullTranscript.trim()) return;

    setIsGeneratingNotes(true);
    setGeneratedNotes("");

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!response.ok) throw new Error("Failed to generate notes");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(line => line.startsWith("data: "));
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                setGeneratedNotes(prev => prev + data.token);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const copyNotes = async () => {
    await navigator.clipboard.writeText(generatedNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Notes copied to clipboard." });
  };

  const downloadNotes = () => {
    const blob = new Blob([generatedNotes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecture-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fullTranscript = transcriptChunks.map(c => c.text).join(" ");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/20">
          <Mic className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Lecture Notes</h1>
        <p className="text-muted-foreground">Record your lectures and get AI-generated study notes</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold">Recording</h3>
              </div>
              {isRecording && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Recording
                </Badge>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 py-4">
              {isRecording && (
                <div className="text-5xl font-mono font-bold text-violet-600 tabular-nums">
                  {formatTime(recordingTime)}
                </div>
              )}
              
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="gap-2 bg-violet-600 hover:bg-violet-700 h-14 px-8 rounded-2xl shadow-lg shadow-violet-600/20"
                  disabled={isTranscribing}
                  data-testid="button-start-recording"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="gap-2 h-14 px-8 rounded-2xl"
                  data-testid="button-stop-recording"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </Button>
              )}

              {isTranscribing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Transcribing audio...</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Transcript</h4>
                {transcriptChunks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {transcriptChunks.length} segment{transcriptChunks.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div 
                className="h-40 overflow-y-auto bg-muted/50 rounded-xl p-4 text-sm border border-border/50"
                data-testid="transcript-display"
              >
                {transcriptChunks.length === 0 ? (
                  <p className="text-muted-foreground italic text-center py-8">
                    Start recording to see transcript here...
                  </p>
                ) : (
                  <p className="leading-relaxed">{fullTranscript}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold">AI Notes</h3>
            </div>

            <Button
              onClick={generateNotes}
              disabled={!fullTranscript.trim() || isGeneratingNotes}
              className="w-full gap-2 mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              data-testid="button-generate-notes"
            >
              {isGeneratingNotes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Study Notes
                </>
              )}
            </Button>

            <div 
              className="h-52 overflow-y-auto bg-muted/50 rounded-xl p-4 text-sm whitespace-pre-wrap border border-border/50"
              data-testid="notes-display"
            >
              {generatedNotes ? (
                <p className="leading-relaxed">{generatedNotes}</p>
              ) : (
                <p className="text-muted-foreground italic text-center py-16">
                  AI-generated notes will appear here...
                </p>
              )}
            </div>

            {generatedNotes && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={copyNotes} className="flex-1 gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadNotes} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
