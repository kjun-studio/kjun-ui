import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { reorderDuplicates, reorderPlace, type ReorderMove } from "../../../shared/package-runtime/reorder";
import { createReorderSession, type ReorderSession } from "../../../shared/package-runtime/reorder-session";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import { KjunButton } from "./button";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
export type KjunListReorderControls = "buttons" | "handle" | "both";
/** The reorderable section's order and its move actions, for the rows inside it; null outside one. */
export interface ListReorder {
  order?: readonly ListChoiceValue[];
  disabled: boolean;
  controls: KjunListReorderControls;
  /** The row held by its handle, by a keyboard grab or a pointer drag. */
  grabbed: ListChoiceValue | null;
  /** Id of the text that says why moving is off. */
  noteId?: string;
  session: ReorderSession;
}
export const ListReorderContext = createContext<ListReorder | null>(null);

/** A row's move controls; the row draws them only when the section's order lists its value. */
export function ListReorderControls({ value, name }: { value: ListChoiceValue; name: string }) {
  const reorder = useContext(ListReorderContext), m = useKjunMessages();
  const place = reorder ? reorderPlace(reorder.order, value) : null;
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
export function useListReorder({ reorderable, order, disabled, controls, noteId, list, onOrderChange, onReorder }: {
  reorderable: boolean; order?: readonly ListChoiceValue[]; disabled: boolean; controls: KjunListReorderControls; noteId?: string; list: HTMLElement | null;
  onOrderChange?: (order: ListChoiceValue[]) => void; onReorder?: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages();
  const [said, setSaid] = useState(""), [grabbed, setGrabbed] = useState<ListChoiceValue | null>(null);
  const latest = useRef({ order, disabled, list, onOrderChange, onReorder, m });
  latest.current = { order, disabled, list, onOrderChange, onReorder, m };
  const session = useMemo(() => createReorderSession({
    order: () => latest.current.order, disabled: () => latest.current.disabled, list: () => latest.current.list,
    text: () => ({ moved: latest.current.m.reorderMoved, grabbed: latest.current.m.reorderGrabbed, dropped: latest.current.m.reorderDropped, cancelled: latest.current.m.reorderCancelled }),
    say: setSaid, grabbed: setGrabbed,
    change: next => latest.current.onOrderChange?.(next), moved: move => latest.current.onReorder?.(move),
  }), []);
  useEffect(() => {
    if (!reorderable) return;
    if (!order) console.warn("KJUN ListSection: reorderable needs `order` (the row values in the order shown) and onOrderChange.");
    else if (reorderDuplicates(order)) console.warn("KJUN ListSection: `order` lists a value twice; rows that share a value share one place.");
  }, [reorderable, order]);
  // An order that shows the moved row at its new place confirms the move: it is announced, and focus follows the
  // row's control to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  useEffect(() => session.confirm(order), [order, list]);
  useEffect(() => { if (!reorderable || disabled) session.reset(); }, [reorderable, disabled]);
  useEffect(() => () => session.dispose(), []);
  const context = useMemo<ListReorder | null>(() => reorderable ? { order, disabled, controls, grabbed, noteId, session } : null,
    [reorderable, order, disabled, controls, grabbed, noteId]);
  return { context, said };
}
