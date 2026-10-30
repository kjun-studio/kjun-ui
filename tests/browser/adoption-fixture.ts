import type { Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

export const open = (page: Page, scenario: string, controlled = false) =>
  openFixture(page, 'vue3', `?scenario=${scenario}${controlled ? '&controlled' : ''}`, 'adoption-improvements', 'development');
export const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configure(next), next);
export const events = (page: Page) => page.getByTestId('events').textContent().then(text => JSON.parse(text!));
export const reset = (page: Page) => page.evaluate(() => (window as any).resetEvents());

