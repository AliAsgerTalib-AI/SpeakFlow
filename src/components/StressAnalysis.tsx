import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { AlertTriangle, Heart, Zap } from 'lucide-react';
import { SpeechFeedback } from '@/src/types';

interface StressAnalysisProps {
  feedback: SpeechFeedback;
}

const getStressColor = (level: number) => {
  if (level < 30) return { bg: 'from-emerald-500/20 to-emerald-500/10', text: 'text-emerald-600', label: 'Calm' };
  if (level < 60) return { bg: 'from-amber-500/20 to-amber-500/10', text: 'text-amber-600', label: 'Moderate' };
  return { bg: 'from-rose-500/20 to-rose-500/10', text: 'text-rose-600', label: 'High' };
};

const getContributingFactors = (feedback: SpeechFeedback) => {
  const factors: { label: string; value: number; threshold: number; above: boolean }[] = [];

  if (feedback.microHesitations > 5) {
    factors.push({ label: 'Frequent Hesitations', value: feedback.microHesitations, threshold: 5, above: true });
  }

  if (feedback.breathManagement.score < 60) {
    factors.push({ label: 'Shallow Breathing', value: feedback.breathManagement.score, threshold: 60, above: false });
  }

  if (feedback.paceAnalysis.wpm > 170 || feedback.paceAnalysis.wpm < 100) {
    factors.push({
      label: feedback.paceAnalysis.wpm > 170 ? 'Rapid Pace' : 'Slow Pace',
      value: feedback.paceAnalysis.wpm,
      threshold: feedback.paceAnalysis.wpm > 170 ? 170 : 100,
      above: feedback.paceAnalysis.wpm > 170,
    });
  }

  if (feedback.vocalHealth.strainLevel > 40) {
    factors.push({ label: 'Vocal Tension', value: feedback.vocalHealth.strainLevel, threshold: 40, above: true });
  }

  if (feedback.intonationScore < 50) {
    factors.push({ label: 'Limited Intonation', value: feedback.intonationScore, threshold: 50, above: false });
  }

  if (feedback.fillerWordDetection.length > 3) {
    const totalFillers = feedback.fillerWordDetection.reduce((acc, f) => acc + f.count, 0);
    factors.push({ label: 'Many Filler Words', value: totalFillers, threshold: 3, above: true });
  }

  return factors;
};

export const StressAnalysis: React.FC<StressAnalysisProps> = ({ feedback }) => {
  if (!feedback.stressProfile) return null;

  const stressLevel = Math.round(feedback.stressProfile.stressLevel);
  const colors = getStressColor(stressLevel);
  const factors = getContributingFactors(feedback);

  return (
    <Card className={`overflow-hidden border-2 bg-gradient-to-br ${colors.bg} border-current/20`}>
      <CardHeader className="border-b bg-background/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`h-5 w-5 ${colors.text}`} />
            <CardTitle className={colors.text}>Stress & Confidence Profile</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Stress Gauge */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <p className="text-sm font-semibold">Stress Level</p>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${colors.text} border-current/30 bg-current/5`}>
              {stressLevel}%
            </Badge>
          </div>

          <div className="relative h-8 bg-muted rounded-full overflow-hidden border border-border/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stressLevel}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              className={`h-full rounded-full ${
                stressLevel < 30
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : stressLevel < 60
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-rose-500 to-rose-400'
              }`}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Calm (0%)</span>
            <span>{colors.label}</span>
            <span>Stressed (100%)</span>
          </div>
        </div>

        {/* Nervousness Indicators */}
        {feedback.stressProfile.nervousnessIndicators.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Detected Indicators
            </p>
            <div className="flex flex-wrap gap-2">
              {feedback.stressProfile.nervousnessIndicators.map((indicator, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Badge
                    variant="outline"
                    className={`gap-1 px-2.5 py-1 text-xs ${colors.text} border-current/20 bg-current/5`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {indicator}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Contributing Factors */}
        {factors.length > 0 && (
          <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Contributing Factors
            </p>
            <div className="space-y-2">
              {factors.slice(0, 4).map((factor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground">{factor.label}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {Math.round(factor.value)}
                    {typeof factor.value === 'number' && factor.label.includes('Hesitation') ? '' : '%'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Peak Moment */}
        <div className="p-4 bg-muted/40 rounded-lg border border-border/50 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peak Stress Moment</p>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            {feedback.stressProfile.peakMoment}
          </p>
        </div>

        {/* Overall Assessment */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Coaching Insight</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feedback.stressProfile.overallAssessment}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
