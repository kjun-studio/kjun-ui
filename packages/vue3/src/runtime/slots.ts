import { Comment, Fragment, Text, type VNode } from "vue";

/** React treats undefined, null, "" and false children as empty; a slot is empty when it renders nothing visible. */
export function hasContent(nodes: VNode[] | undefined): boolean {
  return !!nodes?.some(node =>
    node.type === Comment ? false
      : node.type === Text ? String(node.children ?? "") !== ""
      : node.type === Fragment ? hasContent(node.children as VNode[])
      : true);
}
