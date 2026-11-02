import { tokens } from "@kjun-ui/tokens";

/** Where KjunFeedbackProvider stacks toasts: the top (default) or the bottom of the screen, right-aligned on wide web. */
export type ToastPlacement = "top" | "bottom";
/** Toasts enter from, and leave toward, their screen edge. */
export const toastEdgeShift = (placement: ToastPlacement = "top") => (placement === "bottom" ? 1 : -1) * tokens.motionDistance.toast;
