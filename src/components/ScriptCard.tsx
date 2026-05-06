import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { RealTimeScriptHighlight } from './RealTimeScriptHighlight';
import { TranscriptWithFeedback } from './TranscriptWithFeedback';
import { SpeechFeedback } from '@/src/types';
import { computeWordStatuses } from '@/src/lib/wordMatching';
import { parseScript } from '@/src/lib/scriptParser';

interface ScriptCardProps {
  script: string;
  isRecording: boolean;
  recordingTime: number;
  feedback: SpeechFeedback | null;
  realTimeTranscript: string;
  onLoadNewScript?: () => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  isRecording,
  recordingTime,
  feedback,
  realTimeTranscript,
  onLoadNewScript,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<{
    currentWordIndex: number;
    currentWord: string;
    scrollTop: number;
    scrollHeight: number;
    wordElementsFound: number;
    transcriptWords: number;
  } | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isRecording || !scrollViewportRef.current) {
      setDebugInfo(null);
      return;
    }

    const cleanScript = script.replace(/[*_#](/g, '');
    const scriptWords = cleanScript.split(/\s+/).filter(w => w.length > 0);
    const transcriptWords = realTimeTranscript
      .toLowerCase()
      .replace(/[.,!?;:"'()]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);

    const wordStatuses = computeWordStatuses(scriptWords, transcriptWords);
    const currentWordIndex = wordStatuses.findIndex(status => status === 'current');

    const wordElements = scrollViewportRef.current.querySelectorAll('span[data-word-index]');
    const currentWordElement = wordElements[currentWordIndex] as HTMLElement | undefined;

    setDebugInfo({
      currentWordIndex,
      currentWord: currentWordElement?.textContent || '—',
      scrollTop: scrollViewportRef.current.scrollTop,
      scrollHeight: scrollViewportRef.current.scrollHeight,
      wordElementsFound: wordElements.length,
      transcriptWords: transcriptWords.length,
    });

    if (currentWordIndex === -1 || !currentWordElement || wordElements.length === 0) {
      return;
    }

    currentWordElement.scrollIntoView({
      behavior: 'auto',
      block: 'center'
    });
  }, [isRecording, realTimeTranscript, script]);

  const { instructions, readingText } = parseScript(script);

  return (
    <div className="space-y-4">
      {/* Instructions Box */}
      <Card className="border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 pb-3">
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <div className="text-sm leading-relaxed text-foreground/80">
            <ReactMarkdown>{instructions}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Reading Text Box */}
      <Card className="border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Read This Text
            </CardTitle>
            {onLoadNewScript && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadNewScript}
                disabled={isRecording}
                aria-label="Generate a new practice script"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> New
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 relative">
          <div className="h-[300px] overflow-y-auto rounded-lg" ref={scrollViewportRef}>
            <div className="space-y-6 pr-4">
              <div
                className={`leading-relaxed font-sans transition-opacity ${isRecording ? 'opacity-100' : 'opacity-70'}`}
              >
                {feedback ? (
                  <TranscriptWithFeedback
                    transcription={readingText.replace(/[*_#]/g, '')}
                    pronunciationFeedback={feedback.pronunciationFeedback}
                  />
                ) : isRecording ? (
                  <RealTimeScriptHighlight script={readingText} realTimeTranscript={realTimeTranscript} />
                ) : (
                  <div className="text-lg">
                    <ReactMarkdown>{readingText}</ReactMarkdown>
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
          </div>
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

      {/* Debug Panel */}
      {isRecording && debugInfo && (
        <Card className="border-2 border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <CardHeader className="bg-amber-500/10 pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-wider text-amber-600">
              Auto-Scroll Debug
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-foreground/70">
              <div>Current Word:</div>
              <div className="text-primary font-semibold truncate">{debugInfo.currentWord}</div>

              <div>Word Index:</div>
              <div className="text-blue-500 font-semibold">{debugInfo.currentWordIndex}</div>

              <div>Word Elements:</div>
              <div className={debugInfo.wordElementsFound > 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                {debugInfo.wordElementsFound}
              </div>

              <div>Transcript Words:</div>
              <div className="text-purple-500 font-semibold">{debugInfo.transcriptWords}</div>

              <div>Scroll Pos:</div>
              <div className="text-cyan-500 font-semibold">
                {debugInfo.scrollTop} / {debugInfo.scrollHeight}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
