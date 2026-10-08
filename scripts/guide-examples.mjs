import { iconScenarios, iconSelectionScenario, iconValidationSelections } from '../shared/icon-examples.ts';
import { accessibilityScenarios } from "../shared/accessibility-examples.ts";
import { interactionScenarios } from "../shared/interaction-examples.ts";
import { readFile } from "node:fs/promises";
import { presetConfig } from "../shared/example-registry.ts";
import { prepareExample, compileEntries } from "./example-consumers.mjs";
const guides = JSON.parse(await readFile("apps/docs/lib/generated/visual-guides.json", "utf8"));
import { usageScenarios } from "../shared/visual-guides/usage-content.ts";
import { designScenarios } from "../shared/visual-guides/design-cases.ts";
import { motionScenarios } from "../shared/motion-examples.ts";
let count = 0;
for (const platform of ["vue2", "react", "native"]) {
  const entries = {};
  for (const guide of Object.values(guides)) {
    for (const scenario of [
      ...guide.platforms[platform].states,
      ...guide.platforms[platform].sizes,
    ]) {
      const id = "guide-" + scenario.id;
      const settings = { ...presetConfig(guide.name).settings, ...scenario.settings };
      entries[guide.name + "-" + id] = await prepareExample(
        platform,
        guide.name,
        id,
        settings,
        scenario.values || {},
      );
      count++;
    }
  }
  for (const { name, scenario } of [...usageScenarios, ...designScenarios, ...motionScenarios, ...accessibilityScenarios, ...interactionScenarios, ...iconScenarios, ...iconValidationSelections.map((selection, i) => ({ name: "GuideIconSelection", scenario: { ...iconSelectionScenario(selection), id: "icons-check-" + i } }))]) {
    const id = "usage-" + scenario.id;
    entries[name + "-" + id] = await prepareExample(
      platform,
      name,
      id,
      { ...presetConfig(name).settings, ...scenario.settings },
      scenario.values || {},
    );
    count++;
  }
  await compileEntries(platform, entries);
}
console.log(`Compiled ${count} visual comparison exports against installed packages.`);
