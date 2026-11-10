// Framework-free rules for reordering a list by hand, shared by the React, Vue and Native list sections: the app keeps
// the order (an array of row values) and renders its rows in it; these say where a row is and what a move produces.

export type ReorderKey = string | number;
export interface ReorderPlace { index: number; total: number; up: boolean; down: boolean }
export interface ReorderMove<T extends ReorderKey = ReorderKey> { value: T; from: number; to: number; order: T[] }

const inside = (index: number, length: number) => Number.isInteger(index) && index >= 0 && index < length;

/** A copy with the item at `from` moved to `to`; the same array when nothing moves. */
export function reorderMove<T>(order: readonly T[], from: number, to: number): T[] {
  if (from === to || !inside(from, order.length) || !inside(to, order.length)) return order as T[];
  const next = order.slice();
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

/** Where a row sits and which way it can go; null for a row the order does not list. */
export function reorderPlace(order: readonly ReorderKey[] | undefined, value: ReorderKey | undefined): ReorderPlace | null {
  const index = order && value !== undefined ? order.indexOf(value) : -1;
  return index < 0 ? null : { index, total: order!.length, up: index > 0, down: index < order!.length - 1 };
}

/** One step up (-1) or down (1); null at an end or for an unknown row. */
export function reorderStep<T extends ReorderKey>(order: readonly T[] | undefined, value: T, step: -1 | 1): ReorderMove<T> | null {
  const place = reorderPlace(order, value);
  if (!place || !(step < 0 ? place.up : place.down)) return null;
  return { value, from: place.index, to: place.index + step, order: reorderMove(order!, place.index, place.index + step) };
}

/** The button to focus after a move: the one pressed while it is still usable, else the other; null when neither is. */
export function reorderFocus(order: readonly ReorderKey[] | undefined, value: ReorderKey, step: -1 | 1): "up" | "down" | null {
  const place = reorderPlace(order, value);
  if (!place || (!place.up && !place.down)) return null;
  return step < 0 ? place.up ? "up" : "down" : place.down ? "down" : "up";
}

/** A move waiting for the app to apply it: the row, where it should land and when it was pressed (ms). */
export interface ReorderPending { value: ReorderKey; to: number; at: number }
/** How long a pressed move may wait for its order; after that an order change is someone else's. */
export const REORDER_CONFIRM_MS = 10000;

/**
 * Whether an order is the pressed move, applied: it shows the row at the place it was sent to, soon enough after the
 * press. An order the app drew again unchanged, or changed for another reason, confirms nothing.
 */
export function reorderConfirmed(order: readonly ReorderKey[] | undefined, pending: ReorderPending | null, now: number) {
  return !!pending && now - pending.at <= REORDER_CONFIRM_MS && reorderPlace(order, pending.value)?.index === pending.to;
}

/** True when a value appears twice: such rows would share one place. */
export function reorderDuplicates(order: readonly ReorderKey[] | undefined) {
  return !!order && new Set(order).size !== order.length;
}
