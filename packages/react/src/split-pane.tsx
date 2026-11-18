import {
  splitClamp, splitCollapseAt, splitDrag, splitFoldedPx, splitKeyAction, splitKeyCollapse, splitKeyHeld, splitKeyTarget, splitLimits,
  splitPercent, splitReport, splitWanted, splitWantedPx,
  type SplitDirection, type SplitMax, type SplitMin, type SplitUnit,
} from "../../../shared/package-runtime/split-pane";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export interface KjunSplitPaneProps {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction?: SplitDirection;
  /**
   * "ratio": sizes are the first pane's share (0–1) of the room beside the handle, so the split keeps its proportion as
   * the container resizes. "px": sizes are the first pane's pixels, so a side list keeps its width.
   */
  sizeUnit?: SplitUnit;
  /** Controlled size of the first pane in sizeUnit; pair with onSizeChange. */
  size?: number;
  /** The starting size without size, and the size a double press (or Enter, when the pane does not collapse) restores. Half the room without it. */
  defaultSize?: number;
  /** Smallest pixels of the first and second pane. A minimum beats the size and the maximums. */
  minSize?: SplitMin;
  /** Largest pixels of the first and second pane; null leaves a pane unlimited. */
  maxSize?: SplitMax;
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: string;
  /** Keeps the split where it is: the handle takes no pointer, key or focus. */
  disabled?: boolean;
  /** The first pane collapses to collapsedSize when dragged past half its minimum, or with Enter or Home. */
  collapsible?: boolean;
  /** Pixels a collapsed first pane keeps, e.g. 48 for an icon rail the app draws in first. 0 hides the pane. */
  collapsedSize?: number;
  /** Controlled collapsed state; pair with onCollapsedChange. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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
export function KjunSplitPane({ direction = "horizontal", sizeUnit = "ratio", size, defaultSize, minSize, maxSize, ariaLabel, disabled = false,
  collapsible = false, collapsedSize, collapsed, defaultCollapsed = false, onCollapsedChange,
  onSizeChange, onChangeCommit, first, second, className, style, id }: KjunSplitPaneProps) {
  const root = useRef<HTMLDivElement>(null), handle = useRef<HTMLDivElement>(null);
  const firstId = "kjun-split-pane-" + useId().replace(/:/g, "");
  const [own, setOwn] = useState(defaultSize);
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  // The measured main-axis length and handle thickness; null until the first layout.
  const [box, setBox] = useState<{ total: number; hit: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const vertical = direction === "vertical", wanted = splitWanted(size ?? own, defaultSize, sizeUnit);
  const folded = collapsible && (collapsed ?? ownCollapsed);
  const latest = useRef(wanted), foldedNow = useRef(folded), changed = useRef(false);
  // The pointer that started the drag, where it and the pane were, and layout pixels per viewport pixel.
  const drag = useRef<{ pointer: number; at: number; px: number; scale: number } | null>(null);
  latest.current = wanted;
  foldedNow.current = folded;
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
  // The first pane's pixels where it is drawn now: collapsed, or the wanted size inside the limits.
  const at = (now: { total: number; hit: number }, range = splitLimits(now.total, now.hit, minSize, maxSize)) => foldedNow.current
    ? splitFoldedPx(collapsedSize, now.total, now.hit) : splitClamp(splitWantedPx(latest.current, sizeUnit, now.total, now.hit), range);
  const px = box && limits ? at(box, limits) : null;
  const room = box ? Math.max(0, box.total - box.hit) : 0;
  // Pixels and a collapsed pane are drawn at their pixels; a ratio as its share, so it follows the container without a script.
  const basis = px !== null ? (sizeUnit === "px" || folded ? `${px}px` : undefined)
    : folded ? `${splitFoldedPx(collapsedSize, Infinity, 0)}px` : sizeUnit === "px" && wanted !== null ? `${wanted}px` : undefined;
  const share = px !== null && room > 0 ? px / room : sizeUnit === "ratio" && wanted !== null ? wanted : 0.5;
  const rtl = () => !vertical && !!root.current && getComputedStyle(root.current).direction === "rtl";
  const moveTo = (nextPx: number, now: { total: number; hit: number }) => {
    // A container with no room has no size to report; the asked size is kept for when it has room again.
    if (now.total <= now.hit) return;
    const next = splitReport(splitClamp(nextPx, splitLimits(now.total, now.hit, minSize, maxSize)), sizeUnit, now.total, now.hit);
    if (next === latest.current) return;
    latest.current = next;
    changed.current = true;
    if (size === undefined) setOwn(next);
    onSizeChange?.(next);
  };
  const fold = (next: boolean) => {
    if (!collapsible || next === foldedNow.current) return;
    foldedNow.current = next;
    if (collapsed === undefined) setOwnCollapsed(next);
    onCollapsedChange?.(next);
  };
  const commit = () => {
    if (!changed.current) return;
    changed.current = false;
    onChangeCommit?.(latest.current as number);
  };
  const resetPx = (now: { total: number; hit: number }) => splitWantedPx(splitWanted(defaultSize, undefined, sizeUnit), sizeUnit, now.total, now.hit);
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
    drag.current = { pointer: event.pointerId, at: vertical ? event.clientY : event.clientX, scale: drawn > 0 ? now.total / drawn : 1, px: at(now) };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = drag.current, now = measure();
    if (!session || event.pointerId !== session.pointer || !now) return;
    if (disabled) return end();
    const next = splitDrag(session.px, session.at, vertical ? event.clientY : event.clientX, session.scale, rtl());
    if (collapsible) {
      const shut = splitCollapseAt(next, splitLimits(now.total, now.hit, minSize, maxSize).low, splitFoldedPx(collapsedSize, now.total, now.hit));
      fold(shut);
      if (shut) return;
    }
    moveTo(next, now);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = disabled || splitKeyHeld(event) ? null : splitKeyAction(event.key, direction, rtl()), now = measure();
    if (!action || !now) return;
    event.preventDefault();
    const range = splitLimits(now.total, now.hit, minSize, maxSize);
    const plan = splitKeyCollapse(action, collapsible, foldedNow.current);
    if (plan.collapse !== null) fold(plan.collapse);
    if (plan.move) moveTo(splitKeyTarget(action, at(now, range), range, resetPx(now)), now);
    commit();
  };
  // A double press puts the default size back, opening a collapsed pane.
  const onDoubleClick = () => {
    const now = measure();
    if (disabled || !now) return;
    fold(false);
    moveTo(resetPx(now), now);
    commit();
  };
  const hidden = folded && px !== null ? px === 0 : folded && splitFoldedPx(collapsedSize, Infinity, 0) === 0;
  return (
    <div ref={root} id={id} className={"kjun-split-pane" + (className ? " " + className : "")} data-direction={direction}
      data-dragging={dragging || undefined} data-collapsed={folded || undefined}
      style={{ ...style, "--_kjun-split-pane-size": share, ...(basis ? { "--_kjun-split-pane-basis": basis } : {}) } as CSSProperties}>
      {/* A pane collapsed to nothing leaves the reading and tab order with its width. */}
      <div id={firstId} className="kjun-split-pane-first" inert={hidden || undefined} aria-hidden={hidden || undefined}>{first}</div>
      {/* A focusable separator is the window-splitter widget: it reports the first pane's share as a percentage. */}
      <div ref={handle} className="kjun-split-pane-handle" role="separator" tabIndex={disabled ? undefined : 0} aria-label={ariaLabel} aria-controls={firstId}
        aria-orientation={vertical ? "horizontal" : "vertical"} aria-disabled={disabled || undefined} data-dragging={dragging || undefined}
        data-collapsed={folded || undefined}
        aria-valuenow={box && px !== null ? splitPercent(px, box.total, box.hit) : Math.round(share * 100)}
        aria-valuemin={box && limits ? splitPercent(collapsible ? Math.min(limits.low, splitFoldedPx(collapsedSize, box.total, box.hit)) : limits.low, box.total, box.hit) : 0}
        aria-valuemax={box && limits ? splitPercent(limits.high, box.total, box.hit) : 100}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
        onKeyDown={onKeyDown} onDoubleClick={onDoubleClick}>
        <span className="kjun-split-pane-bar" />
      </div>
      <div className="kjun-split-pane-second">{second}</div>
    </div>
  );
}
