import { test, expect } from '@playwright/test';
import { mockGeminiApi } from './helpers';

const ALL_METRICS = [
  'Confidence Score',
  'Rhythm & Prosody',
  'Intonation',
  'Articulation',
  'Vocal Resonance',
  'Breath Management',
  'Vocal Health',
  'Speaking Pace (WPM)',
  'Sentiment Analysis',
  'Filler Words',
  'Micro-Hesitations',
  'Plosive Clarity',
  'Environment Quality',
  'Mic Calibration',
  'Linguistic Accent',
  'Clarity Index',
];

test.beforeEach(async ({ page }) => {
  await mockGeminiApi(page);
  await page.goto('/');
  await page.getByRole('tab', { name: /Glossary/i }).first().click();
});

test('renders all 16 glossary metric cards', async ({ page }) => {
  for (const metric of ALL_METRICS) {
    await expect(page.getByText(metric, { exact: true })).toBeVisible();
  }
});

test('each glossary card shows a benchmark label', async ({ page }) => {
  // Use exact match to avoid collisions with description text that may contain the same words
  await expect(page.getByText('Signal-to-Noise', { exact: true })).toBeVisible();
  await expect(page.getByText('Phonetic Profile', { exact: true })).toBeVisible();
  await expect(page.getByText('Listener Ease', { exact: true })).toBeVisible();
});

test('accent-related entries added in latest commit are present', async ({ page }) => {
  await expect(page.getByText('Linguistic Accent')).toBeVisible();
  await expect(page.getByText('Clarity Index')).toBeVisible();
  await expect(page.getByText('Mic Calibration')).toBeVisible();
});
