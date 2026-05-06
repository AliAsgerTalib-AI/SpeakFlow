import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'motion/react';
import {
  TrendingUp, Target, Award, AlertCircle, CheckCircle2, ArrowUp
} from 'lucide-react';
import {
  MODE_BENCHMARKS,
  getTierForScore,
  calculateGap,
  isAboveBenchmark,
  BenchmarkMetrics,
  TIER_BENCHMARKS,
} from '@/src/lib/benchmarks';
import { SpeechFeedback } from '@/src/types';

interface BenchmarkComparisonProps {
  feedback: SpeechFeedback;
  mode: 'general' | 'interview' | 'presentation' | 'sales';
}

// Normalize scores to 0-100 range (handles both 0-100 and 0-1 formats)
const normalizeScore = (score: number | undefined): number => {
  if (!score) return 0;
  if (score <= 1) return score * 100; // Convert 0-1 to 0-100
  return score; // Already in 0-100 range
};

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  feedback,
  mode,
}) => {
  const benchmark = MODE_BENCHMARKS[mode];

  // Normalize all scores before calculations
  const normalizedConfidence = normalizeScore(feedback.confidenceScore);
  const normalizedRhythm = normalizeScore(feedback.rhythmScore);
  const normalizedIntonation = normalizeScore(feedback.intonationScore);
  const normalizedBreath = normalizeScore(feedback.breathManagement?.score);
  const normalizedArticulation = normalizeScore(feedback.articulationScore);
  const normalizedVocalHealth = normalizeScore(100 - (feedback.vocalHealth?.strainLevel || 0));
  const normalizedSentiment = normalizeScore((feedback.sentimentScore || 0) < 1 ? (feedback.sentimentScore || 0) * 100 : feedback.sentimentScore);
  const normalizedResonance = normalizeScore(feedback.vocalResonance?.score);

  const overallScore =
    (normalizedConfidence +
      normalizedRhythm +
      normalizedIntonation +
      normalizedBreath +
      normalizedArticulation +
      normalizedVocalHealth +
      normalizedSentiment +
      normalizedResonance) /
    8;

  const tier = getTierForScore(overallScore);

  const metrics = [
    {
      label: 'Confidence',
      current: normalizedConfidence,
      benchmark: benchmark.confidence,
      icon: Target,
      color: 'text-primary',
    },
    {
      label: 'Rhythm',
      current: normalizedRhythm,
      benchmark: benchmark.rhythm,
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      label: 'Intonation',
      current: normalizedIntonation,
      benchmark: benchmark.intonation,
      icon: Award,
      color: 'text-indigo-500',
    },
    {
      label: 'Breath Management',
      current: normalizedBreath,
      benchmark: benchmark.breath,
      icon: ArrowUp,
      color: 'text-emerald-500',
    },
    {
      label: 'Articulation',
      current: normalizedArticulation,
      benchmark: benchmark.articulation,
      icon: Target,
      color: 'text-amber-500',
    },
    {
      label: 'Vocal Health',
      current: normalizedVocalHealth,
      benchmark: benchmark.health,
      icon: CheckCircle2,
      color: 'text-rose-500',
    },
    {
      label: 'Sentiment',
      current: normalizedSentiment,
      benchmark: benchmark.sentiment,
      icon: Award,
      color: 'text-orange-500',
    },
    {
      label: 'Resonance',
      current: normalizedResonance,
      benchmark: benchmark.resonance,
      icon: Target,
      color: 'text-purple-500',
    },
  ];

  const countMetrics = [
    {
      label: 'Filler Words',
      current: feedback.fillerWordDetection.reduce((acc, f) => acc + f.count, 0),
      benchmark: benchmark.fillerWords,
      unit: 'words',
      lowerIsBetter: true,
    },
    {
      label: 'Micro-Hesitations',
      current: feedback.microHesitations,
      benchmark: benchmark.microHesitations,
      unit: 'pauses',
      lowerIsBetter: true,
    },
    {
      label: 'Pronunciation Errors',
      current: feedback.pronunciationFeedback.length,
      benchmark: benchmark.pronunciationErrors,
      unit: 'errors',
      lowerIsBetter: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Tier Card */}
      <Card className="overflow-hidden">
        <CardHeader className={`border-b ${tier.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className={`h-5 w-5 ${tier.color}`} />
                Speaking Level
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode Analysis
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${tier.color}`}>
                {Math.round(overallScore)}
              </div>
              <Badge className={`mt-2 ${tier.bgColor} ${tier.color} border-current`}>
                {tier.tier}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{tier.tier} Level</span>
                <span className="font-mono text-xs">{tier.range[0]}–{tier.range[1]}%</span>
              </div>
              <Progress value={overallScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {tier.description}
              </p>
            </div>
            {overallScore < 90 && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {overallScore < 75
                    ? `Focus on fundamentals. Target areas below for quick wins.`
                    : `You're close to Advanced level. A few targeted improvements will get you there.`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Comparison Summary */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Benchmark Comparison Summary</CardTitle>
          <CardDescription className="text-xs">
            Your scores vs professional coaching standards by mode
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map((metric, i) => {
              const gap = calculateGap(metric.current, metric.benchmark);
              const isAbove = isAboveBenchmark(metric.current, metric.benchmark);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border text-center ${isAbove ? 'bg-emerald-500/5 border-emerald-500/20' : gap > 10 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}
                >
                  <p className="text-[10px] uppercase font-mono text-muted-foreground mb-1.5 tracking-wider">{metric.label}</p>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-lg font-bold">{Math.round(metric.current)}</span>
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                  {isAbove ? (
                    <Badge variant="outline" className="w-full justify-center text-[9px] text-emerald-600 border-emerald-200/50 bg-emerald-500/5">
                      +{Math.round(gap)}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`w-full justify-center text-[9px] ${gap > 10 ? 'text-red-600 border-red-200/50 bg-red-500/5' : 'text-amber-600 border-amber-200/50 bg-amber-500/5'}`}
                    >
                      -{Math.round(gap)}
                    </Badge>
                  )}
                  <p className="text-[8px] text-muted-foreground mt-2">Pro: {Math.round(metric.benchmark)}%</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Count-based Metrics */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Precision Metrics</CardTitle>
          <CardDescription className="text-xs">
            Count-based measurements (lower is better for these)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {countMetrics.map((metric, i) => {
              const isGood = metric.current <= metric.benchmark;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    isGood
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-amber-500/20 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium">{metric.label}</h4>
                    {isGood ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Your count</div>
                      <div className="text-2xl font-bold">
                        {metric.current.toFixed(1)} <span className="text-xs text-muted-foreground">{metric.unit}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Professional avg: {metric.benchmark.toFixed(1)} {metric.unit}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Quick Wins</CardTitle>
          <CardDescription className="text-xs">
            Areas where small improvements yield big results
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {(() => {
            const gaps = metrics
              .map((m) => ({
                label: m.label,
                gap: calculateGap(m.current, m.benchmark),
                current: m.current,
              }))
              .filter((g) => g.gap > 5)
              .sort((a, b) => b.gap - a.gap)
              .slice(0, 3);

            if (gaps.length === 0) {
              return (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Excellent! All metrics are at professional level.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {gaps.map((gap, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{gap.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        +{Math.round(gap.gap)} points
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Currently {Math.round(gap.current)}% → Target {Math.round(gap.current + gap.gap)}%
                    </div>
                    <Progress value={gap.current} className="h-1" />
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};
