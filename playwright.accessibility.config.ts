import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig(base, {
  expect: { timeout: 8000 },
  testMatch: ['**/accessibility-tabs.spec.ts', '**/accessibility-components.spec.ts', '**/accessibility-controls.spec.ts'],
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  outputDir: 'test-results-accessibility',
});
