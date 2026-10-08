import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanType,
  reactContracts,
  vueContracts,
  feedbackApiMembers,
} from "./api-reference-source.mjs";
import { overrides } from "../shared/api-reference/overrides.mjs";
import { coreContracts, feedbackContracts } from "../shared/api-reference/contracts.mjs";
const root = resolve(import.meta.dirname, "..");
const json = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const platforms = ["vue2", "react", "native"];
import {
  fail,
  validateBindings,
  validateItem as validateMember,
  validateGenerated,
  validateFeedback,
} from "./api-reference-validation.mjs";
export async function generateReference({ check = false } = {}) {
  const [api, catalog, terms] = await Promise.all(
    [
      "apps/docs/lib/generated/api.json",
      "shared/component-catalog.json",
      "shared/api-reference/terms.json",
    ].map(json),
  );
  const bindings = {};
  for (const file of (await readdir(resolve(root, "shared/api-reference"))).sort()) {
    if (!file.endsWith(".json") || file === "terms.json") continue;
    for (const [name, value] of Object.entries(await json("shared/api-reference/" + file))) {
      if (bindings[name]) fail("duplicate component " + name);
      bindings[name] = value;
    }
  }
  const publicEntries = catalog.filter((e) => e.kind !== "internal");
  if (
    publicEntries.length !== Object.keys(bindings).length ||
    publicEntries.some((e) => !bindings[e.name])
  )
    fail("public component coverage");
  const actual = { react: reactContracts("react"), native: reactContracts("native") },
    components = {};
  const knownPaths = new Set([...publicEntries.map((e) => e.docs), "/feedback"]);
  const validateItem = (item, label) => validateMember(item, label, knownPaths, root);
  for (const entry of publicEntries) {
    const name = entry.name,
      vueSource = entry.sources.vue2;
    const vue = vueContracts(resolve(root, vueSource));
    const component = (components[name] = {});
    for (const platform of platforms) {
      const rows = api[name][platform],
        expected = bindings[name][platform];
      validateBindings(rows, expected, name + "." + platform);
      const basic = { ...overrides[name]?.common, ...overrides[name]?.[platform] };
      const core = coreContracts[name]?.[platform] || {};
      const unionProps = new Set(platforms.flatMap((p) => api[name][p].map((row) => row.name)));
      for (const key of Object.keys(overrides[name]?.common || {}))
        if (!unionProps.has(key)) fail("unknown shared prop " + name + "." + key);
      for (const key of Object.keys(overrides[name]?.[platform] || {}))
        if (!expected.includes(key))
          fail("unknown platform prop " + name + "." + platform + "." + key);
      for (const key of Object.keys(core.props || {}))
        if (!expected.includes(key))
          fail("unknown detailed prop " + name + "." + platform + "." + key);
      const props = rows.map((row) => {
        const extra = { ...basic[row.name], ...core.props?.[row.name] };
        return {
          ...row,
          type: cleanType(extra.type || row.type),
          default:
            extra.default ?? actual[platform]?.[name]?.defaults[row.name]?.value ?? row.default,
          summary: extra.summary || terms[row.name],
          ...extra,
          source: platform === "vue2" ? vueSource : actual[platform]?.[name]?.source,
          ...(extra.details?.length ? { example: extra.example || entry.docs + "#preview" } : {}),
        };
      });
      const makeMembers = (kind, members) => {
        const details = core[kind] || {};
        for (const key of Object.keys(details))
          if (!members.some((m) => m.name === key))
            fail("unknown " + kind + " " + name + "." + key);
        return members.map((member) => ({
          ...member,
          type:
            kind === "slots"
              ? member.data.length
                ? "{ " + member.data.join(", ") + " }"
                : member.forwarded
                  ? "전달받은 슬롯 데이터"
                  : "제공 데이터 없음"
              : "이벤트",
          summary:
            kind === "slots"
              ? member.name === "*"
                ? "호출자가 제공한 이름과 데이터를 자식의 슬롯에 그대로 전달합니다."
                : `${member.name} 영역의 기본 내용을 교체합니다.`
              : `${member.name} 이벤트를 통지합니다.`,
          ...details[member.name],
          ...(details[member.name]?.details?.length ? { example: entry.docs + "#preview" } : {}),
        }));
      };
      component[platform] = {
        props,
        events: platform === "vue2" ? makeMembers("events", vue.events) : [],
        slots: platform === "vue2" ? makeMembers("slots", vue.slots) : [],
        ownership: core.ownership || [],
        types: core.types || [],
      };
      for (const item of [...props, ...component[platform].events, ...component[platform].slots])
        await validateItem(item, name + "." + platform + "." + item.name);
      for (const type of core.types || []) {
        if (new Set(type.fields.map((f) => f.name)).size !== type.fields.length)
          fail("duplicate nested field " + type.name);
        for (const field of type.fields)
          await validateItem(field, name + "." + type.name + "." + field.name);
      }
      if (coreContracts[name]) {
        if (!core.ownership?.length) fail("missing state ownership " + name + "." + platform);
        for (const item of [...component[platform].events, ...component[platform].slots])
          if (!item.details?.length) fail("missing detailed member " + name + "." + item.name);
        for (const item of props.filter((p) =>
          /^(on[A-Z]|render[A-Z])|^(loadOptions|formatValue)$/.test(p.name),
        ))
          if (!item.details?.length)
            fail("missing callback contract " + name + "." + platform + "." + item.name);
      }
    }
  }
  for (const name of Object.keys(overrides))
    if (!components[name]) fail("unknown component override " + name);
  const feedback = feedbackContracts,
    feedbackSource = feedbackApiMembers();
  for (const platform of platforms) {
    const data = feedback[platform];
    validateFeedback(data, feedbackSource);
    if (!data?.ownership?.length) fail("missing feedback ownership " + platform);
    for (const section of ["methods", "options"]) {
      if (new Set(data[section].map((item) => item.name)).size !== data[section].length)
        fail("duplicate feedback member");
      for (const item of data[section])
        await validateItem(item, "feedback." + platform + "." + item.name);
    }
  }
  const output = JSON.stringify({ components, feedback }, null, 2) + "\n",
    target = resolve(root, "apps/docs/lib/generated/api-reference.json");
  if (check) validateGenerated(await readFile(target, "utf8").catch(() => ""), output);
  else await writeFile(target, output);
  const count = Object.values(components).flatMap((c) =>
    platforms.flatMap((p) => c[p].props),
  ).length;
  console.log(
    `API reference verified: ${publicEntries.length} components, ${count} prop descriptions, ${Object.keys(coreContracts).length + 1} detailed documents, three platforms.`,
  );
  return { components, feedback };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await generateReference({ check: process.argv.includes("--check") });
