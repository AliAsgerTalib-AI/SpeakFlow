import { Page } from '@playwright/test';

/** Minimal valid SpeechFeedback response for Gemini API mocking. */
export const mockFeedback = {
  transcription: "This is a test transcription for the practice session.",
  pronunciationFeedback: [{ word: "test", suggestions: "Stress the 't' more clearly." }],
  paceAnalysis: { wpm: 140, rating: "good", feedback: "Your pace is ideal for a professional presentation." },
  fillerWordDetection: [{ word: "um", count: 2 }],
  confidenceScore: 82,
  generalAdvice: ["Slow down slightly before key points.", "Make eye contact with your audience."],
  clinicalInsights: "Vocal patterns indicate a strong diaphragmatic foundation.",
  rhythmScore: 75,
  rhythmFeedback: "Good natural cadence with minor irregularities.",
  intonationScore: 78,
  emotionalTone: { primary: "Confident", intensity: 70, feedback: "Your tone conveys authority." },
  breathManagement: { score: 80, feedback: "Breath support is consistent throughout." },
  phrasingFeedback: "Natural phrasing with clear sentence breaks.",
  articulationScore: 85,
  vocalHealth: { strainLevel: 10, fryPresence: false, feedback: "No strain detected." },
  sentimentScore: 0.6,
  vocalResonance: { score: 77, feedback: "Chest resonance is well-balanced." },
  microHesitations: 3,
  plosiveAnalysis: { quality: 88, feedback: "Clear plosive consonants." },
  environmentalNoise: { level: 15, feedback: "Clean recording environment." },
  accentProfile: { detectedAccent: "General American", clarityScore: 91, feedback: "Highly intelligible to a broad audience." },
};

/**
 * Intercepts all Gemini API calls and returns mock data.
 * Call this before navigating to any page that triggers Gemini requests.
 */
export async function mockGeminiApi(page: Page) {
  await page.route('**/generativelanguage.googleapis.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('generateContent')) {
      // Return the mock feedback payload wrapped in the Gemini response envelope
      // Small delay so the "Analyzing..." loader state is visible in tests
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockFeedback) }],
              role: 'model'
            },
            finishReason: 'STOP',
          }],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200 },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/** Seeds localStorage with a given number of mock sessions. */
export async function seedSessions(page: Page, count: number) {
  const sessions = Array.from({ length: count }, (_, i) => ({
    id: String(Date.now() + i),
    userId: 'anonymous',
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    script: `Practice script ${i + 1}`,
    feedback: { ...mockFeedback, confidenceScore: 70 + i, paceAnalysis: { ...mockFeedback.paceAnalysis, wpm: 130 + i * 5 } },
  }));
  await page.evaluate((data) => {
    localStorage.setItem('speakflow_sessions', JSON.stringify(data));
  }, sessions);
}

/** Clears speakflow localStorage data. */
export async function clearSessions(page: Page) {
  await page.evaluate(() => localStorage.removeItem('speakflow_sessions'));
}
