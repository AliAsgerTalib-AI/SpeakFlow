import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, Square, RefreshCw, Loader2, Activity,
  Target, Zap, Trophy, Music, Volume2, Smile, Wind,
  Shield, Star, Heart, Download
} from 'lucide-react';
import { useRecorder } from '@/src/hooks/useRecorder';
import { useSessionPersistence } from '@/src/hooks/useSessionPersistence';
import { analyzeSpeech } from '@/src/lib/gemini';
import { getSpeechRecognition, isSpeechRecognitionSupported } from '@/src/hooks/useSpeechRecognition';
import { TranscriptWithFeedback } from './TranscriptWithFeedback';
import { LiveFeedbackBar } from './LiveFeedbackBar';
import { SpeechFeedback } from '@/src/types';
import { toast } from 'sonner';

export const FreeSpeechSession = () => {
  const { isRecording, startRecording, stopRecording, audioBase64, resetRecording, recordingTime, mimeType, error: recorderError } = useRecorder();
  // Generate random bar heights once for the audio visualizer animation.
  // These remain constant throughout the component's lifetime to create a consistent visual effect.
  const barHeights = useMemo(() => [...Array(12)].map(() => Math.random() * 40 + 10), []);
  const { saveSession, downloadSession } = useSessionPersistence();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Prevent double-fire of analysis
  const analysisTriggeredRef = useRef(false);

  // Show toast notification for recorder errors
  useEffect(() => {
    if (recorderError) {
      toast.error(recorderError.message);
    }
  }, [recorderError]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      console.warn('Speech Recognition is not supported in this browser. Live transcription will not be available.');
      return;
    }

    const recognitionInstance = getSpeechRecognition();
    if (recognitionInstance) {
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        setRealTimeTranscript(finalTranscript + interimTranscript);
      };
      setRecognition(recognitionInstance);
    }
  }, []);

  const handleStartRecording = () => {
    setRealTimeTranscript("");
    setFeedback(null);
    resetRecording();
    analysisTriggeredRef.current = false;
    startRecording();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.error("Recognition start failed", err);
      }
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Recognition stop failed", err);
      }
    }
  };

  const performAnalysis = async () => {
    if (!audioBase64 || analysisTriggeredRef.current) return;

    analysisTriggeredRef.current = true;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSpeech(audioBase64, mimeType, "Analyze this unscripted free speech session.");
      if (!result.success) {
        const error = result.error;
        console.error("Analysis error:", error.type, error.message);

        let userMessage = "Analysis failed. Try recording again.";
        if (error.isMissingFields()) {
          userMessage = "Analysis incomplete: missing required metrics. Try recording again.";
        } else if (error.isParseError()) {
          userMessage = "Could not process API response. Please try again.";
        } else if (error.isValidationError()) {
          userMessage = "Invalid response from analysis service. Please try again.";
        }

        toast.error(userMessage);
        return;
      }

      setFeedback(result.data);
      saveSession("Free Speech Session", result.data);
    } catch (error) {
      console.error("Unexpected error during analysis:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!feedback) return;
    downloadSession('free-speech', feedback);
  };

  // Trigger analysis once when recording stops and audio is ready
  useEffect(() => {
    if (!isRecording && audioBase64 && !feedback && !isAnalyzing) {
      performAnalysis();
    }
  }, [isRecording, audioBase64]);

  const totalFillers = feedback?.fillerWordDetection.reduce((acc, curr) => acc + curr.count, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-10 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="space-y-1">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[9px] font-mono px-2 py-0.5">
            Unscripted Mode
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Free Speech Lab</h2>
          <p className="text-muted-foreground text-xs md:text-sm">Capture up to 60 seconds of natural flow analysis.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetRecording();
            setFeedback(null);
            setRealTimeTranscript("");
            analysisTriggeredRef.current = false;
          }}
          className="rounded-full text-[10px] md:text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Start Over
        </Button>
      </div>

      <Card className="border-border/40 shadow-xl bg-card/50 backdrop-blur-md overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border/10 bg-muted/20 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Activity className={`h-3.5 w-3.5 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
              {isRecording ? 'Capturing Voice...' : 'Studio Booth'}
            </h3>
            {isRecording && (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-[10px] font-bold text-red-500">{recordingTime}s</span>
                </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 min-h-[180px] md:min-h-[260px] flex flex-col items-center justify-center p-6 md:p-8 text-center">
            <AnimatePresence mode="wait">
              {!feedback && !isRecording && !audioBase64 && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4 max-w-xs"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Mic className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h4 className="text-lg md:text-xl font-bold">Ready to record?</h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Talk about anything. We'll analyze your pace, tone, and delivery markers.</p>
                    <p className="text-[10px] text-primary/80 font-medium mt-3 bg-primary/5 py-1 px-3 rounded-full border border-primary/10 inline-block">
                        Tip: Hold mic 6" away at an angle
                    </p>
                  </div>
                </motion.div>
              )}

              {isRecording && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-xl space-y-6 md:space-y-8"
                >
                  <div className="flex justify-center gap-1.5 h-10 items-center">
                    {barHeights.map((height, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [12, height, 12] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.08 }}
                        className="w-1 md:w-1.5 bg-primary/30 rounded-full"
                      />
                    ))}
                  </div>
                  <div className="bg-primary/5 p-5 md:p-6 rounded-2xl border border-primary/20 bg-muted/30 max-h-32 md:max-h-48 overflow-y-auto">
                    <p className="italic text-sm md:text-lg font-medium text-foreground/80 leading-relaxed">
                      "{realTimeTranscript || 'Listening for your voice...'}"
                    </p>
                  </div>
                  <LiveFeedbackBar
                    isRecording={isRecording}
                    realTimeTranscript={realTimeTranscript}
                    recordingTime={recordingTime}
                  />
                </motion.div>
              )}

              {audioBase64 && !isRecording && !feedback && (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm space-y-6"
                >
                  <div className="p-8 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Trophy className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto relative z-10" />
                    <div className="space-y-2 relative z-10">
                      <h4 className="text-lg md:text-xl font-bold">Voice Captured</h4>
                      <p className="text-[11px] md:text-xs text-muted-foreground">Successfully recorded {recordingTime}s of speech. Ready for AI diagnostic.</p>
                    </div>
                    <Button 
                      onClick={performAnalysis} 
                      disabled={isAnalyzing}
                      size="lg"
                      className="w-full rounded-2xl h-12 md:h-14 bg-primary text-white shadow-xl shadow-primary/20 relative z-10 font-bold"
                    >
                      {isAnalyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Deep Analysis...</> : <><Zap className="mr-2 h-5 w-5 fill-current" /> Analyze Speech Pattern</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {feedback && (
              <div className="w-full text-left space-y-6 md:space-y-8 animate-in fade-in duration-700">
                <div className="p-4 md:p-6 bg-muted/40 rounded-2xl border border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Transcription Audit</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 rounded-full text-[9px] gap-1.5 px-3 bg-background"
                    >
                      <Download className="h-3 w-3" /> Save JSON
                    </Button>
                  </div>
                  <TranscriptWithFeedback 
                    transcription={feedback.transcription || ""} 
                    pronunciationFeedback={feedback.pronunciationFeedback} 
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 md:gap-3">
                  {[
                    { label: 'Confidence', val: feedback.confidenceScore, icon: Target, color: 'text-primary' },
                    { label: 'Rhythm', val: feedback.rhythmScore, icon: Music, color: 'text-blue-500' },
                    { label: 'Intonation', val: feedback.intonationScore, icon: Volume2, color: 'text-indigo-500' },
                    { label: 'Articulation', val: feedback.articulationScore, icon: Zap, color: 'text-amber-500' },
                    { label: 'Resonance', val: feedback.vocalResonance.score, icon: Activity, color: 'text-purple-500' },
                    { label: 'Health', val: 100 - (feedback.vocalHealth?.strainLevel || 0), icon: Heart, color: 'text-rose-500' },
                    { label: 'Sentiment', val: Math.round(feedback.sentimentScore * 100), icon: Smile, color: 'text-orange-500', isScore: false },
                    { label: 'Breath', val: feedback.breathManagement.score, icon: Wind, color: 'text-emerald-500' },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 bg-card/60 rounded-xl border border-border/50 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">{stat.label}</p>
                        <stat.icon className={`h-3 w-3 ${stat.color}`} />
                      </div>
                      <div className="flex items-end gap-0.5">
                        <span className="text-base md:text-xl font-bold tracking-tighter">
                          {stat.isScore === false ? (stat.val > 0 ? "+" : "") + stat.val : stat.val}
                        </span>
                        <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">{stat.isScore === false ? "" : "%"}</span>
                      </div>
                      <Progress value={Math.abs(stat.isScore === false ? stat.val : stat.val)} className={`h-1 ${stat.color.replace('text-', 'bg-')}/10`} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-4 md:p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <h4 className="font-bold text-xs md:text-sm mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" /> Delivery Insights
                    </h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed italic">
                        {feedback.clinicalInsights}
                    </p>
                  </div>
                  <div className="p-4 md:p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <h4 className="font-bold text-xs md:text-sm mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" /> Professional Metrics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-amber-500/20">{totalFillers} Fillers Detected</Badge>
                        <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-amber-500/20">Tone: {feedback.emotionalTone.primary}</Badge>
                        <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-amber-500/20">Intensity: {feedback.emotionalTone.intensity}%</Badge>
                        {feedback.microHesitations !== undefined && (
                          <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-blue-500/20">{feedback.microHesitations} Hesitations</Badge>
                        )}
                        {feedback.environmentalNoise && (
                           <Badge variant="outline" className={`bg-card/80 text-[10px] font-mono border-emerald-500/20 ${feedback.environmentalNoise.level > 40 ? 'text-amber-500' : ''}`}>
                             Studio: {100 - feedback.environmentalNoise.level}% Clear {feedback.environmentalNoise.level > 40 && "⚠️"}
                           </Badge>
                        )}
                        {feedback.plosiveAnalysis && (
                           <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-cyan-500/20">Plosives: {feedback.plosiveAnalysis.quality}%</Badge>
                        )}
                        {feedback.accentProfile && (
                           <Badge variant="outline" className="bg-card/80 text-[10px] font-mono border-indigo-500/20">Accent: {feedback.accentProfile.detectedAccent}</Badge>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!feedback && (
            <div className="p-6 md:p-10 bg-muted/20 border-t border-border/10">
              <div className="flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="stop"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full flex justify-center"
                    >
                      <Button 
                        onClick={handleStopRecording} 
                        variant="destructive" 
                        size="lg" 
                        className="rounded-full px-10 h-16 shadow-xl shadow-destructive/20 text-lg font-bold group w-full max-w-xs"
                      >
                        <Square className="mr-2 h-5 w-5 fill-current group-hover:scale-110 transition-transform" /> Stop & Finish
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="start"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full flex justify-center"
                    >
                      <Button 
                        onClick={handleStartRecording} 
                        size="lg" 
                        className="rounded-full px-10 h-16 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 text-lg font-bold group w-full max-w-xs"
                      >
                        <Mic className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> 
                        {audioBase64 ? "Record Again" : "Start Capturing"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-[10px] md:text-xs text-muted-foreground/60">
                  {isRecording ? 'Click to stop and begin AI analysis' : 'Your audio is processed locally for privacy'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
