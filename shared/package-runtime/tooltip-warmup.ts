// The react-aria tooltip warm-up, for the Vue 3 and Native tooltips: once a tooltip has opened,
// the next one opens without its delay, until no tooltip has been open for the cooldown.
/** react-aria's TOOLTIP_COOLDOWN, in milliseconds. */
export const tooltipCooldown = 500;
let warm = false, openCount = 0, cooldown: ReturnType<typeof setTimeout> | undefined;

/** True while a delayed tooltip should open at once. */
export const isTooltipWarm = () => warm;

/** Call when a tooltip becomes visible. */
export function tooltipOpened() {
  openCount++;
  warm = true;
  clearTimeout(cooldown);
}

/** Call when a visible tooltip closes; the warm state ends after the cooldown with none open. */
export function tooltipClosed() {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;
  clearTimeout(cooldown);
  cooldown = setTimeout(() => { if (openCount === 0) warm = false; }, tooltipCooldown);
}
