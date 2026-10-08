import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  cleanType,
  vueContracts,
  reactContracts,
  feedbackApiMembers,
} from "../scripts/api-reference-source.mjs";
import {
  validateBindings,
  validateItem,
  validateGenerated,
  validateFeedback,
} from "../scripts/api-reference-validation.mjs";
import { searchDocuments } from "../shared/docs-search.mjs";
const json = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
const reference = json("../apps/docs/lib/generated/api-reference.json");
const raw = json("../apps/docs/lib/generated/api.json");
const catalog = json("../shared/component-catalog.json");
const paths = new Set(catalog.map((c) => c.docs));
paths.add("/feedback");
const platforms = ["vue2", "react", "native"];

test("all public components have one description per prop and valid examples", async () => {
  assert.equal(Object.keys(reference.components).length, catalog.filter(entry => entry.kind !== "internal").length);
  let count = 0;
  for (const entry of catalog.filter((c) => c.kind !== "internal"))
    for (const platform of platforms) {
      const contract = reference.components[entry.name][platform];
      validateBindings(
        contract.props,
        raw[entry.name][platform].map((p) => p.name),
        entry.name,
      );
      for (const item of [...contract.props, ...contract.events, ...contract.slots])
        await validateItem(item, entry.name, paths, resolve("."));
      count += contract.props.length;
    }
  assert.equal(count, catalog.filter(c => c.kind !== "internal").reduce((total, entry) => total + platforms.reduce((sum, platform) => sum + raw[entry.name][platform].length, 0), 0));
});
test("core docs cover every extracted event, slot and callback with ownership", () => {
  for (const name of ["DsFormGroup", "DsSelect", "DsSearchInput", "DsTable", "DsDataState", "DsListRow", "DsListSection", "DsTopNavigation", "DsBottomNavigation", "DsBottomActionBar", "DsImage", "DsAvatar", "DsChip", "DsSlider", "DsRangeSlider", "DsTimePicker", "DsQuantityStepper"])
    for (const platform of platforms) {
      const c = reference.components[name][platform];
      assert.ok(c.ownership.length);
      for (const member of [
        ...c.events,
        ...c.slots,
        ...c.props.filter((p) => /^(on[A-Z]|render[A-Z])|^(loadOptions|formatValue)$/.test(p.name)),
      ])
        assert.ok(member.details?.length, name + "." + member.name);
    }
  const source = feedbackApiMembers();
  for (const platform of platforms) validateFeedback(reference.feedback[platform], source);
});
test("docs extraction retains Vue mixin/conditional events and named/dynamic/forwarded slots", () => {
  const table = vueContracts(resolve("packages/vue2/src/source/data-display/Table.vue"));
  for (const name of ["selection-change", "row-expand", "row-collapse", "update:expandedRows"])
    assert.ok(table.events.some((e) => e.name === name));
  assert.deepEqual(table.slots.find((s) => s.name === "cell-*").data, ["row", "value", "index"]);
  assert.equal(table.slots.find((s) => s.name === "*").forwarded, true);
  assert.ok(!table.slots.some((s) => s.name === "default"));
  const dir = mkdtempSync(join(tmpdir(), "api-extraction-"));
  try {
    writeFileSync(
      join(dir, "mixin.js"),
      "export default { methods: { change(ok) { this.$emit(ok ? 'yes' : 'no', 1) } } }",
    );
    writeFileSync(
      join(dir, "Example.vue"),
      '<template><div><slot name="heading" :row="item"/><slot :name="`cell-${key}`" :value="value"/><slot :name="name" v-bind="slotProps"/></div></template><script>import mixed from "./mixin.js"; export default { mixins: [mixed] }</script>',
    );
    const extracted = vueContracts(join(dir, "Example.vue"));
    assert.deepEqual(
      extracted.events.map((e) => e.name),
      ["yes", "no"],
    );
    assert.deepEqual(
      extracted.slots.map((s) => s.name),
      ["heading", "cell-*", "*"],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("literal defaults come from the implementation, and nominal public types stay readable", () => {
  for (const platform of ["react", "native"]) {
    const actual = reactContracts(platform);
    assert.equal(actual.DsSelect.defaults.searchable.value, "false");
    assert.equal(actual.DsSelect.defaults.clearable.value, "false");
    assert.equal(actual.DsSearchInput.defaults.minChars.value, "2");
    assert.equal(actual.DsTable.defaults.sortable.value, "true");
    assert.equal(actual.DsTable.defaults.sortable.source, "shared/package-runtime/table.ts");
    assert.equal(actual.DsTable.defaults.expandSingle.value, "false");
    assert.equal(actual.DsMarketCards.defaults.excludeKeys.value, "[]");
    assert.equal(actual.DsMarketCards.defaults.excludeKeys.source, "shared/package-runtime/market-cards.ts");
    assert.equal(actual.DsFormGroup.defaults.id, undefined); // useId is not a literal default.
    const form = reference.components.DsFormGroup[platform];
    assert.equal(form.props.find((p) => p.name === "id").default, "자동 생성");
    assert.equal(
      form.props.some((p) => p.name === "value"),
      false,
    );
  }
  assert.equal(
    cleanType(
      'import("/workspace/node_modules/@types/react/index").ReactNode | import("/tmp/types").StyleProp<ViewStyle>',
    ),
    "ReactNode | StyleProp<ViewStyle>",
  );
  assert.ok(
    reference.components.DsTable.react.props
      .find((p) => p.name === "renderCell")
      .type.includes("TableColumn<Row>"),
  );
});
test("invalid metadata, unknown APIs, duplicate bindings and stale generation fail validation", async () => {
  assert.throws(() => validateBindings([{ name: "a" }], ["b"], "x"), /bindings/);
  assert.throws(
    () => validateBindings([{ name: "a" }, { name: "a" }], ["a", "a"], "x"),
    /duplicate/,
  );
  await assert.rejects(validateItem({ summary: "" }, "x", paths, "."), /missing summary/);
  await assert.rejects(
    validateItem({ summary: "ok", type: 'import("/tmp/private").T' }, "x", paths, "."),
    /private type/,
  );
  await assert.rejects(
    validateItem({ summary: "ok", example: "/missing#preview" }, "x", paths, "."),
    /invalid example/,
  );
  await assert.rejects(
    validateItem({ summary: "ok", example: "/components/select#missing" }, "x", paths, "."),
    /invalid example/,
  );
  assert.throws(() => validateGenerated("old", "new"), /stale/);
  validateGenerated("same", "same");
  assert.throws(
    () =>
      validateFeedback(
        { methods: [{ name: "private" }], options: [] },
        { methods: [], options: [] },
      ),
    /feedback method/,
  );
});
test("contract descriptions and dynamic API names join discovery without losing API priority", () => {
  const index = json("../apps/docs/lib/generated/discovery.json");
  const search = (query) => searchDocuments(index.documents, query);
  assert.equal(search("loadOptions")[0].href, "/components/search-input#api");
  assert.equal(search("queryKey")[0].href, "/components/data-state#api");
  assert.ok(search("AbortSignal").some((r) => r.document.id === "search-input"));
  assert.ok(search("행 키 배열").some((r) => r.document.id === "table"));
  assert.ok(search("cell-*").some((r) => r.href === "/components/table#api"));
  assert.equal(search("ToastOptions.duration")[0].href, "/feedback#api");
});
