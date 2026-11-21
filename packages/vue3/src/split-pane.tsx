import { onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import {
  splitClamp, splitCollapseAt, splitDrag, splitFoldedPx, splitKeyAction, splitKeyCollapse, splitKeyHeld, splitKeyTarget, splitLimits,
  splitPercent, splitReport, splitWanted, splitWantedPx,
  type SplitDirection, type SplitMax, type SplitMin, type SplitUnit,
} from "../../../shared/package-runtime/split-pane";
import { useKjunId } from "./input";

const kjunSplitPaneProps = {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction: { type: String as PropType<SplitDirection>, default: "horizontal" },
  /**
   * "ratio": sizes are the first pane's share (0–1) of the room beside the handle, so the split keeps its proportion as
   * the container resizes. "px": sizes are the first pane's pixels, so a side list keeps its width.
   */
  sizeUnit: { type: String as PropType<SplitUnit>, default: "ratio" },
  /** v-model:size. The first pane's size in sizeUnit; without it the split keeps its own. */
  size: { type: Number, default: undefined },
  /** The starting size without size, and the size a double press (or Enter, when the pane does not collapse) restores. Half the room without it. */
  defaultSize: { type: Number, default: undefined },
  /** Smallest pixels of the first and second pane. A minimum beats the size and the maximums. */
  minSize: { type: Array as unknown as PropType<SplitMin>, default: undefined },
  /** Largest pixels of the first and second pane; null leaves a pane unlimited. */
  maxSize: { type: Array as unknown as PropType<SplitMax>, default: undefined },
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: { type: String, required: true },
  /** Keeps the split where it is: the handle takes no pointer, key or focus. */
  disabled: { type: Boolean, default: false },
  /** The first pane collapses to collapsedSize when dragged past half its minimum, or with Enter or Home. */
  collapsible: { type: Boolean, default: false },
  /** Pixels a collapsed first pane keeps, e.g. 48 for an icon rail the app draws in the first slot. 0 hides the pane. */
  collapsedSize: { type: Number, default: undefined },
  /** v-model:collapsed. Without it the split keeps its own, starting from defaultCollapsed. */
  collapsed: { type: Boolean, default: undefined },
  defaultCollapsed: { type: Boolean, default: false },
  /** Hides the second pane and the handle; the first pane takes the whole room and stays mounted, keeping its scroll, selection and focus (a list that opens its detail beside it). The second slot stays mounted too. */
  secondHidden: { type: Boolean, default: false },
} as const;
export type KjunSplitPaneProps = ExtractPublicPropTypes<typeof kjunSplitPaneProps>;
/**
 * Two panes with a handle between them; dragging it or pressing arrow keys, Home, End or Enter resizes the first pane.
 * Slots: first, second. secondHidden shows the first pane alone. Events: update:size (every step), change (once when a drag ends or a key moves the handle),
 * update:collapsed.
 */
export const KjunSplitPane = defineComponent({
  name: "KjunSplitPane",
  props: kjunSplitPaneProps,
  emits: { "update:size": (_size: number) => true, change: (_size: number) => true, "update:collapsed": (_collapsed: boolean) => true },
  slots: Object as SlotsType<{ first?: () => VNodeChild; second?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const root = ref<HTMLElement | null>(null), handle = ref<HTMLElement | null>(null);
    const own = ref(props.defaultSize), ownCollapsed = ref(props.defaultCollapsed), dragging = ref(false), firstId = useKjunId("kjun-split-pane-");
    // The measured main-axis length and handle thickness; null until the first layout.
    const box = ref<{ total: number; hit: number } | null>(null);
    const wantedNow = () => splitWanted(props.size ?? own.value, props.defaultSize, props.sizeUnit);
    const foldedNow = () => props.collapsible && (props.collapsed ?? ownCollapsed.value);
    let latest = wantedNow(), folded = foldedNow(), changed = false, observer: ResizeObserver | undefined;
    // The pointer that started the drag, where it and the pane were, and layout pixels per viewport pixel.
    let drag: { pointer: number; at: number; px: number; scale: number } | null = null;
    const vertical = () => props.direction === "vertical";
    const measure = () => {
      const el = root.value, bar = handle.value;
      // A hidden handle measures nothing: the last shown sizes stay until it shows again.
      return el && bar && !props.secondHidden ? { total: vertical() ? el.clientHeight : el.clientWidth, hit: vertical() ? bar.offsetHeight : bar.offsetWidth } : null;
    };
    const read = () => {
      const next = measure(), old = box.value;
      if (next && !(old && old.total === next.total && old.hit === next.hit)) box.value = next;
    };
    onMounted(() => {
      read();
      if (typeof ResizeObserver === "undefined" || !root.value) return;
      observer = new ResizeObserver(read);
      observer.observe(root.value);
    });
    // A pane removed in the middle of a drag still reports the size it reached.
    onBeforeUnmount(() => { observer?.disconnect(); commit(); });
    watch(() => [props.direction, props.secondHidden], read, { flush: "post" });
    const limitsOf = (now: { total: number; hit: number }) => splitLimits(now.total, now.hit, props.minSize, props.maxSize);
    // The first pane's pixels where it is drawn now: collapsed, or the wanted size inside the limits.
    const at = (now: { total: number; hit: number }, range = limitsOf(now)) => folded
      ? splitFoldedPx(props.collapsedSize, now.total, now.hit) : splitClamp(splitWantedPx(latest, props.sizeUnit, now.total, now.hit), range);
    const rtl = () => !vertical() && !!root.value && getComputedStyle(root.value).direction === "rtl";
    const moveTo = (nextPx: number, now: { total: number; hit: number }) => {
      // A container with no room has no size to report; the asked size is kept for when it has room again.
      if (now.total <= now.hit) return;
      const next = splitReport(splitClamp(nextPx, limitsOf(now)), props.sizeUnit, now.total, now.hit);
      if (next === latest) return;
      latest = next;
      changed = true;
      if (props.size === undefined) own.value = next;
      emit("update:size", next);
    };
    const fold = (next: boolean) => {
      if (!props.collapsible || next === folded) return;
      folded = next;
      if (props.collapsed === undefined) ownCollapsed.value = next;
      emit("update:collapsed", next);
    };
    const commit = () => {
      if (!changed) return;
      changed = false;
      emit("change", latest as number);
    };
    const resetPx = (now: { total: number; hit: number }) =>
      splitWantedPx(splitWanted(props.defaultSize, undefined, props.sizeUnit), props.sizeUnit, now.total, now.hit);
    // Pointer capture keeps the drag when the pointer leaves the handle or the window; a cancel ends it where it is.
    const end = (event?: PointerEvent) => {
      if (!drag || (event && event.pointerId !== drag.pointer)) return;
      drag = null;
      dragging.value = false;
      commit();
    };
    const onPointerdown = (event: PointerEvent) => {
      const now = measure(), el = root.value;
      // One pointer drags at a time: a second finger on the handle is ignored.
      if (props.disabled || event.button !== 0 || drag || !now || !el) return;
      const rect = el.getBoundingClientRect(), drawn = vertical() ? rect.height : rect.width;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      drag = { pointer: event.pointerId, at: vertical() ? event.clientY : event.clientX, scale: drawn > 0 ? now.total / drawn : 1, px: at(now) };
      dragging.value = true;
    };
    const onPointermove = (event: PointerEvent) => {
      const session = drag, now = measure();
      if (!session || event.pointerId !== session.pointer || !now) return;
      if (props.disabled) return end();
      const next = splitDrag(session.px, session.at, vertical() ? event.clientY : event.clientX, session.scale, rtl());
      if (props.collapsible) {
        const shut = splitCollapseAt(next, limitsOf(now).low, splitFoldedPx(props.collapsedSize, now.total, now.hit));
        fold(shut);
        if (shut) return;
      }
      moveTo(next, now);
    };
    const onKeydown = (event: KeyboardEvent) => {
      const action = props.disabled || splitKeyHeld(event) ? null : splitKeyAction(event.key, props.direction, rtl()), now = measure();
      if (!action || !now) return;
      event.preventDefault();
      const range = limitsOf(now), plan = splitKeyCollapse(action, props.collapsible, folded);
      if (plan.collapse !== null) fold(plan.collapse);
      if (plan.move) moveTo(splitKeyTarget(action, at(now, range), range, resetPx(now)), now);
      commit();
    };
    // A double press puts the default size back, opening a collapsed pane.
    const onDblclick = () => {
      const now = measure();
      if (props.disabled || !now) return;
      fold(false);
      moveTo(resetPx(now), now);
      commit();
    };
    return () => {
      const wanted = wantedNow(), measured = box.value, shut = foldedNow();
      latest = wanted;
      folded = shut;
      const limits = measured ? limitsOf(measured) : null;
      const px = measured && limits ? at(measured, limits) : null;
      const room = measured ? Math.max(0, measured.total - measured.hit) : 0;
      const restFold = splitFoldedPx(props.collapsedSize, Infinity, 0);
      // Pixels and a collapsed pane are drawn at their pixels; a ratio as its share, so it follows the container without a script.
      const basis = px !== null ? (props.sizeUnit === "px" || shut ? `${px}px` : undefined)
        : shut ? `${restFold}px` : props.sizeUnit === "px" && wanted !== null ? `${wanted}px` : undefined;
      const share = px !== null && room > 0 ? px / room : props.sizeUnit === "ratio" && wanted !== null ? wanted : 0.5;
      const alone = props.secondHidden, hidden = !alone && shut && (px !== null ? px === 0 : restFold === 0);
      return (
        <div ref={root} class="kjun-split-pane" data-direction={props.direction} data-dragging={dragging.value || undefined} data-collapsed={shut || undefined} data-second-hidden={alone || undefined}
          style={{ "--_kjun-split-pane-size": String(share), ...(basis ? { "--_kjun-split-pane-basis": basis } : {}) }}>
          {/* A pane collapsed to nothing leaves the reading and tab order with its width. */}
          <div id={firstId} class="kjun-split-pane-first" inert={hidden || undefined} aria-hidden={hidden ? "true" : undefined}>{slots.first?.()}</div>
          {/* A focusable separator is the window-splitter widget: it reports the first pane's share as a percentage. */}
          <div ref={handle} class="kjun-split-pane-handle" role="separator" tabindex={props.disabled || alone ? undefined : 0} aria-label={props.ariaLabel} aria-controls={firstId}
            aria-orientation={vertical() ? "horizontal" : "vertical"} aria-disabled={props.disabled || undefined} data-dragging={dragging.value || undefined}
            data-collapsed={shut || undefined}
            aria-valuenow={measured && px !== null ? splitPercent(px, measured.total, measured.hit) : Math.round(share * 100)}
            aria-valuemin={measured && limits ? splitPercent(props.collapsible ? Math.min(limits.low, splitFoldedPx(props.collapsedSize, measured.total, measured.hit)) : limits.low, measured.total, measured.hit) : 0}
            aria-valuemax={measured && limits ? splitPercent(limits.high, measured.total, measured.hit) : 100}
            onPointerdown={onPointerdown} onPointermove={onPointermove} onPointerup={end} onPointercancel={end} onLostpointercapture={end}
            onKeydown={onKeydown} onDblclick={onDblclick}>
            <span class="kjun-split-pane-bar" />
          </div>
          <div class="kjun-split-pane-second" inert={alone || undefined}>{slots.second?.()}</div>
        </div>
      );
    };
  },
});
