import {
  splitClamp, splitDrag, splitFromRatio, splitKeyAction, splitKeyHeld, splitKeyTarget, splitLimits, splitPercent, splitShare, splitToRatio,
  type SplitDirection, type SplitMax, type SplitMin,
} from "../../../shared/package-runtime/split-pane";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export interface KjunSplitPaneProps {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction?: SplitDirection;
  /** Controlled share (0–1) of the room beside the handle that the first pane takes; pair with onSizeChange. */
  size?: number;
  /** The starting share without size, and the share Enter restores. */
  defaultSize?: number;
  /** Smallest pixels of the first and second pane. A minimum beats the share and the maximums. */
  minSize?: SplitMin;
  /** Largest pixels of the first and second pane; null leaves a pane unlimited. */
  maxSize?: SplitMax;
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: string;
  /** Keeps the split where it is: the handle takes no pointer, key or focus. */
  disabled?: boolean;
  /** Every step of a drag or key press. */
  onSizeChange?: (size: number) => void;
  /** Once when a drag ends or a key moves the handle; the place to save the size. */
  onChangeCommit?: (size: number) => void;
  first: ReactNode;
  second: ReactNode;
  className?: string;
  /** Outer size and margins only: padding or a border on the root would shift the panes away from the measured sizes. */
  style?: CSSProperties;
  id?: string;
}

/** Two panes with a handle between them; dragging it or pressing arrow keys, Home, End or Enter resizes the first pane. */
export function KjunSplitPane({ direction = "horizontal", size, defaultSize = 0.5, minSize, maxSize, ariaLabel, disabled = false,
  onSizeChange, onChangeCommit, first, second, className, style, id }: KjunSplitPaneProps) {
  const root = useRef<HTMLDivElement>(null), handle = useRef<HTMLDivElement>(null);
  const firstId = "kjun-split-pane-" + useId().replace(/:/g, "");
  const [own, setOwn] = useState(defaultSize);
  // The measured main-axis length and handle thickness; null until the first layout.
  const [box, setBox] = useState<{ total: number; hit: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const vertical = direction === "vertical", wanted = splitShare(size ?? own, defaultSize);
  const latest = useRef(wanted), changed = useRef(false);
  // The pointer that started the drag, where it and the pane were, and layout pixels per viewport pixel.
  const drag = useRef<{ pointer: number; at: number; px: number; scale: number } | null>(null);
  latest.current = wanted;
  const measure = () => {
    const el = root.current, bar = handle.current;
    return el && bar ? { total: vertical ? el.clientHeight : el.clientWidth, hit: vertical ? bar.offsetHeight : bar.offsetWidth } : null;
  };
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () => {
      const next = measure();
      if (next) setBox(old => old && old.total === next.total && old.hit === next.hit ? old : next);
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [vertical]);
  const limits = box ? splitLimits(box.total, box.hit, minSize, maxSize) : null;
  const px = box && limits ? splitClamp(splitFromRatio(wanted, box.total, box.hit), limits) : null;
  const room = box ? Math.max(0, box.total - box.hit) : 0;
  // Before the first layout the share is drawn as asked; afterwards it is the share the limits allow.
  const share = px !== null && room > 0 ? px / room : wanted;
  const rtl = () => !vertical && !!root.current && getComputedStyle(root.current).direction === "rtl";
  const moveTo = (nextPx: number, now: { total: number; hit: number }) => {
    // A container with no room has no size to report; the asked share is kept for when it has room again.
    if (now.total <= now.hit) return;
    const next = splitToRatio(splitClamp(nextPx, splitLimits(now.total, now.hit, minSize, maxSize)), now.total, now.hit);
    if (next === latest.current) return;
    latest.current = next;
    changed.current = true;
    if (size === undefined) setOwn(next);
    onSizeChange?.(next);
  };
  const commit = () => {
    if (!changed.current) return;
    changed.current = false;
    onChangeCommit?.(latest.current);
  };
  // A pane removed in the middle of a drag still reports the size it reached.
  const leave = useRef(commit);
  leave.current = commit;
  useEffect(() => () => leave.current(), []);
  // Pointer capture keeps the drag when the pointer leaves the handle or the window; a cancel ends it where it is.
  const end = (event?: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || (event && event.pointerId !== drag.current.pointer)) return;
    drag.current = null;
    setDragging(false);
    commit();
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const now = measure(), el = root.current;
    // One pointer drags at a time: a second finger on the handle is ignored.
    if (disabled || event.button !== 0 || drag.current || !now || !el) return;
    const rect = el.getBoundingClientRect(), drawn = vertical ? rect.height : rect.width;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, at: vertical ? event.clientY : event.clientX, scale: drawn > 0 ? now.total / drawn : 1,
      px: splitClamp(splitFromRatio(latest.current, now.total, now.hit), splitLimits(now.total, now.hit, minSize, maxSize)) };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = drag.current, now = measure();
    if (!session || event.pointerId !== session.pointer || !now) return;
    if (disabled) return end();
    moveTo(splitDrag(session.px, session.at, vertical ? event.clientY : event.clientX, session.scale, rtl()), now);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = disabled || splitKeyHeld(event) ? null : splitKeyAction(event.key, direction, rtl()), now = measure();
    if (!action || !now) return;
    event.preventDefault();
    const range = splitLimits(now.total, now.hit, minSize, maxSize);
    moveTo(splitKeyTarget(action, splitClamp(splitFromRatio(latest.current, now.total, now.hit), range), range, splitFromRatio(splitShare(defaultSize), now.total, now.hit)), now);
    commit();
  };
  return (
    <div ref={root} id={id} className={"kjun-split-pane" + (className ? " " + className : "")} data-direction={direction} data-dragging={dragging || undefined}
      style={{ ...style, "--_kjun-split-pane-size": share } as CSSProperties}>
      <div id={firstId} className="kjun-split-pane-first">{first}</div>
      {/* A focusable separator is the window-splitter widget: it reports the first pane's share as a percentage. */}
      <div ref={handle} className="kjun-split-pane-handle" role="separator" tabIndex={disabled ? undefined : 0} aria-label={ariaLabel} aria-controls={firstId}
        aria-orientation={vertical ? "horizontal" : "vertical"} aria-disabled={disabled || undefined} data-dragging={dragging || undefined}
        aria-valuenow={box && px !== null ? splitPercent(px, box.total, box.hit) : Math.round(share * 100)}
        aria-valuemin={box && limits ? splitPercent(limits.low, box.total, box.hit) : 0}
        aria-valuemax={box && limits ? splitPercent(limits.high, box.total, box.hit) : 100}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={onKeyDown}>
        <span className="kjun-split-pane-bar" />
      </div>
      <div className="kjun-split-pane-second">{second}</div>
    </div>
  );
}
