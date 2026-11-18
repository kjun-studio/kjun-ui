// Shared by React, Vue 3 and Native KjunFilterGroup: which chips are on, and the value after pressing one.
// In multiple mode an option whose value is null stands for "all": it is on while nothing else is, and pressing it clears.
export function filterSelected<T>(value: T | T[], option: T, multiple: boolean) {
  return multiple ? Array.isArray(value) && (option === null ? value.length === 0 : value.includes(option)) : value === option;
}

export function nextFilterValue<T>(value: T | T[], option: T, multiple: boolean): T | T[] {
  if (!multiple) return option;
  if (option === null) return [];
  const list = Array.isArray(value) ? value : [];
  return list.includes(option) ? list.filter(v => v !== option) : [...list, option];
}
