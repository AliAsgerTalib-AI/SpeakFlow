import { test, expect } from '@playwright/test';
import { mockGeminiApi } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockGeminiApi(page);
  await page.goto('/');
});

test('loads on the Practice tab by default', async ({ page }) => {
  await expect(page).toHaveTitle(/SpeakFlow/i);
  // Practice script card should be visible immediately
  await expect(page.getByText('Practice Script')).toBeVisible();
});

test('desktop tab: navigates to Free Speech Lab', async ({ page }) => {
  await page.getByRole('tab', { name: /Free Speech Lab/i }).first().click();
  await expect(page.getByText('Free Speech Lab')).toBeVisible();
  await expect(page.getByText('Capture up to 60 seconds')).toBeVisible();
});

test('desktop tab: navigates to Dashboard', async ({ page }) => {
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();
  // Empty state when no sessions
  await expect(page.getByText('No sessions yet')).toBeVisible();
});

test('desktop tab: navigates to Glossary', async ({ page }) => {
  await page.getByRole('tab', { name: /Glossary/i }).first().click();
  await expect(page.getByText('Confidence Score')).toBeVisible();
  await expect(page.getByText('Linguistic Accent')).toBeVisible();
});

test('clicking the SpeakFlow logo returns to Practice tab', async ({ page }) => {
  // Navigate away first
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();
  await expect(page.getByText('No sessions yet')).toBeVisible();

  // Click the logo
  await page.locator('header span.font-serif').click();
  await expect(page.getByText('Practice Script')).toBeVisible();
});

test('tab state is visually active after switching', async ({ page }) => {
  const glossaryTab = page.getByRole('tab', { name: /Glossary/i }).first();
  await glossaryTab.click();
  // base-ui uses aria-selected, not data-state
  await expect(glossaryTab).toHaveAttribute('aria-selected', 'true');
});
