import { optionMatchRank, type SelectOption } from "./options";

/**
 * Combobox candidates: every option until the user types after opening, then Select's ranked match
 * (label prefix, label contains, searchKeys contains). A caller's filterFn owns matching and keeps the original order.
 */
export function comboboxOptions<T extends SelectOption>({ options, query, typed, labelKey, filterFn, searchKeys = [] }: {
  options: T[]; query: string; typed: boolean; labelKey: string;
  filterFn?: (option: T, query: string) => boolean; searchKeys?: readonly string[];
}): T[] {
  if (!typed) return options;
  if (filterFn) return options.filter(option => filterFn(option, query));
  return options.map((option, index) => ({ option, index, rank: optionMatchRank(option, query, labelKey, searchKeys) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ option }) => option);
}
