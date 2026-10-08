import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig(base, {
  testIgnore: [],
  testMatch: ['**/elevation*.spec.ts', '**/provider-layers.spec.ts', '**/quantity.spec.ts'],
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName,
    use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  outputDir: 'test-results-elevation',
});
