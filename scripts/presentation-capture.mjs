import { expect } from '@playwright/test';
import { captureFor } from '../previews/presentation/registry.mjs';
export async function preparePresentation(page, scene) {
  const capture = captureFor(scene);
  await page.locator(`[data-scene="${scene.name}"] .presentation-subject`).waitFor({ state: scene.layer ? 'attached' : 'visible' });
  if (scene.layer) await page.frameLocator('iframe').getByRole('dialog').waitFor();
  const surface = scene.layer ? page.frames().find(frame => frame.url().includes('embedded=true')) : page;
  await surface.evaluate(() => document.fonts.ready);
  if (scene.prepare === 'menu') { await page.getByRole('button', { name: '목록 관리', exact: true }).click(); await page.getByRole('menu').waitFor(); }
  if (scene.prepare === 'tooltip') { await page.keyboard.press('Tab'); await page.getByRole('button', { name: '관심 목록', exact: true }).focus(); await page.getByRole('tooltip').waitFor(); }
  if (scene.name === 'DsPopover') await page.getByRole('dialog').waitFor();
  if (scene.name === 'DsErrorBoundary') await expect(page.locator('html')).toHaveAttribute('data-expected-boundary', 'caught');
  await surface.evaluate(async () => {
    await Promise.all([...document.images].map(img => img.decode()));
    await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming().iterations === Infinity) { animation.pause(); animation.currentTime = 0; }
      else animation.finish();
    }
  });
  await page.mouse.move(0, 0);
  if (scene.highlight) await page.locator(scene.highlight).evaluate(el => {
    const box = el.getBoundingClientRect();
    document.querySelector('.presentation-highlight')?.remove();
    const marker = document.createElement('div');
    marker.className = 'presentation-highlight'; marker.setAttribute('aria-hidden', 'true');
    // React Aria menus occupy the browser's top layer. Keep this separate annotation above them.
    marker.setAttribute('popover', 'manual');
    Object.assign(marker.style, { left: box.left - 4 + 'px', top: box.top - 6 + 'px', width: box.width + 8 + 'px', height: box.height + 12 + 'px' });
    document.body.append(marker);
    marker.showPopover();
  });
  await expect(page.locator('.presentation-canvas')).not.toContainText(/버튼을 눌러보세요|입력 대기 중|번 실행했습니다|그라데이션 변경/);
  const frame = scene.layer ? await page.locator('iframe').boundingBox() : null;
  if (scene.layer) {
    expect(frame, scene.name + ' consumer frame').not.toBeNull();
    expect(frame.x).toBeGreaterThanOrEqual(capture.padding);
    expect(frame.y).toBeGreaterThanOrEqual(capture.padding);
    expect(frame.x + frame.width).toBeLessThanOrEqual(capture.width - capture.padding);
    expect(frame.y + frame.height).toBeLessThanOrEqual(capture.height - capture.padding);
  }
  const geometry = await surface.evaluate(({ padding, width, height, layer }) => {
    const roots = layer ? [...document.querySelectorAll('[role="dialog"]')] : [...document.querySelectorAll('.presentation-subject, .kjun-floating, [role="menu"], [role="tooltip"], [role="dialog"], .presentation-highlight')];
    const boxes = roots.map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }).filter(r => r.width && r.height);
    const outside = boxes.filter(r => r.left < padding - 1 || r.top < padding - 1 || r.right > width - padding + 1 || r.bottom > height - padding + 1);
    // ScrollFade intentionally demonstrates horizontally scrollable content. Hidden accessibility inputs are not visible content.
    const clipped = [...new Set(roots.flatMap(root => [root, ...root.querySelectorAll('*')]))].filter(el => {
      if (el.closest('.kjun-scroll-fade, [aria-hidden="true"]') || ['INPUT', 'TEXTAREA', 'SVG', 'PATH'].includes(el.tagName)) return false;
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || !r.height || style.clipPath !== 'none') return false;
      if (!roots.includes(el) && ['absolute', 'fixed'].includes(style.position)) return false;
      return (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && ['hidden', 'auto', 'scroll', 'clip'].includes(style.overflow);
    }).map(el => el.tagName + '.' + el.className);
    return { boxes, outside, clipped, viewport: { width: innerWidth, height: innerHeight } };
  }, scene.layer ? { padding: 0, width: frame.width, height: frame.height, layer: true } : { ...capture, layer: false });
  if (frame) geometry.frame = { left: frame.x, top: frame.y, width: frame.width, height: frame.height };
  expect(geometry.viewport, scene.name + ' capture viewport').toEqual({ width: frame?.width ?? capture.width, height: frame?.height ?? capture.height });
  expect(geometry.boxes.length, scene.name + ' rendered content').toBeGreaterThan(0);
  expect(geometry.outside, scene.name + ' safe-area overflow').toEqual([]);
  expect(geometry.clipped, scene.name + ' clipped content').toEqual([]);
  return geometry;
}
