import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { reorderConfirmed, reorderDuplicates, reorderPlace, reorderStep, type ReorderMove, type ReorderPending } from "../../../shared/package-runtime/reorder";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import { KjunButton } from "./button";
import { KText } from "./internal";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
/** The reorderable section's order and its move action, for the rows inside it; null outside one. */
export interface ListReorder {
  order?: readonly ListChoiceValue[];
  disabled: boolean;
  move: (value: ListChoiceValue, step: -1 | 1, name: string) => void;
}
export const ListReorderContext = createContext<ListReorder | null>(null);

/** A row's up and down buttons; the row draws them only when the section's order lists its value. */
export function ListReorderControls({ value, name }: { value: ListChoiceValue; name: string }) {
  const reorder = useContext(ListReorderContext), m = useKjunMessages();
  const place = reorder ? reorderPlace(reorder.order, value) : null;
  if (!reorder || !place) return null;
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)}
      disabled={reorder.disabled || !place[direction]} onPress={() => reorder.move(value, direction === "up" ? -1 : 1, name)} />
  );
  return <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 0, gap: tokens.extensions.list.actionsGap }}>{button("up")}{button("down")}</View>;
}

/** The section's side: reports moves and announces them (a live region on Native Web, the screen reader on devices). */
export function useListReorder({ reorderable, order, disabled, onOrderChange, onReorder }: {
  reorderable: boolean; order?: readonly ListChoiceValue[]; disabled: boolean;
  onOrderChange?: (order: ListChoiceValue[]) => void; onReorder?: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages();
  const [said, setSaid] = useState("");
  const latest = useRef({ order, disabled, onOrderChange, onReorder, m });
  latest.current = { order, disabled, onOrderChange, onReorder, m };
  // The pressed move, until the app applies its order: only then is it announced.
  const pending = useRef<(ReorderPending & { name: string }) | null>(null);
  useEffect(() => {
    if (!reorderable) return;
    if (!order) console.warn("KJUN ListSection: reorderable needs `order` (the row values in the order shown) and onOrderChange.");
    else if (reorderDuplicates(order)) console.warn("KJUN ListSection: `order` lists a value twice; rows that share a value share one place.");
  }, [reorderable, order]);
  useEffect(() => {
    const moved = pending.current;
    if (!moved || !reorderConfirmed(order, moved, Date.now())) return;
    pending.current = null;
    const text = latest.current.m.reorderMoved(moved.name, moved.to + 1, order!.length);
    if (Platform.OS === "web") setSaid(text);
    else AccessibilityInfo.announceForAccessibility(text);
  }, [order]);
  useEffect(() => { if (!reorderable || disabled) pending.current = null; }, [reorderable, disabled]);
  const context = useMemo<ListReorder | null>(() => reorderable ? {
    order, disabled,
    move: (value, step, name) => {
      const now = latest.current, result = now.disabled ? null : reorderStep(now.order as ListChoiceValue[] | undefined, value, step);
      if (!result) return;
      pending.current = { value, name, to: result.to, at: Date.now() };
      // Cleared first, so the same sentence is read again when the same move is made twice.
      if (Platform.OS === "web") setSaid("");
      now.onOrderChange?.(result.order);
      now.onReorder?.(result);
    },
  } : null, [reorderable, order, disabled]);
  // Native Web has no announce call, so the move is spoken from a polite live region that takes no room.
  const status = reorderable && Platform.OS === "web"
    ? <View role="status" pointerEvents="none" style={{ position: "absolute", opacity: 0 }}><KText>{said}</KText></View> : null;
  return { context, status };
}
