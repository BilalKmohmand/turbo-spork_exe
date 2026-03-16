import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Copy, Check, Sparkles, Wand2, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptChunk {
  text: string;
  timestamp: number;
}

export default function NotesContent() {
  const [mode, setMode]                       = useState<"record" | "paste">("record");
  const [pastedText, setPastedText]           = useState("");
  const [isRecording, setIsRecording]         = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
  const [liveTranscript, setLiveTranscript]   = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes]   = useState("");
  const [recordingTime, setRecordingTime]     = useState(0);
  const [copied, setCopied]                   = useState(false);
  const [audioLevel, setAudioLevel]           = useState(0);

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef    = useRef<any>(null);
  const isRecordingRef    = useRef(false);
  const audioContextRef   = useRef<AudioContext | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const animFrameRef      = useRef<number | null>(null);
  const { toast }         = useToast();

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const stopAll = () => {
    isRecordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  /* ── Audio level analyser for waveform bars ───────────────────── */
  const startAudioAnalyser = (stream: MediaStream) => {
    try {
      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current     = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
        setAudioLevel(Math.min(100, avg * 1.5));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  };

  /* ── Start recognition (restartable) ─────────────────────────── */
  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition         = new SR();
    recognition.continuous    = true;
    recognition.interimResults = true;
    recognition.lang          = "en-US";

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interim   = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
        else                          interim    += event.results[i][0].transcript;
      }
      if (finalText) {
        setLiveTranscript(prev => prev + finalText);
        setTranscriptChunks(prev => [...prev, { text: finalText, timestamp: Date.now() }]);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Please allow microphone access.", variant: "destructive" });
        stopRecording();
      }
    };

    recognition.onend = () => {
      /* Auto-restart if still recording (Chrome stops on silence) */
      if (isRecordingRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setInterimTranscript("");
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [toast]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.onstop = () => stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.start();

      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscript("");
      setTranscriptChunks([]);
      setInterimTranscript("");

      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      startAudioAnalyser(stream);
      startRecognition();
    } catch {
      toast({ title: "Microphone error", description: "Could not access your microphone. Check browser permissions.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    setInterimTranscript("");
  };

  const generateNotes = async () => {
    const fullTranscript = mode === "paste"
      ? pastedText.trim()
      : transcriptChunks.map(c => c.text).join(" ");
    if (!fullTranscript.trim()) return;
    setIsGeneratingNotes(true);
    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate notes");
      setGeneratedNotes(data.notes || "");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate notes.", variant: "destructive" });
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
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `lecture-notes-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setLiveTranscript("");
    setTranscriptChunks([]);
    setInterimTranscript("");
    setGeneratedNotes("");
    setRecordingTime(0);
  };

  /* Waveform bars — animated by audio level */
  const barCount = 7;
  const waveforms = Array.from({ length: barCount }, (_, i) => {
    const center   = (barCount - 1) / 2;
    const dist     = Math.abs(i - center);
    const scale    = 1 - dist * 0.15;
    const animated = isRecording && audioLevel > 5;
    const height   = animated ? Math.max(8, (audioLevel * scale * 0.5)) : 8;
    return height;
  });

  const canGenerate = mode === "paste"
    ? pastedText.trim().length > 0
    : transcriptChunks.length > 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 rounded-[22px] bg-[#111110] dark:bg-white flex items-center justify-center mx-auto mb-6">
          <Mic className="w-8 h-8 text-white dark:text-black" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Lecture Notes</h2>
        <p className="text-[#666660]">Record audio or paste text and let AI generate structured study notes</p>
      </header>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-[#F0F0EE] dark:bg-[#1A1A18] rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode("record")}
          data-testid="tab-record-audio"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === "record"
              ? "bg-white dark:bg-[#2A2A28] text-[#111110] dark:text-white shadow-sm"
              : "text-[#888880] hover:text-[#111110] dark:hover:text-white"
          }`}
        >
          <Mic className="w-4 h-4" /> Record Audio
        </button>
        <button
          onClick={() => setMode("paste")}
          data-testid="tab-paste-text"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === "paste"
              ? "bg-white dark:bg-[#2A2A28] text-[#111110] dark:text-white shadow-sm"
              : "text-[#888880] hover:text-[#111110] dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" /> Paste Text
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left — recorder or paste */}
        <div className="lg:col-span-7">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] overflow-hidden">
            <CardContent className="p-8 lg:p-10">
              {/* Paste Text Mode */}
              {mode === "paste" ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#999990] uppercase tracking-widest text-center mb-4">
                    Paste Lecture Text
                  </p>
                  <Textarea
                    data-testid="input-lecture-text"
                    placeholder="Paste your lecture notes, textbook excerpt, or any text you want to convert into structured study notes…"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={14}
                    className="resize-none text-sm leading-relaxed border-[#E5E5E0] dark:border-[#22221F] rounded-2xl bg-[#F9F9F8] dark:bg-[#111110] focus-visible:ring-1"
                  />
                  {pastedText && (
                    <p className="text-xs text-[#999990] text-right">
                      ~{pastedText.split(/\s+/).filter(Boolean).length} words
                    </p>
                  )}
                </div>
              ) : (
              <div className="text-center">
              {/* Timer */}
              <div className="mb-8">
                {isRecording ? (
                  <div className="space-y-2">
                    <div className="text-6xl font-mono font-bold tracking-tighter tabular-nums text-[#111110] dark:text-white">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-red-500 font-bold uppercase tracking-widest text-[11px] animate-pulse">
                      Live Recording
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-6xl font-mono font-bold tracking-tighter text-[#CCCCCC] dark:text-[#333330]">
                      {recordingTime > 0 ? formatTime(recordingTime) : "00:00"}
                    </div>
                    <p className="text-[#999990] uppercase tracking-widest text-[11px] font-bold">
                      {recordingTime > 0 ? "Recording stopped" : "Ready to record"}
                    </p>
                  </div>
                )}
              </div>

              {/* Waveform visualiser */}
              <div className="flex justify-center items-end gap-1 h-12 mb-8">
                {waveforms.map((h, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-100 ${isRecording ? "bg-red-500" : "bg-[#E5E5E0] dark:bg-[#22221F]"}`}
                    style={{ height: `${h}px`, minHeight: "8px" }}
                  />
                ))}
              </div>

              {/* Record / Stop button */}
              <div className="flex justify-center mb-8">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-xl shadow-black/10 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Mic className="w-10 h-10 text-white dark:text-black" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 transition-transform hover:scale-110 active:scale-95 ring-4 ring-red-200 dark:ring-red-900 animate-pulse"
                  >
                    <Square className="w-8 h-8 text-white fill-white" />
                  </button>
                )}
              </div>

              {/* Live transcript */}
              <div className="text-left bg-[#F9F9F8] dark:bg-[#111110] rounded-2xl p-6 min-h-[160px] border border-[#E5E5E0] dark:border-[#22221F]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#999990]">
                    Live Transcript
                  </p>
                  {transcriptChunks.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[11px] text-[#BBBBBB] hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[15px] leading-relaxed text-[#111110] dark:text-[#E5E5E0]">
                  {liveTranscript}
                  <span className="text-[#AAAAAA] italic">{interimTranscript}</span>
                  {!liveTranscript && !interimTranscript && (
                    <span className="text-[#CCCCCC] dark:text-[#333330]">
                      {isRecording ? "Start speaking — your words will appear here…" : "Your transcript will appear here as you speak…"}
                    </span>
                  )}
                </p>
              </div>

              {/* Word count */}
              {liveTranscript && (
                <p className="text-[12px] text-[#999990] mt-3 text-right">
                  ~{liveTranscript.split(/\s+/).filter(Boolean).length} words captured
                </p>
              )}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — notes */}
        <div className="lg:col-span-5">
          <Card className="border-[#E5E5E0] dark:border-[#22221F] rounded-[32px] h-full bg-[#F9F9F8] dark:bg-[#111110]">
            <CardContent className="p-8 flex flex-col h-full min-h-[500px]">
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#999990]">AI Study Notes</h3>
                  <Sparkles className="w-4 h-4 text-[#999990]" />
                </div>

                {generatedNotes ? (
                  <div>
                    <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#111110] dark:text-[#E5E5E0]">
                      {generatedNotes}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Wand2 className="w-10 h-10 text-[#E5E5E0] dark:text-[#22221F] mx-auto mb-4" />
                    <p className="text-[13px] text-[#999990] max-w-[180px] mx-auto">
                      Record a lecture then click "Generate Notes"
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-8 pt-6 border-t border-[#E5E5E0] dark:border-[#22221F] space-y-3">
                <Button
                  onClick={generateNotes}
                  disabled={isRecording || !canGenerate || isGeneratingNotes}
                  data-testid="button-generate-notes"
                  className="w-full h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-[#222] dark:hover:bg-[#EEE] disabled:opacity-40"
                >
                  {isGeneratingNotes ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating…</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" />Generate Notes</>
                  )}
                </Button>

                {generatedNotes && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={copyNotes}
                      className="flex-1 h-10 rounded-xl border-[#E5E5E0] dark:border-[#22221F] text-[13px]"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</>}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadNotes}
                      className="flex-1 h-10 rounded-xl border-[#E5E5E0] dark:border-[#22221F] text-[13px]"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />Save
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
