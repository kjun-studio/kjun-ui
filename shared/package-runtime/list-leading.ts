import { tokens } from "@kjun-ui/tokens";

export type ListLeadingSize = "xs" | "sm" | "md" | "lg";

/** Explicit sizes reserve a square. Only a built-in icon background opts into sm automatically. */
export function listLeadingGeometry({ size, custom, background }: { size?: ListLeadingSize; custom: boolean; background: boolean }) {
  const resolved = size ?? (!custom && background ? "sm" : undefined);
  const list = tokens.extensions.list;
  return {
    size: resolved,
    width: resolved ? list.leadingSizes[resolved] : custom ? list.leadingWidth : tokens.dimension.value24,
    iconSize: resolved ? list.leadingIconSizes[resolved] : list.iconSize,
  };
}
