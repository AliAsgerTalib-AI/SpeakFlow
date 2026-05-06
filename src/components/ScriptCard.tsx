import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TranscriptWithFeedback } from './TranscriptWithFeedback';
import { SpeechFeedback } from '@/src/types';
import { parseScript } from '@/src/lib/scriptParser';

interface ScriptCardProps {
  script: string;
  scriptPrompt?: string;
  isRecording: boolean;
  recordingTime: number;
  feedback: SpeechFeedback | null;
  realTimeTranscript: string;
  onLoadNewScript?: () => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  scriptPrompt,
  isRecording,
  recordingTime,
  feedback,
  realTimeTranscript,
  onLoadNewScript,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const { readingText } = parseScript(script);

  return (
    <div className="space-y-4">
      {scriptPrompt && (
        <Card className="border border-border/50 bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Prompt</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{scriptPrompt}</p>
          </CardContent>
        </Card>
      )}

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
                ) : (
                  <div className="text-lg">
                    <ReactMarkdown>{readingText}</ReactMarkdown>
                  </div>
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
    </div>
  );
};
