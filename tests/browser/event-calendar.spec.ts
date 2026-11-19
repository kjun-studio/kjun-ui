import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunEventCalendar: six fixed weeks (or one week) of 49px day cells with dots, an icon and a span bar; today is pinned to 2026-11-17.
// React Native Web prints no kjun-* classes or ::before: Native parts carry data-kjun-part, set per test from the platform.
let native = false;
const part = (web: string, name: string) => native ? `[data-kjun-part="${name}"]` : web;
const values = (page: Page) => page.getByTestId('values');
const grid = (page: Page, id: string) => page.getByTestId(id).locator(part('.kjun-event-calendar-grid', 'event-calendar-grid'));
const cells = (page: Page, id: string) => grid(page, id).locator(native ? '[data-iso]' : 'button');
const day = (page: Page, id: string, iso: string) => page.getByTestId(id).locator(`[data-iso="${iso}"]`);
const number = (page: Page, id: string, iso: string) => day(page, id, iso).locator(part('.kjun-calendar-day-number', 'number'));
// The web number draws its own pill; Native wraps the number text in a pill view.
const pillOf = (page: Page, id: string, iso: string) => native ? day(page, id, iso).locator('[data-kjun-part="pill"]') : number(page, id, iso);
// The selected square: the web cell's ::before, a Native view behind the number.
const squareColor = (cell: Locator) => native ? cell.locator('[data-kjun-part="square"]').evaluate(el => getComputedStyle(el).backgroundColor)
  : cell.evaluate(el => getComputedStyle(el, '::before').backgroundColor);
const opacity = (cell: Locator) => cell.evaluate(el => Number(getComputedStyle(el).opacity));
// A colour role as the browser computes it inside the KJUN scope.
// Native has no .kjun-scope; its fixture passes the provider the same palette it sets as the public --kjun-* values.
const role = (page: Page, name: string) => page.evaluate(name => {
  const probe = document.createElement('i'), scope = document.querySelector('.kjun-scope');
  probe.style.color = scope ? `var(--_kjun-color-${name})` : `var(--kjun-${name})`;
  (scope ?? document.body).append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}, name);
// Pointer events as a finger (or mouse) would send them, from the middle of a cell.
// React Native Web's responder system reads touch (and mouse) events, not pointer events: Native gets touch events, which, as a browser sends them,
// all target the element the finger went down on. (Its mouse path loses a drag that crosses into a sibling cell: RN Web finds no common ancestor there.)
async function drag(cell: Locator, dx: number, dy: number, pointerType = 'touch') {
  if (native && pointerType === 'mouse') {
    // React Native Web's responder reads mouse events, so a real mouse drag.
    const box = (await cell.boundingBox())!, x = box.x + box.width / 2, y = box.y + box.height / 2, mouse = cell.page().mouse;
    await mouse.move(x, y); await mouse.down(); await mouse.move(x + dx / 2, y + dy / 2); await mouse.move(x + dx, y + dy); await mouse.up();
    return;
  }
  if (native) {
    await cell.evaluate((el, { dx, dy }) => {
      const box = el.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
      const fire = (type: string, cx: number, cy: number) => {
        const touch = new Touch({ identifier: 21, target: el, clientX: cx, clientY: cy, pageX: cx + scrollX, pageY: cy + scrollY });
        const active = type === 'touchend' ? [] : [touch];
        el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: active, targetTouches: active, changedTouches: [touch] }));
      };
      fire('touchstart', x, y);
      fire('touchmove', x + dx / 2, y + dy / 2);
      fire('touchmove', x + dx, y + dy);
      fire('touchend', x + dx, y + dy);
    }, { dx, dy });
    return;
  }
  await cell.evaluate((el, { dx, dy, pointerType }) => {
  const box = el.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
  const fire = (type: string, cx: number, cy: number) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 21, pointerType, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: cx, clientY: cy,
  }));
  fire('pointerdown', x, y);
  fire('pointermove', x + dx / 2, y + dy / 2);
  fire('pointermove', x + dx, y + dy);
  fire('pointerup', x + dx, y + dy);
  }, { dx, dy, pointerType });
}
const middleCell = (page: Page, id: string) => cells(page, id).nth(17);
// A finger held on a cell for 800ms, then lifted.
const hold = (cell: Locator) => cell.evaluate(el => {
  const box = el.getBoundingClientRect(), init = { bubbles: true, cancelable: true, pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...init, buttons: 1 }));
  return new Promise<void>(done => setTimeout(() => {
    el.dispatchEvent(new PointerEvent('pointerup', init));
    // The click a browser sends when the finger lifts.
    (el as HTMLElement).click();
    done();
  }, 800));
});
// Native: the mouse held down for 800ms (React Native Web's Pressable takes it as a long press), then released, which clicks.
const mouseHold = async (cell: Locator) => { await cell.hover(); await cell.page().mouse.down(); await cell.page().waitForTimeout(800); await cell.page().mouse.up(); };
// Records every data-slide value the grid takes from now on.
const recordSlides = (target: Locator) => target.evaluate(el => {
  const seen: (string | null)[] = (window as any).slides = [];
  new MutationObserver(() => seen.push(el.getAttribute('data-slide'))).observe(el, { attributes: true, attributeFilter: ['data-slide'] });
});
const slides = (page: Page) => page.evaluate(() => ((window as any).slides as (string | null)[]).filter(Boolean));

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      native = platform === 'native';
      // React Native's Animated times its frames with Date.now, so Native lets time run from the same moment instead of freezing it.
      if (native) await page.clock.setSystemTime(new Date('2026-11-17T12:00:00'));
      else await page.clock.setFixedTime(new Date('2026-11-17T12:00:00'));
      await openFixture(page, platform, '', 'event-calendar');
      await expect(day(page, 'month', '2026-11-17')).toBeVisible();
    });

    test('six weeks at a fixed height', async ({ page }) => {
      await expect(cells(page, 'month')).toHaveCount(42);
      expect(Math.round((await day(page, 'month', '2026-11-17').boundingBox())!.height)).toBe(49);
      const november = (await grid(page, 'plain').boundingBox())!.height;
      // February 2026 fits in four weeks; the grid still draws six.
      await page.evaluate(() => (window as any).configureEvents({ plainMonth: '2026-02' }));
      await expect(day(page, 'plain', '2026-02-14')).toBeVisible();
      await expect(grid(page, 'plain')).not.toHaveAttribute('data-slide');
      await expect(cells(page, 'plain')).toHaveCount(42);
      expect((await grid(page, 'plain').boundingBox())!.height).toBe(november);
    });

    test('today is a filled pill and the picked day a grey square', async ({ page }) => {
      const today = pillOf(page, 'month', '2026-11-17');
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
      expect(await squareColor(picked)).toBe(await role(page, 'active'));
      expect(await number(page, 'month', '2026-11-20').evaluate(el => getComputedStyle(el).fontWeight)).toBe('800');
      // Cells carry no border or ring; the selected square is a fill.
      const edges = await cells(page, 'month').evaluateAll(cells => cells.map(el => {
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
      expect(await opacity(pillOf(page, 'month', '2026-11-10'))).toBeCloseTo(0.7, 2);
      expect(await opacity(pillOf(page, 'month', '2026-11-12'))).toBeCloseTo(0.45, 2);
      expect(await opacity(day(page, 'month', '2026-11-12'))).toBe(1);
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('data-outside', /.*/);
      expect(await opacity(pillOf(page, 'month', '2026-12-01'))).toBeCloseTo(0.2, 2);
      expect(await opacity(day(page, 'month', '2026-12-01').locator(part('.kjun-event-calendar-marks', 'marks')))).toBeCloseTo(0.2, 2);
      // The bar on a past day keeps its colour.
      expect(await opacity(day(page, 'month', '2026-11-13').locator(part('.kjun-event-calendar-span', 'span')))).toBe(1);
      expect(await opacity(pillOf(page, 'month', '2026-11-18'))).toBe(1);
    });

    test('marks: three dots at most, one icon, a bar that joins across cells', async ({ page }) => {
      const busy = day(page, 'month', '2026-11-11');
      await expect(busy.locator(part('.kjun-event-calendar-dot', 'dot'))).toHaveCount(3);
      await expect(busy.locator(part('.kjun-event-calendar-icon', 'icon'))).toHaveCount(1);
      expect(Math.round((await busy.locator(part('.kjun-event-calendar-icon', 'icon')).boundingBox())!.width)).toBe(11);
      expect(Math.round((await busy.locator(part('.kjun-event-calendar-dot', 'dot')).first().boundingBox())!.width)).toBe(5);
      const bar = (iso: string) => day(page, 'month', iso).locator(part('.kjun-event-calendar-span', 'span'));
      await expect(bar('2026-11-12')).toHaveCount(0);
      await expect(bar('2026-11-13')).toHaveAttribute('data-start', /.*/);
      await expect(bar('2026-11-13')).not.toHaveAttribute('data-end');
      await expect(bar('2026-11-14')).toHaveAttribute('data-end', /.*/); // Saturday ends the row
      await expect(bar('2026-11-14')).not.toHaveAttribute('data-start');
      await expect(bar('2026-11-15')).toHaveAttribute('data-start', /.*/); // Sunday starts the next row
      await expect(bar('2026-11-16')).toHaveAttribute('data-end', /.*/);
      await expect(bar('2026-11-17')).toHaveCount(0);
      expect(Math.round((await bar('2026-11-13').boundingBox())!.height)).toBe(5);
      // The bar is the date's underline: 1px under the number's pill, and the marks row follows it at the same height with or without a bar.
      const top = async (target: Locator, cell: Locator) => (await target.boundingBox())!.y - (await cell.boundingBox())!.y;
      const barCell = day(page, 'month', '2026-11-13');
      expect(Math.round(await top(bar('2026-11-13'), barCell))).toBe(31);
      const marksOf = (iso: string) => day(page, 'month', iso).locator(part('.kjun-event-calendar-marks', 'marks'));
      expect(Math.round(await top(marksOf('2026-11-11'), busy))).toBe(37);
      expect(Math.round(await top(marksOf('2026-12-01'), day(page, 'month', '2026-12-01')))).toBe(37);
      const bottom = await busy.evaluate(el => el.getBoundingClientRect().bottom), marksBottom = (await marksOf('2026-11-11').boundingBox())!;
      expect(marksBottom.y + marksBottom.height).toBeLessThanOrEqual(bottom + 0.5);
      const edge = (iso: string) => bar(iso).evaluate(el => { const box = el.getBoundingClientRect(); return { left: box.left, right: box.right }; });
      // Neighbouring pieces touch or overlap, so fractional cell widths leave no hairline.
      expect((await edge('2026-11-13')).right).toBeGreaterThanOrEqual((await edge('2026-11-14')).left);
      expect((await edge('2026-11-15')).right).toBeGreaterThanOrEqual((await edge('2026-11-16')).left);
    });

    test('today selected shows the pill inside the square', async ({ page }) => {
      const today = day(page, 'month', '2026-11-17');
      await today.click();
      await expect(today).toHaveAttribute('aria-pressed', 'true');
      expect(await squareColor(today)).toBe(await role(page, 'active'));
      expect(await pillOf(page, 'month', '2026-11-17').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(await role(page, 'brand'));
      const text = await number(page, 'month', '2026-11-17').evaluate(el => ({ color: getComputedStyle(el).color, weight: getComputedStyle(el).fontWeight }));
      expect(text).toEqual({ color: await role(page, 'on-brand'), weight: '800' });
    });

    test('the bar crosses a selected cell and an outside day unbroken', async ({ page }) => {
      const bar = (iso: string) => day(page, 'month', iso).locator(part('.kjun-event-calendar-span', 'span'));
      const box = async (target: Locator) => { const b = (await target.boundingBox())!; return { left: b.x, right: b.x + b.width }; };
      for (const iso of ['2026-11-13', '2026-11-14']) {
        await day(page, 'month', iso).click();
        await expect(day(page, 'month', iso)).toHaveAttribute('aria-pressed', 'true');
        expect(await opacity(bar(iso))).toBe(1);
        const cell = await box(day(page, 'month', iso)), piece = await box(bar(iso));
        expect(Math.abs(piece.left - cell.left)).toBeLessThan(0.5);
        // A piece that continues reaches under the next cell; an end piece stops at its own edge.
        if (iso === '2026-11-14') expect(Math.abs(piece.right - cell.right)).toBeLessThan(0.5);
        else expect(piece.right).toBeGreaterThanOrEqual(cell.right);
        // The bar paints above the selected square.
        const above = native
          ? await day(page, 'month', iso).evaluate(el => {
            const square = el.querySelector('[data-kjun-part="square"]')!, span = el.querySelector('[data-kjun-part="span"]')!;
            return !!(square.compareDocumentPosition(span) & Node.DOCUMENT_POSITION_FOLLOWING);
          })
          : await day(page, 'month', iso).evaluate(el => Number(getComputedStyle(el.querySelector('.kjun-event-calendar-span')!).zIndex) > Number(getComputedStyle(el, '::before').zIndex));
        expect(above).toBe(true);
      }
      // The last column's end piece stays inside the grid.
      expect((await box(bar('2026-11-14'))).right).toBeLessThanOrEqual((await box(grid(page, 'month'))).right + 0.5);
      // An outside day's bar steps back to the past fade (0.45) while its number fades to 0.2; the bar stays joined.
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('data-outside', /.*/);
      expect(await opacity(bar('2026-12-01'))).toBeCloseTo(0.45, 2);
      expect(await opacity(bar('2026-11-30'))).toBe(1);
      expect(await opacity(pillOf(page, 'month', '2026-12-01'))).toBeCloseTo(0.2, 2);
      expect((await box(bar('2026-11-30'))).right).toBeGreaterThanOrEqual((await box(bar('2026-12-01'))).left);
    });

    test('an outside day picks and moves the month', async ({ page }) => {
      await day(page, 'month', '2026-12-01').click();
      await expect(values(page)).toHaveText('2026-12|2026-11-30|2026-12-01|');
      await expect(day(page, 'month', '2026-12-01')).not.toHaveAttribute('data-outside');
      await expect(day(page, 'month', '2026-12-01')).toHaveAttribute('aria-pressed', 'true');
    });

    test('arrow keys cross the month and carry focus', async ({ page }) => {
      // Before any pick, today holds the only tab stop.
      await expect(grid(page, 'month').locator('[data-iso][tabindex="0"]')).toHaveAttribute('data-iso', '2026-11-17');
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

    test('without a month listener the keys stay inside the month', async ({ page }) => {
      const last = day(page, 'unlistened', '2026-11-30');
      await last.focus();
      for (const key of ['ArrowRight', 'PageDown']) {
        await page.keyboard.press(key);
        await page.waitForTimeout(300);
        await expect(grid(page, 'unlistened')).not.toHaveAttribute('data-slide');
        await expect(day(page, 'unlistened', '2026-11-15')).toHaveCount(1);
        await expect(day(page, 'unlistened', '2026-11-15')).not.toHaveAttribute('data-outside');
        await expect(last).toBeFocused();
      }
    });

    test('going back slides the other way', async ({ page }) => {
      await grid(page, 'month').evaluate(el => {
        const seen: (string | null)[] = (window as any).directions = [];
        new MutationObserver(() => seen.push(el.getAttribute('data-direction'))).observe(el, { attributes: true, attributeFilter: ['data-direction'] });
      });
      const directions = () => page.evaluate(() => ((window as any).directions as (string | null)[]).filter(Boolean));
      await day(page, 'month', '2026-11-01').focus();
      await page.keyboard.press('ArrowLeft');
      await expect(values(page)).toHaveText(/^2026-10\|/);
      await expect(grid(page, 'month')).not.toHaveAttribute('data-slide');
      expect(await directions()).toContain('-1');
      expect(await directions()).not.toContain('1');
      await page.evaluate(() => { (window as any).directions.length = 0; });
      await expect(day(page, 'month', '2026-10-31')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(values(page)).toHaveText(/^2026-11\|/);
      await expect(grid(page, 'month')).not.toHaveAttribute('data-slide');
      expect(await directions()).toContain('1');
      expect(await directions()).not.toContain('-1');
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
      // Mouse drags never change the month, Native's web preview included.
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
      await drag(cells(page, 'week').nth(3), -60, 0);
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
      if (native) {
        // Native offers the long press as an accessibility action on devices; its web preview also takes Shift+Enter, but no right click.
        await expect(cell).toHaveAttribute('aria-keyshortcuts', 'Shift+Enter');
        await mouseHold(cell);
        await expect(values(page)).toHaveText('2026-11|2026-11-30||2026-11-19');
        await day(page, 'month', '2026-11-25').focus();
        await page.keyboard.press('Shift+Enter');
        await expect(values(page)).toHaveText('2026-11|2026-11-30||2026-11-25');
        await day(page, 'month', '2026-11-26').click();
        await expect(values(page)).toHaveText('2026-11|2026-11-30|2026-11-26|2026-11-25');
        return;
      }
      await expect(cell).toHaveAttribute('aria-keyshortcuts', 'Shift+Enter');
      const described = await cell.getAttribute('aria-describedby');
      await expect(page.locator(`[id="${described}"]`)).toHaveText('이날 약속 추가');
      await hold(cell);
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
      // Shift+Enter falls through to the button and picks the day; on Native a hold without onDayLongPress is an ordinary press.
      if (native) await mouseHold(cell);
      else { await cell.focus(); await page.keyboard.press('Shift+Enter'); }
      await expect(cell).toHaveAttribute('aria-pressed', 'true');
    });

    test('week view: seven days, no dimming of the other month, null value', async ({ page }) => {
      const week = cells(page, 'week');
      await expect(week).toHaveCount(7);
      expect(await week.evaluateAll(list => list.map(el => (el as HTMLElement).dataset.iso))).toEqual(
        ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
      await expect(grid(page, 'week').locator('[data-outside]')).toHaveCount(0);
      await expect(grid(page, 'week').locator('[aria-pressed="true"]')).toHaveCount(0);
      // A week is named by its first and last day; across two months both months show.
      await expect(grid(page, 'week')).toHaveAttribute('aria-label', '2026년 11월 29일 – 12월 5일');
      expect(await opacity(pillOf(page, 'week', '2026-12-01'))).toBe(1);
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
