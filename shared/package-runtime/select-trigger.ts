/** How many labels end past the room left for them, given each label's right edge. */
export function hiddenLabelCount(rights: readonly number[], available: number) {
  const first = rights.findIndex(right => right > available + 0.5);
  return first < 0 ? 0 : rights.length - first;
}

/** Size and place of the clear button that sits over a select-like trigger, before its indicator. */
export function selectClearStyle(spec: { padding: number; iconSize: number; affixGap: number; clearSize: number }) {
  return { right: spec.padding + spec.iconSize + spec.affixGap, width: spec.clearSize, height: spec.clearSize, minHeight: spec.clearSize };
}

/** The filled circle drawn inside the clear button; the button keeps the larger target. */
export function selectClearMarkStyle(spec: { clearMarkSize: number }) {
  return { width: spec.clearMarkSize, height: spec.clearMarkSize };
}

/** Web: how many of the label spans inside `text` end past its visible width. */
export function measureHiddenLabels(text: HTMLElement | null | undefined) {
  if (!text) return 0;
  const left = text.getBoundingClientRect().left;
  const rights = [...text.children].map(child => child.getBoundingClientRect().right - left);
  return hiddenLabelCount(rights, text.clientWidth);
}
