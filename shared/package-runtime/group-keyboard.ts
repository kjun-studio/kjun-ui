/** Arrow, Home and End keys move focus between a group's enabled buttons, following text direction. */
export function groupKeydown(event: { key: string; target: EventTarget | null; currentTarget: EventTarget | null; preventDefault(): void }) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const group = event.currentTarget as HTMLElement;
  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const current = buttons.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const direction = getComputedStyle(group).direction === "rtl" ? -1 : 1;
  const next =
    event.key === "Home" ? 0
      : event.key === "End" ? buttons.length - 1
      : (current + (event.key === "ArrowRight" ? direction : -direction) + buttons.length) % buttons.length;
  buttons[next]?.focus();
}
