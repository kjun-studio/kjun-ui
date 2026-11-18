// KjunTiles cells for React and Native (Vue 3 keeps its own form in packages/vue3/src/tiles.tsx).
import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

/** The cells: every child, fragments opened, with nothing for false, null and blank strings. Keys keep the
 *  fragment path so a child inside a fragment never shares a key with one outside it. */
export function tileItems(children: ReactNode, path = ""): [string, ReactNode][] {
  return Children.toArray(children).flatMap((child, i): [string, ReactNode][] => {
    // Children.toArray keys elements ".0", ".$id"; other children take "#i" so the two never clash.
    const key = path + (isValidElement(child) && child.key != null ? child.key : "#" + i);
    if (isValidElement(child) && child.type === Fragment) return tileItems((child as ReactElement<{ children?: ReactNode }>).props.children, key + "/");
    return typeof child === "string" && !child.trim() ? [] : [[key, child]];
  });
}
