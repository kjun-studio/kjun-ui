import { tokens } from "@kjun-ui/tokens";

/** The web close button: a 32px square with its own radius. Inline, because the button sets its size and radius inline. */
export const modalCloseStyle = { borderRadius: tokens.modal.closeRadius, width: tokens.modal.closeSize, height: tokens.modal.closeSize, padding: 0 };
/** The Native close button: React Native's own padding keys, which the button's padding would otherwise win over. */
export const nativeModalCloseStyle = { borderRadius: tokens.modal.closeRadius, width: tokens.modal.closeSize, height: tokens.modal.closeSize,
  paddingHorizontal: 0, paddingVertical: 0 };
