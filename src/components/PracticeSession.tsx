import React, { useState, useEffect, useMemo } from 'react';
import { useRecorder } from '@/src/hooks/useRecorder';
import { useSessionPersistence } from '@/src/hooks/useSessionPersistence';
import { analyzeSpeech, generatePracticeScript } from '@/src/lib/gemini';
import { AudioVisualizer } from './AudioVisualizer';
import { TranscriptWithFeedback } from './TranscriptWithFeedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Play, RefreshCw, Loader2, Info, ChevronRight, CheckCircle2, TrendingUp, TrendingDown, Target, Zap, Trophy, AlertCircle, Stethoscope, Music, Volume2, Heart, Wind, Activity, Smile, Shield, Download } from 'lucide-react';
import { SpeechFeedback } from '@/src/types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

const PaceGauge = ({ wpm }: { wpm: number }) => {
  const normalizedPace = Math.min(Math.max(((wpm - 80) / 120) * 100, 0), 100);
  
  const getStatus = () => {
    if (wpm < 115) return { label: "Too Slow", color: "text-blue-400", bg: "bg-blue-400", icon: <TrendingDown className="h-3 w-3" /> };
    if (wpm <= 165) return { label: "Perfect", color: "text-green-400", bg: "bg-green-400", icon: <Target className="h-3 w-3" /> };
    return { label: "Too Fast", color: "text-amber-400", bg: "bg-amber-400", icon: <TrendingUp className="h-3 w-3" /> };
  };

  const status = getStatus();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest mb-1">Speaking Pace</p>
           <div className="flex items-center gap-2">
             <span className="text-3xl font-bold">{wpm}</span>
             <span className="text-xs text-muted-foreground font-mono">WPM</span>
           </div>
        </div>
        <Badge variant="outline" className={`${status.color} border-current gap-1 px-2 py-0.5`}>
          {status.icon} {status.label}
        </Badge>
      </div>
      
      <div className="relative pt-2">
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1.5 px-1 uppercase opacity-50">
          <span>Casual</span>
          <span>Professional</span>
          <span>Excited</span>
        </div>
        <div className="h-3 bg-muted/30 rounded-full relative overflow-hidden border border-border/50">
          <div className="absolute left-[30%] right-[35%] h-full bg-green-500/10 border-x border-green-500/20" />
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${normalizedPace}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className={`h-full ${status.bg} shadow-[0_0_15px_-3px_currentColor] transition-colors`}
          />
        </div>
      </div>
    </div>
  );
};

const RealTimeScriptHighlight = ({ script, realTimeTranscript }: { script: string, realTimeTranscript: string }) => {
  const cleanScript = script.replace(/[*_#]/g, '');
  const scriptWords = cleanScript.split(/\s+/).filter(w => w.length > 0);
  const transcriptWords = realTimeTranscript.toLowerCase().replace(/[.,!?;:"'()]/g, "").split(/\s+/).filter(w => w.length > 0);

  const wordStatuses = React.useMemo(() => {
    const statuses: Array<'pending' | 'correct' | 'current' | 'error'> = [];
    let transcriptIndex = 0;

    for (let i = 0; i < scriptWords.length; i++) {
      const cleanWord = scriptWords[i].toLowerCase().replace(/[.,!?;:"'()]/g, "");
      let status: 'pending' | 'correct' | 'current' | 'error' = 'pending';

      // Find this word in transcript starting from where we left off
      let foundIndex = -1;
      const searchLimit = Math.min(transcriptIndex + 10, transcriptWords.length);
      for (let j = transcriptIndex; j < searchLimit; j++) {
        if (transcriptWords[j] === cleanWord) {
          foundIndex = j;
          break;
        }
      }

      if (foundIndex !== -1) {
        status = 'correct';
        transcriptIndex = foundIndex + 1;
      } else if (i < scriptWords.length - 1) {
        // Check if next word is found (means current word was skipped/mispronounced)
        const nextCleanWord = scriptWords[i + 1].toLowerCase().replace(/[.,!?;:"'()]/g, "");
        for (let j = transcriptIndex; j < searchLimit; j++) {
          if (transcriptWords[j] === nextCleanWord) {
            status = 'error';
            break;
          }
        }
      }

      // Current word is the first pending after all correct ones
      if (status === 'pending' && transcriptIndex > 0 && statuses.every(s => s !== 'pending')) {
        status = 'current';
      }

      statuses.push(status);
    }

    return statuses;
  }, [scriptWords, transcriptWords]);

  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-2 leading-relaxed text-lg md:text-xl font-medium">
      {scriptWords.map((word, i) => {
        const status = wordStatuses[i];

        return (
          <motion.span
            key={i}
            initial={false}
            animate={{
                color: status === 'correct' ? 'hsl(var(--primary))' :
                       status === 'error' ? 'hsl(var(--destructive))' :
                       status === 'current' ? 'hsl(var(--foreground))' : 'rgba(var(--foreground), 0.3)',
                scale: status === 'current' ? 1.05 : 1
            }}
            className={`relative ${status === 'current' ? 'border-b-2 border-primary' : ''} ${status === 'error' ? 'underline decoration-wavy decoration-destructive/50' : ''}`}
          >
            {word}
            {status === 'error' && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-destructive uppercase tracking-tighter">
                    Mispronounced?
                </span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

export const PracticeSession: React.FC = () => {
  const { isRecording, recordingTime, audioUrl, audioBase64, mimeType, startRecording, stopRecording, resetRecording } = useRecorder();
  const { saveSession, downloadSession } = useSessionPersistence();
  const [script, setScript] = useState<string>("Loading script...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setRealTimeTranscript(finalTranscript + interimTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleStartRecording = () => {
    setRealTimeTranscript("");
    resetRecording();
    startRecording();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.error("Recognition start failed:", err);
      }
    }
  };

  const handleStopAndAnalyze = async () => {
    stopRecording();
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Recognition stop failed:", err);
      }
    }
  };

  useEffect(() => {
    loadNewScript();
  }, []);

  const loadNewScript = async () => {
    setScript("Generating a new challenge...");
    setFeedback(null);
    setRealTimeTranscript("");
    resetRecording();
    try {
      const newScript = await generatePracticeScript();
      setScript(newScript);
    } catch (err) {
      setScript("Failed to generate script. Try again.");
    }
  };

  const performAnalysis = async () => {
    if (!audioBase64) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSpeech(audioBase64, mimeType, script);
      setFeedback(result);
      saveSession(script, result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze speech.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!feedback) return;
    downloadSession('scripted', feedback, script);
  };

  useEffect(() => {
    // If we're not recording and have audio data, and haven't analyzed it yet
    if (!isRecording && audioBase64 && !feedback && !isAnalyzing) {
      console.log("Triggering analysis with audioBase64 length:", audioBase64.length);
      performAnalysis();
    }
  }, [isRecording, audioBase64, feedback, isAnalyzing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6 lg:sticky lg:top-24">
        <Card className="border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-primary/5 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Practice Script</CardTitle>
              <Button variant="ghost" size="sm" onClick={loadNewScript} disabled={isRecording}>
                <RefreshCw className="h-4 w-4 mr-2" /> New Script
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 relative min-h-[200px]">
             <ScrollArea className="h-[300px]">
                <div className="space-y-6">
                    <div className={`leading-relaxed font-sans transition-opacity pr-4 ${isRecording ? 'opacity-100' : 'opacity-70'}`}>
                        {feedback ? (
                            <TranscriptWithFeedback 
                                transcription={script.replace(/[*_#]/g, '')} 
                                pronunciationFeedback={feedback.pronunciationFeedback} 
                            />
                        ) : isRecording ? (
                            <RealTimeScriptHighlight script={script} realTimeTranscript={realTimeTranscript} />
                        ) : (
                            <div className="text-lg">
                                <ReactMarkdown>{script}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {isRecording && realTimeTranscript && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-primary/5 rounded-xl border border-primary/20"
                        >
                            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                <Mic className="h-3 w-3 animate-pulse" /> Live Transcription
                            </p>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
                                "{realTimeTranscript}..."
                            </p>
                        </motion.div>
                    )}
                </div>
             </ScrollArea>
            {isRecording && (
                <div className="absolute top-4 right-4 animate-pulse">
                     <Badge variant="destructive" className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        REC {formatTime(recordingTime)}
                    </Badge>
                </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-6 p-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50 transition-all hover:bg-muted/30">
          <AudioVisualizer isRecording={isRecording} />
          
          {!isRecording && !feedback && (
            <div className="text-center space-y-2 mb-2">
                <h4 className="text-sm font-bold text-foreground">Hardware Calibration</h4>
                <p className="text-[10px] text-muted-foreground max-w-[200px]">
                    For best results, hold your phone <span className="text-primary font-bold">6 inches</span> from your mouth.
                </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
            {!isRecording ? (
              <Button size="lg" onClick={handleStartRecording} className="w-full md:w-auto rounded-full px-10 h-14 bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
                <Mic className="mr-2 h-5 w-5" /> Start Recording
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={handleStopAndAnalyze} className="w-full md:w-auto rounded-full px-10 h-14 transition-all active:scale-95 shadow-lg shadow-destructive/20">
                <Square className="mr-2 h-4 w-4" /> Stop & Analyze
              </Button>
            )}
          </div>

          {audioUrl && !isRecording && (
            <div className="w-full space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] font-mono uppercase text-center text-muted-foreground tracking-widest">Instant Playback</p>
              <audio src={audioUrl} controls className="w-full h-10 rounded-xl" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 min-h-[600px]">
        {isAnalyzing ? (
          <Card className="h-[600px] flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500 bg-card/50">
             <div className="relative mb-6">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                </div>
             </div>
             <h3 className="text-xl font-medium mb-2">Analyzing your performance</h3>
             <p className="text-muted-foreground text-sm max-w-xs">Comparing your patterns against professional speaking benchmarks...</p>
          </Card>
        ) : feedback ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {(() => {
              const totalFillers = feedback.fillerWordDetection.reduce((acc, curr) => acc + curr.count, 0);
              return (
                <Card className="overflow-hidden border-2 border-primary/10">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Session Insights</CardTitle>
                        <CardDescription>AI Pattern Analysis</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="h-8 rounded-full text-[10px] gap-1.5"
                        >
                          <Download className="h-3 w-3" /> Save JSON
                        </Button>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {totalFillers} Fillers
                        </Badge>
                        {feedback.microHesitations !== undefined && (
                          <Badge variant="outline" className="font-mono text-[10px] text-blue-500 border-blue-500/20">
                              {feedback.microHesitations} Hesit.
                          </Badge>
                        )}
                        {feedback.environmentalNoise && (
                           <Badge variant="outline" className={`font-mono text-[10px] border-emerald-500/20 ${feedback.environmentalNoise.level > 40 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                              {100 - feedback.environmentalNoise.level}% Env {feedback.environmentalNoise.level > 40 && " (High Noise)"}
                           </Badge>
                        )}
                        {feedback.accentProfile && (
                           <Badge variant="outline" className="font-mono text-[10px] text-indigo-500 border-indigo-500/20">
                              {feedback.accentProfile.detectedAccent} ({feedback.accentProfile.clarityScore}%)
                           </Badge>
                        )}
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">V1.5 FLASH</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 md:gap-3">
                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Confidence</p>
                            <Target className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.confidenceScore}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.confidenceScore} className="h-1 bg-muted" />
                      </div>
                      
                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm">
                        <PaceGauge wpm={feedback.paceAnalysis.wpm} />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Rhythm</p>
                            <Music className="h-2.5 w-2.5 md:h-3 md:w-3 text-blue-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.rhythmScore || 0}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.rhythmScore || 0} className="h-1 bg-blue-500/20" />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Intonation</p>
                            <Volume2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-indigo-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.intonationScore || 0}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.intonationScore || 0} className="h-1 bg-indigo-500/20" />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Breath</p>
                            <Wind className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.breathManagement?.score || 0}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.breathManagement?.score || 0} className="h-1 bg-emerald-500/20" />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Articulation</p>
                            <Zap className="h-2.5 w-2.5 md:h-3 md:w-3 text-amber-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.articulationScore || 0}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.articulationScore || 0} className="h-1 bg-amber-500/20" />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Health</p>
                            <Stethoscope className="h-2.5 w-2.5 md:h-3 md:w-3 text-rose-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{100 - (feedback.vocalHealth?.strainLevel || 0)}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={100 - (feedback.vocalHealth?.strainLevel || 0)} className="h-1 bg-rose-500/20" />
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Sentiment</p>
                            <Smile className="h-2.5 w-2.5 md:h-3 md:w-3 text-orange-500" />
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-base md:text-xl font-bold tracking-tighter">
                                {feedback.sentimentScore !== undefined ? (feedback.sentimentScore > 0 ? "+" : "") + Math.round(feedback.sentimentScore * 100) : "0"}
                            </span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-orange-500 transition-all" 
                                style={{ 
                                    marginLeft: feedback.sentimentScore ? `${feedback.sentimentScore > 0 ? 50 : 50 + (feedback.sentimentScore * 50)}%` : '50%', 
                                    width: feedback.sentimentScore ? `${Math.abs(feedback.sentimentScore * 50)}%` : '2%' 
                                }}
                            />
                        </div>
                      </div>

                      <div className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">Resonance</p>
                            <Target className="h-2.5 w-2.5 md:h-3 md:w-3 text-purple-500" />
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-base md:text-xl font-bold tracking-tighter">{feedback.vocalResonance?.score || 0}</span>
                          <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                        </div>
                        <Progress value={feedback.vocalResonance?.score || 0} className="h-1 bg-purple-500/20" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-wider">
                                <Music className="h-3.5 w-3.5" /> Prosody & Phrasing
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {feedback.phrasingFeedback || feedback.rhythmFeedback}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                                <Heart className="h-3.5 w-3.5" /> Tone: <span className="text-emerald-700">{feedback.emotionalTone?.primary || "Neutral"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {feedback.emotionalTone?.feedback || "Speech appears balanced and controlled."}
                            </p>
                        </div>
                        <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-wider">
                                <Activity className="h-3.5 w-3.5" /> Vocal Health
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {feedback.vocalHealth?.fryPresence ? "⚠️ Glottal fry detected. " : ""}
                                {feedback.vocalHealth?.feedback || "No significant strain detected."}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                   <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold mb-4 px-1">
                        <Play className="h-4 w-4 text-primary fill-primary/20" /> Analysis & Actionable Tips
                    </h4>
                    <div className="space-y-4">
                        {feedback.pronunciationFeedback.length > 0 ? feedback.pronunciationFeedback.map((pf, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i} 
                                className="group p-5 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-destructive/10 rounded-lg">
                                            <Mic className="h-4 w-4 text-destructive" />
                                        </div>
                                        <span className="font-bold text-lg tracking-tight">{pf.word}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/50">MISPRONOUNCED</Badge>
                                </div>
                                <div className="pl-11 space-y-3">
                                    <div className="p-3 bg-muted/30 rounded-xl border border-border/30">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Zap className="h-3 w-3 text-amber-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actionable Correction</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                                            {pf.suggestions}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground pt-1">
                                        <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-primary" /> Visual feedback available on script</span>
                                        <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-amber-500" /> Clinical tip generated</span>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="p-10 text-center border-2 border-dashed rounded-3xl bg-green-500/5 border-green-500/20">
                                <Trophy className="h-10 w-10 text-green-500 mx-auto mb-3" />
                                <h5 className="font-bold text-green-700">Flawless Articulation</h5>
                                <p className="text-sm text-green-600/70">Every word was delivered with precision. Excellent clarity!</p>
                            </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold mb-4 px-1">
                        <Info className="h-4 w-4 text-primary fill-primary/20" /> Filler Frequency Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {feedback.fillerWordDetection.length > 0 ? feedback.fillerWordDetection.map((f, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg border border-border/40 group hover:border-primary/20 transition-all">
                                <span className="text-xs font-mono text-muted-foreground mb-1 group-hover:text-primary transition-colors">"{f.word}"</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold">{f.count}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">x</span>
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                                   <div className="h-full bg-primary/40" style={{ width: `${Math.min((f.count / 10) * 100, 100)}%` }} />
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full p-4 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <p className="text-xs text-green-700 font-medium">Clean delivery! No filler words detected.</p>
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <h4 className="flex items-center gap-2 text-sm font-bold mb-4 text-primary">
                        <Trophy className="h-4 w-4" /> Pro Coaching Tips
                    </h4>
                    <ul className="space-y-3">
                        {feedback.generalAdvice.map((adv, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-3 leading-relaxed">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                                {adv}
                            </li>
                        ))}
                    </ul>
                  </div>

                  {feedback.clinicalInsights && (
                    <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                      <h4 className="flex items-center gap-2 text-sm font-bold mb-3 text-amber-600">
                          <Stethoscope className="h-4 w-4" /> Pathologist's Perspective
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{feedback.clinicalInsights}"
                      </p>
                      {feedback.rhythmFeedback && (
                        <div className="mt-4 pt-4 border-t border-amber-500/10">
                          <p className="text-[11px] font-bold uppercase text-amber-700/60 mb-1 flex items-center gap-1">
                            <Music className="h-3 w-3" /> Rhythm Analysis
                          </p>
                          <p className="text-sm text-muted-foreground underline decoration-amber-500/10">
                            {feedback.rhythmFeedback}
                          </p>
                        </div>
                      )}
                      
                      {feedback.vocalResonance && (
                        <div className="mt-4 pt-4 border-t border-amber-500/10">
                          <p className="text-[11px] font-bold uppercase text-amber-700/60 mb-2 flex items-center gap-2">
                            <Volume2 className="h-3 w-3" /> Resonance Highlight
                          </p>
                          <div className="flex gap-4 items-start bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 hover:border-amber-500/20 transition-all">
                            <div className="flex flex-col items-center gap-1 shrink-0 bg-background px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm">
                                <div className="text-lg font-bold text-amber-600 leading-none">{feedback.vocalResonance.score}</div>
                                <div className="text-[7px] font-mono uppercase text-muted-foreground">Placement</div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-amber-900/40">Coach Note:</span> {feedback.vocalResonance.feedback}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-background flex items-center justify-center text-[8px] font-bold">SLP</div>
                          <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-background flex items-center justify-center text-[8px] font-bold">VC</div>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">Expert consensus reached</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              );
            })()}
            
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Smart Transcript Analysis</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                    <div className="p-6 bg-muted/20 rounded-2xl border border-border/50">
                        <TranscriptWithFeedback 
                            transcription={feedback.transcription} 
                            pronunciationFeedback={feedback.pronunciationFeedback} 
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-destructive rounded-full" /> Pronunciation Issue</div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-muted-foreground/40 rounded-full" /> Clear Speech</div>
                    </div>
                </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 text-center bg-muted/5 border-dashed border-2">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 relative">
                 <Mic className="h-10 w-10 text-muted-foreground/20" />
                 <div className="absolute inset-[-10px] rounded-full border border-border border-dashed animate-[spin_10s_linear_infinite]" />
            </div>
            <h3 className="text-xl font-medium text-foreground">Ready for your performance</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Review the script, find a quiet space, and start recording to receive comprehensive AI analysis.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
