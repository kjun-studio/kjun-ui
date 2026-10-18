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

export function selectOptions<T extends SelectOption>({
  options, value, labelKey, valueKey, query, pageSize, limit, loading, multiple, filterFn, searchKeys = [],
}: {
  options: T[]; value: OptionValue | OptionValue[] | null;
  labelKey: string; valueKey: string; query: string;
  pageSize: number; limit: number; loading: boolean; multiple: boolean;
  filterFn?: (option: T, query: string) => boolean; searchKeys?: readonly string[];
}) {
  const selected = (option: T) => optionSelected(value, option, valueKey);
  const indexed = options.map((option, index) => ({ option, key: optionKey(option, valueKey, index) }));
  // A caller's filterFn owns matching and order; the default ranks prefix, label and searchKeys matches.
  const matching = filterFn ? indexed.filter(({ option }) => filterFn(option, query))
    : indexed.map((item, index) => ({ item, index, rank: optionMatchRank(item.option, query, labelKey, searchKeys) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ item }) => item);
  const visible = loading ? [] : pageSize > 0 ? matching.slice(0, limit) : matching;
  const selectedOption = options.find(selected);
  const label = multiple && Array.isArray(value) && value.length > 1
    ? `${value.length}개 선택됨` : selectedOption !== undefined ? optionLabel(selectedOption, labelKey) : "";
  return { selected, matching, visible, selectedOption, label,
    nextValue: (option: T) => nextOptionValue(value, option, valueKey, multiple) };
}
