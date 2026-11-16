import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../packages/tokens/src/" + path, import.meta.url), "utf8");
const colors = JSON.parse(await read("definitions/colors.json"));
const kebab = name => name.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
// Follows a role's fallbacks to the required role an unconfigured project draws it with.
const settled = role => { while (colors.colorRoleFallbacks?.[role]) role = colors.colorRoleFallbacks[role]; return role; };

test("every semantic tone has a quiet card surface on its light role", () => {
  for (const tone of ["success", "warning", "danger", "info"])
    assert.deepEqual(colors.cardSurfaces[tone], { background: tone + "Light", border: "cardBorder", text: "text", description: "textSecondary" });
});

test("brandSoft is the quiet brand surface and reuses the subtle brand role", () => {
  assert.deepEqual(colors.cardSurfaces.brandSoft, { background: "brandSubtleBg", border: "cardBorder", text: "text", description: "textSecondary" });
  assert.equal(colors.cardSurfaces.brand.background, "brand");
});

test("a project that sets none of the optional roles draws the tinted surfaces like muted", () => {
  for (const name of ["accent", "subtle", "brandSoft", "success", "warning", "danger", "info"])
    assert.equal(settled(colors.cardSurfaces[name].background), colors.cardSurfaces.muted.background, name);
});

test("the generated bindings carry one rule per surface", async () => {
  const css = await read("bindings.css");
  for (const [name, surface] of Object.entries(colors.cardSurfaces)) {
    const rule = css.split(`.kjun-scope .kjun-card[data-surface="${name}"] {`)[1]?.split("}")[0];
    assert.ok(rule, name + " has a rule");
    assert.ok(rule.includes(`var(--_kjun-color-${kebab(surface.background)})`), name + " paints its background role");
  }
});
