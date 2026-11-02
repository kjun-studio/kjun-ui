// Provider inputs are often written inline (messages={{ save: "저장" }}); equal contents keep the previous object,
// so a re-rendering app root does not hand every KJUN component a "new" scope.
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keys = Object.keys(a as object);
  if (keys.length !== Object.keys(b as object).length) return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Returns the last value passed in while new values stay shallowly equal to it. */
export function stableValue<T>() {
  let last: { value: T } | undefined;
  return (next: T): T => {
    if (!last || !shallowEqual(last.value, next)) last = { value: next };
    return last.value;
  };
}
