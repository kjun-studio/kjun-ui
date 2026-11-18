// The text a screen reader should hear for content given as a node (a list row's badge or end value), for Native,
// where a pressable's accessibilityLabel replaces what its children would say. Strings and numbers read as they are;
// an element reads its own screen reader name (ariaLabel, label), a badge its count, else its children. Content with
// no text (an icon, a dot) reads as nothing.
type Props = { ariaLabel?: unknown; label?: unknown; count?: unknown; max?: unknown; children?: unknown };
export function nodeText(node: unknown): string | undefined {
  if (typeof node === "string") return node.trim() || undefined;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(" ") || undefined;
  if (!node || typeof node !== "object" || !("props" in node)) return undefined;
  const props = ((node as { props?: Props }).props ?? {}) as Props;
  for (const name of [props.ariaLabel, props.label]) if (typeof name === "string" && name.trim()) return name.trim();
  if (typeof props.count === "number") {
    const max = typeof props.max === "number" ? props.max : 99;
    return props.count > 0 ? props.count > max ? max + "+" : String(props.count) : undefined;
  }
  return nodeText(props.children);
}
