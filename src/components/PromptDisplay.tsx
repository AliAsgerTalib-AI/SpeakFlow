import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

interface PromptDisplayProps {
  prompt: string;
  title?: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt, title = "LLM System Prompt" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-border/50 bg-muted/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
          <span className="text-[9px] text-muted-foreground/60">({prompt.split('\n').length} lines)</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 border-t border-border/30">
          <pre className="text-[10px] text-foreground/70 leading-relaxed whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto bg-background/50 p-3 rounded border border-border/20">
            {prompt}
          </pre>
        </CardContent>
      )}
    </Card>
  );
};
