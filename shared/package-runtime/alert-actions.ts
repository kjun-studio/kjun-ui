// Untitled alerts put their actions beside the message, centred on its first line by negative block margins. When
// the row is too narrow they wrap under the message; the platforms then drop those margins so the buttons keep the
// alert's bottom padding. These helpers tell the two layouts apart on the web, from where the browser placed them.

/** True when the actions have wrapped onto their own line under the message. */
export function alertActionsWrapped(content: HTMLElement | null): boolean {
  const actions = content?.querySelector<HTMLElement>(":scope > .kjun-alert-actions");
  const message = actions?.previousElementSibling as HTMLElement | null | undefined;
  if (!actions || !message) return false;
  return actions.getBoundingClientRect().top >= message.getBoundingClientRect().bottom - 1;
}

/** Calls back with the wrapped state now and whenever the content resizes; returns the cleanup. */
export function observeAlertActions(content: HTMLElement | null, change: (wrapped: boolean) => void): () => void {
  if (!content) return () => {};
  const check = () => change(alertActionsWrapped(content));
  check();
  if (typeof ResizeObserver === "undefined") return () => {};
  const observer = new ResizeObserver(check);
  observer.observe(content);
  return () => observer.disconnect();
}

/** Native: wrapped when the actions start below the message's bottom edge (onLayout boxes, same parent). */
export function alertActionsBelow(message: { y: number; height: number } | null, actions: { y: number } | null): boolean {
  return !!message && !!actions && actions.y >= message.y + message.height - 1;
}
