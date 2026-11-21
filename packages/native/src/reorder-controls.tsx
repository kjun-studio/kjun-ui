import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { createReorderMoves, reorderPlaceAmong, reorderWarning, type ReorderMove } from "../../../shared/package-runtime/reorder";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import { KjunButton } from "./button";
import { KText } from "./internal";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
/** The reorderable section's order and its move action, for the rows inside it; null outside one. */
export interface ReorderScope {
  order?: readonly ListChoiceValue[];
  /** Like Web: the rows on screen when they are only part of the order. */
  shown?: ReadonlySet<ListChoiceValue>;
  disabled: boolean;
  /** Like Web: why moving is off, read with the move buttons (its id on Native Web, the text as a hint on devices). */
  note?: { id: string; text: string };
  move: (value: ListChoiceValue, step: -1 | 1, name: string) => void;
}
export const ReorderContext = createContext<ReorderScope | null>(null);

/** A row's up and down buttons; the row draws them only when the section's order lists its value. */
export function ReorderControls({ value, name }: { value: ListChoiceValue; name: string }) {
  const reorder = useContext(ReorderContext), m = useKjunMessages();
  const place = reorder ? reorderPlaceAmong(reorder.order, value, reorder.shown) : null;
  if (!reorder || !place) return null;
  const note = reorder.disabled ? reorder.note : undefined;
  const described = !note ? {} : Platform.OS === "web" ? { "aria-describedby": note.id } : { accessibilityHint: note.text };
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)} {...described}
      disabled={reorder.disabled || !place[direction]} onPress={() => reorder.move(value, direction === "up" ? -1 : 1, name)} />
  );
  return <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 0, gap: tokens.extensions.list.actionsGap }}>{button("up")}{button("down")}</View>;
}

/** The section's side: reports moves and announces them (a live region on Native Web, the screen reader on devices). */
export function useReorder({ reorderable, order, shown, disabled, note, onOrderChange, onReorder }: {
  reorderable: boolean; order?: readonly ListChoiceValue[]; shown?: ReadonlySet<ListChoiceValue>; disabled: boolean; note?: { id: string; text: string };
  onOrderChange?: (order: ListChoiceValue[]) => void; onReorder?: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages();
  const [said, setSaid] = useState("");
  const latest = useRef({ order, disabled, onOrderChange, onReorder, m });
  latest.current = { order, disabled, onOrderChange, onReorder, m };
  // The same request-and-confirm rules as Web: a move is announced once the app's order shows it.
  const moves = useMemo(() => createReorderMoves({
    order: () => latest.current.order, disabled: () => latest.current.disabled,
    moved: (name, position, total) => latest.current.m.reorderMoved(name, position, total),
    say: text => { if (Platform.OS === "web") setSaid(text); else if (text) AccessibilityInfo.announceForAccessibility(text); },
    change: next => latest.current.onOrderChange?.(next),
  }), []);
  useEffect(() => {
    const warning = reorderable ? reorderWarning(order, "onOrderChange") : null;
    if (warning) console.warn(warning);
  }, [reorderable, order]);
  useEffect(() => { moves.confirm(order); }, [order]);
  useEffect(() => { if (!reorderable || disabled) moves.expect(null); }, [reorderable, disabled]);
  const context = useMemo<ReorderScope | null>(() => reorderable ? {
    order, shown, disabled, note,
    move: (value, step, name) => {
      const result = moves.step(value, step, name);
      if (result) latest.current.onReorder?.(result);
    },
  } : null, [reorderable, order, shown, disabled, note?.id, note?.text]);
  // Native Web has no announce call, so the move is spoken from a polite live region that takes no room.
  const status = reorderable && Platform.OS === "web"
    ? <View role="status" style={{ pointerEvents: "none", position: "absolute", opacity: 0 }}><KText>{said}</KText></View> : null;
  return { context, status };
}
