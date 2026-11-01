// Typeahead for lists the web packages draw themselves (Vue menus and listboxes): typed characters gather for a
// second and move to the next item whose label starts with them, searching from the current item onwards.
export function createTypeahead(timeout = 1000) {
  let typed = "", typedAt = 0;
  /** The index to focus, or -1; `key` is a KeyboardEvent key. */
  return (key: string, labels: readonly string[], current: number, now = Date.now()) => {
    if (key.length !== 1 || (key === " " && !typed)) return -1;
    typed = (now - typedAt > timeout ? "" : typed) + key.toLocaleLowerCase();
    typedAt = now;
    const start = Math.max(0, current);
    for (let step = 0; step < labels.length; step++) {
      const index = (start + step) % labels.length;
      if (labels[index].trim().toLocaleLowerCase().startsWith(typed)) return index;
    }
    return -1;
  };
}
