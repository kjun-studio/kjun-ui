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
