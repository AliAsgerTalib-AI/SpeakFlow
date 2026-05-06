import { test, expect } from '@playwright/test';
import { mockGeminiApi } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).MediaRecorder = class {
      static isTypeSupported() { return true; }
      mimeType = 'audio/webm';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
        }, 100);
      }
      stop() { setTimeout(() => this.onstop?.(), 50); }
      stream = { getTracks: () => [{ stop: () => {} }] };
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) },
      writable: true,
    });

    (window as any).SpeechRecognition = class {
      continuous = false; interimResults = false; lang = '';
      onresult: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      start() {} stop() {}
    };
  });

  await mockGeminiApi(page);
  await page.goto('/');
  await page.getByRole('tab', { name: /Free Speech Lab/i }).first().click();
});

test('renders the Free Speech Lab heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Free Speech Lab/i })).toBeVisible();
  await expect(page.getByText('Capture up to 60 seconds')).toBeVisible();
});

test('idle state shows the studio booth with Unscripted Mode badge', async ({ page }) => {
  await expect(page.getByText('Unscripted Mode')).toBeVisible();
  await expect(page.getByText('Studio Booth')).toBeVisible();
});

test('idle state shows mic distance tip', async ({ page }) => {
  await expect(page.getByText(/Hold mic 6/i)).toBeVisible();
});

test('Start Capturing button is visible in idle state', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Start Capturing/i })).toBeVisible();
});

test('Start Over button is visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Start Over/i })).toBeVisible();
});

test('clicking Start Capturing shows Stop & Finish button', async ({ page }) => {
  await page.getByRole('button', { name: /Start Capturing/i }).click();
  await expect(page.getByRole('button', { name: /Stop & Finish/i })).toBeVisible();
  // REC timer badge appears
  await expect(page.getByText(/s$/).first()).toBeVisible();
});

test('after recording, Analyze Speech Pattern button appears', async ({ page }) => {
  await page.getByRole('button', { name: /Start Capturing/i }).click();
  await page.getByRole('button', { name: /Stop & Finish/i }).click();

  // After stop, the "Voice Captured" state and Analyze button should appear
  await expect(page.getByText('Voice Captured')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: /Analyze Speech Pattern/i })).toBeVisible();
});

test('analysis results include metrics grid and delivery insights', async ({ page }) => {
  await page.getByRole('button', { name: /Start Capturing/i }).click();
  await page.getByRole('button', { name: /Stop & Finish/i }).click();

  await page.getByRole('button', { name: /Analyze Speech Pattern/i }).click();

  await expect(page.getByText('Delivery Insights')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Professional Metrics')).toBeVisible();
  // Accent badge from mock data
  await expect(page.getByText(/General American/)).toBeVisible();
});
