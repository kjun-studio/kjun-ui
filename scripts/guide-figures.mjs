import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { assertCurrentConsumer } from "./package-state.mjs";
import { presetConfig } from "../shared/example-registry.ts";
import { servePreviews, configureFigure, partBox } from "./guide-capture.mjs";
const read = async (file) => JSON.parse(await readFile(file, "utf8"));
const guides = await read("apps/docs/lib/generated/visual-guides.json");
const consumer = await assertCurrentConsumer(),
  packages = await read("artifacts/manifest.json");
for (const platform of ["vue2", "react", "native"]) {
  const name = "@kjun/" + platform,
    installed = await read(resolve(consumer.directory, "node_modules", name, "package.json"));
  if (
    installed.name !== name ||
    !consumer.packages[name]?.startsWith("file:") ||
    !packages.some((p) => p.name === name && p.version === installed.version)
  )
    throw Error("Figures require verified installed tarballs: " + name);
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fingerprint = createHash("sha256");
for (const file of [
  "scripts/guide-figures.mjs",
  "scripts/guide-capture.mjs",
  "apps/docs/lib/generated/visual-guides.json",
  "apps/docs/public/previews/demo.css",
  "apps/docs/public/previews/components.css",
  ...["vue2", "react", "native"].flatMap((p) => [
    `apps/docs/public/previews/catalog-${p}.js`,
    `apps/docs/public/previews/catalog-${p}.html`,
  ]),
])
  fingerprint.update(await readFile(file));
async function fonts(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await fonts(file);
    else fingerprint.update(await readFile(file));
  }
}
await fonts("apps/docs/public/fonts");
fingerprint.update(JSON.stringify(packages));
const digest = fingerprint.digest("hex"),
  directory = "apps/docs/public/previews/guide-figures",
  manifestPath = directory + "/manifest.json";
const previous = await read(manifestPath).catch(() => null);
const expected = Object.values(guides).flatMap((guide) =>
  Object.entries(guide.platforms).flatMap(([platform, data]) =>
    data.figures.map((spec) => ({
      name: guide.name,
      platform,
      spec,
      key: `${platform}/${guide.name}/${spec.id}`,
    })),
  ),
);
async function valid() {
  if (
    previous?.fingerprint !== digest ||
    Object.keys(previous.figures || {}).length !== expected.length
  )
    return false;
  for (const { key, spec } of expected) {
    const asset = previous.figures[key];
    if (!asset || asset.parts.length !== spec.parts.length) return false;
    const data = await readFile("apps/docs/public" + asset.src).catch(() => null);
    if (!data || hash(data) !== asset.sha256) return false;
  }
  return true;
}
if (await valid()) console.log(`Packed anatomy figures verified: ${expected.length} images.`);
else if (process.argv.includes("--check"))
  throw Error("Anatomy figures are missing or stale. Run build:guide-figures.");
else {
  await mkdir(directory, { recursive: true });
  const server = await servePreviews(),
    browser = await chromium.launch();
  const figures = {},
    failures = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 960, height: 760 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [index, { name, platform, spec, key }] of expected.entries()) {
      try {
        errors.length = 0;
        await page.goto(`${server.url}/previews/catalog-${platform}.html?component=${name}`);
        await page.locator(`[data-component="${name}"]`).waitFor();
        await page.addStyleTag({
          content: `html,body{background:#fff}.catalog-root{padding:32px;background:var(--kjun-surface)}.catalog-example{max-width:${/Table|Market|Kpi|Skeleton/.test(name) ? 840 : 440}px;margin:0 auto}.catalog-example>output{display:none}`,
        });
        await configureFigure(page, name, spec, presetConfig);
        const boxes = await Promise.all(spec.parts.map((part) => partBox(page, part)));
        const content = await page.locator(".catalog-render").boundingBox();
        const layers = await page
          .locator(
            '[role="menu"], [role="listbox"], [role="tooltip"], [role="dialog"], [role="alert"]',
          )
          .evaluateAll((elements) =>
            elements.flatMap((element) => {
              const rect = element.getBoundingClientRect();
              if (!rect.width || !rect.height || getComputedStyle(element).visibility === "hidden")
                return [];
              // Native Web adds a viewport-sized dialog wrapper around the actual panel.
              if (rect.width >= innerWidth - 1 && rect.height >= innerHeight - 1) return [];
              return [
                {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  dialog: element.getAttribute("role") === "dialog",
                },
              ];
            }),
          );
        const dialog = layers.some((layer) => layer.dialog);
        // captureParts figures (portaled output such as a Toast) crop to their labelled parts
        // instead of spanning the unlabelled trigger row.
        const context = !dialog && content && !spec.captureParts;
        const bounds = [...boxes, ...layers, ...(context ? [content] : [])];
        const x = Math.max(0, Math.floor(Math.min(...bounds.map((b) => b.x)) - 20)),
          y = Math.max(0, Math.floor(Math.min(...bounds.map((b) => b.y)) - 20));
        const right = Math.min(960, Math.ceil(Math.max(...bounds.map((b) => b.x + b.width)) + 20));
        const bottom = Math.min(
          760,
          Math.ceil(Math.max(...bounds.map((b) => b.y + b.height)) + 20),
        );
        const clip = { x, y, width: Math.max(160, right - x), height: Math.max(90, bottom - y) };
        for (const box of [...boxes, ...layers])
          if (
            box.x < x - 1 ||
            box.y < y - 1 ||
            box.x + box.width > x + clip.width + 1 ||
            box.y + box.height > y + clip.height + 1
          )
            throw Error("Anatomy part is clipped by the capture viewport.");
        const filename = `${platform}-${name}-${spec.id}.png`;
        const image = await page.screenshot({
          path: directory + "/" + filename,
          clip,
          animations: "disabled",
        });
        if (errors.length) throw Error(errors.join("; "));
        figures[key] = {
          src: "/previews/guide-figures/" + filename,
          sha256: hash(image),
          width: clip.width,
          height: clip.height,
          contexts: layers.map((b) => ({
            x: b.x - x,
            y: b.y - y,
            width: b.width,
            height: b.height,
          })),
          parts: boxes.map((b) => ({ x: b.x - x, y: b.y - y, width: b.width, height: b.height })),
        };
      } catch (error) {
        failures.push(key + ": " + error.message);
        console.error(failures.at(-1));
      }
      if ((index + 1) % 30 === 0) console.log(`Anatomy capture ${index + 1}/${expected.length}`);
    }
    if (failures.length)
      throw Error(`${failures.length} anatomy captures failed.\n` + failures.join("\n"));
    await writeFile(
      manifestPath,
      JSON.stringify(
        {
          fingerprint: digest,
          renderers: ["@kjun/vue2", "@kjun/react", "@kjun/native"],
          packages,
          figures,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`Generated ${expected.length} anatomy figures from installed packed packages.`);
  } finally {
    await browser.close();
    await server.close();
  }
}
