import { computed, onBeforeUnmount, provide, ref, watch, type InjectionKey, type VNodeChild } from "vue";
import { reorderWarning, type ReorderMove, type ReorderPlace } from "../../../shared/package-runtime/reorder";
import { createReorderSession, type ReorderSession } from "../../../shared/package-runtime/reorder-session";
import type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
import type { KjunMessages } from "../../../shared/package-runtime/messages/ko";
import { KjunButton } from "./button";
import { useKjunMessages } from "./runtime/messages";

export type KjunListReorderMove = ReorderMove<ListChoiceValue>;
export type KjunListReorderControls = "buttons" | "handle" | "both";
/** A reorderable section's or table's order and its move actions, for the rows inside it; null outside one. */
export interface ReorderScope {
  order?: readonly ListChoiceValue[];
  /** Like React: the rows on screen when they are only part of the order. */
  shown?: ReadonlySet<ListChoiceValue>;
  disabled: boolean;
  controls: KjunListReorderControls;
  /** The row held by its handle, by a keyboard grab or a pointer drag. */
  grabbed: ListChoiceValue | null;
  /** Id of the text that says why moving is off. */
  noteId?: string;
  session: ReorderSession;
}
export const kjunReorderKey: InjectionKey<{ readonly value: ReorderScope | null }> = Symbol("kjunReorder");

/** A row's move controls, drawn only when the section's order lists its value. */
export function renderReorderControls(reorder: ReorderScope, place: ReorderPlace, value: ListChoiceValue, name: string, m: KjunMessages): VNodeChild {
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
export function useReorder(options: {
  reorderable: () => boolean; order: () => readonly ListChoiceValue[] | undefined; disabled: () => boolean; controls: () => KjunListReorderControls;
  noteId: () => string | undefined; list: () => HTMLElement | null; shown?: () => ReadonlySet<ListChoiceValue> | undefined;
  /** Where the movable rows' controls are inside list (a Table's rows rather than a list section's). */
  selector?: string;
  /** The root selector that owns those controls, so a table nested in a row keeps its own. */
  owner?: string;
  onOrderChange: (order: ListChoiceValue[]) => void; onReorder: (move: KjunListReorderMove) => void;
}) {
  const m = useKjunMessages(), said = ref(""), grabbed = ref<ListChoiceValue | null>(null);
  const session = createReorderSession({
    order: options.order, disabled: options.disabled, list: options.list, controls: options.selector, owner: options.owner,
    text: () => ({ moved: m.value.reorderMoved, grabbed: m.value.reorderGrabbed, dropped: m.value.reorderDropped, cancelled: m.value.reorderCancelled }),
    say: text => { said.value = text; }, grabbed: value => { grabbed.value = value; },
    change: options.onOrderChange, moved: options.onReorder,
  });
  watch([options.reorderable, options.order], ([reorderable, order]) => {
    const warning = reorderable ? reorderWarning(order, "v-model:order") : null;
    if (warning) console.warn(warning);
  }, { immediate: true });
  // An order that shows the moved row at its new place confirms the move: it is announced, and focus follows the
  // row's control to where it now is. An order drawn again unchanged, or changed for another reason, does neither.
  watch(options.order, order => session.confirm(order), { flush: "post" });
  // Like React: turned off, a held row is let go; turned on again, focus that could not follow a move goes to its row.
  watch(() => !options.reorderable() || options.disabled(), off => { if (off) session.reset(); else session.resume(); }, { flush: "post" });
  onBeforeUnmount(() => session.dispose());
  const context = computed<ReorderScope | null>(() => options.reorderable()
    ? { order: options.order(), shown: options.shown?.(), disabled: options.disabled(), controls: options.controls(), grabbed: grabbed.value, noteId: options.noteId(), session } : null);
  provide(kjunReorderKey, context);
  return { said, context };
}
