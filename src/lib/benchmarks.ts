export interface BenchmarkMetrics {
  confidence: number;
  rhythm: number;
  intonation: number;
  breath: number;
  articulation: number;
  health: number;
  sentiment: number;
  resonance: number;
  pace: number; // ideal WPM (not a percentage)
  fillerWords: number; // expected count
  microHesitations: number; // expected count
  accentClarity: number;
  stressLevel: number; // 0-100, where 0 is calm
  pronunciationErrors: number; // expected count
}

export interface TierBenchmark {
  tier: "Beginner" | "Intermediate" | "Advanced" | "Professional";
  range: [number, number];
  description: string;
  color: string;
  bgColor: string;
}

export const TIER_BENCHMARKS: TierBenchmark[] = [
  {
    tier: "Beginner",
    range: [50, 65],
    description: "Developing fundamentals",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  {
    tier: "Intermediate",
    range: [65, 80],
    description: "Solid speaker",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    tier: "Advanced",
    range: [80, 90],
    description: "Skilled communicator",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  {
    tier: "Professional",
    range: [90, 100],
    description: "Expert-level delivery",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
];

// Mode-independent professional benchmarks (general baseline)
export const PROFESSIONAL_BENCHMARKS: BenchmarkMetrics = {
  confidence: 90,
  rhythm: 88,
  intonation: 88,
  breath: 88,
  articulation: 94,
  health: 95, // 100 - strain level (so 95 means ~5% strain)
  sentiment: 75,
  resonance: 88,
  pace: 140, // WPM midpoint (130-150)
  fillerWords: 1, // average
  microHesitations: 3, // average
  accentClarity: 92,
  stressLevel: 12, // 0-100 scale, lower is better
  pronunciationErrors: 0.5, // average
};

// Mode-specific professional benchmarks
export const MODE_BENCHMARKS: Record<
  "general" | "interview" | "presentation" | "sales",
  BenchmarkMetrics
> = {
  general: {
    confidence: 90,
    rhythm: 88,
    intonation: 88,
    breath: 88,
    articulation: 94,
    health: 95,
    sentiment: 75,
    resonance: 88,
    pace: 140,
    fillerWords: 1,
    microHesitations: 3,
    accentClarity: 92,
    stressLevel: 12,
    pronunciationErrors: 0.5,
  },
  interview: {
    confidence: 92,
    rhythm: 88,
    intonation: 86,
    breath: 90,
    articulation: 94,
    health: 95,
    sentiment: 70,
    resonance: 86,
    pace: 132,
    fillerWords: 0.5,
    microHesitations: 2,
    accentClarity: 92,
    stressLevel: 18, // slightly higher due to interview anxiety
    pronunciationErrors: 0.5,
  },
  presentation: {
    confidence: 88,
    rhythm: 90,
    intonation: 92,
    breath: 88,
    articulation: 96,
    health: 96,
    sentiment: 72,
    resonance: 90,
    pace: 140,
    fillerWords: 1,
    microHesitations: 2,
    accentClarity: 94,
    stressLevel: 10,
    pronunciationErrors: 0.3,
  },
  sales: {
    confidence: 94,
    rhythm: 88,
    intonation: 92,
    breath: 88,
    articulation: 92,
    health: 94,
    sentiment: 80,
    resonance: 90,
    pace: 150,
    fillerWords: 0.5,
    microHesitations: 2,
    accentClarity: 92,
    stressLevel: 8,
    pronunciationErrors: 0.5,
  },
};

export function getTierForScore(score: number): TierBenchmark {
  return (
    TIER_BENCHMARKS.find(
      (tier) => score >= tier.range[0] && score <= tier.range[1]
    ) || TIER_BENCHMARKS[0]
  );
}

export function calculateGap(current: number, benchmark: number): number {
  return benchmark - current;
}

export function isAboveBenchmark(current: number, benchmark: number): boolean {
  return current >= benchmark;
}
