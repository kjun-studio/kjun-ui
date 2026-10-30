import { expect, type Locator, type Page } from '@playwright/test';
import { tokens, type TypographyToken } from '../../packages/tokens/dist/index.js';
export const px = (value: number) => value + 'px';

export async function weightedTypography(text: Locator, spec: TypographyToken, weight = spec.fontWeight) {
  await expect(text).toHaveCSS('font-size', px(spec.fontSizePx));
  await expect(text).toHaveCSS('line-height', px(spec.lineHeightPx));
  await expect(text).toHaveCSS('font-weight', String(weight));
  const spacing = await text.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(spacing === 'normal' ? 0 : parseFloat(spacing)).toBeCloseTo(spec.fontSizePx * spec.letterSpacingEm, 2);
}

export async function fieldTypography(node: Locator, size: 'sm' | 'md' | 'lg', scale: number) {
  const spec = tokens.input[size], type = tokens.typography.input;
  await expect(node).toHaveCSS('font-size', px(spec.fontSize * scale));
  await expect(node).toHaveCSS('line-height', px(spec.lineHeight * scale));
  await expect(node).toHaveCSS('font-weight', String(type.fontWeight));
  const tracking = await node.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(tracking === 'normal' ? 0 : parseFloat(tracking)).toBeCloseTo(spec.fontSize * type.letterSpacingEm * scale, 2);
}

export async function typography(node: Locator, role: TypographyToken, scale = 1) {
  await expect(node).toHaveCSS('font-size', role.fontSizePx * scale + 'px');
  await expect(node).toHaveCSS('line-height', role.lineHeightPx * scale + 'px');
  await expect(node).toHaveCSS('font-weight', String(role.fontWeight));
  const spacing = await node.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(spacing === 'normal' ? 0 : parseFloat(spacing)).toBeCloseTo(role.letterSpacingEm * role.fontSizePx * scale, 2);
}

export async function displacement(page: Page, selector: string, action: string, duration: number) {
  return page.evaluate(async ({ selector, action, duration }) => {
    const samples: number[] = [], endpoints: number[] = [];
    const magnitude = (transform: string, translate: string) => {
      const matrix = new DOMMatrixReadOnly(transform || 'none');
      const offset = !translate || translate === 'none' ? [0, 0] : translate.split(' ').map(parseFloat);
      return Math.max(Math.abs(matrix.m41 + (offset[0] || 0)), Math.abs(matrix.m42 + (offset[1] || 0)));
    };
    const sample = () => {
      const element = document.querySelector(selector);
      if (!element) return;
      const style = getComputedStyle(element);
      samples.push(magnitude(style.transform, style.translate));
      // A busy browser may skip the last exit frame before removing the node.
      // Inspect the browser's actual animation endpoints as well as painted frames.
      for (const animation of element.getAnimations()) {
        for (const frame of (animation.effect as KeyframeEffect).getKeyframes()) {
          if (frame.transform || frame.translate) endpoints.push(magnitude(String(frame.transform || 'none'), String(frame.translate || 'none')));
        }
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    const interval = setInterval(sample, 8);
    try {
      if (action === 'modal-enter') (window as any).configureMotion({ modal: true });
      else if (action === 'modal-exit') (window as any).configureMotion({ modal: false });
      else if (action === 'popup') [...document.querySelectorAll<HTMLElement>('button,[role="button"]')].find(el => el.textContent === 'Open menu')!.click();
      else (window as any).feedback.toast.info('Distance toast', { duration: 0 });
      await new Promise(resolve => setTimeout(resolve, duration + 100));
      sample();
      return { samples, endpoints };
    } finally { observer.disconnect(); clearInterval(interval); }
  }, { selector, action, duration });
}
