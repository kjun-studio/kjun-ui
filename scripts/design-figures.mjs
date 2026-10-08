import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { assertCurrentConsumer } from "./package-state.mjs";
import { designCases, designFigure, designWidths } from "../shared/visual-guides/design-cases.ts";
import { presetConfig } from "../shared/example-registry.ts";
import { servePreviews, configureFigure, partBox } from "./guide-capture.mjs";

const read = async path => JSON.parse(await readFile(path, "utf8"));
const hash = data => createHash("sha256").update(data).digest("hex");
const platforms = ["vue2", "react", "native"], sides = ["before", "after"];
const packages = await read("artifacts/manifest.json"), consumer = await assertCurrentConsumer();
for (const platform of platforms) {
  const name = "@kjun/" + platform;
  const installed = await read(resolve(consumer.directory, "node_modules", name, "package.json"));
  if (installed.name !== name || !consumer.packages[name]?.startsWith("file:") || !packages.some(p => p.name === name && p.version === installed.version))
    throw Error("Design figures require installed tarballs: " + name);
}
const fingerprint = createHash("sha256");
for (const file of [
  "scripts/design-figures.mjs", "scripts/guide-capture.mjs", "shared/visual-guides/design-cases.ts",
  "previews/catalog/example-design-cases.ts", "apps/docs/public/previews/demo.css", "apps/docs/public/previews/components.css",
  ...platforms.flatMap(p => [`apps/docs/public/previews/catalog-${p}.js`, `apps/docs/public/previews/catalog-${p}.html`]),
]) fingerprint.update(await readFile(file));
async function fonts(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await fonts(path);
    else fingerprint.update(await readFile(path));
  }
}
await fonts("apps/docs/public/fonts");
fingerprint.update(JSON.stringify(packages));
const digest = fingerprint.digest("hex"), directory = "apps/docs/public/previews/design-figures";
const expected = platforms.flatMap(platform => designCases.flatMap(item => designWidths.flatMap(width => sides.map(side => ({
  platform, item, width, side, spec: designFigure(item, side, width), key: `${platform}/${item.id}/${side}/${width}`,
})))));
const previous = await read(directory + "/manifest.json").catch(() => null);
async function valid() {
  if (previous?.fingerprint !== digest || Object.keys(previous.figures || {}).length !== expected.length) return false;
  for (const { key, spec, width } of expected) {
    const asset = previous.figures[key];
    if (!asset || asset.width !== width || (spec.viewportHeight && asset.height !== spec.viewportHeight) || asset.parts.length !== spec.parts.length) return false;
    const image = await readFile("apps/docs/public" + asset.src).catch(() => null);
    if (!image || hash(image) !== asset.sha256) return false;
    if (asset.parts.some(b => b.width <= 0 || b.height <= 0 || b.x < 0 || b.y < 0 || b.x + b.width > asset.width + 1 || b.y + b.height > asset.height + 1)) return false;
  }
  return true;
}
if (await valid()) console.log(`Packed design figures verified: ${expected.length} images.`);
else if (process.argv.includes("--check")) throw Error("Design figures are missing or stale. Run build:design-figures.");
else {
  await mkdir(directory, { recursive: true });
  const server = await servePreviews(), browser = await chromium.launch();
  const figures = {}, errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 1800 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    for (const [index, { platform, item, width, side, spec, key }] of expected.entries()) {
      await page.setViewportSize({ width, height: spec.viewportHeight || 1800 });
      await page.goto(`${server.url}/previews/catalog-${platform}.html?component=${item.name}`);
      await page.locator(`[data-component="${item.name}"]`).waitFor();
      await configureFigure(page, item.name, spec, presetConfig);
      if (item.id === "delete-confirmation") {
        await page.locator('[role="dialog"][aria-label], [role="dialog"][aria-labelledby]').waitFor();
        // Modal may be portaled outside catalog-render and enter with a transition.
        await page.waitForTimeout(450);
      }
      const boxes = await Promise.all(spec.parts.map(part => partBox(page, part)));
      const content = await page.locator(".catalog-render").boundingBox();
      const height = spec.viewportHeight || Math.ceil(content.y + content.height + 24);
      if (height > 1800) throw Error("Design figure exceeds capture height: " + key);
      for (const b of boxes) if (b.x < 0 || b.y < 0 || b.x + b.width > width + 1 || b.y + b.height > height + 1)
        throw Error("Design annotation is outside the figure: " + key);
      const bodyFits = await page.locator("body").evaluate(body => body.scrollWidth <= innerWidth + 1);
      if (!bodyFits) throw Error("Design screen overflows its viewport: " + key);
      const filename = `${platform}-${item.id}-${side}-${width}.png`;
      const image = await page.screenshot({ path: directory + "/" + filename, clip: { x: 0, y: 0, width, height }, animations: "disabled" });
      figures[key] = { src: "/previews/design-figures/" + filename, sha256: hash(image), width, height, parts: boxes };
      if ((index + 1) % 12 === 0) console.log(`Design capture ${index + 1}/${expected.length}`);
    }
    if (errors.length) throw Error(errors.join("\n"));
    await writeFile(directory + "/manifest.json", JSON.stringify({ fingerprint: digest, renderers: platforms.map(p => "@kjun/" + p), packages, figures }, null, 2) + "\n");
    console.log(`Generated ${expected.length} design figures from installed packed packages.`);
  } finally {
    await browser.close(); await server.close();
  }
}
