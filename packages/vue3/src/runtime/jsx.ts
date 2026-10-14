// esbuild compiles every JSX expression in the Vue 3 package to h(type, props, ...children).
import { Fragment, h as vueH, isVNode, type VNode } from "vue";

export { Fragment };

const isSlots = (value: unknown) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !isVNode(value);

/**
 * React-style children for Vue: `{cond && <x/>}` renders nothing when false. Vue's h turns a single
 * non-array boolean child into text, so element children always go in an array; component children
 * become a default slot unless a slot object (`{{ default: () => … }}`) is given.
 */
export function h(type: Parameters<typeof vueH>[0], props: Record<string, unknown> | null, ...children: unknown[]): VNode {
  if (!children.length) return vueH(type, props);
  if (typeof type === "string" || type === Fragment) return vueH(type as string, props, children as never);
  if (children.length === 1 && isSlots(children[0])) return vueH(type, props, children[0] as never);
  return vueH(type, props, { default: () => children } as never);
}
