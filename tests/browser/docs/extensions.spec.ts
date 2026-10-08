import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { presetConfig } from "../../../shared/example-registry";
// @ts-ignore Node-only packed consumer compiler.
import { prepareExample, compileEntries } from "../../../scripts/example-consumers.mjs";
const platforms = ["vue2", "react", "native"] as const;
async function configure(page: Page, name: string, settings: Record<string, any> = {}, values: Record<string, any> = {}, revision = 1) {
  const config = presetConfig(name);
  await page.evaluate(({ settings, values, revision }) => {
    (window as any).extensionEvents = [];
    window.postMessage({ type: "kjun:catalog-configure", config: { settings, values, reset: revision, revision } }, location.origin);
  }, { settings: { ...config.settings, ...settings }, values, revision });
  await expect.poll(() => page.evaluate(() => (window as any).extensionSnapshot?.revision)).toBe(revision);
}
async function visit(page: Page, platform: string, name: string, settings = {}, values = {}) {
  await page.addInitScript(() => {
    (window as any).extensionEvents = [];
    window.addEventListener("message", event => {
      if (event.data?.type === "kjun:catalog-snapshot") (window as any).extensionSnapshot = event.data;
      if (event.data?.type === "kjun:catalog-event") (window as any).extensionEvents.push(event.data.event);
    });
  });
  await page.goto(`/previews/catalog-${platform}.html?component=${name}`);
  await expect.poll(() => page.evaluate(() => !!(window as any).extensionSnapshot)).toBe(true);
  await configure(page, name, settings, values);
}
async function snapshot(page: Page) { return page.evaluate(() => (window as any).extensionSnapshot); }
async function replay(page: Page, platform: string, name: string) {
  const state: any = await page.evaluate(() => new Promise(resolve => {
    const receive = (event: MessageEvent) => {
      if (event.data?.type !== "kjun:catalog-copy-result" || event.data.requestId !== "extensions-copy") return;
      window.removeEventListener("message", receive); resolve(event.data.snapshot);
    };
    window.addEventListener("message", receive);
    window.postMessage({ type: "kjun:catalog-copy", requestId: "extensions-copy" }, location.origin);
  }));
  const id = name + "-extensions-copy";
  const entry = await prepareExample(platform, name, "extensions-copy", state.settings, state.values);
  await compileEntries(platform, { [id]: entry });
  await page.route("**/previews/export-checks/**", async route => {
    const path = new URL(route.request().url()).pathname.split("/export-checks/")[1];
    await route.fulfill({ body: await readFile("artifacts/export-checks/" + path), contentType: path.endsWith(".html") ? "text/html" : path.endsWith(".js") ? "application/javascript" : "text/css" });
  });
  await page.goto(`/previews/export-checks/${platform}/${id}.html`);
}
async function chooseTime(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).or(page.getByRole("button", { name: label, exact: true })).click();
  const item = page.getByRole("option", { name: option, exact: true }).or(page.getByRole("radio", { name: option, exact: true }));
  await item.click();
  await expect(page.getByRole("combobox", { name: label, exact: true }).or(page.getByRole("button", { name: label, exact: true }))).toHaveAttribute("aria-expanded", "false");
}
for (const platform of platforms) {
  test(`${platform} generic rows isolate secondary actions and preserve consumer selection`, async ({ page }) => {
    await visit(page, platform, "DsListRow");
    await page.getByRole("button", { name: "공유", exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).values.message).toBe("프로필 공유");
    const events = await page.evaluate(() => (window as any).extensionEvents);
    expect(events.some((e: any) => e.name.startsWith("DsListRow."))).toBe(false);
    await page.getByRole("button", { name: /프로필 설정/ }).click();
    await expect.poll(async () => (await snapshot(page)).values.message).toBe("프로필 설정 열기");
    if (platform === "native") await page.getByRole("switch").click();
    else { await page.getByRole("switch").focus(); await page.getByRole("switch").press("Space"); }
    await expect.poll(async () => (await snapshot(page)).values.notifications).toBe(false);
    await replay(page, platform, "DsListRow");
    await expect(page.getByRole("switch")).not.toBeChecked();
  });
  test(`${platform} decimal quantity commits, cancels, validates and replays current values`, async ({ page }) => {
    await visit(page, platform, "DsQuantityStepper", { decimal: true, negative: true });
    const field = page.getByRole("spinbutton", { name: "주문 수량", exact: true });
    await field.fill("-1.005"); await field.press("Enter");
    await expect(field).toHaveValue("-1.01");
    await page.getByRole("button", { name: "수량 늘리기" }).click();
    await expect(field).toHaveValue("-0.91");
    await field.fill("2.345"); await field.press("Escape");
    await expect(field).toHaveValue("-0.91");
    await field.fill("1e2"); await field.press("Tab");
    await expect(field).toHaveValue("-0.91");
    await expect.poll(async () => (await snapshot(page)).values.message).toBe("잘못된 수량: 1e2");
    {
      await field.fill("2.345"); await field.dispatchEvent("compositionstart"); await field.press("Enter");
      await expect(field).toHaveValue("2.345");
      await field.dispatchEvent("compositionend"); await field.press("Enter");
      await expect(field).toHaveValue("2.35");
    }
    await replay(page, platform, "DsQuantityStepper");
    await expect(page.getByRole("spinbutton")).toHaveValue("2.35");
  });
  test(`${platform} range hands keep order and support decimal keyboard steps`, async ({ page }) => {
    await visit(page, platform, "DsRangeSlider", { decimal: true });
    const first = page.getByRole("slider", { name: "시작 값" }), last = page.getByRole("slider", { name: "끝 값" });
    await first.focus(); await first.press("ArrowRight");
    await expect.poll(async () => (await snapshot(page)).values.range).toEqual([.3, .8]);
    await first.press("End");
    await expect.poll(async () => (await snapshot(page)).values.range).toEqual([.8, .8]);
    await last.focus(); await last.press("Home");
    expect((await snapshot(page)).values.range).toEqual([.8, .8]);
    await first.focus(); await first.press("Home");
    await expect.poll(async () => (await snapshot(page)).values.range).toEqual([0, .8]);
    await replay(page, platform, "DsRangeSlider");
    await expect.poll(() => page.getByRole("slider", { name: "시작 값" }).evaluate((el: any) => el.getAttribute("aria-valuenow") ?? el.value)).toBe("0");
    await expect.poll(() => page.getByRole("slider", { name: "끝 값" }).evaluate((el: any) => el.getAttribute("aria-valuenow") ?? el.value)).toBe("0.8");
  });
  test(`${platform} slider pointer changes and commits separately from keyboard steps`, async ({ page }) => {
    await visit(page, platform, "DsSlider");
    const thumb = page.getByRole("slider");
    const track = platform === "react" ? page.locator(".kjun-slider-track") : platform === "vue2" ? thumb : thumb.locator("..");
    const box = (await track.boundingBox())!;
    await page.mouse.click(box.x + box.width * .75, box.y + box.height / 2);
    await expect.poll(async () => (await snapshot(page)).values.slider).toBeGreaterThan(60);
    await expect.poll(async () => (await snapshot(page)).values.message).toMatch(/^확정: /);
    const value = (await snapshot(page)).values.slider;
    const handle = platform === "react" ? (await page.locator(".kjun-slider-thumb").boundingBox())! : platform === "native" ? (await thumb.boundingBox())! : { x: box.x + 10 + (box.width - 20) * value / 100 - 10, y: box.y, width: 20, height: box.height };
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * .15, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
    await expect.poll(async () => (await snapshot(page)).values.slider).toBeLessThan(30);
    await thumb.focus(); await thumb.press("Home"); await thumb.press("PageUp");
    await expect.poll(async () => (await snapshot(page)).values.slider).toBe(10);
    await visit(page, platform, "DsRangeSlider");
    await page.getByRole("slider", { name: "시작 값" }).focus(); await page.keyboard.press("Tab");
    await expect(page.getByRole("slider", { name: "끝 값" })).toBeFocused();
  });
  test(`${platform} time selection produces complete bounded seconds and clears`, async ({ page }) => {
    await visit(page, platform, "DsTimePicker", { precision: "second", bounded: true });
    await chooseTime(page, "알림 시각 시", "09");
    await expect.poll(async () => (await snapshot(page)).values.time).toBe("09:30:15");
    await chooseTime(page, "알림 시각 분", "31");
    await chooseTime(page, "알림 시각 초", "20");
    await expect.poll(async () => (await snapshot(page)).values.time).toBe("09:31:20");
    await replay(page, platform, "DsTimePicker");
    await expect(page.getByRole("combobox", { name: "알림 시각 초", exact: true }).or(page.getByRole("button", { name: "알림 시각 초", exact: true }))).toContainText("20");
    await page.getByRole("button", { name: "알림 시각 지우기" }).click();
    await expect(page.getByRole("button", { name: "알림 시각 지우기" })).toHaveCount(0);
  });
  test(`${platform} image fallback, address changes, avatars and consumer chip removal work`, async ({ page }) => {
    await visit(page, platform, "DsImage", { imageState: "실패" });
    await expect(page.getByText("이미지를 불러올 수 없습니다", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: "산과 하늘을 표현한 프로젝트 표지" })).toBeVisible();
    await configure(page, "DsImage", { imageState: "로딩" }, {}, 2);
    await expect(page.getByText("이미지 주소를 준비합니다", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "로컬 이미지 준비 · 2초" }).click();
    await expect.poll(async () => (await snapshot(page)).values.message).toBe("이미지 로드 완료");
    await configure(page, "DsImage", {}, {}, 3);
    await expect.poll(async () => (await snapshot(page)).values.message).toBe("이미지 로드 완료");
    await page.getByRole("button", { name: "이미지 주소 변경" }).click();
    await expect.poll(async () => (await snapshot(page)).values.imageVersion).toBe(1);
    await visit(page, platform, "DsAvatar");
    await expect(page.getByRole("img", { name: "김하늘" })).toBeVisible();
    await visit(page, platform, "DsChip");
    await page.getByRole("button", { name: "프로젝트 삭제" }).click();
    await expect(page.getByRole("button", { name: "태그 복원" })).toBeVisible();
    await replay(page, platform, "DsChip");
    await expect(page.getByRole("button", { name: "태그 복원" })).toBeVisible();
  });
  test(`${platform} application recipes handle narrow width, safe insets, keyboard and bottom content`, async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, platform, "GuideAppScreen", { content: "긴 콘텐츠", safeAreaTop: 24, safeAreaBottom: 34 });
      await expect(page.getByRole("navigation", { name: "주요 탐색" })).toBeVisible();
      await page.getByRole("button", { name: "키보드 상태 전환" }).click();
      await expect(page.getByRole("navigation", { name: "주요 탐색" })).not.toBeVisible();
      await expect(page.getByRole("button", { name: "변경 사항 저장", exact: true })).toBeVisible();
      await page.getByText("마지막 콘텐츠", { exact: true }).scrollIntoViewIfNeeded();
      const end = await page.getByText("마지막 콘텐츠", { exact: true }).boundingBox(), action = await page.getByRole("button", { name: "변경 사항 저장", exact: true }).boundingBox();
      expect(end!.y + end!.height).toBeLessThanOrEqual(action!.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const name of ["GuideGenericLists", "GuideInputSettings", "GuideBottomSheet", "GuideThumbnail", "GuideSegmentedSelection"]) {
      await visit(page, platform, name, { content: "긴 콘텐츠" });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
      if (name === "GuideBottomSheet") { await page.getByRole("button", { name: "하단 패널 열기" }).click(); await expect(page.getByRole("dialog").last()).toBeVisible(); await page.getByRole("button", { name: "설정 완료" }).click(); await expect(page.getByRole("dialog")).toHaveCount(0); }
    }
  });
}
