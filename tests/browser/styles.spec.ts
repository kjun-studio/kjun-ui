import { test, expect } from "@playwright/test";
import { openFixture } from "./packed-fixture";

for (const platform of ["react", "vue2", "native"]) {
  test(
    platform + ": project values stay scoped and update inside an open modal",
    async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await openFixture(page, platform);
      const outer = page.getByRole("button", {
        name: "Outer button",
        exact: true,
      });
      const trigger = page.getByRole("button", {
        name: "Open scoped dialog",
        exact: true,
      });
      await expect(outer).toHaveCSS("background-color", "rgb(18, 86, 168)");
      await expect(trigger).toHaveCSS("background-color", "rgb(23, 107, 71)");
      await expect(trigger).toHaveCSS("height", "40px");
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Scoped dialog",
        exact: true,
      });
      const confirm = dialog.getByRole("button", {
        name: "Confirm",
        exact: true,
      });
      const surface = platform === "react" ? dialog.locator("..") : dialog;
      const ink =
        platform === "native" ? confirm.locator("div").first() : confirm;
      await page.mouse.move(0, 0);
      await expect(confirm).toHaveCSS("background-color", "rgb(23, 107, 71)");
      await expect(ink).toHaveCSS("font-family", /^monospace(?:, monospace)?$/);
      await expect(surface).toHaveCSS("background-color", "rgb(227, 249, 238)");
      await dialog
        .getByRole("button", { name: "Change scoped values", exact: true })
        .click();
      await page.mouse.move(0, 0);
      await expect(confirm).toHaveCSS("background-color", "rgb(140, 35, 89)");
      await expect(ink).toHaveCSS("font-family", "serif");
      await expect(surface).toHaveCSS("background-color", "rgb(249, 227, 238)");
      await expect(
        dialog.getByRole("textbox", { name: "Scoped input" })
      ).toHaveCSS("border-top-color", "rgb(185, 28, 28)");
      // Close, then verify that the enclosing project's values were not overwritten.
      await confirm.click();
      await expect(dialog).not.toBeVisible();
      await page.mouse.move(0, 0);
      await expect(outer).toHaveCSS("background-color", "rgb(18, 86, 168)");
      await expect(trigger).toHaveCSS("background-color", "rgb(140, 35, 89)");
      await expect(trigger).toHaveCSS("height", "40px");
      await expect(trigger).toBeFocused();
      expect(errors).toEqual([]);
    }
  );

  test(
    platform + ": initially open modal inherits the project scope",
    async ({ page }) => {
      await openFixture(page, platform, "?open");
      const dialog = page.getByRole("dialog", {
        name: "Scoped dialog",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Confirm", exact: true })
      ).toHaveCSS("background-color", "rgb(23, 107, 71)");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  );
}

test("Native requires a Provider and the required app color contract", async ({
  page,
}) => {
  await openFixture(page, "native", "?missing-provider");
  await expect(page.getByRole("alert")).toContainText("requires KjunProvider");
  await openFixture(page, "native", "?missing-colors");
  await expect(page.getByRole("alert")).toContainText("Missing KJUN colors:");
});

for (const platform of ["react", "vue2"]) {
  test(
    platform + ": nested modals retain focus and the closest CSS scope",
    async ({ page }) => {
      await openFixture(page, platform);
      await page
        .getByRole("button", { name: "Open scoped dialog", exact: true })
        .click();
      const parent = page.getByRole("dialog", {
        name: "Scoped dialog",
        exact: true,
      });
      const trigger = parent.getByRole("button", {
        name: "Open inner dialog",
        exact: true,
      });
      await trigger.click();
      const inner = page.getByRole("dialog", {
        name: "Inner dialog",
        exact: true,
      });
      await expect(inner).toBeVisible();
      // The pointer that opened the inner dialog can rest on its button; check the resting color, not hover.
      await page.mouse.move(0, 0);
      await expect(
        inner.getByRole("button", { name: "Close inner dialog", exact: true })
      ).toHaveCSS("background-color", "rgb(23, 107, 71)");
      await page.keyboard.press("Tab");
      expect(
        await inner.evaluate((el) => el.contains(document.activeElement))
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(inner).not.toBeVisible();
      await expect(parent).toBeVisible();
      await expect(trigger).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(parent).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Open scoped dialog", exact: true })
      ).toBeFocused();
    }
  );
}

for(const platform of ['react','vue2'])test(`${platform}: missing required CSS roles fail explicitly`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await openFixture(page,platform,'?missing-role');
 await expect.poll(async()=>platform==='vue2'?page.evaluate(()=>(window as any).__roleError):errors.join(' ')).toContain('focusRing');
});
test('Native financial rendering requires its separate domain contract',async({page})=>{
 await openFixture(page,'native','?missing-domain');await expect(page.getByRole('alert')).toContainText('Missing KJUN domain color');
 await openFixture(page,'native','?partial-domain');await expect(page.getByRole('alert')).toContainText('Missing KJUN domain colors');
});
