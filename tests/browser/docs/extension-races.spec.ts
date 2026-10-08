import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { presetConfig } from "../../../shared/example-registry";
// @ts-ignore Packed consumer compiler is shared with copied-code verification.
import { codeTools, prepareExample, compileEntries } from "../../../scripts/example-consumers.mjs";
async function standalone(page: Page, platform: string, name: string, suffix: string, transform: (source: string) => string, settings = {}) {
  const manifest = JSON.parse(await readFile("artifacts/examples/manifest.json", "utf8"));
  const config = presetConfig(name), selected = { ...config.settings, ...settings };
  const source = transform(codeTools.exampleSource(manifest[name].sources[platform], platform, selected, {}));
  const id = name + "-" + suffix;
  const entry = await prepareExample(platform, name, suffix, selected, {}, "default", source);
  await compileEntries(platform, { [id]: entry });
  await page.route("**/previews/export-checks/**", async route => {
    const path = new URL(route.request().url()).pathname.split("/export-checks/")[1];
    await route.fulfill({ body: await readFile("artifacts/export-checks/" + path), contentType: path.endsWith(".html") ? "text/html" : path.endsWith(".js") ? "application/javascript" : "text/css" });
  });
  await page.goto(`/previews/export-checks/${platform}/${id}.html`, { waitUntil: "domcontentloaded" });
}
for (const platform of ["vue2", "react", "native"]) {
  test(`${platform} quantity stays controlled when a consumer ignores a proposed value`, async ({ page }) => {
    await standalone(page, platform, "DsQuantityStepper", "controlled-quantity", source => source.replace('onValueChange: change("quantity")', 'onValueChange: undefined'));
    const input = page.getByRole("spinbutton", { name: "주문 수량" });
    await input.fill("7"); await input.press("Enter");
    await expect(input).toHaveValue("2");
    await expect(page.getByText("확정: 7", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "수량 늘리기" }).click();
    await expect(input).toHaveValue("2");
    await expect(page.getByText("확정: 3", { exact: true })).toBeVisible();
  });
  test(`${platform} stale image failure cannot replace the new image`, async ({ page }) => {
    let release!: () => void, started!: () => void, finished!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    const requested = new Promise<void>(resolve => { started = resolve; });
    const settled = new Promise<void>(resolve => { finished = resolve; });
    await page.route("**/extension-image-*.svg", async route => {
      if (route.request().url().endsWith("-0.svg")) {
        started(); await hold;
        await route.fulfill({ status: 404, body: "missing image" }).catch(() => {});
        finished();
      } else await route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#678B82"/></svg>' });
    });
    await standalone(page, platform, "DsImage", "image-race", source => source.replace('sampleImage(get("imageVersion", 0))', '"/extension-image-" + get("imageVersion", 0) + ".svg"'));
    await requested;
    await page.getByRole("button", { name: "이미지 주소 변경" }).click();
    await expect(page.getByText("이미지 로드 완료", { exact: true })).toBeVisible();
    release(); await settled;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.getByText("이미지 로드 완료", { exact: true })).toBeVisible();
    await expect(page.getByText("이미지를 불러올 수 없습니다", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("img", { name: "산과 하늘을 표현한 프로젝트 표지" })).toBeVisible();
  });
  test(`${platform} decorative images are omitted and navigation keeps native link behavior and owned selection`, async ({ page }) => {
    await standalone(page, platform, "DsImage", "decorative", source => source, { decorative: true, imageState: "실패" });
    await expect(page.getByText("이미지를 불러올 수 없습니다", { exact: true })).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(0);
    await standalone(page, platform, "DsBottomNavigation", "owned-navigation", source => source.replace('event.preventDefault();', '').replace('set("destination", key);', ''));
    const home = page.getByRole("link", { name: "홈", exact: true }), activity = page.getByRole("link", { name: /활동/ });
    await expect(activity).toHaveAttribute("href", "#activity");
    await activity.click();
    await expect(page).toHaveURL(/#activity$/);
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(activity).not.toHaveAttribute("aria-current", "page");
  });
}
