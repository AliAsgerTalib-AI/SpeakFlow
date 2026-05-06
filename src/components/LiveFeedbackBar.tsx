import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Zap, Music, AlertCircle } from 'lucide-react';

interface LiveFeedbackBarProps {
  isRecording: boolean;
  realTimeTranscript: string;
  recordingTime: number;
}

const FILLER_WORDS = new Set([
  'um', 'uh', 'like', 'you know', 'so', 'actually', 'basically',
  'right', 'i mean', 'well', 'literally', 'basically', 'honestly',
]);

export const LiveFeedbackBar: React.FC<LiveFeedbackBarProps> = ({
  isRecording,
  realTimeTranscript,
  recordingTime,
}) => {
  const metrics = useMemo(() => {
    if (!isRecording || recordingTime === 0) {
      return { wpm: 0, fillerCount: 0, paceStatus: 'idle' as const };
    }

    const words = realTimeTranscript.trim().split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const minutes = Math.max(recordingTime / 60, 1 / 60);
    const wpm = Math.round(wordCount / minutes);

    let fillerCount = 0;
    const lowerTranscript = realTimeTranscript.toLowerCase();
    FILLER_WORDS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = lowerTranscript.match(regex);
      if (matches) fillerCount += matches.length;
    });

    let paceStatus: 'slow' | 'good' | 'fast' | 'idle' = 'idle';
    if (wpm > 0) {
      if (wpm < 115) paceStatus = 'slow';
      else if (wpm <= 165) paceStatus = 'good';
      else paceStatus = 'fast';
    }

    return { wpm, fillerCount, paceStatus };
  }, [isRecording, realTimeTranscript, recordingTime]);

  if (!isRecording) return null;

  const getPaceColor = () => {
    switch (metrics.paceStatus) {
      case 'slow':
        return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'good':
        return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'fast':
        return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-muted-foreground border-border/30 bg-muted/10';
    }
  };

  const getPaceLabel = () => {
    switch (metrics.paceStatus) {
      case 'slow':
        return 'Too Slow';
      case 'good':
        return 'Good Pace';
      case 'fast':
        return 'Too Fast';
      default:
        return 'Measuring...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-2xl border border-border/30"
    >
      {/* WPM Badge */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Badge
          variant="outline"
          className={`gap-2 px-3 py-1.5 cursor-default ${getPaceColor()} border font-mono`}
          title="Real-time words per minute"
        >
          <Zap className="h-3 w-3" />
          <span className="font-bold">{metrics.wpm}</span> WPM
        </Badge>
      </motion.div>

      {/* Pace Status Badge */}
      <Badge
        variant="outline"
        className={`gap-2 px-3 py-1.5 border font-mono text-[11px] ${getPaceColor()}`}
        title={`Speaking pace: ${getPaceLabel()}`}
      >
        <motion.div
          animate={{
            scale: metrics.paceStatus !== 'good' ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.6,
            repeat: metrics.paceStatus !== 'good' ? Infinity : 0,
            repeatDelay: 1,
          }}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              metrics.paceStatus === 'slow'
                ? '#3b82f6'
                : metrics.paceStatus === 'good'
                  ? '#10b981'
                  : '#f59e0b',
          }}
        />
        {getPaceLabel()}
      </Badge>

      {/* Filler Words Badge */}
      {metrics.fillerCount > 0 && (
        <Badge
          variant="outline"
          className="gap-2 px-3 py-1.5 border font-mono text-amber-600 border-amber-500/30 bg-amber-500/10"
          title={`Filler words detected: ${metrics.fillerCount}`}
        >
          <AlertCircle className="h-3 w-3 animate-pulse" />
          <span className="font-bold">{metrics.fillerCount}</span> Fillers
        </Badge>
      )}

      {/* Breathing Rhythm Guide */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-muted/30">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.25, 0.5, 0.75, 1],
            repeatDelay: 0,
          }}
          className="w-2 h-2 rounded-full bg-primary"
        />
        <span className="text-[11px] font-mono text-muted-foreground">Breathing Rhythm</span>
      </div>
    </motion.div>
  );
};
