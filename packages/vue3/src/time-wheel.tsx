import { wheelCopies, wheelHome, wheelItemAt, wheelKey, wheelRow, type WheelColumn, type WheelColumnKey } from "../../../shared/package-runtime/time-wheel";
import { tokens } from "@kjun-ui/tokens";
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { useReducedMotion } from "./runtime/presence";

// The Vue form of React's TimeWheel (packages/react/src/time-wheel.tsx).
const rowHeight = tokens.extensions.timePicker.wheelRowHeight;
// The idle time after the last scroll event that counts as stopped (browsers without scrollend, and the snap's own settle).
const settleDelay = 120;
// The longest a smooth scroll of the column's own may take before a stop counts again.
const travelLimit = 1000;

/** One scrolling column: a spinbutton whose rows snap to the band in the middle. */
const WheelColumnView = defineComponent({
  name: "KjunTimeWheelColumn",
  props: {
    column: { type: Object as PropType<WheelColumn>, required: true },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    autoFocus: { type: Boolean, default: false },
    onPick: { type: Function as PropType<(value: number) => void>, required: true },
    onEnter: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const scroller = ref<HTMLElement | null>(null), reduced = useReducedMotion();
    let held = false, timer: ReturnType<typeof setTimeout> | undefined, mounted = false;
    // Where the column itself is scrolling to: its own scroll events are no stop of the user's (cleared by a wheel or a touch).
    let travel: { top: number; until: number } | null = null;
    const go = (element: HTMLElement, top: number, smooth: boolean) => {
      travel = { top, until: Date.now() + travelLimit };
      element.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
    };
    // Brings the draft's item to the band: at once on the first draw, otherwise the short way round.
    const place = () => {
      const element = scroller.value;
      if (!element) return;
      const current = mounted ? element.scrollTop / rowHeight : null;
      const row = wheelRow(props.column, props.column.index, current === null ? null : Math.round(current));
      if (current === null || Math.abs(current - row) > 0.01) go(element, row * rowHeight, mounted && !reduced.value);
      mounted = true;
    };
    onMounted(() => { place(); if (props.autoFocus) scroller.value?.focus({ preventScroll: true }); });
    watch(() => [props.column.index, props.column.items.length, props.column.loop], () => nextTick(place));
    // After the render, so a panel reopening during its exit is no longer inert when the column takes focus.
    watch(() => props.autoFocus, focus => { if (focus) scroller.value?.focus({ preventScroll: true }); }, { flush: "post" });
    onBeforeUnmount(() => clearTimeout(timer));
    const settle = () => {
      const element = scroller.value, column = props.column;
      if (!element || held) return;
      const goal = travel;
      if (goal && Math.abs(element.scrollTop - goal.top) > 1 && Date.now() < goal.until) { later(); return; }
      travel = null;
      const row = Math.round(element.scrollTop / rowHeight), home = wheelHome(column, row);
      // A looping column comes back to its middle copy unseen, so it never reaches an end.
      if (home !== row) go(element, home * rowHeight, false);
      if (goal) return;
      const stopped = wheelItemAt(column, row);
      if (stopped.value !== column.items[column.index].value) props.onPick(stopped.value);
      // A stop between rows (a slow drag without snap support) settles on the row.
      else if (Math.abs(element.scrollTop - home * rowHeight) > 1) go(element, home * rowHeight, !reduced.value);
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(settle, settleDelay); };
    const release = () => { held = false; later(); };
    const keydown = (event: KeyboardEvent) => {
      const target = event.currentTarget as HTMLElement;
      if (event.key === "Enter" && props.onEnter) { event.preventDefault(); props.onEnter(); return; }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const columns = Array.from(target.closest(".kjun-time-wheel")?.querySelectorAll<HTMLElement>(".kjun-time-wheel-scroll") ?? []);
        const next = columns[columns.indexOf(target) + (event.key === "ArrowRight" ? 1 : -1)];
        if (next) { event.preventDefault(); next.focus({ preventScroll: true }); }
        return;
      }
      if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (props.disabled || props.readOnly) return;
      const value = wheelKey(props.column, event.key);
      if (value !== null) props.onPick(value);
    };
    return () => {
      const { column } = props, item = column.items[column.index], locked = props.disabled || props.readOnly;
      return (
        <div class="kjun-time-wheel-column" data-key={column.key}>
          <div ref={scroller} class="kjun-time-wheel-scroll" role="spinbutton" tabindex={props.disabled ? -1 : 0}
            aria-label={column.label} aria-valuenow={item.value} aria-valuetext={item.label}
            aria-disabled={props.disabled || undefined} aria-readonly={props.readOnly || undefined} data-locked={locked || undefined}
            onScroll={later}
            onWheel={() => { travel = null; }}
            onPointerdown={(event: PointerEvent) => { travel = null; if (event.pointerType !== "mouse") held = true; }}
            onTouchstart={() => { travel = null; held = true; }} onTouchend={release}
            onPointerup={() => { if (held) release(); }} onPointercancel={release}
            onKeydown={keydown}>
            {Array.from({ length: wheelCopies(column) }, (_, copy) => column.items.map((entry, index) => (
              <div key={copy + ":" + entry.value} class="kjun-time-wheel-row" aria-hidden="true"
                data-selected={index === column.index || undefined} data-disabled={entry.disabled || undefined}
                onClick={() => { if (!locked && entry.value !== item.value) props.onPick(entry.value); }}>{entry.label}</div>
            )))}
          </div>
        </div>
      );
    };
  },
});

/** The hour, minute (and second, AM/PM) columns over one band that marks the chosen time. */
export const TimeWheel = defineComponent({
  name: "KjunTimeWheel",
  props: {
    columns: { type: Array as PropType<WheelColumn[]>, required: true },
    label: { type: String, required: true },
    labelledBy: { type: String, default: undefined },
    /** Inline wheels sit on the page: a field fill with a surface band. */
    inline: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    /** The column to focus when the wheel appears. */
    focusColumn: { type: Number as PropType<number | null>, default: null },
    onPick: { type: Function as PropType<(key: WheelColumnKey, value: number) => void>, required: true },
    onEnter: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    return () => (
      <div class="kjun-time-wheel" role="group" aria-label={props.labelledBy ? undefined : props.label} aria-labelledby={props.labelledBy}
        data-inline={props.inline || undefined} data-disabled={props.disabled || undefined}>
        <div class="kjun-time-wheel-band" aria-hidden="true" />
        {props.columns.map((column, index) => <WheelColumnView key={column.key} column={column} disabled={props.disabled} readOnly={props.readOnly}
          autoFocus={props.focusColumn === index} onPick={(value: number) => props.onPick(column.key, value)} onEnter={props.onEnter} />)}
      </div>
    );
  },
});
