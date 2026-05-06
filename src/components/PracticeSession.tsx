import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '@/src/hooks/useRecorder';
import { useSessionPersistence } from '@/src/hooks/useSessionPersistence';
import { analyzeSpeech, generatePracticeScript } from '@/src/lib/gemini';
import { getSpeechRecognition, isSpeechRecognitionSupported } from '@/src/hooks/useSpeechRecognition';
import { parseScript } from '@/src/lib/scriptParser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mic, Upload, Briefcase, Monitor, TrendingUp } from 'lucide-react';
import { SpeechFeedback } from '@/src/types';
import { toast } from 'sonner';
import { ScriptCard } from './ScriptCard';
import { RecordingControls } from './RecordingControls';
import { FeedbackResults } from './FeedbackResults';
import { LiveFeedbackBar } from './LiveFeedbackBar';

export const PracticeSession: React.FC = () => {
  const { isRecording, recordingTime, audioUrl, audioBase64, mimeType, error: recorderError, startRecording, stopRecording, resetRecording } = useRecorder();
  const { saveSession, downloadSession } = useSessionPersistence();
  const [script, setScript] = useState<string>("Loading script...");
  const [scriptMode, setScriptMode] = useState<'generate' | 'custom'>('generate');
  const [customScriptInput, setCustomScriptInput] = useState<string>("");
  const [customScriptSubmitted, setCustomScriptSubmitted] = useState(false);
  const [sessionMode, setSessionMode] = useState<'general' | 'interview' | 'presentation' | 'sales'>('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechRecognitionStatus, setSpeechRecognitionStatus] = useState<string>("Checking support...");

  // Prevent double-fire of analysis
  const analysisTriggeredRef = useRef(false);
  // Track if we should keep recognition running
  const keepRecognitionRunningRef = useRef(false);
  // Track last restart time to prevent loop
  const lastRestartTimeRef = useRef(0);

  // Show toast notification for recorder errors
  React.useEffect(() => {
    if (recorderError) {
      toast.error(recorderError.message);
    }
  }, [recorderError]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setSpeechRecognitionStatus('❌ Not supported');
      console.warn('Speech Recognition is not supported in this browser. Live transcription will not be available.');
      return;
    }

    setSpeechRecognitionStatus('✓ Supported');

    const recognitionInstance = getSpeechRecognition();
    if (recognitionInstance) {
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setSpeechRecognitionStatus('🎙️ Listening...');
        console.log('Speech recognition started');
      };

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setSpeechRecognitionStatus('📝 Transcribing...');
        setRealTimeTranscript(finalTranscript + interimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        setSpeechRecognitionStatus(`❌ Error: ${event.error}`);
        console.error('Speech recognition error:', event.error);
      };

      recognitionInstance.onabort = () => {
        setSpeechRecognitionStatus('⚠️ Aborted');
        console.log('Speech recognition aborted');
        if (keepRecognitionRunningRef.current) {
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (err) {
              console.error('Failed to restart after abort:', err);
            }
          }, 500);
        }
      };

      recognitionInstance.onend = () => {
        setSpeechRecognitionStatus('⏸️ Stopped');
        console.log('Speech recognition ended');

        // Restart if we're still recording (work around mobile API issues)
        if (keepRecognitionRunningRef.current) {
          const now = Date.now();
          const timeSinceLastRestart = now - lastRestartTimeRef.current;

          // Only restart if at least 500ms have passed since last restart (prevent rapid restart loop)
          if (timeSinceLastRestart > 500) {
            console.log('Restarting speech recognition after silence...');
            lastRestartTimeRef.current = now;
            try {
              recognitionInstance.start();
            } catch (err) {
              console.error('Failed to restart recognition:', err);
              setSpeechRecognitionStatus(`❌ Restart failed: ${err}`);
            }
          }
        }
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    loadNewScript();
  }, []);

  useEffect(() => {
    if (scriptMode === 'generate') {
      loadNewScript();
    }
    setCustomScriptInput("");
    setCustomScriptSubmitted(false);
  }, [sessionMode, scriptMode]);

  const loadNewScript = async () => {
    if (scriptMode === 'custom') return;
    setScript("Generating a new challenge...");
    setFeedback(null);
    setRealTimeTranscript("");
    resetRecording();
    analysisTriggeredRef.current = false;
    try {
      const newScript = await generatePracticeScript(undefined, sessionMode);
      setScript(newScript);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to generate script:", errorMsg);
      setScript("Failed to generate script. Try again.");
      toast.error(`Script generation failed: ${errorMsg}`);
    }
  };

  const handleUseCustomScript = () => {
    if (!customScriptInput.trim()) {
      toast.error("Please enter a script.");
      return;
    }
    setScript(customScriptInput);
    setCustomScriptSubmitted(true);
    setFeedback(null);
    setRealTimeTranscript("");
    resetRecording();
    analysisTriggeredRef.current = false;
    toast.success("Script loaded!");
  };

  const handleStartRecording = () => {
    setRealTimeTranscript("");
    resetRecording();
    analysisTriggeredRef.current = false;
    keepRecognitionRunningRef.current = true;
    lastRestartTimeRef.current = Date.now();
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
    keepRecognitionRunningRef.current = false;
    stopRecording();
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Recognition stop failed:", err);
      }
    }
  };

  const performAnalysis = async () => {
    if (!audioBase64 || analysisTriggeredRef.current) return;

    analysisTriggeredRef.current = true;
    setIsAnalyzing(true);
    try {
      const { readingText } = parseScript(script);
      const result = await analyzeSpeech(audioBase64, mimeType, readingText);
      if (!result.success) {
        const error = result.error;
        console.error("Analysis error:", error.type, error.message);

        let userMessage = "Failed to analyze speech.";
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
      saveSession(script, result.data);
    } catch (err) {
      console.error("Unexpected error during analysis:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!feedback) return;
    downloadSession('scripted', feedback, script);
  };

  // Trigger analysis once when recording stops and audio is ready
  useEffect(() => {
    if (!isRecording && audioBase64 && !feedback && !isAnalyzing) {
      performAnalysis();
    }
  }, [isRecording, audioBase64]);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Session Mode Selector */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sessionMode === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionMode('general')}
            title="General public speaking practice"
            className="flex-1 min-w-[80px]"
          >
            <Mic className="h-3.5 w-3.5 mr-1" /> General
          </Button>
          <Button
            variant={sessionMode === 'interview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionMode('interview')}
            title="Job interview preparation"
            className="flex-1 min-w-[80px]"
          >
            <Briefcase className="h-3.5 w-3.5 mr-1" /> Interview
          </Button>
          <Button
            variant={sessionMode === 'presentation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionMode('presentation')}
            title="Presentation and pitch practice"
            className="flex-1 min-w-[80px]"
          >
            <Monitor className="h-3.5 w-3.5 mr-1" /> Presentation
          </Button>
          <Button
            variant={sessionMode === 'sales' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionMode('sales')}
            title="Sales pitch practice"
            className="flex-1 min-w-[80px]"
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Sales Pitch
          </Button>
        </div>

        {/* Mode Context Tip */}
        {sessionMode !== 'general' && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 text-xs text-muted-foreground leading-relaxed">
            {sessionMode === 'interview' && (
              <>
                <span className="font-semibold text-primary">Interview Mode:</span> Focus on concise, structured answers.
                Try the STAR method (Situation, Task, Action, Result) for behavioral questions.
              </>
            )}
            {sessionMode === 'presentation' && (
              <>
                <span className="font-semibold text-primary">Presentation Mode:</span> Emphasize clarity, engagement,
                and a compelling call-to-action. Start with a hook to capture attention.
              </>
            )}
            {sessionMode === 'sales' && (
              <>
                <span className="font-semibold text-primary">Sales Mode:</span> Build conviction through a clear value
                proposition. Use confident pacing and persuasive language. End with a strong CTA.
              </>
            )}
          </div>
        )}

        {/* Script Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={scriptMode === 'generate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setScriptMode('generate');
              setCustomScriptSubmitted(false);
              loadNewScript();
            }}
            className="flex-1"
          >
            AI Generate
          </Button>
          <Button
            variant={scriptMode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScriptMode('custom')}
            className="flex-1 gap-2"
          >
            <Upload className="h-3.5 w-3.5" /> Custom Script
          </Button>
        </div>

        {scriptMode === 'custom' && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
            <textarea
              value={customScriptInput}
              onChange={(e) => setCustomScriptInput(e.target.value)}
              placeholder="Paste or type your script here... (30-60 seconds of content recommended)"
              className="w-full min-h-[150px] p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <Button
              onClick={handleUseCustomScript}
              className="w-full"
              disabled={!customScriptInput.trim()}
            >
              Use This Script
            </Button>
          </div>
        )}

        {(scriptMode === 'generate' || customScriptSubmitted) && (
          <ScriptCard
            script={script}
            isRecording={isRecording}
            recordingTime={recordingTime}
            feedback={feedback}
            realTimeTranscript={realTimeTranscript}
            onLoadNewScript={scriptMode === 'generate' ? loadNewScript : undefined}
          />
        )}

        <RecordingControls
          isRecording={isRecording}
          recordingTime={recordingTime}
          audioUrl={audioUrl}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopAndAnalyze}
        />

        <Card className="p-4 bg-muted/20 border-2 border-border/50">
          <div className="text-center text-sm">
            <p className="font-mono text-xs text-muted-foreground mb-1">Speech Recognition Status</p>
            <p className="text-base font-semibold text-foreground">{speechRecognitionStatus}</p>
          </div>
        </Card>

        <LiveFeedbackBar
          isRecording={isRecording}
          realTimeTranscript={realTimeTranscript}
          recordingTime={recordingTime}
        />
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
            <p className="text-muted-foreground text-sm max-w-xs">
              Comparing your patterns against professional speaking benchmarks...
            </p>
          </Card>
        ) : feedback ? (
          <FeedbackResults feedback={feedback} script={script} onDownload={handleDownload} />
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
