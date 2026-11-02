import type { FrameLocator, Locator, Page } from '@playwright/test';

/** Every toast, whatever its role: a danger toast is an alert and the rest are statuses, so tests that count or wait
 * for toasts find the cards themselves (web .kjun-toast, Native Web data-kjun-toast). */
export const toastSelector = '.kjun-toast, [data-kjun-toast]';
export const toasts = (scope: Page | Locator | FrameLocator) => scope.locator(toastSelector);
