import { readFile, writeFile } from "node:fs/promises";
import { buildVisualGuides } from "../shared/visual-guides/index.ts";
import { usageScenarios, layouts } from "../shared/visual-guides/usage-content.ts";
import { validateSettings, exampleDefinition } from "../shared/example-registry.ts";
import { designCases, designScenarios } from "../shared/visual-guides/design-cases.ts";
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const [api, catalog, descriptions] = await Promise.all(
  [
    "apps/docs/lib/generated/api-reference.json",
    "shared/component-catalog.json",
    "shared/component-guides.json",
  ].map(read),
);
const guides = buildVisualGuides(api, catalog, descriptions);
for (const { name, scenario } of usageScenarios) {
  if (!guides[name]) throw Error("Unknown usage destination: " + name);
  validateSettings(name, scenario.settings || {});
  for (const platform of ["vue2", "react", "native"]) {
    for (const [target, spec] of Object.entries(JSON.parse(scenario.settings?.visual || "{}"))) {
      const props = api.components[target]?.[platform]?.props;
      if (!props) throw Error("Unknown usage target: " + target);
      for (const key of Object.keys(spec.props || {}))
        if (!props.some((prop) => prop.name === key))
          throw Error(`Unknown usage prop: ${platform}/${target}.${key}`);
    }
  }
}
for (const item of designCases) {
  exampleDefinition(item.name);
  if (item.components.some(name => !guides[name])) throw Error("Unknown design destination: " + item.id);
}
if (new Set(designCases.map(item => item.id)).size !== designCases.length) throw Error("Duplicate design case");
for (const { name, scenario } of designScenarios) validateSettings(name, scenario.settings);
for (const layout of layouts) exampleDefinition(layout.name);
const path = "apps/docs/lib/generated/visual-guides.json",
  output = JSON.stringify(guides, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8").catch(() => "")) !== output)
    throw Error("Visual guides are stale; run guides:generate.");
} else await writeFile(path, output);
console.log("Visual guide definitions verified: public catalog + feedback, three platforms.");
