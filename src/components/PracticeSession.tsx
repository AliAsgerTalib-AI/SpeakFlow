import React, { useState, useEffect, useRef } from 'react';
import { useRecorder } from '@/src/hooks/useRecorder';
import { useSessionPersistence } from '@/src/hooks/useSessionPersistence';
import { analyzeSpeech, generatePracticeScript } from '@/src/lib/gemini';
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
import { PromptDisplay } from './PromptDisplay';

export const PracticeSession: React.FC = () => {
  const { isRecording, recordingTime, audioUrl, audioBase64, mimeType, error: recorderError, startRecording, stopRecording, resetRecording } = useRecorder();
  const { saveSession, downloadSession } = useSessionPersistence();
  const [script, setScript] = useState<string>("Loading script...");
  const [scriptPrompt, setScriptPrompt] = useState<string>("");
  const [scriptMode, setScriptMode] = useState<'generate' | 'custom'>('generate');
  const [customScriptInput, setCustomScriptInput] = useState<string>("");
  const [customScriptSubmitted, setCustomScriptSubmitted] = useState(false);
  const [sessionMode, setSessionMode] = useState<'general' | 'interview' | 'presentation' | 'sales'>('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string>("");

  // Prevent double-fire of analysis
  const analysisTriggeredRef = useRef(false);

  // Show toast notification for recorder errors
  React.useEffect(() => {
    if (recorderError) {
      toast.error(recorderError.message);
    }
  }, [recorderError]);


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
    setScriptPrompt("");
    setFeedback(null);
    setRealTimeTranscript("");
    resetRecording();
    analysisTriggeredRef.current = false;
    try {
      const result = await generatePracticeScript(undefined, sessionMode);
      setScript(result.script);
      setScriptPrompt(result.prompt);
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
    startRecording();
  };

  const handleStopAndAnalyze = async () => {
    stopRecording();
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
          <>
            {scriptMode === 'generate' && scriptPrompt && (
              <PromptDisplay prompt={scriptPrompt} title="Challenge Prompt" />
            )}
            <ScriptCard
              script={script}
              isRecording={isRecording}
              recordingTime={recordingTime}
              feedback={feedback}
              realTimeTranscript={realTimeTranscript}
              onLoadNewScript={scriptMode === 'generate' ? loadNewScript : undefined}
            />
          </>
        )}

        <RecordingControls
          isRecording={isRecording}
          recordingTime={recordingTime}
          audioUrl={audioUrl}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopAndAnalyze}
        />

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
          <FeedbackResults feedback={feedback} script={script} onDownload={handleDownload} mode={sessionMode} />
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
