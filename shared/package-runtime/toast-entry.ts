import { tokens } from "@kjun-ui/tokens";

/** Toasts that arrive within one stack move of the last arrival wait for it to finish, then enter together, so a burst
 * shifts the stack once instead of once per toast. Returns how long the newest arrivals still wait (0 = none). */
export function toastEntryDelay(lastEntry: number, now: number, reduced: boolean) {
  return reduced ? 0 : Math.max(0, lastEntry + tokens.motion.toastMove - now);
}
