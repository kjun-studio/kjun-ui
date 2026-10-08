import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig(base, {
  expect: { timeout: 8000 },
  testMatch: ['**/interaction-states.spec.ts', '**/accessibility-tabs.spec.ts', '**/tabs-contract.spec.ts'],
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  outputDir: 'artifacts/interaction-review/states',
});
