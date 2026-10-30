// Drawer frame on Native: what the keyboard covers, the safe areas and the sheet height limit.
export type DrawerPosition = "left" | "right" | "top" | "bottom";
export interface DrawerFrameInput {
  position: DrawerPosition;
  windowHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  /** Space a top or bottom sheet leaves at the opposite edge. */
  gap: number;
  /** Height of the window the keyboard covers (0 when hidden). */
  keyboard: number;
  maxHeight?: number;
}
export interface DrawerFrame { maxHeight: number; height: number | undefined; paddingTop: number; paddingBottom: number; lift: number }

/**
 * Keyboard events a drawer listens to. Android reports only after the keyboard moved; edge-to-edge
 * windows no longer resize for it (adjustResize), so the drawer lifts itself there too.
 */
export function keyboardEvents(os: string) {
  if (os === "ios") return { show: "keyboardWillShow", hide: "keyboardWillHide" } as const;
  if (os === "android") return { show: "keyboardDidShow", hide: "keyboardDidHide" } as const;
  return null;
}
/**
 * The part of the modal root the keyboard covers. Measured against the root, a window the platform
 * already resized ends at or above the keyboard and gives 0, so the drawer never lifts twice.
 */
export function keyboardOverlap(rootHeight: number, keyboardScreenY: number) {
  return Math.max(0, rootHeight - keyboardScreenY);
}

export function drawerFrame({ position, windowHeight, safeAreaTop, safeAreaBottom, gap, keyboard, maxHeight }: DrawerFrameInput): DrawerFrame {
  const visible = windowHeight - keyboard;
  // The keyboard covers the bottom safe area while it shows.
  const bottomInset = keyboard > 0 ? 0 : safeAreaBottom;
  if (position === "left" || position === "right")
    return { maxHeight: visible, height: visible, paddingTop: safeAreaTop, paddingBottom: bottomInset, lift: 0 };
  const sheet = maxHeight ?? visible - (position === "bottom" ? safeAreaTop : bottomInset) - gap;
  return {
    maxHeight: Math.max(0, Math.min(sheet, visible)),
    height: undefined,
    paddingTop: position === "top" ? safeAreaTop : 0,
    paddingBottom: position === "bottom" ? bottomInset : 0,
    lift: position === "bottom" ? keyboard : 0,
  };
}

/** Web overlay variables read by the drawer CSS (tokens controls.css). */
export function drawerOverlayVars({ safeAreaTop = 0, safeAreaBottom = 0, maxHeight }: { safeAreaTop?: number; safeAreaBottom?: number; maxHeight?: number }) {
  return {
    "--_kjun-drawer-safe-top": Math.max(0, safeAreaTop) + "px",
    "--_kjun-drawer-safe-bottom": Math.max(0, safeAreaBottom) + "px",
    ...(maxHeight === undefined ? {} : { "--_kjun-drawer-max-height": `min(${maxHeight}px, 100dvh)` }),
  } as Record<string, string>;
}
