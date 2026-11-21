import { Comment, Fragment, Text, type VNode, type VNodeChild } from "vue";

/** React treats undefined, null, "" and false children as empty; a slot is empty when it renders nothing visible. */
export function hasContent(nodes: VNodeChild): boolean {
  return !!(nodes as VNode[] | undefined)?.some(node =>
    node.type === Comment ? false
      : node.type === Text ? String(node.children ?? "").trim() !== ""
      : node.type === Fragment ? hasContent(node.children as VNode[])
      : true);
}

/** Slot content, or the matching prop when the slot is not used. */
export const slotOr = <T>(slot: (() => VNode[]) | undefined, value: T) => slot ? slot() : value;

/** The text a slot shows, for a name built from it (a list row's move buttons): text nodes and element children, in order. */
export function slotText(nodes: VNodeChild): string {
  if (nodes == null || typeof nodes === "boolean") return "";
  if (typeof nodes === "string" || typeof nodes === "number") return String(nodes);
  if (Array.isArray(nodes)) return nodes.map(slotText).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const node = nodes as VNode;
  if (node.type === Comment) return "";
  if (typeof node.children === "string") return node.children.trim();
  if (Array.isArray(node.children)) return slotText(node.children as VNodeChild);
  const label = (node.props as { ariaLabel?: unknown; "aria-label"?: unknown } | null)?.ariaLabel ?? node.props?.["aria-label"];
  if (typeof label === "string") return label;
  const slot = (node.children as { default?: () => VNodeChild } | null)?.default;
  return slot ? slotText(slot()) : "";
}
