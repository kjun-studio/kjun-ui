import { implementationNames } from '../implementation-examples';
import catalog from '../component-catalog.json' with { type: 'json' };
import type { UsageGenerator, UsageInput } from './builder';
export type { UsageExample, UsageInput, UsageGenerator } from './builder';
const categories = {
  controls: 'Button Input FormGroup FormActions Checkbox Switch Radio RadioGroup Textarea Select Combobox DatePicker ButtonGroup FilterGroup Tabs TabPane IconToggle CopyButton RefreshButton ExternalLink Progress',
  layers: 'Card Alert Dropdown DropdownItem DropdownDivider MenuButton Accordion AccordionItem Modal Drawer Tooltip Popover Breadcrumb Pagination ScrollFade ErrorBoundary',
  data: 'Icon Badge Spinner Empty Skeleton ListSkeleton FormSkeleton ChartSkeleton MarketTableSkeleton Table DataState KpiHero KpiRow AnimatedNumber Freshness PriceCell SignedValue Deviation HeatmapCell ProgressCell CollectionMark ExecutionStatusBadge Sparkline MarketSimpleList MarketTable MarketCards MarketListPanel',
  extensions: 'ListRow ListSection TopNavigation BottomNavigation BottomActionBar Image Avatar Chip Slider RangeSlider TimePicker QuantityStepper',
  search: 'SearchInput',
};
const loaders = {
  controls: () => import('./controls'), layers: () => import('./layers'), data: () => import('./data'),
  extensions: () => import('./extensions'), search: () => import('./search'), feedback: () => import('./feedback'), recipes: () => import('./recipes'),
};
const groups = Object.fromEntries(Object.entries(categories).flatMap(([group, names]) => names.split(' ').map(name => ['Ds' + name, group]))) as Record<string, keyof typeof loaders>;
groups.KjunFeedbackProvider = 'feedback';
for (const name of implementationNames) groups[name] = 'recipes';
export const usageNames = [...catalog.filter(item => item.kind !== 'internal').map(item => item.name), 'KjunFeedbackProvider', ...implementationNames];
export const usageCategories = Object.keys(loaders);
export function usageCategory(name: string) {
  const group = groups[name];
  if (!group || !usageNames.includes(name)) throw Error('기본 사용 코드 생성기 누락: ' + name);
  return group;
}
export async function loadUsageGenerator(name: string): Promise<UsageGenerator> {
  const group = usageCategory(name);
  const module = await loaders[group]();
  return input => {
    if (input.name !== name) throw Error('기본 사용 코드 대상 불일치');
    return module.generate(input);
  };
}
export async function usageExample(input: UsageInput) { return (await loadUsageGenerator(input.name))(input); }
