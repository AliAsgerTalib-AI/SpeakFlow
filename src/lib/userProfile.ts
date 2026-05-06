import { UserProfile, GoldenStateBaseline, SpeechFeedback } from '@/src/types';

const PROFILE_KEY = 'speakflow_user_profile';
const DEFAULT_PROFILE: UserProfile = {
  vocalGoal: 'NEUTRAL',
  ageDecade: 30,
  neurodiversityFlag: false,
  goldenStateBaseline: null,
};

export function loadUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function updateUserProfile(
  partial: Partial<UserProfile>
): UserProfile {
  const existing = loadUserProfile() || DEFAULT_PROFILE;
  const updated = { ...existing, ...partial };
  saveUserProfile(updated);
  return updated;
}

export function setGoldenStateBaseline(feedback: SpeechFeedback): void {
  const baseline: GoldenStateBaseline = {
    confidenceScore: feedback.confidenceScore,
    rhythmScore: feedback.rhythmScore,
    intonationScore: feedback.intonationScore,
    breathManagementScore: feedback.breathManagement.score,
    articulationScore: feedback.articulationScore,
    vocalHealthScore: 100 - feedback.vocalHealth.strainLevel,
    sentimentScore: feedback.sentimentScore,
    resonanceScore: feedback.vocalResonance.score,
    capturedAt: Date.now(),
  };
  updateUserProfile({ goldenStateBaseline: baseline });
}

export function clearGoldenStateBaseline(): void {
  updateUserProfile({ goldenStateBaseline: null });
}

export function getSessionCount(): number {
  try {
    const stored = localStorage.getItem('speakflow_sessions');
    if (!stored) return 0;
    const sessions = JSON.parse(stored);
    return Array.isArray(sessions) ? sessions.length : 0;
  } catch {
    return 0;
  }
}
