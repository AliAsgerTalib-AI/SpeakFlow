import { test, expect } from '@playwright/test';
import { mockGeminiApi, seedSessions, clearSessions } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockGeminiApi(page);
  await page.goto('/');
  await clearSessions(page);
});

test('shows empty state when no sessions exist', async ({ page }) => {
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();
  await expect(page.getByText('No sessions yet')).toBeVisible();
  await expect(page.getByText('Start your first practice session')).toBeVisible();
});

test('shows session stats when sessions exist', async ({ page }) => {
  await seedSessions(page, 5);
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();

  // Metric cards — scope to the Sessions card to avoid ambiguous locators
  const sessionsCard = page.locator('[data-slot="card"]').filter({ hasText: 'Sessions' }).first();
  await expect(sessionsCard.getByText('5')).toBeVisible();
  await expect(page.getByText('WPM', { exact: true })).toBeVisible();
  await expect(page.getByText('Confidence Trend')).toBeVisible();
});

test('renders confidence trend chart with session data', async ({ page }) => {
  await seedSessions(page, 3);
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();

  await expect(page.getByText('Confidence Trend')).toBeVisible();
  await expect(page.getByText('Pace Volatility')).toBeVisible();
  // Recharts renders an SVG
  await expect(page.locator('svg').first()).toBeVisible();
});

test('top filler word is derived from all sessions', async ({ page }) => {
  await seedSessions(page, 2);
  await page.getByRole('tab', { name: /Dashboard/i }).first().click();
  // "Um" is the filler word in both mock sessions
  await expect(page.getByText(/"Um"/i)).toBeVisible();
});
