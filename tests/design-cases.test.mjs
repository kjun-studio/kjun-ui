import { guideTopicForSection, usageGuideHref } from '../shared/document-navigation.ts';
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { designCases, designSections, designWidths, designScenarios } from "../shared/visual-guides/design-cases.ts";
import { exampleDefinition, validateSettings } from "../shared/example-registry.ts";
import { searchDocuments } from "../shared/docs-search.mjs";
const read = async path => JSON.parse(await readFile(path, "utf8"));

test("design cases resolve recipes separately from public component destinations", async () => {
  const catalog = await read("shared/component-catalog.json");
  assert.equal(designCases.length, 10);
  const additions = ["field-errors", "delete-confirmation", "refresh-context", "empty-vs-error", "bottom-cta-layout", "keyboard-layout"];
  for (const id of additions) {
    const item = designCases.find(item => item.id === id);
    assert.ok(item?.appliesWhen && item?.caution, id);
    assert.ok(item.points.length >= 2 && item.points.length <= 3, id);
    assert.equal(item.section, id);
    assert.equal(item.viewportHeight, ["delete-confirmation", "bottom-cta-layout", "keyboard-layout"].includes(id) ? 720 : undefined);
  }
  for (const item of designCases) {
    exampleDefinition(item.name);
    assert.ok(designSections.some(s => s.id === item.section));
    for (const component of item.components) assert.ok(catalog.some(c => c.name === component && c.kind !== "internal"));
  }
  assert.equal(new Set(designScenarios.map(s => s.scenario.id)).size, 40);
  for (const { name, scenario } of designScenarios) {
    validateSettings(name, scenario.settings);
    const item = designCases.find(item => item.name === name);
    assert.deepEqual(scenario.values, item.values || {});
    assert.equal(scenario.viewportHeight, item.viewportHeight);
  }
});

test("every before/after image has packed provenance and in-bounds annotations at its declared width", async () => {
  const manifest = await read("apps/docs/public/previews/design-figures/manifest.json");
  assert.deepEqual(manifest.renderers, ["@kjun/vue2", "@kjun/react", "@kjun/native"]);
  assert.equal(Object.keys(manifest.figures).length, 120);
  assert.match(manifest.fingerprint, /^[a-f0-9]{64}$/);
  for (const platform of ["vue2", "react", "native"]) for (const item of designCases) for (const width of designWidths) for (const side of ["before", "after"]) {
    const key = `${platform}/${item.id}/${side}/${width}`, asset = manifest.figures[key];
    assert.ok(asset, key); assert.equal(asset.width, width); assert.equal(asset.parts.length, item.points.length);
    if (item.viewportHeight) assert.equal(asset.height, item.viewportHeight);
    const image = await readFile("apps/docs/public" + asset.src);
    assert.equal(image.readUInt32BE(16), width * 2);
    assert.equal(image.readUInt32BE(20), asset.height * 2);
    assert.equal(createHash("sha256").update(image).digest("hex"), asset.sha256);
    for (const b of asset.parts) assert.ok(b.x >= 0 && b.y >= 0 && b.width > 0 && b.height > 0 && b.x + b.width <= width + 1 && b.y + b.height <= asset.height + 1, key);
  }
});

test("new design terms and detail anchors are discoverable without changing API search priority", async () => {
  const { documents } = await read("apps/docs/lib/generated/discovery.json");
  const usage = documents.filter(d => d.parentPageId === "usage-guide");
  for (const section of designSections) assert.ok(usage.find(page => page.path === guideTopicForSection(section.id).path).sections.some(([id]) => id === section.id));
  for (const section of designSections.slice(3)) assert.ok(searchDocuments(documents, section.title).some(r => r.href === usageGuideHref(section.id)), section.id);
  for (const term of ["취소 버튼", "보조 버튼", "전후 비교", "긴 한국어", "오류 메시지 위치", "삭제 확인", "갱신 중 화면 유지", "빈 결과와 조회 실패", "하단 CTA", "키보드", "동일 조건 갱신", "안전 여백"]) assert.ok(searchDocuments(documents, term).some(r => usage.includes(r.document)), term);
  for (const item of designCases) for (const component of item.components) {
    assert.ok(documents.find(d => d.component === component).sections.some(([id]) => id === "design-" + item.id));
  }
  assert.equal(searchDocuments(documents, "loadOptions")[0].href, "/components/search-input#api");
});
