import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

test('react: Slider formatValue describes the native input and keeps keyboard payloads numeric', async ({ page }) => {
  await openFixture(page, 'react', '?mode=slider', 'adoption-controls');
  const slider = page.getByRole('slider', { name: '기록 시간' });
  await expect(slider).toHaveAttribute('aria-valuetext', '10월 30일 10시');
  await expect(page.getByTestId('single').locator('output')).toHaveText('10월 30일 10시');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('11');
  await expect(slider).toHaveAttribute('aria-valuetext', '10월 30일 11시');
  await expect(page.getByTestId('changes')).toHaveText('[{"change":11},{"commit":11}]');
  await page.evaluate(() => (window as any).configureAdoptionControls({ prefix: '10월 31일' }));
  await expect(slider).toHaveAttribute('aria-valuetext', '10월 31일 11시');
  await page.evaluate(() => (window as any).configureAdoptionControls({ formatted: false }));
  await expect(slider).toHaveAttribute('aria-valuetext', '11');
  await expect(page.getByTestId('single').locator('output')).toHaveText('11');
});

test('react: RangeSlider formats each thumb without changing bounds or tuple callbacks', async ({ page }) => {
  await openFixture(page, 'react', '?mode=slider', 'adoption-controls');
  const start = page.getByRole('slider', { name: '시작 시간' }), end = page.getByRole('slider', { name: '끝 시간' });
  await expect(start).toHaveAttribute('aria-valuetext', '10월 30일 20시');
  await expect(end).toHaveAttribute('aria-valuetext', '10월 30일 80시');
  await expect(page.getByTestId('range').locator('output')).toHaveText('10월 30일 20시 – 10월 30일 80시');
  await start.press('End');
  await expect(start).toHaveValue('80');
  await expect(start).toHaveAttribute('aria-valuetext', '10월 30일 80시');
  await expect(end).toHaveValue('80');
  await expect(page.getByTestId('changes')).toHaveText('[{"change":[80,80]},{"commit":[80,80]}]');
  await page.evaluate(() => (window as any).configureAdoptionControls({ range: [30, 70], disabled: true }));
  await expect(start).toBeDisabled();
  await expect(start).toHaveAttribute('aria-valuetext', '10월 30일 30시');
  await expect(end).toHaveAttribute('aria-valuetext', '10월 30일 70시');
});

test('react: formatted Slider follows pointer changes and preserves controlled rejection', async ({ page }) => {
  await openFixture(page, 'react', '?mode=slider', 'adoption-controls');
  const slider = page.getByRole('slider', { name: '기록 시간' });
  const track = (await page.getByTestId('single').locator('.kjun-slider-track').boundingBox())!;
  await page.mouse.click(track.x + track.width * .6, track.y + track.height / 2);
  const value = Number(await slider.inputValue());
  expect(value).toBeGreaterThan(10);
  await expect(slider).toHaveAttribute('aria-valuetext', `10월 30일 ${value}시`);
  const changes = JSON.parse((await page.getByTestId('changes').textContent())!);
  expect(changes.at(-1)).toEqual({ commit: value });
  expect(changes.every((event: { change?: unknown; commit?: unknown }) => typeof (event.change ?? event.commit) === 'number')).toBe(true);
  await page.evaluate(() => (window as any).configureAdoptionControls({ value: 10, accept: false }));
  await expect(slider).toHaveValue('10');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('10');
  await expect(slider).toHaveAttribute('aria-valuetext', '10월 30일 10시');
});
