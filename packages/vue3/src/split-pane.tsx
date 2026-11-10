import { onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import {
  splitClamp, splitDrag, splitFromRatio, splitKeyAction, splitKeyHeld, splitKeyTarget, splitLimits, splitPercent, splitShare, splitToRatio,
  type SplitDirection, type SplitMax, type SplitMin,
} from "../../../shared/package-runtime/split-pane";
import { useKjunId } from "./input";

const kjunSplitPaneProps = {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction: { type: String as PropType<SplitDirection>, default: "horizontal" },
  /** v-model:size. The first pane's share (0–1) of the room beside the handle; without it the split keeps its own. */
  size: { type: Number, default: undefined },
  /** The starting share without size, and the share Enter restores. */
  defaultSize: { type: Number, default: 0.5 },
  /** Smallest pixels of the first and second pane. A minimum beats the share and the maximums. */
  minSize: { type: Array as unknown as PropType<SplitMin>, default: undefined },
  /** Largest pixels of the first and second pane; null leaves a pane unlimited. */
  maxSize: { type: Array as unknown as PropType<SplitMax>, default: undefined },
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: { type: String, required: true },
  /** Keeps the split where it is: the handle takes no pointer, key or focus. */
  disabled: { type: Boolean, default: false },
} as const;
export type KjunSplitPaneProps = ExtractPublicPropTypes<typeof kjunSplitPaneProps>;
/**
 * Two panes with a handle between them; dragging it or pressing arrow keys, Home, End or Enter resizes the first pane.
 * Slots: first, second. Events: update:size (every step), change (once when a drag ends or a key moves the handle).
 */
export const KjunSplitPane = defineComponent({
  name: "KjunSplitPane",
  props: kjunSplitPaneProps,
  emits: { "update:size": (_size: number) => true, change: (_size: number) => true },
  slots: Object as SlotsType<{ first?: () => VNodeChild; second?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const root = ref<HTMLElement | null>(null), handle = ref<HTMLElement | null>(null);
    const own = ref(props.defaultSize), dragging = ref(false), firstId = useKjunId("kjun-split-pane-");
    // The measured main-axis length and handle thickness; null until the first layout.
    const box = ref<{ total: number; hit: number } | null>(null);
    let latest = splitShare(props.size ?? own.value, props.defaultSize), changed = false, observer: ResizeObserver | undefined;
    // The pointer that started the drag, where it and the pane were, and layout pixels per viewport pixel.
    let drag: { pointer: number; at: number; px: number; scale: number } | null = null;
    const vertical = () => props.direction === "vertical";
    const measure = () => {
      const el = root.value, bar = handle.value;
      return el && bar ? { total: vertical() ? el.clientHeight : el.clientWidth, hit: vertical() ? bar.offsetHeight : bar.offsetWidth } : null;
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
    watch(() => props.direction, read, { flush: "post" });
    const rtl = () => !vertical() && !!root.value && getComputedStyle(root.value).direction === "rtl";
    const moveTo = (nextPx: number, now: { total: number; hit: number }) => {
      // A container with no room has no size to report; the asked share is kept for when it has room again.
      if (now.total <= now.hit) return;
      const next = splitToRatio(splitClamp(nextPx, splitLimits(now.total, now.hit, props.minSize, props.maxSize)), now.total, now.hit);
      if (next === latest) return;
      latest = next;
      changed = true;
      if (props.size === undefined) own.value = next;
      emit("update:size", next);
    };
    const commit = () => {
      if (!changed) return;
      changed = false;
      emit("change", latest);
    };
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
      drag = { pointer: event.pointerId, at: vertical() ? event.clientY : event.clientX, scale: drawn > 0 ? now.total / drawn : 1,
        px: splitClamp(splitFromRatio(latest, now.total, now.hit), splitLimits(now.total, now.hit, props.minSize, props.maxSize)) };
      dragging.value = true;
    };
    const onPointermove = (event: PointerEvent) => {
      const session = drag, now = measure();
      if (!session || event.pointerId !== session.pointer || !now) return;
      if (props.disabled) return end();
      moveTo(splitDrag(session.px, session.at, vertical() ? event.clientY : event.clientX, session.scale, rtl()), now);
    };
    const onKeydown = (event: KeyboardEvent) => {
      const action = props.disabled || splitKeyHeld(event) ? null : splitKeyAction(event.key, props.direction, rtl()), now = measure();
      if (!action || !now) return;
      event.preventDefault();
      const range = splitLimits(now.total, now.hit, props.minSize, props.maxSize);
      moveTo(splitKeyTarget(action, splitClamp(splitFromRatio(latest, now.total, now.hit), range), range, splitFromRatio(splitShare(props.defaultSize), now.total, now.hit)), now);
      commit();
    };
    return () => {
      const wanted = splitShare(props.size ?? own.value, props.defaultSize), measured = box.value;
      latest = wanted;
      const limits = measured ? splitLimits(measured.total, measured.hit, props.minSize, props.maxSize) : null;
      const px = measured && limits ? splitClamp(splitFromRatio(wanted, measured.total, measured.hit), limits) : null;
      const room = measured ? Math.max(0, measured.total - measured.hit) : 0;
      // Before the first layout the share is drawn as asked; afterwards it is the share the limits allow.
      const share = px !== null && room > 0 ? px / room : wanted;
      return (
        <div ref={root} class="kjun-split-pane" data-direction={props.direction} data-dragging={dragging.value || undefined}
          style={{ "--_kjun-split-pane-size": String(share) }}>
          <div id={firstId} class="kjun-split-pane-first">{slots.first?.()}</div>
          {/* A focusable separator is the window-splitter widget: it reports the first pane's share as a percentage. */}
          <div ref={handle} class="kjun-split-pane-handle" role="separator" tabindex={props.disabled ? undefined : 0} aria-label={props.ariaLabel} aria-controls={firstId}
            aria-orientation={vertical() ? "horizontal" : "vertical"} aria-disabled={props.disabled || undefined} data-dragging={dragging.value || undefined}
            aria-valuenow={measured && px !== null ? splitPercent(px, measured.total, measured.hit) : Math.round(share * 100)}
            aria-valuemin={measured && limits ? splitPercent(limits.low, measured.total, measured.hit) : 0}
            aria-valuemax={measured && limits ? splitPercent(limits.high, measured.total, measured.hit) : 100}
            onPointerdown={onPointerdown} onPointermove={onPointermove} onPointerup={end} onPointercancel={end} onLostpointercapture={end} onKeydown={onKeydown}>
            <span class="kjun-split-pane-bar" />
          </div>
          <div class="kjun-split-pane-second">{slots.second?.()}</div>
        </div>
      );
    };
  },
});
