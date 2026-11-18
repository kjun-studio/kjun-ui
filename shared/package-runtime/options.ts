export type OptionValue = string | number;
export type SelectOption = OptionValue | { [key: string]: unknown };
export const optionValue = (option: SelectOption, key = "value"): OptionValue =>
  typeof option === "object" ? (option[key] as OptionValue) : option;
export const optionLabel = (option: SelectOption, key = "label") =>
  String(typeof option === "object" ? option[key] ?? "" : option);
export const optionDisabled = (option: SelectOption) =>
  typeof option === "object" && !!option.disabled;

// Assign fallback identities before filtering; valid IDs also retain their type.
export function optionKey(option: SelectOption, key: string, index: number) {
  const value = optionValue(option, key);
  return typeof value === "string" || typeof value === "number"
    ? `${typeof value}:${value}` : `index:${index}`;
}
export function optionSelected(value: OptionValue | OptionValue[] | null, option: SelectOption, key: string) {
  const id = optionValue(option, key);
  return Array.isArray(value) ? value.includes(id) : value === id;
}
export function nextOptionValue(value: OptionValue | OptionValue[] | null, option: SelectOption, key: string, multiple: boolean) {
  const id = optionValue(option, key);
  if (!multiple) return id;
  return Array.isArray(value) && value.includes(id)
    ? value.filter(item => item !== id) : [...(Array.isArray(value) ? value : []), id];
}

/** 0 label starts with the query, 1 label contains it, 2 a searchKeys field contains it, -1 no match; an empty query matches as 0. */
export function optionMatchRank(option: SelectOption, query: string, labelKey: string, searchKeys: readonly string[] = []) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return 0;
  const label = optionLabel(option, labelKey).toLocaleLowerCase();
  if (label.startsWith(needle)) return 0;
  if (label.includes(needle)) return 1;
  return typeof option === "object" && searchKeys.some(key => String(option[key] ?? "").toLocaleLowerCase().includes(needle)) ? 2 : -1;
}

/** A group is an option object whose `options` field holds its options; its label is read with labelKey. */
export const isOptionGroup = (option: SelectOption): option is { options: SelectOption[]; [key: string]: unknown } =>
  typeof option === "object" && Array.isArray(option.options);

export type SelectMultipleDisplay = "count" | "labels";
export interface SelectItem<T> { option: T; key: string }
/** Consecutive visible options that share a group; `label` is undefined for options outside any group. */
export interface SelectSection<T> { key: string; label?: string; items: SelectItem<T>[] }

export function selectOptions<T extends SelectOption>({
  options, value, labelKey, valueKey, query, pageSize, limit, loading, multiple, filterFn, searchKeys = [],
  selectedCount = (count: number) => String(count), multipleDisplay = "count",
}: {
  options: T[]; value: OptionValue | OptionValue[] | null;
  labelKey: string; valueKey: string; query: string;
  pageSize: number; limit: number; loading: boolean; multiple: boolean;
  filterFn?: (option: T, query: string) => boolean; searchKeys?: readonly string[];
  /** Trigger label for several selected options; platforms pass KjunProvider's messages.selectedCount. */
  selectedCount?: (count: number) => string;
  /** "labels" names every selected option in the trigger instead of counting them. */
  multipleDisplay?: SelectMultipleDisplay;
}) {
  const selected = (option: T) => optionSelected(value, option, valueKey);
  // Groups flatten into their options; each option remembers its group so filtering and paging see one list.
  const flat: { option: T; group: number }[] = [];
  const groups: { key: string; label: string }[] = [];
  options.forEach((option, index) => {
    if (!isOptionGroup(option)) { flat.push({ option, group: -1 }); return; }
    groups.push({ key: `group:${index}`, label: optionLabel(option, labelKey) });
    for (const child of option.options) flat.push({ option: child as T, group: groups.length - 1 });
  });
  const indexed = flat.map(({ option, group }, index) => ({ option, group, key: optionKey(option, valueKey, index) }));
  const groupStart = new Map<number, number>();
  indexed.forEach(({ group }, index) => { if (!groupStart.has(group)) groupStart.set(group, index); });
  // A caller's filterFn owns matching and order; the default ranks prefix, label and searchKeys matches within each group;
  // groups keep their given order, and options outside a group sort where the first of them appears.
  const matching = filterFn ? indexed.filter(({ option }) => filterFn(option, query))
    : indexed.map((item, index) => ({ item, index, rank: optionMatchRank(item.option, query, labelKey, searchKeys) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => (groupStart.get(a.item.group)! - groupStart.get(b.item.group)!) || a.rank - b.rank || a.index - b.index)
      .map(({ item }) => item);
  const shown = loading ? [] : pageSize > 0 ? matching.slice(0, limit) : matching;
  const visible: SelectItem<T>[] = shown.map(({ option, key }) => ({ option, key }));
  // A group without a visible option disappears with its title.
  const sections: SelectSection<T>[] = [];
  shown.forEach(({ option, key, group }) => {
    const last = sections[sections.length - 1], id = group < 0 ? "options" : groups[group].key;
    if (last && last.key.startsWith(id + "#")) last.items.push({ option, key });
    else sections.push({ key: `${id}#${sections.length}`, label: group < 0 ? undefined : groups[group].label, items: [{ option, key }] });
  });
  const all = flat.map(({ option }) => option);
  const selectedOption = all.find(selected);
  const labels = multiple && Array.isArray(value)
    ? value.flatMap(item => { const match = all.find(option => optionValue(option, valueKey) === item); return match === undefined ? [] : [optionLabel(match, labelKey)]; })
    : selectedOption !== undefined ? [optionLabel(selectedOption, labelKey)] : [];
  const label = multiple && Array.isArray(value) && value.length > 1 && multipleDisplay === "count"
    ? selectedCount(value.length) : labels.join(", ");
  const hasValue = Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
  return { selected, matching, visible, sections, grouped: groups.length > 0, selectedOption, label, labels, hasValue,
    nextValue: (option: T) => nextOptionValue(value, option, valueKey, multiple) };
}
