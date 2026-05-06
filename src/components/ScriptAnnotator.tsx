import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Loader2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Wand2,
  Clock,
  Lightbulb,
  FileJson,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { annotateScript } from '@/src/lib/gemini';
import { ScriptAnnotation, AnnotationSegment, AnnotationInstructionType } from '@/src/types';

const INSTRUCTION_CONFIG: Record<
  AnnotationInstructionType,
  { label: string; className: string; dotClass: string }
> = {
  PAUSE: {
    label: 'PAUSE',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  STRESS: {
    label: 'STRESS',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  BREATH: {
    label: 'BREATH',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  LOOK_AROUND: {
    label: 'LOOK AROUND',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  SLOW_DOWN: {
    label: 'SLOW DOWN',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-400',
  },
  SPEED_UP: {
    label: 'SPEED UP',
    className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  LOWER_VOICE: {
    label: 'LOWER VOICE',
    className: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-400',
  },
  PROJECT_VOICE: {
    label: 'PROJECT VOICE',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
    dotClass: 'bg-red-400',
  },
};

const AnnotationBadge: React.FC<{
  instruction: AnnotationInstructionType;
  detail: string;
}> = ({ instruction, detail }) => {
  const config = INSTRUCTION_CONFIG[instruction] ?? {
    label: instruction,
    className: 'bg-muted/30 text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  };

  return (
    <span className="group relative inline-flex items-center mx-1 my-0.5 align-middle">
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
          text-[10px] font-mono font-semibold uppercase tracking-wider
          cursor-default select-none transition-all
          hover:scale-105 hover:shadow-lg
          ${config.className}
        `}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
      {/* Tooltip */}
      <span className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
        bg-card border border-border rounded-xl shadow-2xl
        px-3 py-2 text-[11px] leading-relaxed text-foreground/90
        w-52 text-center
        opacity-0 scale-95 origin-bottom pointer-events-none
        group-hover:opacity-100 group-hover:scale-100
        transition-all duration-150
      ">
        {detail}
        <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
      </span>
    </span>
  );
};

const AnnotatedScriptRenderer: React.FC<{ segments: AnnotationSegment[] }> = ({ segments }) => {
  return (
    <div className="leading-8 text-sm text-foreground/85 font-sans">
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {segment.content}
            </span>
          );
        }
        return (
          <AnnotationBadge
            key={i}
            instruction={segment.instruction as AnnotationInstructionType}
            detail={segment.detail}
          />
        );
      })}
    </div>
  );
};

const InstructionLegend: React.FC = () => (
  <div className="flex flex-wrap gap-2">
    {(Object.keys(INSTRUCTION_CONFIG) as AnnotationInstructionType[]).map((key) => {
      const cfg = INSTRUCTION_CONFIG[key];
      return (
        <span
          key={key}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-mono font-semibold uppercase tracking-wider ${cfg.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
          {cfg.label}
        </span>
      );
    })}
  </div>
);

export const ScriptAnnotator: React.FC = () => {
  const [scriptText, setScriptText] = useState('');
  const [annotation, setAnnotation] = useState<ScriptAnnotation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnnotate = async () => {
    const trimmed = scriptText.trim();
    if (!trimmed) {
      toast.error('Please paste or upload a script first.');
      return;
    }
    if (trimmed.length < 50) {
      toast.error('Script is too short. Paste at least a few sentences.');
      return;
    }
    setIsLoading(true);
    setAnnotation(null);
    try {
      const result = await annotateScript(trimmed);
      if (!result.success) {
        toast.error('Annotation failed. Please try again.');
        return;
      }
      setAnnotation(result.data);
      toast.success('Script annotated!');
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      toast.error('Only .txt files are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setScriptText(text);
      setAnnotation(null);
      toast.success(`"${file.name}" loaded.`);
    };
    reader.onerror = () => toast.error('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    setScriptText('');
    setAnnotation(null);
    setCopied(false);
  };

  const buildPlainText = useCallback((ann: ScriptAnnotation): string => {
    const body = ann.segments
      .map((seg) => {
        if (seg.type === 'text') return seg.content;
        return `[${seg.instruction}: ${seg.detail}]`;
      })
      .join('');
    return [
      `Estimated Duration: ${ann.estimatedDuration}`,
      `Overall Tips: ${ann.overallTips}`,
      '',
      '---',
      '',
      body,
    ].join('\n');
  }, []);

  const handleDownload = () => {
    if (!annotation) return;
    const plain = buildPlainText(annotation);
    const blob = new Blob([plain], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotated-script.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script downloaded.');
  };

  const handleCopy = async () => {
    if (!annotation) return;
    const plain = buildPlainText(annotation);
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Clipboard access denied.');
    }
  };

  const handleExportPDF = () => {
    if (!annotation) return;
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(40);
    pdf.text('Annotated Script', margin, yPosition);
    yPosition += 12;

    // Metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Duration: ${annotation.estimatedDuration}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 12;

    // Separator
    pdf.setDrawColor(200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Overall Tips
    pdf.setFontSize(11);
    pdf.setTextColor(40);
    pdf.text('Delivery Tips:', margin, yPosition);
    yPosition += 6;
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    const tipsLines = pdf.splitTextToSize(annotation.overallTips, contentWidth);
    tipsLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 6;

    // Script
    pdf.setFontSize(11);
    pdf.setTextColor(40);
    pdf.text('Script with Instructions:', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(0);
    annotation.segments.forEach((seg) => {
      let text: string;
      if (seg.type === 'text') {
        text = seg.content;
      } else {
        text = `[${seg.instruction}: ${seg.detail}]`;
      }

      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });
    });

    pdf.save('annotated-script.pdf');
    toast.success('PDF downloaded.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-10 px-4 md:px-0">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 uppercase tracking-widest text-[9px] font-mono px-2 py-0.5"
          >
            Script Annotator
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Delivery Coach</h2>
          <p className="text-muted-foreground text-xs md:text-sm">
            Paste your speech and Gemini will mark it up with precision delivery instructions.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="rounded-full text-[10px] md:text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Start Over
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* LEFT: Input card */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <Card className="border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/10 bg-muted/20 py-3 px-4">
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Your Script
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <textarea
                className="w-full min-h-[220px] p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed"
                placeholder="Paste your speech or presentation text here..."
                value={scriptText}
                onChange={(e) => {
                  setScriptText(e.target.value);
                  if (annotation) setAnnotation(null);
                }}
                disabled={isLoading}
              />

              {/* File upload row */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-full gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload .txt
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {scriptText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* Annotate button */}
              <Button
                onClick={handleAnnotate}
                disabled={isLoading || !scriptText.trim()}
                className="w-full h-11 rounded-xl font-semibold gap-2 bg-primary text-white shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Annotating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Annotate Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Legend card */}
          {annotation && (
            <Card className="border border-border/40 bg-card/50">
              <CardHeader className="py-3 px-4 border-b border-border/10">
                <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Instruction Legend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InstructionLegend />
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Results card */}
        <div>
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-center space-y-4"
              >
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Gemini is reading your script...</p>
              </motion.div>
            )}

            {!isLoading && !annotation && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-32 text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Ready to annotate</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Paste your script on the left and hit "Annotate Script" to receive inline delivery
                  coaching.
                </p>
              </motion.div>
            )}

            {!isLoading && annotation && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-mono text-primary">{annotation.estimatedDuration}</span>
                  </div>
                  {/* Action buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-full gap-1.5 ml-auto"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-full gap-1.5"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" /> Download .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-full gap-1.5"
                    onClick={handleExportPDF}
                  >
                    <FileJson className="h-3.5 w-3.5" /> Export PDF
                  </Button>
                </div>

                {/* Overall tips */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex gap-3">
                  <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{annotation.overallTips}</p>
                </div>

                {/* Annotated script */}
                <Card className="border-2 border-primary/20 overflow-hidden bg-card/50 backdrop-blur-sm">
                  <CardHeader className="py-3 px-4 border-b border-border/10 bg-muted/20">
                    <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                      Annotated Script
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[750px]">
                      <div className="p-5">
                        <AnnotatedScriptRenderer segments={annotation.segments} />
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
