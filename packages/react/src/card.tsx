import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { cardLayout, type CardHeadingLevel, type CardMediaAspect, type CardMediaPosition } from "../../../shared/package-runtime/card-layout";
import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface } from "@kjun-ui/tokens";
import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
import { linkRel } from "../../../shared/package-runtime/list-row";
import { CardActionsContext } from "./card-actions-context";
import { KjunIcon } from "./button";

export interface KjunCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The card title; a node can carry an icon or an emphasised number. Give a pressable card with a node title an ariaLabel. */
  title?: ReactNode;
  subtitle?: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  media?: ReactNode;
  /** top (default) puts the media above the header; start puts it in a fixed column beside the content, such as a thumbnail. */
  mediaPosition?: CardMediaPosition;
  /** Fixes the media frame's ratio (wide 16:9, standard 4:3, square 1:1); images and video crop to it. */
  mediaAspect?: CardMediaAspect;
  footer?: ReactNode;
  padding?: CardPadding;
  bodyPadding?: CardPadding;
  radius?: CardRadius;
  surface?: CardSurface;
  elevation?: CardElevation;
  border?: boolean;
  dividers?: boolean;
  /** Makes the whole card one button (onClick). Do not put buttons or links inside a pressable card. */
  pressable?: boolean;
  /** Makes the whole card one link (an a element), such as a card that opens a page. Like pressable, no buttons or links inside.
   * A router can take onClick: call event.preventDefault() and navigate. */
  href?: string;
  /** Where a link card opens, e.g. "_blank"; a new tab gets rel="noopener noreferrer" unless rel is given. */
  target?: string;
  /** The link's rel; by default "noopener noreferrer" for target="_blank". */
  rel?: string;
  /** Blocks a pressable or link card and dims it. */
  disabled?: boolean;
  /** Name of a pressable or link card; defaults to a text title. */
  ariaLabel?: string;
  /** Title level in the page outline (h2–h6, default 3); false keeps plain text. A pressable card's title is never a heading. */
  headingLevel?: CardHeadingLevel;
  /** Where the footer places its content: start (default) or end, such as confirm and cancel actions. */
  footerAlign?: "start" | "end";
}
export function KjunCard({ title, subtitle, header, headerActions, media, mediaPosition = "top", mediaAspect, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, pressable = false, href, target, rel, disabled = false, ariaLabel, headingLevel = 3, footerAlign = "start",
  children, style, className = "", onClick, onKeyDown, onKeyUp, ...props
}: KjunCardProps) {
  const root = useRef<HTMLElement>(null);
  const link = href !== undefined;
  // Checked after every render, so a control added later still warns.
  useEffect(() => {
    if (pressable || link) warnNestedControls(root.current, "KJUN Card: a pressable or link card contains buttons or links; move them out or drop pressable/href.");
  });
  const parts = { header: present(header), title: present(title), subtitle: present(subtitle), actions: present(headerActions),
    body: present(children), footer: present(footer), media: present(media) };
  const layout = cardLayout(parts, { pressable: pressable || link, link, headingLevel, surface, padding, mediaPosition });
  // Like a native button: Enter presses once on keydown (a held key does not repeat), Space presses on release.
  const name = ariaLabel ?? (typeof title === "string" ? title : undefined);
  // A link card is an a element: the browser handles Enter; a disabled one keeps the link role without an href.
  const press = link ? {
    href: disabled ? undefined : href, target, rel: linkRel(target, rel), role: disabled ? "link" : undefined,
    "aria-disabled": disabled || undefined, "aria-label": name, "data-pressable": "",
    onClick: (event: MouseEvent<HTMLElement>) => { if (disabled) event.preventDefault(); else onClick?.(event as MouseEvent<HTMLDivElement>); },
    onKeyDown, onKeyUp,
  } : pressable ? {
    role: "button", tabIndex: disabled ? -1 : 0, "aria-disabled": disabled || undefined,
    "aria-label": name, "data-pressable": "",
    onClick: (event: MouseEvent<HTMLDivElement>) => { if (!disabled) onClick?.(event); },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (event.key === "Enter" && !event.repeat) event.currentTarget.click();
    },
    onKeyUp: (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyUp?.(event);
      if (event.defaultPrevented || disabled || event.key !== " ") return;
      event.preventDefault();
      event.currentTarget.click();
    },
  } : { onClick, onKeyDown, onKeyUp };
  const Title = layout.titleLevel ? (`h${layout.titleLevel}` as const) : "p";
  const rows = [layout.header, parts.body, parts.footer].filter(Boolean).length;
  // Typed as div so the HTML attributes apply; an a element takes the same ones.
  const Root = (link ? "a" : "div") as "div";
  return <Root {...props} {...press} ref={root as RefObject<HTMLDivElement>} className={["kjun-card", className].filter(Boolean).join(" ")}
    data-surface={surface} data-padding={padding} data-body-padding={bodyPadding}
    data-border={border} data-dividers={dividers} data-elevation={elevation} data-media={layout.sideMedia ? "start" : undefined} data-actions-beside={layout.actionsBeside || undefined}
    style={{
      "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${padding})`,
      "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
      "--_kjun-card-header-gap": `${layout.headerGap}px`,
      borderRadius: `var(--_kjun-geometry-card-radii-${radius})`,
      // A pressable card's shadow comes from CSS so its hover lift can replace it.
      [pressable || link ? "--_kjun-card-shadow" : "boxShadow"]: `var(--_kjun-card-elevation-${elevation})`, ...style,
    } as CSSProperties}>
    {parts.media && <div className="kjun-card-media" data-side={layout.sideMedia || undefined} data-aspect={mediaAspect}
      style={{ ...(mediaAspect ? { aspectRatio: tokens.card.mediaAspects[mediaAspect] } : {}), ...(layout.sideMedia ? { gridRow: `1 / span ${Math.max(rows, 1)}` } : {}) }}>{media}</div>}
    {layout.header && <div className="kjun-card-header" data-description={!parts.header && parts.subtitle} data-titled={layout.titled || undefined}>
      {layout.heading && <div className="kjun-card-heading" data-title={layout.titled ? "" : undefined}>
        {parts.header ? header : <>
          {parts.title && <Title className="kjun-card-title">{title}</Title>}
          {parts.subtitle && <p className="kjun-card-subtitle">{subtitle}</p>}
        </>}
      </div>}
      {parts.actions && <div className="kjun-card-actions"><CardActionsContext.Provider value={true}>{headerActions}</CardActionsContext.Provider></div>}
      {layout.linkMark && <span className="kjun-card-link-mark" aria-hidden="true"><KjunIcon name="chevron-right" size={tokens.iconSizes.large} /></span>}
    </div>}
    {parts.body && <div className="kjun-card-body">{children}</div>}
    {parts.footer && <div className="kjun-card-footer" data-align={footerAlign}>{footer}</div>}
  </Root>;
}
