import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download, Music, Heart, Activity, Wind, Zap, Smile, Target, Trophy, CheckCircle2,
  Play, Info, Stethoscope, Volume2, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { SpeechFeedback } from '@/src/types';
import { TranscriptWithFeedback } from './TranscriptWithFeedback';
import { ExercisePanel } from './ExercisePanel';
import { StressAnalysis } from './StressAnalysis';

interface FeedbackResultsProps {
  feedback: SpeechFeedback;
  script: string;
  onDownload: () => void;
}

const PaceGauge: React.FC<{ wpm: number }> = ({ wpm }) => {
  const normalizedPace = Math.min(Math.max(((wpm - 80) / 120) * 100, 0), 100);

  const getStatus = () => {
    if (wpm < 115) return { label: 'Too Slow', color: 'text-blue-400', bg: 'bg-blue-400' };
    if (wpm <= 165) return { label: 'Perfect', color: 'text-green-400', bg: 'bg-green-400' };
    return { label: 'Too Fast', color: 'text-amber-400', bg: 'bg-amber-400' };
  };

  const status = getStatus();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest mb-1">
            Speaking Pace
          </p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{wpm}</span>
            <span className="text-xs text-muted-foreground font-mono">WPM</span>
          </div>
        </div>
        <Badge variant="outline" className={`${status.color} border-current gap-1 px-2 py-0.5`}>
          {status.label}
        </Badge>
      </div>

      <div className="relative pt-2">
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1.5 px-1 uppercase opacity-50">
          <span>Casual</span>
          <span>Professional</span>
          <span>Excited</span>
        </div>
        <div className="h-3 bg-muted/30 rounded-full relative overflow-hidden border border-border/50">
          <div className="absolute left-[30%] right-[35%] h-full bg-green-500/10 border-x border-green-500/20" />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedPace}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            className={`h-full ${status.bg} shadow-[0_0_15px_-3px_currentColor] transition-colors`}
          />
        </div>
      </div>
    </div>
  );
};

export const FeedbackResults: React.FC<FeedbackResultsProps> = ({ feedback, script, onDownload }) => {
  const totalFillers = feedback.fillerWordDetection.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <Card className="overflow-hidden border-2 border-primary/10">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Session Insights</CardTitle>
              <CardDescription>AI Pattern Analysis</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                aria-label="Download session feedback as JSON"
                className="h-8 rounded-full text-[10px] gap-1.5"
              >
                <Download className="h-3 w-3" /> Save JSON
              </Button>
              <Badge
                variant="outline"
                className="font-mono text-[10px]"
                title={`Total filler words detected: ${totalFillers}`}
              >
                {totalFillers} Fillers
              </Badge>
              {feedback.microHesitations !== undefined && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-blue-500 border-blue-500/20"
                  title={`Micro-hesitations (pauses under 500ms): ${feedback.microHesitations}`}
                >
                  {feedback.microHesitations} Hesit.
                </Badge>
              )}
              {feedback.environmentalNoise && (
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] border-emerald-500/20 ${feedback.environmentalNoise.level > 40 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}
                  title={`Environmental noise level: ${feedback.environmentalNoise.level}%. Clarity: ${100 - feedback.environmentalNoise.level}%`}
                >
                  {100 - feedback.environmentalNoise.level}% Env
                  {feedback.environmentalNoise.level > 40 && ' (High Noise)'}
                </Badge>
              )}
              {feedback.accentProfile && (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-indigo-500 border-indigo-500/20"
                  title={`Detected accent: ${feedback.accentProfile.detectedAccent}. Clarity score: ${feedback.accentProfile.clarityScore}%`}
                >
                  {feedback.accentProfile.detectedAccent} ({feedback.accentProfile.clarityScore}%)
                </Badge>
              )}
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">V1.5 FLASH</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 md:gap-3">
            {[
              { label: 'Confidence', val: feedback.confidenceScore, icon: Target, color: 'text-primary' },
              { label: 'Rhythm', val: feedback.rhythmScore, icon: Music, color: 'text-blue-500' },
              { label: 'Intonation', val: feedback.intonationScore, icon: Volume2, color: 'text-indigo-500' },
              { label: 'Breath', val: feedback.breathManagement?.score, icon: Wind, color: 'text-emerald-500' },
              { label: 'Articulation', val: feedback.articulationScore, icon: Zap, color: 'text-amber-500' },
              { label: 'Health', val: 100 - (feedback.vocalHealth?.strainLevel || 0), icon: Heart, color: 'text-rose-500' },
              { label: 'Sentiment', val: Math.round((feedback.sentimentScore || 0) * 100), icon: Smile, color: 'text-orange-500' },
              { label: 'Resonance', val: feedback.vocalResonance?.score, icon: Target, color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className="p-2 md:p-3 bg-card/50 rounded-lg md:rounded-xl border border-border/50 shadow-sm space-y-1.5 md:space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[8px] md:text-[9px] uppercase font-mono text-muted-foreground tracking-widest">
                    {stat.label}
                  </p>
                  <stat.icon className={`h-2.5 w-2.5 md:h-3 md:w-3 ${stat.color}`} />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-base md:text-xl font-bold tracking-tighter">{Math.round(stat.val || 0)}</span>
                  <span className="text-muted-foreground mb-0.5 font-mono text-[8px] md:text-[9px]">%</span>
                </div>
                <Progress
                  value={Math.round(stat.val || 0)}
                  className="h-1 bg-muted"
                  aria-label={`${stat.label} score: ${Math.round(stat.val || 0)}%`}
                />
              </div>
            ))}
          </div>

          <PaceGauge wpm={feedback.paceAnalysis.wpm} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-wider">
                <Music className="h-3.5 w-3.5" /> Prosody & Phrasing
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feedback.phrasingFeedback || feedback.rhythmFeedback}
              </p>
            </div>
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                <Heart className="h-3.5 w-3.5" /> Tone:{' '}
                <span className="text-emerald-700">{feedback.emotionalTone?.primary || 'Neutral'}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feedback.emotionalTone?.feedback || 'Speech appears balanced and controlled.'}
              </p>
            </div>
            <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-[11px] uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" /> Vocal Health
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feedback.vocalHealth?.fryPresence ? '⚠️ Glottal fry detected. ' : ''}
                {feedback.vocalHealth?.feedback || 'No significant strain detected.'}
              </p>
            </div>
            {feedback.accentProfile && (
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-wider">
                  <Volume2 className="h-3.5 w-3.5" /> Accent & Clarity
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-indigo-700 block mb-1">Detected: {feedback.accentProfile.detectedAccent}</span>
                  Clarity Score: <span className="font-bold text-indigo-600">{feedback.accentProfile.clarityScore}%</span> — {feedback.accentProfile.feedback}
                </p>
              </div>
            )}
          </div>

          <StressAnalysis feedback={feedback} />

          <div className="space-y-8">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-4 px-1">
                <Play className="h-4 w-4 text-primary fill-primary/20" /> Analysis & Actionable Tips
              </h4>
              <div className="space-y-4">
                {feedback.pronunciationFeedback.length > 0 ? (
                  feedback.pronunciationFeedback.map((pf, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="group p-5 bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-destructive/10 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </div>
                          <span className="font-bold text-lg tracking-tight">{pf.word}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/50">
                          MISPRONOUNCED
                        </Badge>
                      </div>
                      <div className="pl-11 space-y-3">
                        <div className="p-3 bg-muted/30 rounded-xl border border-border/30">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Actionable Correction
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed italic">{pf.suggestions}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-10 text-center border-2 border-dashed rounded-3xl bg-green-500/5 border-green-500/20">
                    <Trophy className="h-10 w-10 text-green-500 mx-auto mb-3" />
                    <h5 className="font-bold text-green-700">Flawless Articulation</h5>
                    <p className="text-sm text-green-600/70">Every word was delivered with precision. Excellent clarity!</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-4 px-1">
                <Info className="h-4 w-4 text-primary fill-primary/20" /> Filler Frequency Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {feedback.fillerWordDetection.length > 0 ? (
                  feedback.fillerWordDetection.map((f, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-3 bg-muted/40 rounded-lg border border-border/40 group hover:border-primary/20 transition-all">
                      <span className="text-xs font-mono text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                        "{f.word}"
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{f.count}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">x</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary/40" style={{ width: `${Math.min((f.count / 10) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-4 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="text-xs text-green-700 font-medium">Clean delivery! No filler words detected.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <h4 className="flex items-center gap-2 text-sm font-bold mb-4 text-primary">
                <Trophy className="h-4 w-4" /> Pro Coaching Tips
              </h4>
              <ul className="space-y-3">
                {feedback.generalAdvice.map((adv, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-3 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>

            {feedback.clinicalInsights && (
              <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <h4 className="flex items-center gap-2 text-sm font-bold mb-3 text-amber-600">
                  <Stethoscope className="h-4 w-4" /> Pathologist's Perspective
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{feedback.clinicalInsights}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Smart Transcript Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="p-6 bg-muted/20 rounded-2xl border border-border/50">
            <TranscriptWithFeedback
              transcription={feedback.transcription}
              pronunciationFeedback={feedback.pronunciationFeedback}
            />
          </div>
        </CardContent>
      </Card>

      <ExercisePanel feedback={feedback} />
    </div>
  );
};
