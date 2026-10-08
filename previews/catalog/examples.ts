import { renderIconExample } from './example-icons';
import { renderAccessibilityExample } from "./example-accessibility";
import { renderInteractionExample } from "./example-interaction";
import { renderCardExample } from "./example-card";
import { renderMotionExample } from "./example-motion";
import { renderFoundationExample } from "./example-foundations";
import { createExampleTools, type ExampleContext } from "./example-tools";
import { renderDataExample } from "./example-data";
import { renderControlExample } from "./example-controls";
import { renderExtensionExample } from "./example-extensions";
import { renderRecipeExample } from "./example-recipes";
import { renderDesignExample } from "./example-design-cases";
export type { ExampleRenderer, ExampleContext } from "./example-tools";
export { rows, columns, options, priceFormat } from "./example-tools";
const dataNames = new Set([
  "DsEmpty",
  "DsSkeleton",
  "DsListSkeleton",
  "DsFormSkeleton",
  "DsChartSkeleton",
  "DsMarketTableSkeleton",
  "DsTooltip",
  "DsPopover",
  "DsDataState",
  "DsErrorBoundary",
  "DsTable",
  "DsKpiHero",
  "DsKpiRow",
  "DsAnimatedNumber",
  "DsFreshness",
  "DsPriceCell",
  "DsSignedValue",
  "DsDeviation",
  "DsHeatmapCell",
  "DsProgressCell",
  "DsCollectionMark",
  "DsExecutionStatusBadge",
  "DsSparkline",
  "DsMarketSimpleList",
  "DsMarketTable",
  "DsMarketCards",
  "DsMarketListPanel",
]);
export function renderExample(name: string, context: ExampleContext) {
  const tools = createExampleTools(context);
  const interaction = renderIconExample(name, tools) ?? renderInteractionExample(name, tools);
  if (interaction !== undefined) return interaction;
  const extension = renderAccessibilityExample(name, tools) ?? renderMotionExample(name, tools) ?? renderCardExample(name, tools) ?? renderFoundationExample(name, tools) ?? renderExtensionExample(name, tools) ?? renderRecipeExample(name, tools) ?? renderDesignExample(name, tools);
  if (extension !== undefined) return extension;
  return dataNames.has(name)
    ? renderDataExample(name, tools)
    : renderControlExample(name, tools);
}
