import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunEventCalendar: six fixed weeks (or one week) of 49px day cells with dots, an icon and a span bar; today is pinned to 2026-11-17.
const values = (page: Page) => page.getByTestId('values');
const grid = (page: Page, id: string) => page.getByTestId(id).locator('.kjun-event-calendar-grid');
const day = (page: Page, id: string, iso: string) => page.getByTestId(id).locator(`[data-iso="${iso}"]`);
const number = (page: Page, id: string, iso: string) => day(page, id, iso).locator('.kjun-calendar-day-number');
const opacity = (cell: Locator) => cell.evaluate(el => Number(getComputedStyle(el).opacity));
// A colour role as the browser computes it inside the KJUN scope.
const role = (page: Page, name: string) => page.evaluate(name => {
  const probe = document.createElement('i');
  probe.style.color = `var(--_kjun-color-${name})`;
  document.querySelector('.kjun-scope')!.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}, name);
// Pointer events as a finger (or mouse) would send them, from the middle of a cell.
const drag = (cell: Locator, dx: number, dy: number, pointerType = 'touch') => cell.evaluate((el, { dx, dy, pointerType }) => {
  const box = el.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
  const fire = (type: string, cx: number, cy: number) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 21, pointerType, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: cx, clientY: cy,
  }));
  fire('pointerdown', x, y);
  fire('pointermove', x + dx / 2, y + dy / 2);
  fire('pointermove', x + dx, y + dy);
  fire('pointerup', x + dx, y + dy);
}, { dx, dy, pointerType });
const middleCell = (page: Page, id: string) => grid(page, id).locator('button').nth(17);
// Records every data-slide value the grid takes from now on.
const recordSlides = (target: Locator) => target.evaluate(el => {
  const seen: (string | null)[] = (window as any).slides = [];
  new MutationObserver(() => seen.push(el.getAttribute('data-slide'))).observe(el, { attributes: true, attributeFilter: ['data-slide'] });
});
const slides = (page: Page) => page.evaluate(() => ((window as any).slides as (string | null)[]).filter(Boolean));

for (const platform of ['react', 'vue3']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-17T12:00:00'));
      await openFixture(page, platform, '', 'event-calendar');
      await expect(day(page, 'month', '2026-11-17')).toBeVisible();
    });

    test('six weeks at a fixed height', async ({ page }) => {
      await expect(grid(page, 'month').locator('button')).toHaveCount(42);
      expect(Math.round((await day(page, 'month', '2026-11-17').boundingBox())!.height)).toBe(49);
      const november = (await grid(page, 'plain').boundingBox())!.height;
      // February 2026 fits in four weeks; the grid still draws six.
      await page.evaluate(() => (window as any).configureEvents({ plainMonth: '2026-02' }));
      await expect(day(page, 'plain', '2026-02-14')).toBeVisible();
      await expect(grid(page, 'plain')).not.toHaveAttribute('data-slide');
      await expect(grid(page, 'plain').locator('button')).toHaveCount(42);
      expect((await grid(page, 'plain').boundingBox())!.height).toBe(november);
    });

    test('today is a filled pill and the picked day a grey square', async ({ page }) => {
      const today = number(page, 'month', '2026-11-17');
      await expect(day(page, 'month', '2026-11-17')).toHaveAttribute('data-today', /.*/);
      const pill = await today.evaluate(el => {
        const style = getComputedStyle(el), box = el.getBoundingClientRect();
        return { background: style.backgroundColor, height: box.height, width: box.width, radius: style.borderTopLeftRadius };
      });
      expect(pill.background).toBe(await role(page, 'brand'));
      expect(Math.round(pill.height)).toBe(26);
      expect(pill.width).toBeGreaterThanOrEqual(32);
      expect(pill.radius).toBe('9px');
      const picked = day(page, 'month', '2026-11-20');
      await picked.click();
      await expect(picked).toHaveAttribute('aria-pressed', 'true');
      await expect(values(page)).toHaveText('2026-11|2026-11-30|2026-11-20|');
      expect(await picked.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(await role(page, 'active'));
      expect(await number(page, 'month', '2026-11-20').evaluate(el => getComputedStyle(el).fontWeight)).toBe('800');
      // Cells carry no border or ring; the selected square is a fill.
      const edges = await grid(page, 'month').locator('button').evaluateAll(cells => cells.map(el => {
        const style = getComputedStyle(el);
        return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth, style.boxShadow].join(' ');
      }));
      expect(new Set(edges)).toEqual(new Set(['0px 0px 0px 0px none']));
    });

    test('tones and dimming', async ({ page }) => {
      const danger = await role(page, 'danger'), info = await role(page, 'info');
      const color = (iso: string) => number(page, 'month', iso).evaluate(el => getComputedStyle(el).color);
      expect(await color('2026-11-22')).toBe(danger); // Sunday
      expect(await color('2026-11-10')).toBe(danger); // holiday on a Tuesday
      expect(await color('2026-11-21')).toBe(info); // Saturday
      await expect(day(page, 'month', '2026-11-10')).toHaveAttribute('data-past', /.*/);
      expect(await opacity(number(page, 'month', '2026-11-10'))).toBeCloseTo(0.7, 2);
      expect(await opacity(number(page, 'month', '2026-11-12'))).toBeCloseTo(0.45, 2);
      expect(await opacity(day(page, 'month', '2026-11-12'))).toBe(1);
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('data-outside', /.*/);
      expect(await opacity(number(page, 'month', '2026-12-01'))).toBeCloseTo(0.2, 2);
      expect(await opacity(day(page, 'month', '2026-12-01').locator('.kjun-event-calendar-marks'))).toBeCloseTo(0.2, 2);
      // The bar on a past day keeps its colour.
      expect(await opacity(day(page, 'month', '2026-11-13').locator('.kjun-event-calendar-span'))).toBe(1);
      expect(await opacity(number(page, 'month', '2026-11-18'))).toBe(1);
    });

    test('marks: three dots at most, one icon, a bar that joins across cells', async ({ page }) => {
      const busy = day(page, 'month', '2026-11-11');
      await expect(busy.locator('.kjun-event-calendar-dot')).toHaveCount(3);
      await expect(busy.locator('.kjun-event-calendar-icon')).toHaveCount(1);
      expect(Math.round((await busy.locator('.kjun-event-calendar-icon').boundingBox())!.width)).toBe(11);
      expect(Math.round((await busy.locator('.kjun-event-calendar-dot').first().boundingBox())!.width)).toBe(5);
      const bar = (iso: string) => day(page, 'month', iso).locator('.kjun-event-calendar-span');
      await expect(bar('2026-11-12')).toHaveCount(0);
      await expect(bar('2026-11-13')).toHaveAttribute('data-start', /.*/);
      await expect(bar('2026-11-13')).not.toHaveAttribute('data-end');
      await expect(bar('2026-11-14')).toHaveAttribute('data-end', /.*/); // Saturday ends the row
      await expect(bar('2026-11-14')).not.toHaveAttribute('data-start');
      await expect(bar('2026-11-15')).toHaveAttribute('data-start', /.*/); // Sunday starts the next row
      await expect(bar('2026-11-16')).toHaveAttribute('data-end', /.*/);
      await expect(bar('2026-11-17')).toHaveCount(0);
      expect(Math.round((await bar('2026-11-13').boundingBox())!.height)).toBe(5);
      const edge = (iso: string) => bar(iso).evaluate(el => { const box = el.getBoundingClientRect(); return { left: box.left, right: box.right }; });
      // Neighbouring pieces touch or overlap, so fractional cell widths leave no hairline.
      expect((await edge('2026-11-13')).right).toBeGreaterThanOrEqual((await edge('2026-11-14')).left);
      expect((await edge('2026-11-15')).right).toBeGreaterThanOrEqual((await edge('2026-11-16')).left);
    });

    test('an outside day picks and moves the month', async ({ page }) => {
      await day(page, 'month', '2026-12-01').click();
      await expect(values(page)).toHaveText('2026-12|2026-11-30|2026-12-01|');
      await expect(day(page, 'month', '2026-12-01')).not.toHaveAttribute('data-outside');
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('aria-pressed', 'true');
    });

    test('arrow keys cross the month and carry focus', async ({ page }) => {
      // Before any pick, today holds the only tab stop.
      await expect(grid(page, 'month').locator('button[tabindex="0"]')).toHaveAttribute('data-iso', '2026-11-17');
      await day(page, 'month', '2026-11-30').focus();
      await page.keyboard.press('ArrowRight');
      await expect(values(page)).toHaveText(/^2026-12\|/);
      await expect(day(page, 'month', '2026-12-01')).toBeFocused();
      await expect(day(page, 'month', '2026-12-01')).not.toHaveAttribute('data-outside');
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('tabindex', '0');
      await page.keyboard.press('PageDown');
      await expect(values(page)).toHaveText(/^2027-01\|/);
      await expect(day(page, 'month', '2027-01-01')).toBeFocused();
      await expect(day(page, 'month', '2027-01-01')).not.toHaveAttribute('data-outside');
      // Moving inside the month keeps the month.
      await page.keyboard.press('ArrowDown');
      await expect(day(page, 'month', '2027-01-08')).toBeFocused();
      await expect(values(page)).toHaveText(/^2027-01\|/);
    });

    test('a parent that applies the month later still gets focus on the new day', async ({ page }) => {
      // 12-12 is the last of November's 42 cells; 12-19 is drawn only once December is.
      await day(page, 'deferred', '2026-12-12').focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('deferred-month')).toHaveText('2026-12');
      await expect(day(page, 'deferred', '2026-12-19')).not.toHaveAttribute('data-outside');
      await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.iso)).toBe('2026-12-19');
      await expect(day(page, 'deferred', '2026-12-19')).toBeFocused();
    });

    test('touch swipe changes the month; vertical drags do not', async ({ page }) => {
      // Each refused gesture gets time to start a slide before the state is read, so a late change would show.
      await drag(middleCell(page, 'month'), -30, 40);
      await page.waitForTimeout(300);
      await expect(grid(page, 'month')).not.toHaveAttribute('data-slide');
      await expect(values(page)).toHaveText('2026-11|2026-11-30||');
      await drag(middleCell(page, 'month'), -60, 0, 'mouse');
      await page.waitForTimeout(300);
      await expect(grid(page, 'month')).not.toHaveAttribute('data-slide');
      await expect(values(page)).toHaveText('2026-11|2026-11-30||');
      await drag(middleCell(page, 'month'), -60, 0);
      await expect(values(page)).toHaveText('2026-12|2026-11-30||');
      await expect(day(page, 'month', '2026-12-15')).not.toHaveAttribute('data-outside');
      // A swipe to the right goes back, and the swipe never picks or long-presses a day.
      await drag(middleCell(page, 'month'), 60, 0);
      await expect(values(page)).toHaveText('2026-11|2026-11-30||');
      // The week calendar is not swipeable.
      await drag(grid(page, 'week').locator('button').nth(3), -60, 0);
      await page.waitForTimeout(300);
      await expect(grid(page, 'week')).not.toHaveAttribute('data-slide');
      await expect(values(page)).toHaveText('2026-11|2026-11-30||');
    });

    test('rapid month changes settle on the last month', async ({ page }) => {
      await recordSlides(grid(page, 'month'));
      await drag(middleCell(page, 'month'), -60, 0);
      await page.waitForTimeout(100);
      await drag(middleCell(page, 'month'), -60, 0);
      await expect(values(page)).toHaveText(/^2027-01\|/);
      await expect(day(page, 'month', '2027-01-15')).not.toHaveAttribute('data-outside');
      await expect(grid(page, 'month')).not.toHaveAttribute('data-slide');
      await expect(grid(page, 'month')).not.toHaveAttribute('data-direction');
      // The change slid out and in.
      expect(await slides(page)).toEqual(expect.arrayContaining(['out', 'in']));
    });

    test('long press: touch hold, right click and Shift+Enter; the hold does not pick', async ({ page }) => {
      const cell = day(page, 'month', '2026-11-19');
      await expect(cell).toHaveAttribute('aria-keyshortcuts', 'Shift+Enter');
      const described = await cell.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${described}"]`)).toHaveText('이날 약속 추가');
      await cell.evaluate(el => {
        const box = el.getBoundingClientRect(), init = { bubbles: true, cancelable: true, pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
        el.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1 }));
        return new Promise<void>(done => setTimeout(() => {
          el.dispatchEvent(new PointerEvent('pointerup', init));
          // The click a browser sends when the finger lifts.
          (el as HTMLElement).click();
          done();
        }, 800));
      });
      await expect(values(page)).toHaveText('2026-11|2026-11-30||2026-11-19');
      await day(page, 'month', '2026-11-24').click({ button: 'right' });
      await expect(values(page)).toHaveText('2026-11|2026-11-30||2026-11-24');
      await day(page, 'month', '2026-11-25').focus();
      await page.keyboard.press('Shift+Enter');
      await expect(values(page)).toHaveText('2026-11|2026-11-30||2026-11-25');
      // A plain tap still picks after a hold.
      await day(page, 'month', '2026-11-26').click();
      await expect(values(page)).toHaveText('2026-11|2026-11-30|2026-11-26|2026-11-25');
    });

    test('without onDayLongPress the context menu is left alone', async ({ page }) => {
      const cell = day(page, 'plain', '2026-11-19');
      const prevented = await cell.evaluate(el => {
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
        el.dispatchEvent(event);
        return event.defaultPrevented;
      });
      expect(prevented).toBe(false);
      await expect(cell).not.toHaveAttribute('aria-keyshortcuts');
      await expect(cell).not.toHaveAttribute('aria-describedby');
      // Shift+Enter falls through to the button and picks the day.
      await cell.focus();
      await page.keyboard.press('Shift+Enter');
      await expect(cell).toHaveAttribute('aria-pressed', 'true');
    });

    test('week view: seven days, no dimming of the other month, null value', async ({ page }) => {
      const cells = grid(page, 'week').locator('button');
      await expect(cells).toHaveCount(7);
      expect(await cells.evaluateAll(list => list.map(el => (el as HTMLElement).dataset.iso))).toEqual(
        ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
      await expect(grid(page, 'week').locator('[data-outside]')).toHaveCount(0);
      await expect(grid(page, 'week').locator('[aria-pressed="true"]')).toHaveCount(0);
      // A week across two months names both.
      await expect(grid(page, 'week')).toHaveAttribute('aria-label', '2026년 11월 – 2026년 12월');
      expect(await opacity(number(page, 'week', '2026-12-01'))).toBe(1);
      expect(Math.round((await day(page, 'week', '2026-12-01').boundingBox())!.height)).toBe(49);
      // Arrow keys past the week's end ask for the next week by its first day.
      await day(page, 'week', '2026-12-05').focus();
      await page.keyboard.press('ArrowRight');
      await expect(values(page)).toHaveText('2026-11|2026-12-06||');
      await expect(day(page, 'week', '2026-12-06')).toBeFocused();
    });

    test('the spoken name', async ({ page }) => {
      await expect(day(page, 'month', '2026-11-10')).toHaveAttribute('aria-label', '2026년 11월 10일 화요일, 창립기념일, 일정 1개');
      await expect(day(page, 'month', '2026-11-18')).toHaveAttribute('aria-label', '2026년 11월 18일 수요일');
      await expect(day(page, 'month', '2026-11-17')).toHaveAttribute('aria-current', 'date');
      await expect(grid(page, 'month').locator('[aria-current]')).toHaveCount(1);
      await expect(grid(page, 'month')).toHaveAttribute('aria-label', '2026년 11월');
    });

    test('reduced motion swaps at once', async ({ page }) => {
      // The preference is read live, so the open page follows it.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      await recordSlides(grid(page, 'month'));
      await day(page, 'month', '2026-12-01').click();
      await expect(values(page)).toHaveText(/^2026-12\|/);
      await expect(day(page, 'month', '2026-12-01')).not.toHaveAttribute('data-outside');
      expect(await grid(page, 'month').getAttribute('data-slide')).toBeNull();
      expect(await slides(page)).toEqual([]);
    });
  });
}
