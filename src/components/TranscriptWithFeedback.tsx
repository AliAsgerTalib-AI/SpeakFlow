interface Props {
  transcription: string;
  pronunciationFeedback: { word: string; suggestions: string }[];
  tooltipLabel?: string;
}

export const TranscriptWithFeedback = ({
  transcription,
  pronunciationFeedback,
  tooltipLabel = "Correction",
}: Props) => {
  const words = transcription.split(/\s+/);
  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-2 leading-relaxed text-base md:text-lg font-medium">
      {words.map((word, i) => {
        const cleanWord = word.replace(/[.,!?;:"'()]/g, "").toLowerCase();
        const feedback = pronunciationFeedback.find(f => f.word.toLowerCase() === cleanWord);

        if (feedback) {
          return (
            <span key={i} className="group relative inline-block">
              <span className="text-destructive border-b-2 border-destructive/30 cursor-help hover:bg-destructive/5 px-1 -mx-1 rounded transition-all">
                {word}
              </span>
              <span className="absolute bottom-full left-0 mb-2 p-3 bg-card text-card-foreground text-[10px] rounded-xl border border-border shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-95 origin-bottom-left group-hover:scale-100 whitespace-normal min-w-[180px] z-[60] pointer-events-none">
                <span className="flex items-center gap-2 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">{tooltipLabel}</span>
                </span>
                <p className="font-sans text-[11px] leading-relaxed text-foreground/90 italic">
                  "{feedback.suggestions}"
                </p>
                <span className="absolute top-full left-4 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
              </span>
            </span>
          );
        }
        return <span key={i} className="text-foreground/80">{word}</span>;
      })}
    </div>
  );
};
