import { expect, type Page } from '@playwright/test';
import { usageGuideHref } from '../../../shared/document-navigation';

export async function goToGuide(page: Page, section: string, platform: string) {
  const [path, hash] = usageGuideHref(section).split('#');
  const base = process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173';
  await page.goto(`${base}${path}?platform=${platform}#${hash}`);
  // Scroll to lazy examples only after client layout and observers are mounted.
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled({ timeout: 30000 });
  await expect(page.locator('#' + section)).toBeAttached();
}
