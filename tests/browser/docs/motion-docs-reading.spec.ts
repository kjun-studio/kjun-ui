import { test, expect } from '@playwright/test';
import { tokens } from '@kjun-ui/tokens';

const labels = ['사용 원칙', '속도 곡선·이동 거리', '전환 시간', '실제 동작 예제', '연속 조작', '동작 줄이기'];
for (const width of [390, 1280, 1440]) {
  test(`motion guide: one stable preview and readable criteria at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/motion?platform=react');
    await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
    await expect(page.locator('.motion-playground iframe')).toHaveCount(1);
    await expect(page.locator('.motion-playground .guide-example-placeholder')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /실행 예제 (열기|닫기)/ })).toHaveCount(0);
    const blocks = await page.locator('#timing > .body-copy, #timing .motion-table, .motion-curve-demo').evaluateAll(elements => elements.map(element => {
      const { x, width } = element.getBoundingClientRect(); return { x, width };
    }));
    expect(blocks[1]).toEqual(blocks[0]); expect(blocks[2]).toEqual(blocks[0]);
    expect(blocks[0].width).toBeLessThanOrEqual(720);
    expect(await page.locator('#timing > .body-copy').evaluate(element => {
      const style = getComputedStyle(element); return [style.fontSize, style.lineHeight];
    })).toEqual(['16px', '28px']);
    if (width === 390) await expect(page.locator('#timing .kjun-table-card')).toHaveCount(16);
    else {
      await expect(page.locator('#timing tbody tr')).toHaveCount(16);
      await expect(page.locator('#timing tbody tr').nth(3)).toContainText('motion.easeEmphasized');
      // Fades and color changes do not travel, so they have no 90% point.
      for (const role of ['스크림 등장', '툴팁 등장', '가격 변동 배경'])
        await expect(page.locator('#timing tbody tr').filter({ hasText: role }).locator('td').last()).toHaveText('—');
      await expect(page.locator('#timing tbody tr').filter({ hasText: '진행률 변화' }).locator('td').last()).toHaveText(/^\d+ms$/);
      expect(await page.locator('#timing td').first().evaluate(element => {
        const style = getComputedStyle(element); return [style.fontSize, style.lineHeight, style.fontFamily];
      })).toEqual(['14px', '20px', await page.locator('#timing > .body-copy').evaluate(element => getComputedStyle(element).fontFamily)]);
    }
    const nav = page.getByRole('navigation', { name: '상세 문서 바로가기' });
    await expect(nav.getByRole('link')).toHaveText(labels);
    for (const label of labels) {
      const link = nav.getByRole('link', { name: label, exact: true });
      await link.focus(); await page.keyboard.press('Enter');
      await expect(link).toHaveAttribute('aria-current', 'location');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await nav.getByRole('link', { name: '속도 곡선·이동 거리', exact: true }).click();
    await expect(nav.locator('[aria-current]')).toHaveText('속도 곡선·이동 거리');
    await page.screenshot({ path: testInfo.outputPath(`motion-curves-${width}.png`) });
    await expect(page.locator('.motion-demo-graph')).toHaveCount(1);
    await expect(page.locator('.motion-demo-graph path')).toHaveCount(4);
    // The 90% tick and the arrival label are separate: the track end is 100%, not 90%.
    await expect(page.locator('.motion-demo-endpoints')).toHaveText(`시작 · 0ms도착 · ${tokens.motion.layerEnter}ms`);
    await expect(page.locator('.motion-demo-tick').first()).toHaveText(/^90% · \d+ms$/);
    await expect(page.locator('.motion-speed-dock')).toHaveCount(1);
    await expect(page.getByRole('group', { name: '재생 속도' })).toHaveCount(1);
    // The floating control never covers the reading column when the layout has a gutter.
    const [dock, column] = await Promise.all([page.locator('.motion-speed'), page.locator('#timing')].map(locator => locator.evaluate(element => {
      const { left, right } = element.getBoundingClientRect(); return { left, right };
    })));
    if (width >= 1280) expect(dock.left).toBeGreaterThanOrEqual(column.right);
    await expect(page.getByText('easeBounce')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/elevation?platform=react#shadows');
    await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
    if (width > 390) expect(await page.locator('#shadows td:nth-child(2)').first().evaluate(element => getComputedStyle(element).fontSize)).toBe('14px');
  });
}

test('motion curves compare synchronized movement and settle immediately on reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion?platform=react#easing-distance');
  const root = page.locator('.motion-curve-demo');
  const distance = Number(await root.getAttribute('data-distance'));
  expect(distance).toBeGreaterThan(160);
  await root.getByRole('button', { name: '비교 재생', exact: true }).click();
  // Rows: linear, standard, emphasized, accelerate at 30% of motion.layerEnter.
  const positions = await root.locator('.motion-demo-dot').evaluateAll(elements => elements.map(element => {
    for (const animation of element.getAnimations()) { animation.pause(); animation.currentTime = 90; }
    return new DOMMatrix(getComputedStyle(element).transform).m41;
  }));
  expect(positions[0]).toBeCloseTo(distance * 0.3, 0);
  expect(positions[2]).toBeGreaterThan(positions[1]); expect(positions[1]).toBeGreaterThan(positions[0]); expect(positions[0]).toBeGreaterThan(positions[3]);
  expect(positions[2]).toBeLessThan(distance); expect(positions[3]).toBeGreaterThan(0);
  await expect(root.locator('.motion-demo-result')).toHaveText('도착 상태');
  // Reversing mid-flight starts from the displayed position, not from the far end.
  await root.getByRole('button', { name: '도중에 되돌리기', exact: true }).click();
  const reversed = await root.locator('.motion-demo-dot').evaluateAll(elements => elements.map(element => {
    const [animation] = element.getAnimations(); animation.pause();
    const [first, last] = (animation.effect as KeyframeEffect).getKeyframes();
    return [new DOMMatrix(String(first.transform)).m41, new DOMMatrix(String(last.transform)).m41];
  }));
  reversed.forEach(([from, to], index) => { expect(from).toBeCloseTo(positions[index], 0); expect(to).toBe(0); });
  await root.getByRole('button', { name: '처음으로', exact: true }).click();
  await page.locator('.motion-speed-dock').getByRole('button', { name: '0.25×', exact: true }).click();
  await root.getByRole('button', { name: '비교 재생', exact: true }).click();
  expect(await root.locator('.motion-demo-dot').first().evaluate(element => element.getAnimations()[0].effect!.getTiming().duration)).toBe(1200);
  await page.locator('.motion-speed-dock').getByRole('button', { name: '1×', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root.locator('[data-curve-state]')).toHaveAttribute('data-curve-state', 'complete');
  await expect.poll(() => root.locator('.motion-demo-dot').evaluateAll(elements => elements.map(element => ({
    x: new DOMMatrix(getComputedStyle(element).transform).m41, animations: element.getAnimations().length,
  })))).toEqual(Array.from({ length: 4 }, () => ({ x: distance, animations: 0 })));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('[data-motion-preference]')).toHaveAttribute('data-motion-preference', 'no-preference');
  expect(await root.locator('.motion-demo-dot').evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length)).toBe(0);
  await root.getByRole('button', { name: '처음으로', exact: true }).click();
  await expect(root.locator('[data-curve-state]')).toHaveAttribute('data-curve-state', 'initial');
  await root.getByRole('button', { name: '비교 재생', exact: true }).click();
  await root.getByRole('button', { name: '다시 비교하기', exact: true }).click();
  expect(await root.locator('.motion-demo-dot').evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length)).toBe(4);
  await expect(root.locator('[data-curve-state]')).toHaveAttribute('data-curve-state', 'complete');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-motion-preference]')).toHaveAttribute('data-motion-preference', 'reduce');
  // Each demo listens to the media query itself; wait until this one has applied the preference.
  await expect(root.locator('[data-curve-state]')).toContainText('이동 없이 결과를 표시합니다.');
  await root.getByRole('button', { name: '처음으로', exact: true }).click();
  await root.getByRole('button', { name: '비교 재생', exact: true }).click();
  expect(await root.locator('.motion-demo-dot').evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length)).toBe(0);
  await expect(root.locator('[data-curve-state]')).toContainText('이동 없이 결과를 표시합니다.');
});

test('interruption demo retargets from the displayed position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion?platform=react#interruption');
  const root = page.locator('.motion-interrupt');
  await root.getByRole('button', { name: '오른쪽으로', exact: true }).click();
  const middle = await root.locator('.motion-interrupt-marker').evaluate(element => {
    const [animation] = element.getAnimations(); animation.pause(); animation.currentTime = 60;
    return new DOMMatrix(getComputedStyle(element).transform).m41;
  });
  expect(middle).toBeGreaterThan(0); expect(middle).toBeLessThan(200);
  await root.getByRole('button', { name: '왼쪽으로', exact: true }).click();
  await expect(root.locator('[data-interrupt-state]')).toHaveAttribute('data-interrupt-state', 'retargeted');
  const from = await root.locator('.motion-interrupt-marker').evaluate(element => {
    const [first] = (element.getAnimations()[0].effect as KeyframeEffect).getKeyframes();
    return new DOMMatrix(String(first.transform)).m41;
  });
  expect(from).toBeCloseTo(middle, 0);
});

test('distance samples replay with token timing and show equal-time onion frames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/motion?platform=react#easing-distance');
  const cards = page.locator('.motion-distance-card');
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) await expect(card.locator('.motion-distance-ghost')).toHaveCount(8);
  const drawer = page.locator('[data-distance="drawer"]');
  await drawer.getByRole('button', { name: 'Drawer 등장 재생' }).click();
  expect(await drawer.locator('.motion-distance-target').evaluate(element => {
    const [animation] = element.getAnimations(); return [animation.effect!.getTiming().duration, animation.effect!.getTiming().easing];
  })).toEqual([tokens.motion.layerEnter, tokens.motion.easeEmphasized]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(drawer.getByRole('button', { name: 'Drawer 등장 재생' })).toBeDisabled();
});
