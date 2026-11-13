// The web side of reordering a list by hand, shared by the React and Vue list sections: button presses, a handle that
// is grabbed with the keyboard or dragged with a pointer, and what happens once the app applies each new order.
// The app owns the order, so every move is a request; announcing and focusing wait for the order that confirms it.
import {
  REORDER_CONFIRM_MS, reorderConfirmed, reorderDragStep, reorderFocus, reorderKeyAction, reorderMove, reorderPlace, reorderStep,
  type ReorderKey, type ReorderMove, type ReorderPending,
} from "./reorder";

export interface ReorderHost {
  order: () => readonly ReorderKey[] | undefined;
  disabled: () => boolean;
  /** The section's list element. */
  list: () => HTMLElement | null;
  /** Selects the movable rows' control groups inside list(); a list section's own rows by default. */
  controls?: string;
  text: () => {
    moved: (name: string, position: number, total: number) => string;
    grabbed: (name: string) => string;
    dropped: (name: string, position: number, total: number) => string;
    cancelled: (name: string) => string;
  };
  /** Sets the live region's text. */
  say: (text: string) => void;
  /** The row whose handle holds it (keyboard grab or pointer drag), or null. */
  grabbed: (value: ReorderKey | null) => void;
  /** Asks the app for this order. */
  change: (order: ReorderKey[]) => void;
  /** A finished move: one button press, or a whole grab or drag from where it started to where it ended. */
  moved: (move: ReorderMove) => void;
}
interface KeyEvent { key: string; repeat?: boolean; preventDefault: () => void }
interface PressEvent { pointerId: number; button: number; clientY: number; preventDefault: () => void }

// A section's own movable rows; a list nested inside a row is another section's business.
const listControls = ":scope > .kjun-list-row > .kjun-list-actions > [data-reorder-index]";
/** How long a drop waits for the app to apply the last step before it reports the order as it stands. */
const DROP_WAIT_MS = 1500;

export function createReorderSession(host: ReorderHost) {
  const controls = host.controls ?? listControls;
  // The requested step, until an order shows the row there. `focus` is where focus goes then; `quiet` skips the sentence.
  let pending: (ReorderPending & { name: string; focus: -1 | 1 | "handle"; quiet: boolean }) | null = null;
  // A row held by its handle: `pointer` is the dragging pointer's id, or null for a keyboard grab. `dropping` is a
  // drop that waits for the last step to be applied.
  let session: { value: ReorderKey; name: string; from: number; pointer: number | null; dropping?: ReturnType<typeof setTimeout> } | null = null;
  let unbind: (() => void) | null = null, pointerY = 0;
  // A grab or drop made by a key press: the click that some browsers send for the same press is not a second one.
  let keyPress = false, skipClick = false;

  // A step the app never applied stops waiting after a while, so it cannot block the next one.
  const waiting = () => {
    if (pending && Date.now() - pending.at > REORDER_CONFIRM_MS) pending = null;
    return pending;
  };
  const step = (value: ReorderKey, direction: -1 | 1, name: string, focus: -1 | 1 | "handle", quiet = false) => {
    const result = host.disabled() ? null : reorderStep(host.order() as ReorderKey[] | undefined, value, direction);
    if (!result) return null;
    pending = { value, name, to: result.to, at: Date.now(), focus, quiet };
    // Cleared first, so the same sentence is read again when the same move is made twice.
    host.say("");
    host.change(result.order);
    return result;
  };
  const release = () => {
    unbind?.();
    unbind = null;
    if (session?.dropping) clearTimeout(session.dropping);
    session = null;
    host.grabbed(null);
  };
  // Reports the whole grab or drag: from where it started to where the row now is.
  const drop = () => {
    const held = session;
    if (!held) return;
    release();
    const order = host.order() ?? [], place = reorderPlace(order, held.value);
    if (place && place.index !== held.from) host.moved({ value: held.value, from: held.from, to: place.index, order: order.slice() });
    if (place) host.say(host.text().dropped(held.name, place.index + 1, place.total));
  };
  const end = (how: "drop" | "cancel") => {
    const held = session;
    if (!held || held.dropping) return;
    if (how === "drop") {
      // A step still on its way to the app is part of this move: the drop waits for it, but not for ever.
      if (!waiting()) return drop();
      unbind?.();
      unbind = null;
      held.dropping = setTimeout(() => { pending = null; drop(); }, DROP_WAIT_MS);
      return;
    }
    const inFlight = !!waiting();
    release();
    // Back to where the grab started. Only this row is put back, so a change the app made meanwhile stays.
    const order = host.order() ?? [], place = reorderPlace(order, held.value);
    const target = Math.min(held.from, order.length - 1), back = place && (place.index !== target || inFlight);
    pending = back ? { value: held.value, name: held.name, to: target, at: Date.now(), focus: "handle", quiet: true } : null;
    if (back) host.change(reorderMove(order as ReorderKey[], place.index, target).slice());
    host.say(host.text().cancelled(held.name));
  };
  // The movable rows' boxes in order, and the place among them of the row at an order index.
  const rows = (index: number) => {
    const marks = Array.from(host.list()?.querySelectorAll<HTMLElement>(controls) ?? [])
      .sort((a, b) => Number(a.dataset.reorderIndex) - Number(b.dataset.reorderIndex));
    const boxes = marks.map(mark => (mark.closest(".kjun-list-row") ?? mark).getBoundingClientRect());
    return { boxes, at: marks.findIndex(mark => Number(mark.dataset.reorderIndex) === index) };
  };
  // One step toward the pointer; the next waits for the app to apply this one.
  const advance = () => {
    const place = session && !session.dropping && !waiting() ? reorderPlace(host.order(), session.value) : null;
    if (!session || !place) return;
    const { boxes, at } = rows(place.index), direction = reorderDragStep(pointerY, boxes, at);
    if (direction) step(session.value, direction, session.name, "handle", true);
  };
  const listen = (doc: Document, handlers: Record<string, (event: any) => void>) => {
    for (const [type, handler] of Object.entries(handlers)) doc.addEventListener(type, handler, true);
    unbind = () => { for (const [type, handler] of Object.entries(handlers)) doc.removeEventListener(type, handler, true); };
  };
  const hold = (value: ReorderKey, name: string, pointer: number | null) => {
    const place = reorderPlace(host.order(), value);
    // A row already held (another handle's grab) is dropped where it is first.
    if (session) end("drop");
    if (!place || session) return false;
    pending = null;
    session = { value, name, from: place.index, pointer };
    host.grabbed(value);
    return true;
  };
  const grab = (value: ReorderKey, name: string, target?: Element | null) => {
    const doc = host.list()?.ownerDocument;
    if (!doc || !hold(value, name, null)) return;
    host.say(host.text().grabbed(name));
    // A press anywhere else drops the row where it is.
    listen(doc, { pointerdown: (press: Event) => { if (press.target !== target && !target?.contains(press.target as Node)) end("drop"); } });
  };
  const heldByKey = (value: ReorderKey) => session?.value === value && session.pointer === null;

  return {
    /** An up or down button: one step, one finished move. */
    press(value: ReorderKey, direction: -1 | 1, name: string) {
      const result = step(value, direction, name, direction);
      if (result) host.moved(result);
    },
    /** A key on a row's handle. */
    key(event: KeyEvent, value: ReorderKey, name: string, target?: Element | null) {
      const action = host.disabled() ? null : reorderKeyAction(event.key, heldByKey(value));
      if (!action) return;
      if (action === "leave") return end("drop");
      event.preventDefault();
      if (action === "up" || action === "down") return void step(value, action === "up" ? -1 : 1, name, "handle");
      if (action === "cancel") return end("cancel");
      // A held key repeats: one press grabs or drops once.
      if (event.repeat) return;
      keyPress = true;
      if (action === "grab") grab(value, name, target);
      else end("drop");
    },
    /** The key press that grabbed or dropped is over; the click a browser may still send for it is ignored. */
    keyUp() {
      if (!keyPress) return;
      keyPress = false;
      skipClick = true;
      setTimeout(() => { skipClick = false; }, 0);
    },
    /** A click without a pointer (a screen reader's press): grabs the row, or drops it when it is held. */
    click(event: { detail: number }, value: ReorderKey, name: string, target?: Element | null) {
      if (skipClick || keyPress || event.detail !== 0 || host.disabled()) return;
      if (heldByKey(value)) end("drop");
      else grab(value, name, target);
    },
    /** A pointer pressing a row's handle starts a drag; the row steps as the pointer passes its neighbours. */
    pointerDown(event: PressEvent, value: ReorderKey, name: string) {
      const doc = host.list()?.ownerDocument;
      if (host.disabled() || event.button !== 0 || !doc || session?.pointer != null || !hold(value, name, event.pointerId)) return;
      // No text selection while dragging.
      event.preventDefault();
      pointerY = event.clientY;
      // Document listeners rather than pointer capture: the row's elements are moved in the DOM as it steps.
      const mine = (pointer: PointerEvent) => pointer.pointerId === session?.pointer;
      listen(doc, {
        pointermove: (pointer: PointerEvent) => { if (mine(pointer)) { pointerY = pointer.clientY; advance(); } },
        pointerup: (pointer: PointerEvent) => { if (mine(pointer)) end("drop"); },
        pointercancel: (pointer: PointerEvent) => { if (mine(pointer)) end("cancel"); },
        keydown: (key: KeyboardEvent) => { if (key.key === "Escape") { key.preventDefault(); end("cancel"); } },
      });
    },
    /** Called once the DOM shows an order: confirms the pending step, if this order is it. */
    confirm(order: readonly ReorderKey[] | undefined) {
      const done = waiting();
      if (!done || !reorderConfirmed(order, done, Date.now())) return;
      pending = null;
      // The step a drop was waiting for has arrived.
      if (session?.dropping) return drop();
      if (!done.quiet) host.say(host.text().moved(done.name, done.to + 1, order!.length));
      // During a pointer drag focus stays where it is, and the pointer may already be past the next row.
      if (session && session.pointer !== null) return advance();
      const which = done.focus === "handle" ? "handle" : reorderFocus(order, done.value, done.focus);
      if (which) host.list()?.querySelector<HTMLElement>(`${controls.replace("]", `="${done.to}"]`)} [data-reorder="${which}"]`)?.focus();
    },
    /** Moving was turned off: a held row goes back to where it started, and nothing is pending. */
    reset() {
      if (session) end("cancel");
      pending = null;
    },
    dispose() {
      pending = null;
      if (session) release();
    },
  };
}
export type ReorderSession = ReturnType<typeof createReorderSession>;
