import { goToGuide } from './guide-navigation';
import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { designCases } from "../../../shared/visual-guides/design-cases";

// Zoom checks the document shell around the previews, so one platform is enough. Each platform's
// preview layout at narrow widths stays covered by the *-layout specs and design-cases.
const platform = "react";
test(`${platform}: actual 200% browser zoom keeps long compositions and anatomy usable`, async () => {
  test.setTimeout(300000);
  const directory = await mkdtemp("/tmp/kjun-guide-zoom-");
  await mkdir(directory + "/Default");
  // Chrome stores page zoom as log_base_1.2(scale), keyed by storage partition.
  // Full Chromium reads this preference; the headless shell does not.
  await writeFile(
    directory + "/Default/Preferences",
    JSON.stringify({
      partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
    }),
  );
  const context = await chromium.launchPersistentContext(directory, {
    channel: "chromium",
    headless: true,
    viewport: null,
    reducedMotion: "reduce",
    args: ["--window-size=1440,1000"],
  });
  // Manual contexts do not inherit the fixture's bounded action waits.
  context.setDefaultTimeout(30000);
  try {
    const page = context.pages()[0];
    const base = process.env.KJUN_TEST_URL || "http://127.0.0.1:4173";
    await goToGuide(page, "form", platform);
    expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({
      width: 720,
      ratio: 2,
    });
    expect(
      await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    ).toBe(true);
    for (const id of ["form", "toolbar", "assets", "generic-lists", "app-screen", "input-settings", "bottom-sheet", "thumbnail", "segmented-selection"]) {
      await goToGuide(page, id, platform);
      const section = page.locator("#" + id);
      await section.getByRole("button", { name: "프리셋", exact: true }).click();
      await page.getByRole("option", { name: "긴 콘텐츠", exact: true }).click();
      await expect(section.locator(".playground")).toHaveAttribute("data-ready", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await section
          .frameLocator("iframe")
          .locator("body")
          .evaluate((body) => body.scrollWidth <= innerWidth + 1),
        platform + "/" + id,
      ).toBe(true);
    }
    for (const { id, section: sectionId, viewportHeight } of designCases) {
      await goToGuide(page, sectionId, platform);
      const section = page.locator(`[data-design-case="${id}"]`);
      await section.locator(".design-execution").getByRole("button", { name: "실행 예제 보기", exact: true }).click();
      const after = section.locator(`[data-guide-case="${id}-after-375"]`);
      await after.scrollIntoViewIfNeeded();
      const layerTrigger = after.getByRole("button", { name: "실행 비교 열기", exact: true });
      if (await layerTrigger.count()) await layerTrigger.click();
      await expect(after.locator(".guide-running")).toHaveAttribute("data-ready", "true");
      expect(await after.frameLocator("iframe").locator("body").evaluate(body => body.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (viewportHeight) await expect(after.locator("iframe")).toHaveCSS("height", viewportHeight + "px");
      await section.getByRole("button", { name: "실행 예제 접기", exact: true }).click();
      // Inactive width tabs stay mounted but hidden; check the figure in the selected tab.
      const figure = section.getByRole("tabpanel").locator(".design-graphic img").last();
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toBeVisible();
      await expect(section.getByRole("button", { name: "도해 크게 보기", exact: true })).toHaveCount(0);
    }
    await page.goto(base + "/components/table?platform=" + platform + "#anatomy");
    const anatomy = page.locator("#anatomy");
    await expect(anatomy.locator(".anatomy-graphic img").first()).toBeVisible();
    await expect(anatomy.getByRole("button", { name: "도해 크게 보기" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const shortcuts = page.getByRole('navigation', { name: '상세 문서 바로가기' });
    await shortcuts.getByRole('link', { name: 'API', exact: true }).click();
    await expect(shortcuts.locator('[aria-current]')).toHaveText('API');
    await expect.poll(() => page.locator('#api').evaluate(element => {
      const bottom = document.querySelector('.document-shortcuts')!.getBoundingClientRect().bottom;
      const gap = element.getBoundingClientRect().top - bottom;
      return gap >= 0 && gap < 40;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});
