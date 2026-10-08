import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { buildVisualGuides, authors } from "../shared/visual-guides/index.ts";
import { validateSettings } from "../shared/example-registry.ts";
import { searchDocuments } from "../shared/docs-search.mjs";
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const [api, catalog, descriptions, guides, discovery] = await Promise.all(
  [
    "apps/docs/lib/generated/api-reference.json",
    "shared/component-catalog.json",
    "shared/component-guides.json",
    "apps/docs/lib/generated/visual-guides.json",
    "apps/docs/lib/generated/discovery.json",
  ].map(read),
);
test("visual definitions cover public components plus feedback on every platform and retain current destinations", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(buildVisualGuides(api, catalog, descriptions))),
    guides,
  );
  assert.equal(Object.keys(guides).length, catalog.filter(entry => entry.kind !== "internal").length + 1);
  for (const entry of catalog.filter((c) => c.kind !== "internal")) {
    assert.equal(guides[entry.name].path, entry.docs);
    for (const platform of ["vue2", "react", "native"]) {
      const data = guides[entry.name].platforms[platform];
      assert.ok(data.figures.length);
      assert.ok(data.states.length);
      for (const scenario of [...data.figures, ...data.states, ...data.sizes])
        validateSettings(entry.name, scenario.settings || {});
    }
  }
  for (const n of ["DsAccordionItem", "DsTabPane", "DsDropdownItem", "DsDropdownDivider"])
    assert.ok(guides[n].platforms.react.figures[0].parts.length);
  assert.equal(guides.KjunFeedbackProvider.platforms.native.figures.length, 3);
});
test("visual state and size differences reflect public APIs rather than shared guesses", () => {
  assert.ok(guides.DsRadioGroup.platforms.vue2.states.some((s) => s.id === "disabled"));
  assert.ok(!guides.DsRadioGroup.platforms.react.states.some((s) => s.id === "disabled"));
  assert.equal(guides.DsDrawer.platforms.react.sizes.length, 0);
  assert.ok(!guides.DsDrawer.platforms.react.states.some((s) => s.id === "loading"));
  assert.ok(guides.DsFormGroup.platforms.native.states.some((s) => s.id === "child-disabled"));
  assert.ok(guides.DsIconToggle.platforms.vue2.sizes.some((s) => s.label === "xl"));
  assert.ok(guides.DsIconToggle.platforms.react.sizes.some((s) => s.label === "xl"));
  assert.equal(guides.DsBadge.platforms.vue2.sizeDefault, '"sm"');
  assert.equal(guides.DsBadge.platforms.react.sizeDefault, '"sm"');
});
test("unknown public references and duplicate figures fail generation", () => {
  const broken = structuredClone(api);
  broken.components.DsButton.react.props = broken.components.DsButton.react.props.filter(
    (p) => p.name !== "prefixIcon",
  );
  assert.throws(() => buildVisualGuides(broken, catalog, descriptions), /Unknown visual prop/);
  const original = authors.DsButton.figures;
  try {
    authors.DsButton.figures = [
      { id: "default", label: "중복", description: "중복", parts: authors.DsButton.parts },
    ];
    assert.throws(() => buildVisualGuides(api, catalog, descriptions), /Duplicate/);
  } finally {
    authors.DsButton.figures = original;
  }
});
test("anatomy manifest proves installed package rendering and every image has valid annotation coordinates", async () => {
  const manifest = await read("apps/docs/public/previews/guide-figures/manifest.json");
  assert.deepEqual(manifest.renderers, ["@kjun/vue2", "@kjun/react", "@kjun/native"]);
  const expected = Object.values(guides).flatMap((g) =>
    Object.entries(g.platforms).flatMap(([p, data]) =>
      data.figures.map((f) => [`${p}/${g.name}/${f.id}`, f]),
    ),
  );
  assert.equal(Object.keys(manifest.figures).length, expected.length);
  for (const [key, spec] of expected) {
    const image = manifest.figures[key];
    assert.ok(image, key);
    assert.equal(image.parts.length, spec.parts.length);
    const body = await readFile("apps/docs/public" + image.src);
    assert.equal(createHash("sha256").update(body).digest("hex"), image.sha256, key);
    for (const b of [...image.parts, ...(image.contexts || [])]) {
      assert.ok(b.width > 0 && b.height > 0, key);
      assert.ok(
        b.x >= -1 &&
          b.y >= -1 &&
          b.x + b.width <= image.width + 1 &&
          b.y + b.height <= image.height + 1,
        key,
      );
    }
  }
});
test("usage and anatomy terms enter search while API priority remains intact", () => {
  assert.ok(searchDocuments(discovery.documents, "구조 도해").some(r => r.document.component));
  for (const query of ["버튼 문구", "긴 한국어", "빈 상태"])
    assert.ok(
      searchDocuments(discovery.documents, query).some((r) => r.document.parentPageId === "usage-guide"),
      query,
    );
  assert.equal(
    searchDocuments(discovery.documents, "loadOptions")[0].href,
    "/components/search-input#api",
  );
  assert.equal(
    searchDocuments(discovery.documents, "queryKey")[0].href,
    "/components/data-state#api",
  );
  for (const doc of discovery.documents.filter((d) => d.component))
    assert.ok(
      doc.sections.some(([s]) => s === "anatomy") && doc.sections.some(([s]) => s === "states"),
    );
});
