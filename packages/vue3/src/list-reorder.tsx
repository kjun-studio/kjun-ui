import { computed, onBeforeUnmount, provide, ref, watch, type InjectionKey, type VNodeChild } from "vue";
import { reorderDuplicates, type ReorderMove, type ReorderPlace } from "../../../shared/package-runtime/reorder";
import { createReorderSession, type ReorderSession } from "../../../shared/package-runtime/reorder-session";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import type { KjunMessages } from "../../../shared/package-runtime/messages/ko";
import { KjunButton } from "./button";
import { useKjunMessages } from "./runtime/messages";

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
export const kjunListReorderKey: InjectionKey<{ readonly value: ListReorder | null }> = Symbol("kjunListReorder");

/** A row's move controls, drawn only when the section's order lists its value. */
export function listReorderControls(reorder: ListReorder, place: ReorderPlace, value: ListChoiceValue, name: string, m: KjunMessages): VNodeChild {
  const { session, controls } = reorder, described = reorder.disabled ? reorder.noteId : undefined;
  const button = (direction: "up" | "down") => (
    <KjunButton variant="ghost" size="sm" prefixIcon={direction === "up" ? "chevron-up" : "chevron-down"} data-reorder={direction}
      ariaLabel={direction === "up" ? m.moveUp(name) : m.moveDown(name)} aria-describedby={described}
      disabled={reorder.disabled || !place[direction]} onClick={() => session.press(value, direction === "up" ? -1 : 1, name)} />
  );
  return (
    <span class="kjun-list-reorder" data-reorder-index={place.index}>
      {/* The handle drags with a pointer; Enter, Space or a screen reader's press grabs the row and the arrows move it. */}
      {controls !== "buttons" && <KjunButton variant="ghost" size="sm" prefixIcon="grip-vertical" data-reorder="handle" ariaLabel={m.reorderHandle(name)}
        aria-describedby={described} disabled={reorder.disabled || place.total < 2}
        // The button passes attributes it does not declare to its root element.
        {...({ "aria-pressed": reorder.grabbed === value,
          onPointerdown: (event: PointerEvent) => session.pointerDown(event, value, name),
          onKeydown: (event: KeyboardEvent) => session.key(event, value, name, event.currentTarget as Element),
          onKeyup: () => session.keyUp() } as Record<string, unknown>)}
        onClick={(event: MouseEvent) => session.click(event, value, name, event.currentTarget as Element)} />}
      {controls !== "handle" && button("up")}{controls !== "handle" && button("down")}
    </span>
  );
}

/** The section's side: reports moves, announces them and keeps focus on the moved row's control. */
export function useListReorder(options: {
  reorderable: () => boolean; order: () => readonly ListChoiceValue[] | undefined; disabled: () => boolean; controls: () => KjunListReorderControls;
  noteId: () => string | undefined; list: () => HTMLElement | null;
  onOrderChange: (order: ListChoiceValue[]) => void; onReorder: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages(), said = ref(""), grabbed = ref<ListChoiceValue | null>(null);
  const session = createReorderSession({
    order: options.order, disabled: options.disabled, list: options.list,
    text: () => ({ moved: m.value.reorderMoved, grabbed: m.value.reorderGrabbed, dropped: m.value.reorderDropped, cancelled: m.value.reorderCancelled }),
    say: text => { said.value = text; }, grabbed: value => { grabbed.value = value; },
    change: options.onOrderChange, moved: options.onReorder,
  });
  watch([options.reorderable, options.order], ([reorderable, order]) => {
    if (!reorderable) return;
    if (!order) console.warn("KJUN ListSection: reorderable needs `order` (the row values in the order shown) and v-model:order.");
    else if (reorderDuplicates(order)) console.warn("KJUN ListSection: `order` lists a value twice; rows that share a value share one place.");
  }, { immediate: true });
  // An order that shows the moved row at its new place confirms the move: it is announced, and focus follows the
  // row's control to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  watch(options.order, order => session.confirm(order), { flush: "post" });
  watch(() => !options.reorderable() || options.disabled(), off => { if (off) session.reset(); });
  onBeforeUnmount(() => session.dispose());
  provide(kjunListReorderKey, computed<ListReorder | null>(() => options.reorderable()
    ? { order: options.order(), disabled: options.disabled(), controls: options.controls(), grabbed: grabbed.value, noteId: options.noteId(), session } : null));
  return { said };
}
