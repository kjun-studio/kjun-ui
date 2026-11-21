import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { badgeCount } from "../../../shared/package-runtime/navigation-badge";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { skeletonLineBox, skeletonRange, skeletonTableWidth, skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { emptyGeometry, type EmptySize } from "../../../shared/package-runtime/empty-geometry";
import { badgeGeometry, badgeToneRoles } from "../../../shared/package-runtime/badge-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { observeAlertActions } from "../../../shared/package-runtime/alert-actions";
import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import { progressCircle, progressPercent, progressState } from "../../../shared/package-runtime/progress-circle";
import { progressMarker, progressMarkerInset } from "../../../shared/package-runtime/progress-marker";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { typeStyle } from "./typography";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { spinnerStacked } from "../../../shared/package-runtime/spinner-geometry";
import {
forwardRef,
useCallback,
useId,
useLayoutEffect,
useRef,
useState,
type CSSProperties,
type HTMLAttributes,
type ReactElement,
type ReactNode,
} from "react";
import { KjunIcon } from "./button";
import { useSkeletonPhase } from "./skeleton-phase";
import { useReducedMotion } from "./use-reduced-motion";
import { progressColorRole } from "../../../shared/package-runtime/progress-tone";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
const role = (name: string) => `var(--_kjun-color-${name})`;
export interface KjunBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | SemanticTone | "price-up" | "price-down";
  size?: DisplaySize;
  dot?: boolean;
  /** Shows this number instead of children; over max it shows "99+", and 0 or less draws no badge at all. */
  count?: number;
  /** The largest count shown in full (default 99). */
  max?: number;
  /** What the badge means to a screen reader, e.g. "읽지 않은 알림 3개"; the drawn text is then hidden from it. Give it to a dot-only badge. */
  label?: string;
}
/** Like Chip, the ref reaches the badge's root span. */
export const KjunBadge = forwardRef<HTMLSpanElement, KjunBadgeProps>(function KjunBadge({
  variant = "default",
  size = "sm",
  dot = false,
  count,
  max,
  label,
  children,
  style,
  ...props
}, ref) {
  const { padding, radius, gap, dotSize, type, count: pill, standaloneDotSize } = badgeGeometry(size);
  const paint = badgeToneRoles(variant);
  const counted = count === undefined ? undefined : badgeCount(count, max);
  if (counted === null) return null;
  const body = counted ?? children, dotOnly = dot && !hasContent(body);
  return (
    <span
      {...props}
      ref={(element: HTMLSpanElement | null) => {
        domainColorRef(variant.startsWith("price-"))?.(element);
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      className={"kjun-badge " + (props.className || "")}
      data-variant={variant}
      data-dot-only={dotOnly || undefined}
      style={{
        ["--_kjun-badge-dot" as string]: (dotOnly ? standaloneDotSize : dotSize) + "px",
        padding: dotOnly ? 0 : `${padding.y}px ${counted ? pill.paddingX : padding.x}px`,
        ...typeStyle(type),
        gap,
        borderRadius: counted ? pill.radius : radius,
        ...(counted && { minWidth: pill.minWidth, justifyContent: "center", boxSizing: "border-box" as const }),
        // A tinted card sets --_kjun-badge-fill so the badge stays apart from its surface.
        background: dotOnly ? "transparent" : `var(--_kjun-badge-fill, ${role(paint.bg)})`,
        color: role(paint.text),
        ...style,
      }}
    >
      {dot && <span className="kjun-badge-dot" style={{ background: role(paint.dot) }} />}
      {label ? <><span className="kjun-sr-only">{label}</span>{!dotOnly && <span aria-hidden="true">{body}</span>}</> : body}
    </span>
  );
});
export { KjunCard } from "./card";
export type { KjunCardProps } from "./card";
export interface KjunEmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  text?: string;
  /** Why it is empty and what to do next; a node can carry a link or emphasis. */
  description?: ReactNode;
  /** An icon name drawn as a quiet line icon, or your own element (an illustration, a KjunIcon of another size). */
  icon?: string | ReactElement;
  /** md for pages and panels; sm for cards and list areas. */
  size?: EmptySize;
  /** Renders the title as an h2–h6 so it joins the page outline; false keeps a paragraph. */
  headingLevel?: false | 2 | 3 | 4 | 5 | 6;
  /** polite announces the message when it appears (role status), such as a search that just came back empty. */
  live?: "polite" | "off";
  children?: ReactNode;
}
export function KjunEmpty({
  text,
  description,
  icon,
  size = "md",
  headingLevel = false,
  live = "off",
  children,
  className,
  ...rest
}: KjunEmptyProps) {
  const m = useKjunMessages();
  text ??= m.noData;
  const g = emptyGeometry(size);
  const Title = headingLevel ? (`h${headingLevel}` as const) : "p";
  return (
    <div {...rest} className={"kjun-empty" + (className ? " " + className : "")} data-size={size} role={live === "polite" ? "status" : rest.role}>
      {typeof icon === "string"
        ? hasContent(icon) && <KjunIcon name={icon} size={g.iconSize} className="kjun-empty-icon" style={{ strokeWidth: g.iconStroke }} />
        : hasContent(icon) && <div className="kjun-empty-icon">{icon}</div>}
      <Title className="kjun-empty-title">{text}</Title>
      {hasContent(description) && <div className="kjun-empty-description">{description}</div>}
      {hasContent(children) && <div className="kjun-empty-actions">{children}</div>}
    </div>
  );
}
export interface KjunSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function KjunSpinner({ size = "md", text }: KjunSpinnerProps) {
  const m = useKjunMessages();
  return (
    // A live region announces its content, not its name: the loading words sit inside it, hidden when there is no text.
    <span role="status" className="kjun-spinner" data-size={size} data-stacked={(text && spinnerStacked(size)) || undefined}>
      <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes[size]} stroke={tokens.extensions.spinner.strokeWidths[size]} />
      {text ? <span>{text}</span> : <span className="kjun-sr-only">{m.loading}</span>}
    </span>
  );
}
export interface KjunAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children" | "role"> {
  type?: "info" | "success" | "warning" | "danger" | "error";
  variant?: SemanticTone;
  size?: "sm" | "md" | "lg";
  title?: ReactNode;
  /** An icon name in place of the tone's icon (its filled form when the icon has one), or false for no icon. */
  icon?: string | false;
  closable?: boolean;
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live?: AlertLive;
  children?: ReactNode;
  /** Buttons for the alert, under the message when it has a title, beside it otherwise (under it when the alert is too narrow for both); unsized KjunButtons follow the alert size. */
  actions?: ReactNode;
  /** Extra class on the alert root, for placement in the page layout; it leaves with the alert when closed. */
  className?: string;
  onClose?: () => void;
}
/** Other HTML attributes (id, style, tabIndex, aria-*, data-*) and the ref go to the root, so a page can point at the alert or move focus to it. */
export const KjunAlert = forwardRef<HTMLDivElement, KjunAlertProps>(function KjunAlert({
  type = "info",
  variant,
  size = "md",
  title,
  icon,
  closable = false,
  live,
  children,
  actions,
  className,
  onClose,
  style,
  ...rest
}, forward) {
  const m = useKjunMessages();
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement | null>(null), body = useRef<HTMLDivElement>(null), closing = useRef(false);
  const reduced = useReducedMotion();
  const attach = useCallback((node: HTMLDivElement | null) => {
    root.current = node;
    if (typeof forward === "function") forward(node);
    else if (forward) forward.current = node;
  }, [forward]);
  // Without a title the actions sit beside the message, centred on its first line, like a toast's; when the message
  // would be narrower than its minimum width they wrap under it, as under a title.
  const beside = !hasContent(title) && hasContent(actions);
  const [wrapped, setWrapped] = useState(false);
  useLayoutEffect(() => beside && visible ? observeAlertActions(body.current, setWrapped) : undefined, [beside, visible]);
  if (!visible) return null;
  const tone = variant || (type === "error" ? "danger" : type),
    scale = size === "sm" || size === "lg" ? size : "md",
    paint = alertToneRoles(tone);
  const titled = hasContent(title);
  const actionBox = hasContent(actions) && (
    <ActionSizeContext.Provider value={alertActionSizes[scale]}>
      <div className="kjun-alert-actions" data-placement={beside ? "end" : undefined} data-wrapped={(beside && wrapped) || undefined}>{actions}</div>
    </ActionSizeContext.Provider>
  );
  return (
    <div
      {...rest}
      ref={attach}
      role={alertRole(tone, live)}
      className={className ? "kjun-alert " + className : "kjun-alert"}
      data-size={scale}
      data-tone={tone}
      style={paint.bg ? { background: role(paint.bg), ...style } : style}
    >
      {icon !== false && (
        <span className="kjun-alert-icon" data-icon={icon ? "custom" : undefined} style={{ color: role(paint.icon) }}>
          <KjunIcon name={icon || alertIcons[tone]} filled size={tokens.extensions.alert.iconSizes[scale]} />
        </span>
      )}
      <div ref={body} className="kjun-alert-content">
        {/* App links, lists and emphasis inside keep their own styles, as in KjunText. */}
        {titled && <div className="kjun-alert-title" data-kjun-content="">{title}</div>}
        {hasContent(children) && <div className="kjun-alert-description" data-kjun-content="">{children}</div>}
        {actionBox}
      </div>
      {closable && (
        <button
          className="kjun-alert-close"
          type="button"
          aria-label={m.close}
          onClick={() => {
            if (closing.current) return;
            closing.current = true;
            collapseAlert(root.current, reduced, () => {
              setVisible(false);
              onClose?.();
            });
          }}
        >
          <KjunIcon name="x" size={tokens.extensions.alert.closeIconSize} />
        </button>
      )}
    </div>
  );
});
export type KjunProgressVariant = SemanticTone | "neutral";
export interface KjunProgressProps {
  /** null is missing data; omission keeps the zero default. */
  value?: number | null;
  /** Work is active but its completion percentage is unknown; takes precedence over null. */
  indeterminate?: boolean;
  max?: number;
  size?: "sm" | "md" | "lg";
  /** neutral draws the fill in the tertiary text colour, for a stale or reference reading that should not call for attention. */
  variant?: KjunProgressVariant;
  showLabel?: boolean;
  /** Shown and read in place of the rounded percent while the value is known, e.g. "37.4%" or "3.2 / 8 GB". */
  valueText?: string;
  /** A reference point across the bar on the value's own scale (0 to max), such as today's share of a budget. Bars only; not drawn while indeterminate or missing. */
  marker?: number;
  /** Read by screen readers as the bar's description, e.g. "오늘 기준 53%". Put visible wording in subLabel. */
  markerLabel?: string;
  label?: ReactNode;
  /** Names the bar for screen readers without showing text, e.g. "업로드 진행률"; takes the place of a label's name. */
  ariaLabel?: string;
  subLabel?: ReactNode;
  shape?: "bar" | "circle";
}
export function KjunProgress({
  value = 0,
  indeterminate = false,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  valueText,
  marker,
  markerLabel,
  label,
  ariaLabel,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages(), baseId = "kjun-progress-" + useId().replace(/:/g, ""), markerId = baseId + "-marker";
  // A label that is not plain text names the bar through aria-labelledby, so screen readers say what is shown.
  const labelId = !ariaLabel && label && typeof label !== "string" ? baseId + "-label" : undefined, noDataId = baseId + "-nodata";
  const state = progressState(value, max, indeterminate);
  const percentage = state === "determinate" ? progressPercent(value!, max) : 0;
  const text = state === "indeterminate" ? m.loadingEllipsis : state === "missing" ? "—" : valueText ?? `${percentage}%`;
  const name = ariaLabel || (typeof label === "string" ? label : m.progress), color = role(progressColorRole(variant));
  const accessibility = {
    role: state === "missing" ? "img" : "progressbar",
    "aria-label": labelId ? undefined : state === "missing" ? `${name}: ${m.noData}` : name,
    "aria-labelledby": labelId && (state === "missing" ? `${labelId} ${noDataId}` : labelId),
    "aria-valuemin": state === "missing" ? undefined : 0,
    "aria-valuemax": state === "missing" ? undefined : 100,
    "aria-valuenow": state === "determinate" ? percentage : undefined,
    "aria-valuetext": state === "indeterminate" ? m.loadingEllipsis : state === "determinate" ? valueText : undefined,
    "aria-busy": state === "indeterminate" || undefined,
  };
  if (shape === "circle") {
    const c = progressCircle(size, state === "indeterminate" ? 25 : percentage);
    return (
      <div className="kjun-progress" data-shape="circle" data-size={size} data-state={state}>
        <div {...accessibility} className="kjun-progress-circle" style={{ width: c.diameter, height: c.diameter }}>
          <svg className={state === "indeterminate" ? "kjun-spin" : undefined} width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`} fill="none" aria-hidden="true">
            <circle className="kjun-progress-circle-track" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke} />
            {(percentage > 0 || state === "indeterminate") && <circle className="kjun-progress-circle-value" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke}
              stroke={color} strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset}
              transform={`rotate(-90 ${c.centre} ${c.centre})`} />}
          </svg>
          {showLabel && c.showsPercentage && state !== "indeterminate" && <span className="kjun-progress-circle-percent">{text}</span>}
        </div>
        {label && <div id={labelId} className="kjun-progress-circle-label">{label}</div>}
        {labelId && state === "missing" && <span id={noDataId} hidden>{m.noData}</span>}
        {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
      </div>
    );
  }
  const mark = state === "determinate" ? progressMarker(marker, max) : null;
  return (
    <div className="kjun-progress" data-state={state}>
      {(label || showLabel) && (
        <div className="kjun-progress-label">
          {label && <span id={labelId}>{label}</span>}
          {showLabel && <span>{text}</span>}
        </div>
      )}
      <div {...accessibility} className="kjun-progress-track" data-marker={mark != null || undefined} aria-describedby={mark != null && markerLabel ? markerId : undefined}
        style={{ height: tokens.extensions.progress.heights[size] }}>
        <div style={{ width: (state === "indeterminate" ? 30 : percentage) + "%", background: color }} />
        {mark != null && <span className="kjun-progress-marker" aria-hidden="true" style={{ left: `calc(${mark}% - ${progressMarkerInset(mark)}px)` }} />}
      </div>
      {mark != null && markerLabel && <span id={markerId} hidden>{markerLabel}</span>}
      {labelId && state === "missing" && <span id={noDataId} hidden>{m.noData}</span>}
      {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
    </div>
  );
}
export interface KjunSkeletonProps {
  /** "line" is one line of text: a bar in the line box of `role`, or of the surrounding text when no role is given. */
  type?: "text" | "line" | "avatar" | "card" | "table" | "stat" | "block";
  /**
   * Typography role of the text a "line" or "text" skeleton stands in for. Omitted, a line takes the surrounding
   * text's line height and a paragraph the body role.
   */
  role?: TypographyRole;
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
  /** Lines of a "text" or "card" skeleton, body rows of a "table" one; floored, 0–100. */
  rows?: number;
  /** Columns of a "table" skeleton; floored, 0–100. */
  columns?: number;
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
  animated?: boolean;
  rounded?: boolean;
  className?: string;
  /** Merged over the root's own width. */
  style?: CSSProperties;
  id?: string;
}
export function KjunSkeleton({
  type = "text",
  rows = 3,
  columns = 4,
  height,
  width,
  animated = true,
  rounded = true,
  role,
  loadingText,
  className,
  style,
  id,
}: KjunSkeletonProps) {
  const root = useSkeletonPhase(animated);
  const line = (w: CSSProperties["width"], key?: number) => (
    <div key={key} className="kjun-skeleton-line" style={{ width: w }} />
  );
  // A bar inside a line box of a type role, so the skeleton is as tall as that text.
  const slot = (w: CSSProperties["width"], lineRole?: TypographyRole | "inherit", key?: number) => (
    <div key={key} className="kjun-skeleton-slot"
      style={lineRole ? { "--_kjun-skeleton-slot": skeletonLineBox(lineRole === "inherit" ? undefined : lineRole) } as CSSProperties : undefined}>
      {line(w)}
    </div>
  );
  const avatar = () => (
    <div
      className="kjun-skeleton-avatar"
      style={{
        // The root already carries a given width; repeating a percentage here would apply it twice.
        width: width ? "100%" : tokens.extensions.skeleton.avatarSize,
        height: height || tokens.extensions.skeleton.avatarSize,
        borderRadius: rounded ? tokens.radius.radius9999 : tokens.extensions.skeleton.blockRadius,
      }}
    />
  );
  return (
    <div
      ref={root}
      id={id}
      aria-hidden={loadingText ? undefined : true}
      role={loadingText ? "status" : undefined}
      className={"kjun-skeleton" + (animated ? " kjun-skeleton-animated" : "") + (className ? " " + className : "")}
      data-type={type}
      style={{ width, ...style }}
    >
      {loadingText && <span className="kjun-sr-only">{loadingText}</span>}
      {type === "text" && skeletonTextWidths(rows).map((w, i) => slot(w, role, i))}
      {type === "line" && slot("100%", role ?? "inherit")}
      {type === "avatar" && avatar()}
      {type === "card" && (
        <div className="kjun-skeleton-card">
          <div className="kjun-skeleton-card-header">
            {slot("40%", "cardTitle")}
            {slot("28%", "caption")}
          </div>
          {rows > 0 && <div className="kjun-skeleton-card-body">{skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}</div>}
        </div>
      )}
      {type === "table" && (
        <div className="kjun-skeleton-table">
          {[0, ...skeletonRange(rows)].map((row) => (
            <div
              key={row}
              className={
                row === 0
                  ? "kjun-skeleton-table-header"
                  : "kjun-skeleton-table-row"
              }
            >
              {skeletonRange(columns).map((col) => (
                <div key={col} className="kjun-skeleton-table-cell" data-align={col > 1 ? "end" : undefined}>
                  {slot(skeletonTableWidth(row, col - 1), row === 0 ? "caption" : "body")}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {type === "stat" && (
        <div className="kjun-skeleton-stat">
          {slot("40%", "caption")}
          {slot("64%", "displaySm")}
          {slot("30%", "caption")}
        </div>
      )}
      {type === "block" && (
        <div
          className="kjun-skeleton-block"
          style={{ width: "100%", height: height ?? tokens.extensions.skeleton.blockHeight }}
        />
      )}
    </div>
  );
}

