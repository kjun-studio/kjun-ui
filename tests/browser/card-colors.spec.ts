import { test, expect, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
import { cardOutline } from './card-outline';

/** Every card surface is one flat fill: no gradient layer on the web, no SVG gradient on Native. */
async function solid(card: Locator, platform: string, color: string) {
  await expect(card).toHaveCSS("background-color", color);
  if (platform === "native") await expect(card.locator("svg")).toHaveCount(0);
  else await expect(card).toHaveCSS("background-image", "none");
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform} card roles follow project colors and keep surface, border and project colors independent`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await openFixture(page, platform, "", "card-colors");
    const card = page.getByTestId("card").locator(":scope > div");
    const click = (name: string) => page.getByRole("button", { name, exact: true }).click();
    await expect(card).toHaveCSS("background-color", "rgb(227, 238, 249)");
    await expect(card).toHaveCSS("border-top-width", "0px");
    await expect.poll(() => cardOutline(card, platform)).toContain("rgb(68, 85, 102)");
    await click("Toggle accent");
    await solid(card, platform, "rgb(221, 238, 255)");
    await expect(card).toHaveCSS("border-top-width", "0px");
    await click("Toggle accent");
    await expect(card).toHaveCSS("background-image", "none");
    await expect(card.locator("svg")).toHaveCount(0);
    await expect(card).toHaveCSS("border-top-width", "0px");
    await click("Toggle accent");
    await click("Toggle overrides");
    await solid(card, platform, "rgb(17, 102, 68)");
    await click("Toggle colors");
    await solid(card, platform, "rgb(170, 68, 17)");
    await click("Use subtle");
    await solid(card, platform, "rgb(255, 240, 221)");
    await expect(card).toHaveCSS("border-top-width", "0px");
    await expect.poll(() => cardOutline(card, platform)).toContain("rgb(136, 85, 34)");
    await click("Toggle colors");
    await solid(card, platform, "rgb(234, 246, 240)");
    await expect.poll(() => cardOutline(card, platform)).toContain("rgb(68, 119, 102)");
    await click("Toggle glass");
    await expect(card).toHaveCSS("background-image", "none");
    await expect(card.locator("svg")).toHaveCount(0);
    await expect(card).toHaveCSS("background-color", "rgb(241, 242, 243)");
    await expect.poll(() => cardOutline(card, platform)).toContain("rgb(18, 52, 86)");
    await click("Toggle glass");
    await click("Toggle overrides");
    await solid(card, platform, "rgb(221, 238, 255)");
    await expect.poll(() => cardOutline(card, platform)).toContain("rgb(68, 85, 102)");
    const body = platform === "native" ? card.getByText("Project card", { exact: true }).locator("..") : card.locator(".kjun-card-body");
    await expect(body).toHaveCSS("padding-top", "16px");
    await expect(card).toHaveCSS("border-radius", "12px");
    expect(errors).toEqual([]);
  });
}
