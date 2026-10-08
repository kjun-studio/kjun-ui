import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Documentation site, packed previews and export checks. `npm run test:docs` builds the docs app and
// serves that build on port 4174; running this config directly targets KJUN_TEST_URL (default: dev server).
export default defineConfig(base, {
  testDir: './tests/browser/docs',
  testIgnore: [],
  // Test builds wait 30s before marking a preview frame failed (scripts/docs-test.mjs), so assertions
  // that wait for that failure state need a longer window than the base 30s.
  expect: { timeout: 45000 },
  outputDir: ['smoke', 'related'].includes(process.env.KJUN_DOCS_TEST_PROFILE || '')
    ? `test-results-docs-${process.env.KJUN_DOCS_TEST_PROFILE}` : 'test-results-docs',
});
