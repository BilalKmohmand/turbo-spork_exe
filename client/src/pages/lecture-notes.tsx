import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, FileText, Loader2, Download, Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface TranscriptChunk {
  text: string;
  timestamp: number;
}

export default function LectureNotes() {
  useAuth(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
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
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.start(5000); // Collect data every 5 seconds
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error: any) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record lectures",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      
      if (data.text) {
        setTranscriptChunks(prev => [...prev, {
          text: data.text,
          timestamp: Date.now()
        }]);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          transcriptRef.current?.scrollTo({
            top: transcriptRef.current.scrollHeight,
            behavior: "smooth"
          });
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "Transcription error",
        description: error.message || "Failed to transcribe audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateNotes = async () => {
    const fullTranscript = transcriptChunks.map(c => c.text).join(" ");
    
    if (!fullTranscript.trim()) {
      toast({
        title: "No transcript",
        description: "Record some audio first to generate notes",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingNotes(true);
    setGeneratedNotes("");

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate notes");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  setGeneratedNotes(prev => prev + data.token);
                }
              } catch {}
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error generating notes",
        description: error.message || "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(generatedNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Notes copied to clipboard" });
  };

  const downloadNotes = () => {
    const blob = new Blob([generatedNotes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecture-notes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fullTranscript = transcriptChunks.map(c => c.text).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            AI Lecture Notes
          </h1>
          <p className="text-muted-foreground mt-2">
            Record your lectures, get automatic transcription, and generate AI study notes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recording Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Live Recording
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-mono font-bold text-center">
                  {formatTime(recordingTime)}
                </div>
                
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    Recording...
                  </div>
                )}

                <div className="flex gap-3">
                  {!isRecording ? (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                      data-testid="button-start-recording"
                    >
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopRecording}
                      className="gap-2"
                      data-testid="button-stop-recording"
                    >
                      <Square className="w-5 h-5" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>

              {/* Transcription Status */}
              {isTranscribing && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transcribing audio...
                </div>
              )}

              {/* Live Transcript */}
              <div className="space-y-2">
                <h3 className="font-medium">Live Transcript</h3>
                <div 
                  ref={transcriptRef}
                  className="h-48 overflow-y-auto bg-muted/50 rounded-lg p-3 text-sm"
                  data-testid="transcript-display"
                >
                  {transcriptChunks.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      Start recording. Transcription appears when you stop...
                    </p>
                  ) : (
                    <p>{fullTranscript}</p>
                  )}
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-xs text-muted-foreground text-center">
                Ensure your audio recordings comply with legal and ethical standards.
                Always obtain consent before recording others.
              </p>
            </CardContent>
          </Card>

          {/* Notes Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  AI Generated Notes
                </span>
                {generatedNotes && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyNotes}
                      className="gap-1"
                      data-testid="button-copy-notes"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadNotes}
                      className="gap-1"
                      data-testid="button-download-notes"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateNotes}
                disabled={isGeneratingNotes || transcriptChunks.length === 0}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
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
                    Generate AI Notes
                  </>
                )}
              </Button>

              <div 
                className="h-80 overflow-y-auto bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap"
                data-testid="notes-display"
              >
                {generatedNotes ? (
                  generatedNotes
                ) : (
                  <p className="text-muted-foreground italic">
                    Record a lecture and click "Generate AI Notes" to create comprehensive study notes.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Mic className="w-8 h-8 mx-auto mb-2 text-violet-600" />
            <h3 className="font-medium">Automatic Transcription</h3>
            <p className="text-sm text-muted-foreground">
              AI transcribes your recordings accurately
            </p>
          </Card>
          <Card className="p-4 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
            <h3 className="font-medium">Smart Note Generation</h3>
            <p className="text-sm text-muted-foreground">
              Transforms lectures into organized notes
            </p>
          </Card>
          <Card className="p-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-violet-600" />
            <h3 className="font-medium">Export & Share</h3>
            <p className="text-sm text-muted-foreground">
              Download or copy your notes instantly
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
