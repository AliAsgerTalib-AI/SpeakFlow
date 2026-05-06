import { SpeechFeedback, UserProfile } from '@/src/types';

export interface VitalityResult {
  score: number;
  label: 'Peak Flow' | 'Strong' | 'Building' | 'Warming Up';
  delta: number | null;
}

export function computeVitalityScore(
  feedback: SpeechFeedback,
  profile?: UserProfile | null
): VitalityResult {
  // Extract 8 core metrics, normalized to 0-100
  const metrics = {
    confidence: feedback.confidenceScore,
    rhythm: feedback.rhythmScore,
    intonation: feedback.intonationScore,
    breath: feedback.breathManagement.score,
    articulation: feedback.articulationScore,
    health: 100 - feedback.vocalHealth.strainLevel,
    sentiment: feedback.sentimentScore * 100, // normalize from 0-1 to 0-100
    resonance: feedback.vocalResonance.score,
  };

  // Apply age tolerance: if 60+, boost health component
  let healthForWeighting = metrics.health;
  if (profile?.ageDecade !== undefined && profile.ageDecade >= 60) {
    healthForWeighting = Math.min(metrics.health + 10, 100);
  }

  // Goal-based weights (must sum to 1.0)
  let weights: Record<string, number>;
  switch (profile?.vocalGoal) {
    case 'FEMINIZATION':
      weights = {
        resonance: 0.2,
        intonation: 0.2,
        breath: 0.15,
        confidence: 0.15,
        rhythm: 0.1,
        articulation: 0.1,
        health: 0.05,
        sentiment: 0.05,
      };
      break;
    case 'MASCULINIZATION':
      weights = {
        resonance: 0.25,
        breath: 0.2,
        confidence: 0.15,
        articulation: 0.15,
        rhythm: 0.1,
        intonation: 0.1,
        health: 0.03,
        sentiment: 0.02,
      };
      break;
    default: // NEUTRAL, MAINTENANCE, or undefined
      weights = {
        confidence: 0.125,
        rhythm: 0.125,
        intonation: 0.125,
        breath: 0.125,
        articulation: 0.125,
        health: 0.125,
        sentiment: 0.125,
        resonance: 0.125,
      };
      break;
  }

  // Compute weighted sum for current scores
  const rawScore =
    metrics.confidence * weights.confidence +
    metrics.rhythm * weights.rhythm +
    metrics.intonation * weights.intonation +
    metrics.breath * weights.breath +
    metrics.articulation * weights.articulation +
    healthForWeighting * weights.health +
    metrics.sentiment * weights.sentiment +
    metrics.resonance * weights.resonance;

  // Compute delta vs baseline if available
  let delta: number | null = null;
  if (profile?.goldenStateBaseline) {
    const baseline = profile.goldenStateBaseline;
    const baselineHealth = baseline.vocalHealthScore;
    const baselineScore =
      baseline.confidenceScore * weights.confidence +
      baseline.rhythmScore * weights.rhythm +
      baseline.intonationScore * weights.intonation +
      baseline.breathManagementScore * weights.breath +
      baseline.articulationScore * weights.articulation +
      baselineHealth * weights.health +
      baseline.sentimentScore * weights.sentiment +
      baseline.resonanceScore * weights.resonance;

    delta = Math.round(rawScore - baselineScore);
  }

  // Clamp to [0, 100]
  const clampedScore = Math.min(Math.max(rawScore, 0), 100);

  // Assign label
  let label: 'Peak Flow' | 'Strong' | 'Building' | 'Warming Up';
  if (clampedScore >= 85) {
    label = 'Peak Flow';
  } else if (clampedScore >= 70) {
    label = 'Strong';
  } else if (clampedScore >= 55) {
    label = 'Building';
  } else {
    label = 'Warming Up';
  }

  return {
    score: Math.round(clampedScore),
    label,
    delta,
  };
}

export function buildGoalContext(profile?: UserProfile | null): string {
  if (!profile || profile.vocalGoal === 'NEUTRAL') {
    return 'Focus on balanced, natural expressiveness. Let the speaker\'s authentic voice emerge.';
  }

  let goalText = '';
  switch (profile.vocalGoal) {
    case 'FEMINIZATION':
      goalText =
        'This speaker is exploring forward oral resonance, rising intonation patterns, and release of laryngeal tension. Emphasize resonance placement over raw pitch. Celebrate subtle vocal shifts.';
      break;
    case 'MASCULINIZATION':
      goalText =
        'This speaker is developing chest and pharyngeal resonance depth, vocal projection, and lower-register stability. Focus on sustainable resonance, not forcing.';
      break;
    case 'MAINTENANCE':
      goalText =
        'This speaker wants to maintain vocal health, prevent strain, and sustain natural expressiveness over time. Protect stamina and sustainability.';
      break;
    default:
      goalText = 'Focus on balanced, natural expressiveness.';
  }

  let contextParts = [goalText];

  if (profile.neurodiversityFlag) {
    contextParts.push(
      'This person processes auditory feedback differently. Keep suggestions concrete, single-step, and jargon-free. Avoid overwhelm.'
    );
  }

  if (profile.ageDecade !== undefined && profile.ageDecade >= 60) {
    contextParts.push(
      'Account for natural vocal aging. Frame any strain observation as manageable tension, not deterioration. Celebrate what works.'
    );
  }

  contextParts.push(
    'Avoid diagnostic labels like "Standard" or "Atypical". Use intent-based coaching language.'
  );

  return contextParts.join('\n\n');
}
