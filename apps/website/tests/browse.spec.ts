/** The icon browser at /browse, in the built site, on a desktop and a phone. */

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
  await page.goto('./browse');
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
  await page.goto('./browse?c=material&v=rounded-filled&q=volume');
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
  await page.goto('./browse?c=phosphor&q=gear');
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

test('fills the window, scrolling the grid and not the page', async ({
  page,
}) => {
  const height = page.viewportSize()!.height;
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(height);
  const scroller = page.getByTestId('grid-scroller');
  await scroller.evaluate((element) => element.scrollBy(0, 2000));
  await expect(cell(page, 'AArrowDown, Lucide')).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('picks a color in a popover: area, hue, hex and swatches, without the system picker', async ({
  page,
}) => {
  await page.goto('./browse?icon=lucide%3APlay');
  const details = page.getByTestId('details');
  const code = details.locator('pre');
  await expect(details.locator('input[type="color"]')).toHaveCount(0);
  await details.getByRole('button', { name: 'Color #f2f4f7' }).click();
  const picker = page.getByRole('dialog', { name: 'Color picker' });
  await expect(picker).toBeVisible();

  await picker.getByRole('button', { name: 'Soundor orange' }).click();
  await expect(code).toContainText('color="#ff5a1f"');
  const hex = picker.getByRole('textbox', { name: 'Hex color' });
  await expect(hex).toHaveValue('ff5a1f');

  await hex.fill('4ade8');
  await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await expect(code).toContainText('color="#ff5a1f"');
  await hex.fill('#38f');
  await expect(code).toContainText('color="#3388ff"');

  // Black, dragged to the area's top right: full saturation and brightness.
  await hex.fill('000');
  const area = picker.getByTestId('color-area');
  const box = (await area.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 20, box.y - 20, { steps: 4 });
  await page.mouse.up();
  await expect(hex).not.toHaveValue('000000');
  const hue = picker.getByRole('slider', { name: 'Hue' });
  const before = Number(await hue.getAttribute('aria-valuenow'));
  await hue.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(hue).toHaveAttribute('aria-valuenow', String(before + 10));

  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(details).toBeVisible();
});

test('keeps the scroll position when an icon is selected, and the icon in view when its variant changes', async ({
  page,
}) => {
  const scroller = page.getByTestId('grid-scroller');
  await scroller.evaluate((element) => element.scrollBy(0, 3000));
  const top = await scroller.evaluate((element) => element.scrollTop);
  expect(top).toBeGreaterThan(2000);
  // A cell on screen, so the click itself does not scroll.
  const box = (await scroller.boundingBox())!;
  await page.mouse.click(box.x + 60, box.y + box.height / 2);
  await expect(page.getByTestId('details')).toBeVisible();
  expect(await scroller.evaluate((element) => element.scrollTop)).toBe(top);

  // Tabler filled hides Tabler icons without a filled version: new results,
  // with the selected icon still among them and on screen.
  await page.goto('./browse?q=player');
  await cell(page, 'PlayerPlay, Tabler').click();
  await page
    .getByTestId('details')
    .getByRole('button', { name: 'Filled' })
    .click();
  await expect(cell(page, 'PlayerPlay, Tabler')).toBeInViewport();
});
