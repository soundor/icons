/** The gallery, in the built site, on a desktop and a phone. */

import { expect, test, type Page } from '@playwright/test';

const count = (page: Page) => page.getByTestId('result-count');
const search = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search icons' });
const cell = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Icons' })
    .getByRole('button', { name, exact: true });

test.beforeEach(async ({ page, context, browserName }) => {
  if (browserName === 'chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await expect(count(page)).toHaveText('13,575 icons');
});

test('shows the gallery at once, drawn with the browser implementation, without mounting the catalog', async ({
  page,
}) => {
  const first = cell(page, 'AArrowDown, Lucide');
  await expect(first.locator('svg')).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(first.locator('svg')).toHaveAttribute('stroke', 'currentColor');
  // Virtualized: a few rows, not 13 575 icons.
  expect(
    await page
      .getByRole('list', { name: 'Icons' })
      .getByRole('listitem')
      .count(),
  ).toBeLessThan(250);
});

test('searches names, word by word and joined, case-insensitively', async ({
  page,
}) => {
  await search(page).fill('Arrow Left');
  await expect(count(page)).toHaveText(/icons for “Arrow Left”/);
  await expect(cell(page, 'ArrowLeft, Lucide')).toBeVisible();
  await search(page).fill('arrowleft');
  await expect(cell(page, 'ArrowLeft, Tabler')).toBeVisible();
});

test('searches upstream tags', async ({ page }) => {
  // Lucide tags `cog` with "sprocket"; its name says nothing about it.
  await search(page).fill('sprocket');
  await expect(cell(page, 'Cog, Lucide')).toBeVisible();
});

test('filters by collection and variant, in the URL', async ({ page }) => {
  await page.getByRole('radio', { name: /^Tabler/ }).click();
  await expect(count(page)).toHaveText('5,491 icons in Tabler');
  await expect(page).toHaveURL(/\?c=tabler$/);
  await page
    .getByRole('radiogroup', { name: 'Tabler variant' })
    .getByRole('radio', { name: 'Filled' })
    .click();
  await expect(count(page)).toHaveText('1,054 icons in Tabler');
  await expect(page).toHaveURL(/c=tabler&v=filled/);
  await expect(cell(page, 'Accessible').locator('svg')).toHaveAttribute(
    'fill',
    'currentColor',
  );
});

test('restores a shared search from the URL', async ({ page }) => {
  await page.goto('./?c=material&v=rounded-filled&q=volume');
  await expect(count(page)).toHaveText(
    '6 icons in Material Symbols for “volume”',
  );
  await expect(
    page.getByRole('radio', { name: 'Rounded, filled' }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(cell(page, 'VolumeUp').locator('svg')).toHaveAttribute(
    'viewBox',
    '0 -960 960 960',
  );
});

test("shows an icon's details and copies its public import and JSX", async ({
  page,
  browserName,
}) => {
  await search(page).fill('arrow left');
  await cell(page, 'ArrowLeft, Lucide').click();
  const details = page.getByTestId('details');
  await expect(
    details.getByRole('heading', { name: 'ArrowLeft' }),
  ).toBeVisible();
  await expect(details).toContainText('ISC AND MIT');
  await expect(
    details.getByTestId('preview').getByRole('img', { name: 'ArrowLeft' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/icon=lucide%3AArrowLeft/);

  await details.getByRole('slider').nth(1).fill('1.5');
  await details.getByRole('slider').first().fill('32');
  await expect(details.locator('pre')).toContainText(
    `import { ArrowLeft } from '@soundor/icons/lucide';`,
  );
  await expect(details.locator('pre')).toContainText(
    '<ArrowLeft size={32} color="#f2f4f7" strokeWidth={1.5} />',
  );
  test.skip(browserName !== 'chromium', 'clipboard permissions');
  await details.getByRole('button', { name: 'Copy import' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `import { ArrowLeft } from '@soundor/icons/lucide';`,
  );
  await details.getByRole('button', { name: 'Copy JSX' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '<ArrowLeft size={32} color="#f2f4f7" strokeWidth={1.5} />',
  );
});

test("switches an icon's variant, and offers no stroke width for filled icons", async ({
  page,
}) => {
  await page.goto('./?c=phosphor&q=gear');
  await cell(page, 'Gear').click();
  const details = page.getByTestId('details');
  await expect(details.getByText('Stroke width')).toHaveCount(0);
  await details.getByRole('button', { name: 'Bold' }).click();
  await expect(details.locator('pre')).toContainText(
    `from '@soundor/icons/phosphor/bold'`,
  );
  await expect(page).toHaveURL(/v=bold/);
  await expect(details).toContainText('MIT');
});

test('moves through the grid with the keyboard', async ({ page }) => {
  await search(page).fill('play');
  const first = page.locator('[data-icon-index="0"]');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-icon-index="1"]')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(first).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('[data-icon-index]:focus')).toHaveAttribute(
    'aria-label',
    /.+/,
  );
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('details')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('details')).toHaveCount(0);
});

test('fits the viewport', async ({ page }) => {
  const width = page.viewportSize()!.width;
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
  await cell(page, 'Activity, Lucide').click();
  const box = (await page.getByTestId('details').boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
});
