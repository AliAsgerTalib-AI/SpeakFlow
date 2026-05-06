import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  audioUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingTime,
  audioUrl,
  onStartRecording,
  onStopRecording,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50 transition-all hover:bg-muted/30">
      {!isRecording && !audioUrl && (
        <p className="text-[10px] text-muted-foreground max-w-[200px] text-center">
          For best results, hold your phone <span className="text-primary font-bold">6 inches</span> from your mouth.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={onStartRecording}
            aria-label="Start recording your speech"
            className="w-full md:w-auto rounded-full px-10 h-14 bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Mic className="mr-2 h-5 w-5" /> Start Recording
          </Button>
        ) : (
          <Button
            size="lg"
            variant="destructive"
            onClick={onStopRecording}
            aria-label="Stop recording and analyze speech"
            className="w-full md:w-auto rounded-full px-10 h-14 transition-all active:scale-95 shadow-lg shadow-destructive/20"
          >
            <Square className="mr-2 h-4 w-4" /> Stop & Analyze
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="absolute top-4 right-4 animate-pulse">
          <Badge variant="destructive" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            REC {formatTime(recordingTime)}
          </Badge>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="w-full space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[10px] font-mono uppercase text-center text-muted-foreground tracking-widest">
            Instant Playback
          </p>
          <audio src={audioUrl} controls className="w-full h-10 rounded-xl" />
        </div>
      )}
    </div>
  );
};
