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

/**
 * Which way a dragged row steps for a pointer position: up once the pointer is above the middle of the row before
 * it, down once it is below the middle of the row after it. `rows` are the movable rows' boxes in their current order.
 */
export function reorderDragStep(pointer: number, rows: readonly { top: number; height: number }[], index: number): -1 | 0 | 1 {
  const middle = (row: { top: number; height: number }) => row.top + row.height / 2;
  if (!rows[index] || !Number.isFinite(pointer)) return 0;
  if (index > 0 && pointer < middle(rows[index - 1])) return -1;
  if (index < rows.length - 1 && pointer > middle(rows[index + 1])) return 1;
  return 0;
}

export type ReorderKeyAction = "grab" | "drop" | "cancel" | "up" | "down" | "leave";
/** Keys on a row's handle. "leave" (Tab) drops the row and must not be prevented. */
export function reorderKeyAction(key: string, grabbed: boolean): ReorderKeyAction | null {
  const press = key === "Enter" || key === " ";
  if (!grabbed) return press ? "grab" : null;
  return press ? "drop" : key === "Escape" ? "cancel" : key === "ArrowUp" ? "up" : key === "ArrowDown" ? "down" : key === "Tab" ? "leave" : null;
}

/**
 * A row's place for its buttons when only some of the order is on screen (a table page, a filtered list): a step
 * that would pass a row that is not shown is off, so a move never takes the row out of sight.
 */
export function reorderPlaceAmong(order: readonly ReorderKey[] | undefined, value: ReorderKey | undefined, shown?: ReadonlySet<ReorderKey> | null): ReorderPlace | null {
  const place = reorderPlace(order, value);
  if (!place || !shown || !order) return place;
  return { ...place, up: place.up && shown.has(order[place.index - 1]), down: place.down && shown.has(order[place.index + 1]) };
}

/** What is wrong with a reorderable section's `order`, for the console; `model` names the platform's way to receive it. */
export function reorderWarning(order: readonly ReorderKey[] | undefined, model: string) {
  if (!order) return `KJUN reorder (ListSection, Table): reorderable needs \`order\` (the row values in the order shown) and ${model}.`;
  return reorderDuplicates(order) ? "KJUN reorder (ListSection, Table): `order` lists a value twice; rows that share a value share one place." : null;
}

/** A requested step: `focus` is where focus goes once it is applied, and `quiet` skips the sentence. */
export interface ReorderRequest extends ReorderPending { name: string; focus: -1 | 1 | "handle"; quiet: boolean }
export interface ReorderMovesHost {
  order: () => readonly ReorderKey[] | undefined;
  disabled: () => boolean;
  /** Says a sentence to screen readers; an empty one clears the last. */
  say: (text: string) => void;
  moved: (name: string, position: number, total: number) => string;
  /** Asks the app for this order. */
  change: (order: ReorderKey[]) => void;
}
/**
 * The part of reordering every platform shares. The app owns the order, so a step is a request: it waits until an
 * order shows the row at its new place, and only then is it announced. A request the app never applies stops waiting.
 */
export function createReorderMoves(host: ReorderMovesHost) {
  let pending: ReorderRequest | null = null;
  const waiting = () => {
    if (pending && Date.now() - pending.at > REORDER_CONFIRM_MS) pending = null;
    return pending;
  };
  return {
    waiting,
    /** Waits for this request (an order the caller asked for itself), or for nothing. */
    expect(request: ReorderRequest | null) { pending = request; },
    step(value: ReorderKey, direction: -1 | 1, name: string, focus: -1 | 1 | "handle" = direction, quiet = false) {
      const result = host.disabled() ? null : reorderStep(host.order() as ReorderKey[] | undefined, value, direction);
      if (!result) return null;
      pending = { value, name, to: result.to, at: Date.now(), focus, quiet };
      // Cleared first, so the same sentence is read again when the same move is made twice.
      host.say("");
      host.change(result.order);
      return result;
    },
    /** The request this order confirms, announced unless it is quiet or `announce` is off; null when it confirms none. */
    confirm(order: readonly ReorderKey[] | undefined, announce = true) {
      const done = waiting();
      if (!done || !reorderConfirmed(order, done, Date.now())) return null;
      pending = null;
      if (announce && !done.quiet) host.say(host.moved(done.name, done.to + 1, order!.length));
      return done;
    },
  };
}
