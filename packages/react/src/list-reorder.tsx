import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { reorderConfirmed, reorderDuplicates, reorderFocus, reorderPlace, reorderStep, type ReorderMove, type ReorderPending } from "../../../shared/package-runtime/reorder";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import { KjunButton } from "./button";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
/** The reorderable section's order and its move action, for the rows inside it; null outside one. */
export interface ListReorder {
  order?: readonly ListChoiceValue[];
  disabled: boolean;
  /** Id of the text that says why moving is off. */
  noteId?: string;
  move: (value: ListChoiceValue, step: -1 | 1, name: string) => void;
}
export const ListReorderContext = createContext<ListReorder | null>(null);

/** A row's up and down buttons; the row draws them only when the section's order lists its value. */
export function ListReorderControls({ value, name }: { value: ListChoiceValue; name: string }) {
  const reorder = useContext(ListReorderContext), m = useKjunMessages();
  const place = reorder ? reorderPlace(reorder.order, value) : null;
  if (!reorder || !place) return null;
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"} data-reorder={direction}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)} aria-describedby={reorder.disabled ? reorder.noteId : undefined}
      disabled={reorder.disabled || !place[direction]} onClick={() => reorder.move(value, direction === "up" ? -1 : 1, name)} />
  );
  return <span className="kjun-list-reorder" data-reorder-index={place.index}>{button("up")}{button("down")}</span>;
}

/** The section's side: reports moves, announces them and keeps focus on the moved row's button. */
export function useListReorder({ reorderable, order, disabled, noteId, list, onOrderChange, onReorder }: {
  reorderable: boolean; order?: readonly ListChoiceValue[]; disabled: boolean; noteId?: string; list: HTMLElement | null;
  onOrderChange?: (order: ListChoiceValue[]) => void; onReorder?: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages();
  const [said, setSaid] = useState("");
  // The pressed move, until the app applies its order: only then is it announced and focus moved.
  const pending = useRef<(ReorderPending & { step: -1 | 1; name: string }) | null>(null);
  const latest = useRef({ order, disabled, onOrderChange, onReorder, m });
  latest.current = { order, disabled, onOrderChange, onReorder, m };
  useEffect(() => {
    if (!reorderable) return;
    if (!order) console.warn("KJUN ListSection: reorderable needs `order` (the row values in the order shown) and onOrderChange.");
    else if (reorderDuplicates(order)) console.warn("KJUN ListSection: `order` lists a value twice; rows that share a value share one place.");
  }, [reorderable, order]);
  // An order that shows the pressed row at its new place confirms the move: it is announced, and focus follows the
  // row's button to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  useEffect(() => {
    const moved = pending.current;
    if (!moved || !reorderConfirmed(order, moved, Date.now())) return;
    pending.current = null;
    setSaid(latest.current.m.reorderMoved(moved.name, moved.to + 1, order!.length));
    const which = reorderFocus(order, moved.value, moved.step);
    if (list && which) list.querySelector<HTMLElement>(`:scope > .kjun-list-row > .kjun-list-actions > [data-reorder-index="${moved.to}"] [data-reorder="${which}"]`)?.focus();
  }, [order, list]);
  useEffect(() => { if (!reorderable || disabled) pending.current = null; }, [reorderable, disabled]);
  const context = useMemo<ListReorder | null>(() => reorderable ? {
    order, disabled, noteId,
    move: (value, step, name) => {
      const now = latest.current, result = now.disabled ? null : reorderStep(now.order as ListChoiceValue[] | undefined, value, step);
      if (!result) return;
      pending.current = { value, step, name, to: result.to, at: Date.now() };
      // Cleared first, so the same sentence is read again when the same move is made twice.
      setSaid("");
      now.onOrderChange?.(result.order);
      now.onReorder?.(result);
    },
  } : null, [reorderable, order, disabled, noteId]);
  return { context, said };
}
