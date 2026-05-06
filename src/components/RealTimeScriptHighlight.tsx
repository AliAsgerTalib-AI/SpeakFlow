import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { computeWordStatuses } from '@/src/lib/wordMatching';

interface RealTimeScriptHighlightProps {
  script: string;
  realTimeTranscript: string;
}

export const RealTimeScriptHighlight: React.FC<RealTimeScriptHighlightProps> = ({
  script,
  realTimeTranscript,
}) => {
  const cleanScript = useMemo(() => script.replace(/[*_#]/g, ''), [script]);
  const scriptWords = useMemo(() => cleanScript.split(/\s+/).filter(w => w.length > 0), [cleanScript]);
  const transcriptWords = useMemo(
    () => realTimeTranscript.toLowerCase().replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(w => w.length > 0),
    [realTimeTranscript]
  );

  const wordStatuses = useMemo(
    () => computeWordStatuses(scriptWords, transcriptWords),
    [scriptWords, transcriptWords]
  );

  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-2 leading-relaxed text-lg md:text-xl font-medium">
      {scriptWords.map((word, i) => {
        const status = wordStatuses[i];

        return (
          <motion.span
            key={i}
            initial={false}
            data-word-index={i}
            animate={{
              color:
                status === 'correct'
                  ? 'hsl(var(--primary))'
                  : status === 'error'
                    ? 'hsl(var(--destructive))'
                    : status === 'current'
                      ? 'hsl(var(--foreground))'
                      : 'rgba(var(--foreground), 0.3)',
              scale: status === 'current' ? 1.05 : 1,
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
