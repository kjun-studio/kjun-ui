import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue3']) {
  test(`${platform}: a link row opens where target says and a new tab drops the opener and referrer`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-link');
    const blank = page.getByRole('link', { name: '새 탭 링크' });
    await expect(blank).toHaveAttribute('target', '_blank');
    await expect(blank).toHaveAttribute('rel', 'noopener noreferrer');
    // The app's own rel is kept as given.
    await expect(page.getByRole('link', { name: '직접 준 rel' })).toHaveAttribute('rel', 'noopener');
    const same = page.getByRole('link', { name: '같은 창 링크' });
    await expect(same).not.toHaveAttribute('target');
    await expect(same).not.toHaveAttribute('rel');
  });
}
