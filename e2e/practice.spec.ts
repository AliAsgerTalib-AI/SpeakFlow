import { test, expect } from '@playwright/test';
import { mockGeminiApi } from './helpers';

test.beforeEach(async ({ page }) => {
  // Mock MediaRecorder and SpeechRecognition before the page loads
  await page.addInitScript(() => {
    // Stub MediaRecorder
    (window as any).MediaRecorder = class {
      static isTypeSupported() { return true; }
      mimeType = 'audio/webm';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        // Simulate a small audio chunk
        setTimeout(() => {
          this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
        }, 100);
      }
      stop() { setTimeout(() => this.onstop?.(), 50); }
      stream = { getTracks: () => [{ stop: () => {} }] };
    };

    // Stub navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => {} }],
        }),
      },
      writable: true,
    });

    // Stub SpeechRecognition
    (window as any).SpeechRecognition = class {
      continuous = false;
      interimResults = false;
      lang = '';
      onresult: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      start() {}
      stop() {}
    };
  });

  await mockGeminiApi(page);
  await page.goto('/');
});

test('practice tab shows the script card on load', async ({ page }) => {
  await expect(page.getByText('Practice Script')).toBeVisible();
});

test('Start Recording button is visible in idle state', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
});

test('Hardware Calibration tip is shown before recording starts', async ({ page }) => {
  await expect(page.getByText('Hardware Calibration')).toBeVisible();
  await expect(page.getByText(/6 inches/i)).toBeVisible();
});

test('New Script button is visible and enabled in idle state', async ({ page }) => {
  const newScriptBtn = page.getByRole('button', { name: /New Script/i });
  await expect(newScriptBtn).toBeVisible();
  await expect(newScriptBtn).toBeEnabled();
});

test('script area renders generated script text', async ({ page }) => {
  // The Gemini mock returns a script; wait for the loading state to resolve
  await expect(page.getByText(/Generating a new challenge/)).toBeHidden({ timeout: 8000 });
  // Script content area should be non-empty
  const scriptArea = page.locator('.leading-relaxed.font-sans');
  await expect(scriptArea.first()).not.toBeEmpty();
});

test('clicking Stop & Analyze triggers the analyzing loader', async ({ page }) => {
  // Wait for script to load
  await expect(page.getByText(/Generating a new challenge/)).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: /Start Recording/i }).click();
  await expect(page.getByRole('button', { name: /Stop & Analyze/i })).toBeVisible();

  await page.getByRole('button', { name: /Stop & Analyze/i }).click();
  // Loader should appear while Gemini mock resolves
  await expect(page.getByText('Analyzing your performance')).toBeVisible({ timeout: 5000 });
});

test('analysis results render after Gemini returns', async ({ page }) => {
  await expect(page.getByText(/Generating a new challenge/)).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: /Start Recording/i }).click();
  await page.getByRole('button', { name: /Stop & Analyze/i }).click();

  // Wait for results card
  await expect(page.getByText('Session Insights')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('AI Pattern Analysis')).toBeVisible();
});

test('accent profile badge is shown after analysis', async ({ page }) => {
  await expect(page.getByText(/Generating a new challenge/)).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: /Start Recording/i }).click();
  await page.getByRole('button', { name: /Stop & Analyze/i }).click();

  await expect(page.getByText('Session Insights')).toBeVisible({ timeout: 10000 });
  // accentProfile from mock: "General American (91%)"
  await expect(page.getByText(/General American/)).toBeVisible();
});

test('Save JSON button appears after analysis', async ({ page }) => {
  await expect(page.getByText(/Generating a new challenge/)).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: /Start Recording/i }).click();
  await page.getByRole('button', { name: /Stop & Analyze/i }).click();

  await expect(page.getByText('Session Insights')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /Save JSON/i }).first()).toBeVisible();
});
