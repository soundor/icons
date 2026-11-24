/** The landing page, in the built site, on a desktop and a phone. */

import { expect, test } from '@playwright/test';

import { collectionCount, iconCountLabel } from './catalog';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('shows a sample of every collection, drawn with the browser implementation', async ({
  page,
}) => {
  const sample = page.getByRole('list', { name: 'A sample of the icons' });
  await expect(sample.getByRole('link')).toHaveCount(30);
  for (const name of [
    'Play, Lucide',
    'PlayerSkipForward, Tabler',
    'Waveform, Phosphor',
    'GraphicEq, Material Symbols',
    'SpeakerWave, Heroicons',
  ])
    await expect(
      sample.getByRole('link', { name, exact: true }).locator('svg'),
    ).toBeVisible();
});

test('opens a sample icon in the browser', async ({ page }) => {
  await page
    .getByRole('list', { name: 'A sample of the icons' })
    .getByRole('link', { name: 'Play, Lucide', exact: true })
    .click();
  await expect(page).toHaveURL(/\/browse\?icon=lucide%3APlay$/);
  await expect(
    page.getByTestId('details').getByRole('heading', { name: 'Play' }),
  ).toBeVisible();
});

test('searches in the browser', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search icons' }).fill('volume');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/browse\?q=volume$/);
  await expect(page.getByTestId('result-count')).toHaveText(
    /icons for “volume”/,
  );
});

test('opens a collection in the browser', async ({ page }) => {
  await page.getByRole('link', { name: /^Heroicons/ }).click();
  await expect(page).toHaveURL(/\/browse\?c=heroicons$/);
  await expect(page.getByTestId('result-count')).toHaveText(
    `${iconCountLabel(collectionCount('heroicons'))} in Heroicons`,
  );
});

test('reaches the footer without scrolling through the icons', async ({
  page,
}) => {
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThan(5000);
});

test('fits the viewport', async ({ page }) => {
  const width = page.viewportSize()!.width;
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
});
