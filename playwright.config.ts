import { defineConfig } from "@playwright/test";
const profile = process.env.KJUN_BROWSER_TEST_PROFILE;
const suffix = profile === 'smoke' || profile === 'related' ? `-browser-${profile}` : '';
export default defineConfig({
  testDir: "./tests/browser",
  // Package contracts run standalone; documentation-site checks live in playwright.docs.config.ts.
  testIgnore: ["docs/**"],
  globalSetup: "./tests/browser/global-setup.ts",
  // Packed document previews can take over 10s to initialize in Docker.
  timeout: 90000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: `playwright-report${suffix}` }]],
  use: {
    baseURL: process.env.KJUN_TEST_URL || "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    actionTimeout: 30000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
  },
  outputDir: `test-results${suffix}`,
});
