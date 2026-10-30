import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Locator, Page } from '@playwright/test';

// Review artifacts are opt-in. Assertions (including pixel checks) never use this helper.
export const reviewCapturesEnabled = () => process.env.KJUN_REVIEW_CAPTURES === '1';

export async function captureReview(target: Page | Locator, options: Parameters<Page['screenshot']>[0]): Promise<void> {
  if (reviewCapturesEnabled()) await target.screenshot(options);
}

// Persistent contexts with real browser zoom need the viewport in device coordinates.
// force preserves diagnostic captures made immediately before a failed assertion.
export async function captureReviewViewport(page: Page, path: string, { force = false } = {}): Promise<void> {
  if (!force && !reviewCapturesEnabled()) return;
  const session = await page.context().newCDPSession(page);
  try {
    const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from(shot.data, 'base64'));
  } finally {
    await session.detach();
  }
}
