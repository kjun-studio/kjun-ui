import { computed, provide, ref, watch, type InjectionKey, type VNodeChild } from "vue";
import { reorderConfirmed, reorderDuplicates, reorderFocus, reorderStep, type ReorderMove, type ReorderPending, type ReorderPlace } from "../../../shared/package-runtime/reorder";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import type { KjunMessages } from "../../../shared/package-runtime/messages/ko";
import { KjunButton } from "./button";
import { useKjunMessages } from "./runtime/messages";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
/** The reorderable section's order and its move action, for the rows inside it; null outside one. */
export interface ListReorder {
  order?: readonly ListChoiceValue[];
  disabled: boolean;
  /** Id of the text that says why moving is off. */
  noteId?: string;
  move: (value: ListChoiceValue, step: -1 | 1, name: string) => void;
}
export const kjunListReorderKey: InjectionKey<{ readonly value: ListReorder | null }> = Symbol("kjunListReorder");

/** A row's up and down buttons, drawn only when the section's order lists its value. */
export function listReorderControls(reorder: ListReorder, place: ReorderPlace, value: ListChoiceValue, name: string, m: KjunMessages): VNodeChild {
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"} data-reorder={direction}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)} aria-describedby={reorder.disabled ? reorder.noteId : undefined}
      disabled={reorder.disabled || !place[direction]} onClick={() => reorder.move(value, direction === "up" ? -1 : 1, name)} />
  );
  return <span class="kjun-list-reorder" data-reorder-index={place.index}>{button("up")}{button("down")}</span>;
}

/** The section's side: reports moves, announces them and keeps focus on the moved row's button. */
export function useListReorder(options: {
  reorderable: () => boolean; order: () => readonly ListChoiceValue[] | undefined; disabled: () => boolean; noteId: () => string | undefined;
  list: () => HTMLElement | null; onOrderChange: (order: ListChoiceValue[]) => void; onReorder: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages(), said = ref("");
  // The pressed move, until the app applies its order: only then is it announced and focus moved.
  let pending: (ReorderPending & { step: -1 | 1; name: string }) | null = null;
  watch([options.reorderable, options.order], ([reorderable, order]) => {
    if (!reorderable) return;
    if (!order) console.warn("KJUN ListSection: reorderable needs `order` (the row values in the order shown) and v-model:order.");
    else if (reorderDuplicates(order)) console.warn("KJUN ListSection: `order` lists a value twice; rows that share a value share one place.");
  }, { immediate: true });
  // An order that shows the pressed row at its new place confirms the move: it is announced, and focus follows the
  // row's button to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  watch(options.order, order => {
    const moved = pending, list = options.list();
    if (!moved || !reorderConfirmed(order, moved, Date.now())) return;
    pending = null;
    said.value = m.value.reorderMoved(moved.name, moved.to + 1, order!.length);
    const which = reorderFocus(order, moved.value, moved.step);
    if (list && which) list.querySelector<HTMLElement>(`:scope > .kjun-list-row > .kjun-list-actions > [data-reorder-index="${moved.to}"] [data-reorder="${which}"]`)?.focus();
  }, { flush: "post" });
  watch(() => !options.reorderable() || options.disabled(), off => { if (off) pending = null; });
  provide(kjunListReorderKey, computed<ListReorder | null>(() => options.reorderable() ? {
    order: options.order(), disabled: options.disabled(), noteId: options.noteId(),
    move: (value, step, name) => {
      const result = options.disabled() ? null : reorderStep(options.order() as ListChoiceValue[] | undefined, value, step);
      if (!result) return;
      pending = { value, step, name, to: result.to, at: Date.now() };
      // Cleared first, so the same sentence is read again when the same move is made twice.
      said.value = "";
      options.onOrderChange(result.order);
      options.onReorder(result);
    },
  } : null));
  return { said };
}
