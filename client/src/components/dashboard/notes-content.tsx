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
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const { toast } = useToast();

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

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      setLiveTranscript("");
      
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
            else interim += event.results[i][0].transcript;
          }
          if (final) {
            setLiveTranscript(prev => prev + final);
            setTranscriptChunks(prev => [...prev, { text: final, timestamp: Date.now() }]);
          }
          setInterimTranscript(interim);
        };
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (error) {
      toast({ title: "Microphone error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      setInterimTranscript("");
    }
  };

  const generateNotes = async () => {
    const fullTranscript = transcriptChunks.map(c => c.text).join(" ");
    if (!fullTranscript.trim()) return;
    setIsGeneratingNotes(true);
    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      });
      const data = await response.json();
      setGeneratedNotes(data.notes || "");
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to generate notes.", variant: "destructive" });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 rounded-[22px] bg-[#111110] dark:bg-white flex items-center justify-center mx-auto mb-6">
          <Mic className="w-8 h-8 text-white dark:text-black" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Lecture Notes</h2>
        <p className="text-[#666660]">Record audio and let AI generate structured study notes</p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] overflow-hidden">
            <CardContent className="p-8 lg:p-10 text-center">
              <div className="mb-10">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="text-6xl font-mono font-bold tracking-tighter tabular-nums">{formatTime(recordingTime)}</div>
                    <p className="text-red-500 font-bold uppercase tracking-widest text-[11px] animate-pulse">Live Recording</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl font-mono font-bold tracking-tighter text-[#999990]">00:00</div>
                    <p className="text-[#999990] uppercase tracking-widest text-[11px] font-bold">Ready to record</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-10">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-xl shadow-black/10 transition-transform hover:scale-110 active:scale-95 group"
                  >
                    <Mic className="w-10 h-10 text-white dark:text-black" />
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/20 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Square className="w-8 h-8 text-white" />
                  </button>
                )}
              </div>

              <div className="text-left bg-[#F9F9F8] dark:bg-[#111110] rounded-2xl p-6 min-h-[200px] border border-[#E5E5E0] dark:border-[#22221F]">
                <p className="text-[13px] font-bold uppercase tracking-widest text-[#999990] mb-3">Live Transcript</p>
                <p className="text-[16px] leading-relaxed">
                  {liveTranscript}
                  <span className="text-[#999990] italic">{interimTranscript}</span>
                  {!liveTranscript && !interimTranscript && <span className="text-[#999990]">Your transcript will appear here as you speak...</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] h-full bg-[#F9F9F8] dark:bg-[#111110]">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#999990]">AI Study Notes</h3>
                  <Sparkles className="w-4 h-4 text-[#999990]" />
                </div>
                
                <div className="space-y-6">
                  {generatedNotes ? (
                    <div className="prose prose-sm dark:prose-invert">
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#111110] dark:text-[#E5E5E0]">
                        {generatedNotes}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Wand2 className="w-12 h-12 text-[#E5E5E0] dark:text-[#22221F] mx-auto mb-4" />
                      <p className="text-sm text-[#666660]">Complete your recording to generate notes</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[#E5E5E0] dark:border-[#22221F]">
                <Button 
                  onClick={generateNotes}
                  disabled={isRecording || transcriptChunks.length === 0 || isGeneratingNotes}
                  className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold"
                >
                  {isGeneratingNotes ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Notes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
