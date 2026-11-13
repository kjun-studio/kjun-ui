import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { reorderPlaceAmong, reorderWarning, type ReorderMove } from "../../../shared/package-runtime/reorder";
import { createReorderSession, type ReorderSession } from "../../../shared/package-runtime/reorder-session";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import { KjunButton } from "./button";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
export type KjunListReorderControls = "buttons" | "handle" | "both";
/** A reorderable section's or table's order and its move actions, for the rows inside it; null outside one. */
export interface ReorderScope {
  order?: readonly ListChoiceValue[];
  /** The rows on screen when they are only part of the order (a table page, a search): a step past a hidden row is off. */
  shown?: ReadonlySet<ListChoiceValue>;
  disabled: boolean;
  controls: KjunListReorderControls;
  /** The row held by its handle, by a keyboard grab or a pointer drag. */
  grabbed: ListChoiceValue | null;
  /** Id of the text that says why moving is off. */
  noteId?: string;
  session: ReorderSession;
}
export const ReorderContext = createContext<ReorderScope | null>(null);

/** A row's move controls; the row draws them only when the section's order lists its value. */
export function ReorderControls({ value, name }: { value: ListChoiceValue; name: string }) {
  const reorder = useContext(ReorderContext), m = useKjunMessages();
  const place = reorder ? reorderPlaceAmong(reorder.order, value, reorder.shown) : null;
  if (!reorder || !place) return null;
  const { session, controls } = reorder, described = reorder.disabled ? reorder.noteId : undefined;
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"} data-reorder={direction}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)} aria-describedby={described}
      disabled={reorder.disabled || !place[direction]} onClick={() => session.press(value, direction === "up" ? -1 : 1, name)} />
  );
  return (
    <span className="kjun-list-reorder" data-reorder-index={place.index}>
      {/* The handle drags with a pointer; Enter, Space or a screen reader's press grabs the row and the arrows move it. */}
      {controls !== "buttons" && <KjunButton variant="ghost" size="sm" prefixIcon="grip-vertical" data-reorder="handle" ariaLabel={m.reorderHandle(name)}
        aria-pressed={reorder.grabbed === value} aria-describedby={described} disabled={reorder.disabled || place.total < 2}
        onPointerDown={event => session.pointerDown(event, value, name)} onKeyDown={event => session.key(event, value, name, event.currentTarget)}
        onKeyUp={() => session.keyUp()} onClick={event => session.click(event, value, name, event.currentTarget)} />}
      {controls !== "handle" && button("up")}{controls !== "handle" && button("down")}
    </span>
  );
}

/** The section's side: reports moves, announces them and keeps focus on the moved row's control. */
export function useReorder({ reorderable, order, shown, disabled, controls, noteId, list, selector, owner, onOrderChange, onReorder }: {
  reorderable: boolean; order?: readonly ListChoiceValue[]; shown?: ReadonlySet<ListChoiceValue>; disabled: boolean; controls: KjunListReorderControls; noteId?: string; list: HTMLElement | null;
  /** Where the movable rows' controls are inside list (a Table's rows rather than a list section's). */
  selector?: string;
  /** The root selector that owns those controls, so a table nested in a row keeps its own. */
  owner?: string;
  onOrderChange?: (order: ListChoiceValue[]) => void; onReorder?: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages();
  const [said, setSaid] = useState(""), [grabbed, setGrabbed] = useState<ListChoiceValue | null>(null);
  const latest = useRef({ order, disabled, list, onOrderChange, onReorder, m });
  latest.current = { order, disabled, list, onOrderChange, onReorder, m };
  const session = useMemo(() => createReorderSession({
    order: () => latest.current.order, disabled: () => latest.current.disabled, list: () => latest.current.list, controls: selector, owner,
    text: () => ({ moved: latest.current.m.reorderMoved, grabbed: latest.current.m.reorderGrabbed, dropped: latest.current.m.reorderDropped, cancelled: latest.current.m.reorderCancelled }),
    say: setSaid, grabbed: setGrabbed,
    change: next => latest.current.onOrderChange?.(next), moved: move => latest.current.onReorder?.(move),
  }), []);
  useEffect(() => {
    if (!reorderable) return;
    const warning = reorderWarning(order, "onOrderChange");
    if (warning) console.warn(warning);
  }, [reorderable, order]);
  // An order that shows the moved row at its new place confirms the move: it is announced, and focus follows the
  // row's control to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  useEffect(() => session.confirm(order), [order, list]);
  // Turned off, a held row is let go; turned on again, focus that could not follow a move goes to its row.
  useEffect(() => { if (!reorderable || disabled) session.reset(); else session.resume(); }, [reorderable, disabled]);
  useEffect(() => () => session.dispose(), []);
  const context = useMemo<ReorderScope | null>(() => reorderable ? { order, shown, disabled, controls, grabbed, noteId, session } : null,
    [reorderable, order, shown, disabled, controls, grabbed, noteId]);
  return { context, said };
}
