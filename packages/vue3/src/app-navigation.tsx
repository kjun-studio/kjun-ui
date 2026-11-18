import { webSafeBottom, webSafeTop } from "../../../shared/package-runtime/safe-area";
import { useKjunMessages } from "./runtime/messages";
import { navigationBadge, navigationLabel, type NavigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { bottomNavigationLayout, navigationIconFilled, revealDelta, type NavigationIconStyle } from "../../../shared/package-runtime/bottom-navigation";
import { isPlainNavigationClick } from "../../../shared/package-runtime/side-navigation";
export type { NavigationIconStyle };
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { provide, shallowRef, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { trackBottomBar } from "../../../shared/package-runtime/bottom-bar";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunActionSize } from "./runtime/action-size";
import { kjunTopNavigationKey } from "./runtime/keys";
import { hasContent } from "./runtime/slots";

const kjunTopNavigationProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  /** Keeps clear of the screen's safe area from KjunProvider; false where the app already reserved it. */
  safeArea: { type: Boolean, default: true },
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface: { type: Boolean, default: true },
} as const;
export type KjunTopNavigationProps = ExtractPublicPropTypes<typeof kjunTopNavigationProps>;
/** Slots: leading, actions. Buttons inside take the navigation's control geometry. */
export const KjunTopNavigation = defineComponent({
  name: "KjunTopNavigation",
  props: kjunTopNavigationProps,
  slots: Object as SlotsType<{
    leading?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    provide(kjunTopNavigationKey, tokens.extensions.topNavigation);
    return () => {
      const leading = slots.leading?.(), actions = slots.actions?.();
      return (
        <header class="kjun-top-navigation" data-surface={props.surface ? undefined : "false"} style={{ paddingTop: webSafeTop(props.safeArea) }}>
          <div class="kjun-navigation-content">
            {hasContent(leading) && <div class="kjun-navigation-leading">{leading}</div>}
            <div class="kjun-navigation-title"><strong>{props.title}</strong>{props.description && <p>{props.description}</p>}</div>
            {hasContent(actions) && <div class="kjun-navigation-actions">{actions}</div>}
          </div>
        </header>
      );
    };
  },
});

export interface NavigationDestination { key: string; label: string; href: string; icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+, and the accessible name keeps the value. */
  badge?: NavigationBadge; disabled?: boolean }
const badgeMark = (badge: NavigationDestination["badge"]) => {
  const mark = navigationBadge(badge);
  return mark && <span class="kjun-navigation-badge" data-dot={mark.dot || undefined} aria-hidden="true">{mark.text}</span>;
};
const kjunBottomNavigationProps = {
  items: { type: Array as PropType<NavigationDestination[]>, required: true },
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  /** Keeps clear of the screen's safe area from KjunProvider; false where the app already reserved it. */
  safeArea: { type: Boolean, default: true },
  keyboardVisible: { type: Boolean, default: false },
  hideOnKeyboard: { type: Boolean, default: true },
  /** Paints the surface (default true): a square bar with a hairline shadow along its top edge; false lets the page background show through, so the bar does not read as a separate band. */
  surface: { type: Boolean, default: true },
  /** "auto" (default) draws outline icons and fills the selected one; "filled" or "outline" keeps one style for every destination, the selection then carried by colour (and stroke weight). */
  iconStyle: { type: String as PropType<NavigationIconStyle>, default: "auto" },
  /** Shows each label under its icon (default true); false draws icons alone on a lower bar, each label staying the destination's accessible name. Destinations without icons always show their labels. */
  showLabels: { type: Boolean, default: true },
} as const;
export type KjunBottomNavigationProps = ExtractPublicPropTypes<typeof kjunBottomNavigationProps>;
/** One destination link's attributes, shared by the bottom and floating bars. Events (plain clicks only): navigate(key, event),
 * prevent the event to route in the app; reselect, the current destination was pressed again. */
function destination(item: NavigationDestination, selected: boolean, m: KjunMessages,
  emit: { (event: "navigate", key: string, mouse: MouseEvent): void; (event: "reselect", key: string, mouse: MouseEvent): void }) {
  // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
  return {
    href: item.disabled ? undefined : item.href, role: item.disabled ? "link" : undefined, tabindex: item.disabled ? -1 : undefined,
    "aria-label": navigationLabel(item.label, item.badge, m.newContent, m.newCount), "aria-disabled": item.disabled || undefined, "aria-current": selected ? ("page" as const) : undefined,
    onClick: (event: MouseEvent) => {
      if (item.disabled) { event.preventDefault(); return; }
      // A modified click opens a new tab or window, which the browser handles; only a plain click is the app's to route.
      if (!isPlainNavigationClick(event)) return;
      emit("navigate", item.key, event);
      if (selected) emit("reselect", item.key, event);
    },
  };
}
/** A bottom bar reports its height to the provider scope, so KjunFab sits above it. */
function useBottomBar() {
  const bar = shallowRef<HTMLElement | null>(null);
  watch(bar, (element, _previous, onCleanup) => onCleanup(trackBottomBar(element)), { flush: "post" });
  return bar;
}
export const KjunBottomNavigation = defineComponent({
  name: "KjunBottomNavigation",
  props: kjunBottomNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true },
  setup(props, { emit }) {
    const m = useKjunMessages(), bar = useBottomBar();
    return () => {
      const layout = bottomNavigationLayout(props.items, props.showLabels);
      if (props.keyboardVisible && props.hideOnKeyboard) return null;
      return (
        <nav ref={bar} class="kjun-bottom-navigation" data-icons={layout.hasIcons || undefined} data-icon-style={props.iconStyle} data-labels={layout.iconOnly ? "false" : undefined} data-surface={props.surface ? undefined : "false"} aria-label={(props.ariaLabel ?? m.value.mainNavigation)} style={{ paddingBottom: webSafeBottom(props.safeArea) }}>
          {props.items.map(item => {
            const selected = props.value === item.key, parts = layout.parts(item);
            const badge = badgeMark(item.badge);
            return (
              <a key={item.key} {...destination(item, selected, m.value, emit)}>
                {parts.iconBox && <span class="kjun-navigation-icon">{item.icon && <KjunIcon name={item.icon} filled={navigationIconFilled(props.iconStyle, selected)} size={tokens.extensions.bottomNavigation.iconSize} />}{badge}</span>}
                {parts.showLabel && <span class="kjun-navigation-label">{item.label}{!parts.badgeOnIcon && badge}</span>}
              </a>
            );
          })}
        </nav>
      );
    };
  },
});

const kjunFloatingNavigationProps = {
  items: { type: Array as PropType<NavigationDestination[]>, required: true },
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  /** Keeps clear of the screen's safe area from KjunProvider; false where the app already reserved it. */
  safeArea: { type: Boolean, default: true },
  keyboardVisible: { type: Boolean, default: false },
  hideOnKeyboard: { type: Boolean, default: true },
} as const;
export type KjunFloatingNavigationProps = ExtractPublicPropTypes<typeof kjunFloatingNavigationProps>;
/** A capsule detached from the screen edge. Destinations with an icon show only the icon; the label stays their accessible name.
 * Event: navigate(key, event); prevent the event to route in the app. */
export const KjunFloatingNavigation = defineComponent({
  name: "KjunFloatingNavigation",
  props: kjunFloatingNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true },
  setup(props, { emit }) {
    const m = useKjunMessages(), bar = useBottomBar();
    // A capsule with more destinations than fit scrolls inside; the current one is brought into view.
    // Only a new current destination or a new set of destinations moves it, so a re-render keeps where the user scrolled.
    watch([bar, () => props.value, () => props.items.map(item => item.key).join("\n")], ([nav]) => {
      const current = nav?.querySelector<HTMLElement>("a[aria-current]");
      if (!nav || !current) return;
      const view = nav.getBoundingClientRect(), item = current.getBoundingClientRect(), padding = parseFloat(getComputedStyle(nav).paddingInlineStart) || 0;
      const delta = revealDelta(item.left, item.right, view.left + padding, view.right - padding);
      if (delta) nav.scrollLeft += delta;
    }, { flush: "post" });
    return () => {
      const geometry = tokens.extensions.floatingNavigation;
      if (props.keyboardVisible && props.hideOnKeyboard) return null;
      return (
        <nav ref={bar} class="kjun-floating-navigation" aria-label={(props.ariaLabel ?? m.value.mainNavigation)} style={{ marginBottom: `calc(${geometry.offset}px + ${webSafeBottom(props.safeArea)})` }}>
          {props.items.map(item => {
            const selected = props.value === item.key;
            const badge = badgeMark(item.badge);
            return (
              <a key={item.key} {...destination(item, selected, m.value, emit)}>
                {item.icon
                  ? <span class="kjun-navigation-icon"><KjunIcon name={item.icon} filled={selected} size={geometry.iconSize} />{badge}</span>
                  : <span class="kjun-navigation-label">{item.label}{badge}</span>}
              </a>
            );
          })}
        </nav>
      );
    };
  },
});

const kjunBottomActionBarProps = {
  description: { type: String, default: undefined },
  /** Keeps clear of the screen's safe area from KjunProvider; false where the app already reserved it. */
  safeArea: { type: Boolean, default: true },
  keyboardVisible: { type: Boolean, default: false },
  hideOnKeyboard: { type: Boolean, default: false },
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface: { type: Boolean, default: true },
  /** "floating" is a capsule detached from the screen edge, like KjunFloatingNavigation: the description and the actions sit on one line and unsized buttons in it are lg pills. */
  variant: { type: String as PropType<"docked" | "floating">, default: "docked" },
  /** Names the bar as a region (landmark) that screen readers can jump to, e.g. "Order summary". */
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunBottomActionBarProps = ExtractPublicPropTypes<typeof kjunBottomActionBarProps>;
export const KjunBottomActionBar = defineComponent({
  name: "KjunBottomActionBar",
  props: kjunBottomActionBarProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const bar = useBottomBar();
    return () => {
      if (props.keyboardVisible && props.hideOnKeyboard) return null;
      const floating = props.variant === "floating", inset = floating ? tokens.extensions.floatingNavigation.offset : tokens.extensions.navigation.padding;
      const actions = <div class="kjun-navigation-actions">{slots.default?.()}</div>;
      return (
        <div ref={bar} class="kjun-bottom-action-bar" role={props.ariaLabel ? "region" : undefined} aria-label={props.ariaLabel} data-variant={floating ? "floating" : undefined} data-surface={props.surface ? undefined : "false"} style={{ paddingBottom: `calc(${inset}px + ${webSafeBottom(props.safeArea)})` }}>
          <div class="kjun-bottom-action-content">{props.description && <p>{props.description}</p>}{floating ? <KjunActionSize size="lg" shape="pill">{actions}</KjunActionSize> : actions}</div>
        </div>
      );
    };
  },
});
