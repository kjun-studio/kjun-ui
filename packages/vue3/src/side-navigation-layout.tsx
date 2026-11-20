import { useKjunMessages } from "./runtime/messages";
import { sideNavigationRailRequest, type SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { spacesColumnWidth, spacesFocusAfterChange, spacesIgnoredProps, type SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";
import { developmentMode } from "../../../shared/package-runtime/development";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { onBeforeUnmount, onMounted, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunDrawer } from "./drawer";
import { KjunIcon } from "./button";
import { KjunTooltip } from "./popover";
import { provideFallbackIcons } from "./runtime/icons";
import { useReducedMotion } from "./runtime/presence";
import { hasContent } from "./runtime/slots";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
export type { SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";

/** Where the menu is drawn: in the column (collapsed or open) or in the drawer of a narrow screen, which is always open.
 * closeDrawer closes that drawer, e.g. on the menu's navigate; in the column it does nothing. */
export type SideNavigationLayoutState = { collapsed: boolean; drawer: boolean; closeDrawer: () => void };

const kjunSideNavigationLayoutProps = {
  /** v-model:collapsed: the column shrinks to the rail of icons. Pass the same value to the menu. update:collapsed comes
   * from railBreakpoint. */
  collapsed: { type: Boolean, default: false },
  /** Below this viewport width the column asks to shrink to the rail (update:collapsed true), and above it to widen
   * again; between crossings the menu's own toggle stands. Default 0, off. */
  railBreakpoint: { type: Number, default: 0 },
  /** The menu shows names under its icons while collapsed (KjunSideNavigation railLabels), so the rail is wider. */
  railLabels: { type: Boolean, default: false },
  /** The open column's width: sm 224, md 256 (default), lg 288. */
  width: { type: String as PropType<SideNavigationWidth>, default: "md" },
  /** The column stays in view as the page scrolls (default), the viewport's height, scrolling on its own. false lets it
   * scroll away with the page. */
  sticky: { type: Boolean, default: true },
  /** How far below the viewport's top the sticky column stays, such as the height of a fixed top bar; the column is
   * that much shorter than the viewport. Default 0. */
  stickyOffset: { type: Number, default: 0 },
  /** Below this viewport width the column goes away and the menu opens in a drawer from the start edge (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint: { type: Number, default: tokens.responsive.sideNavigationLayout },
  /** v-model:navOpen: the drawer of a narrow screen. Open it from the app's own menu button, and close it with the nav
   * slot's closeDrawer. Widening past the breakpoint closes it (update:navOpen false). */
  navOpen: { type: Boolean, default: false },
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel: { type: String, default: undefined },
  /** The chosen space's name at the top of the menu panel, on one line (or the spacesTitle slot). Applies with the spaces slot. */
  spacesTitle: { type: String, default: undefined },
  /** The panel beside the spaces slot: a card set into the band ("card", default) or flat against it with a line before the page. */
  panelSurface: { type: String as PropType<SideNavigationPanelSurface>, default: "card" },
  /** v-model:panelCollapsed: the panel is collapsed and only the spaces rail stays; the rail's top cell then holds the expand button. */
  panelCollapsed: { type: Boolean, default: false },
  /** The panel's name for assistive technology; "메뉴 패널" by default. */
  panelLabel: { type: String, default: undefined },
} as const;
export type KjunSideNavigationLayoutProps = ExtractPublicPropTypes<typeof kjunSideNavigationLayoutProps>;

/** The panel toggles' icons are outside the default icon set; this wrapper provides them to its own icon only, so the
 * layout's page keeps the app's icon set as it is. */
const PanelToggleIcon = defineComponent({
  name: "KjunSideNavigationLayoutToggleIcon",
  props: { name: { type: String, required: true } },
  setup(props) {
    provideFallbackIcons(componentIcons);
    return () => <KjunIcon name={props.name} size={tokens.extensions.sideNavigation.iconSize} />;
  },
});

/** Whether the viewport is narrower than a width (never for 0), following the width as it changes. The server and the
 * first render take the wide layout. */
function useNarrow(breakpoint: () => number, changed: (narrow: boolean) => void) {
  const narrow = ref(false);
  let media: MediaQueryList | null = null;
  const sync = () => { const next = breakpoint() > 0 && !!media?.matches; if (next !== narrow.value) { narrow.value = next; changed(next); } };
  const stop = () => { media?.removeEventListener("change", sync); media = null; };
  const listen = () => {
    stop();
    if (typeof matchMedia === "function" && breakpoint() > 0) { media = matchMedia(`(width < ${breakpoint()}px)`); media.addEventListener("change", sync); }
    sync();
  };
  onMounted(listen);
  watch(breakpoint, listen);
  onBeforeUnmount(stop);
  return narrow;
}

/** A page with a side menu: a column that keeps the menu's width tokens (open or collapsed, sticky by default) beside the
 * page, and a drawer for the menu below a breakpoint. The column's width follows collapsed with the collapse motion.
 * Slots: nav({ collapsed, drawer, closeDrawer }), the menu, usually a KjunSideNavigation: pass collapsed on, show the full
 * menu in the drawer and close the drawer after navigating; default, the page beside the menu. spaces(state), a rail of
 * spaces (usually a collapsed KjunSideNavigation) before a menu panel that holds nav: both sit in a band in the
 * navigation-rail-bg colour, the panel's head shows spacesTitle (or the spacesTitle slot) and a collapse button, and below
 * the breakpoint the drawer holds both. With spaces, collapsed, railLabels and width do not apply, and railBreakpoint asks
 * update:panelCollapsed instead. Events: update:navOpen, update:collapsed, update:panelCollapsed. */
export const KjunSideNavigationLayout = defineComponent({
  name: "KjunSideNavigationLayout",
  props: kjunSideNavigationLayoutProps,
  emits: { "update:navOpen": (_open: boolean) => true, "update:collapsed": (_collapsed: boolean) => true, "update:panelCollapsed": (_collapsed: boolean) => true },
  slots: Object as SlotsType<{ nav?: (state: SideNavigationLayoutState) => VNodeChild; spaces?: (state: SideNavigationLayoutState) => VNodeChild;
    spacesTitle?: () => VNodeChild; default?: () => VNodeChild }>,
  setup(props, { emit, slots }) {
    const m = useKjunMessages();
    // Widening past the breakpoint takes the drawer away, so it closes rather than opening again on the next narrowing.
    const narrow = useNarrow(() => props.breakpoint, next => { if (!next && props.navOpen) emit("update:navOpen", false); });
    // With spaces the rail is the collapsed column, so railBreakpoint folds the panel instead.
    const spaced = () => !!slots.spaces;
    let wasBelow: boolean | null = null;
    const below = useNarrow(() => props.railBreakpoint, () => {});
    watch([below, () => props.railBreakpoint], () => {
      if (props.railBreakpoint <= 0) { wasBelow = null; return; }
      const request = sideNavigationRailRequest(wasBelow, below.value, spaced() ? props.panelCollapsed : props.collapsed);
      wasBelow = below.value;
      if (request !== null) spaced() ? emit("update:panelCollapsed", request) : emit("update:collapsed", request);
    }, { immediate: true });
    const reduced = useReducedMotion(), panelId = "kjun-side-panel-" + useId().replace(/[^\w-]/g, "");
    const panel = ref<HTMLElement | null>(null), expand = ref<HTMLButtonElement | null>(null), collapse = ref<HTMLButtonElement | null>(null);
    // A collapsing panel stays in the page while the column narrows, then leaves the tab order and the accessibility tree.
    const settled = ref(props.panelCollapsed);
    let byButton = false, timer: ReturnType<typeof setTimeout> | undefined, warned = false;
    watch(() => props.panelCollapsed, (next, _previous, onCleanup) => {
      const inPanel = !!panel.value && panel.value.contains(document.activeElement);
      const target = spacesFocusAfterChange(next, inPanel, byButton);
      byButton = false;
      // Focus moves once the DOM shows the new state (the expand button exists, the panel is no longer hidden).
      void Promise.resolve().then(() => { if (target === "expand") expand.value?.focus(); else if (target === "collapse") collapse.value?.focus(); });
      if (!next) { settled.value = false; return; }
      timer = setTimeout(() => { settled.value = true; }, reduced.value ? 0 : tokens.motion.collapse);
      onCleanup(() => clearTimeout(timer));
    }, { flush: "post" });
    watch(() => [spaced(), props.collapsed, props.railLabels, props.width] as const, () => {
      if (!spaced() || warned || !developmentMode()) return;
      const ignored = spacesIgnoredProps({ collapsed: props.collapsed, railLabels: props.railLabels, width: props.width });
      if (ignored.length > 0) { warned = true; console.warn(`KjunSideNavigationLayout: ${ignored.join(", ")} do not apply with spaces.`); }
    }, { immediate: true });
    const request = (next: boolean) => { byButton = true; emit("update:panelCollapsed", next); };
    const closeDrawer = () => { if (props.navOpen) emit("update:navOpen", false); };

    const toggle = (next: boolean) => {
      const label = next ? m.value.collapseSpacesPanel : m.value.expandSpacesPanel;
      return <KjunTooltip content={label} placement="right">{{ default: () =>
        <button ref={next ? collapse : expand} type="button" class="kjun-side-navigation-toggle kjun-side-navigation-layout-panel-toggle" aria-label={label}
          aria-expanded={!props.panelCollapsed} aria-controls={panelId} onClick={() => request(next)}>
          <PanelToggleIcon name={next ? "layout-sidebar-left-collapse" : "layout-sidebar-left-expand"} />
        </button> }}
      </KjunTooltip>;
    };
    const band = (drawer: boolean) => {
      const closed = !drawer && props.panelCollapsed, title = slots.spacesTitle ? slots.spacesTitle() : props.spacesTitle;
      return [
        <div class="kjun-side-navigation-layout-spaces">
          <div class="kjun-side-navigation-layout-spaces-top">{closed ? toggle(false) : null}</div>
          {slots.spaces?.({ collapsed: true, drawer, closeDrawer })}
        </div>,
        <section ref={panel} id={panelId} class="kjun-side-navigation-layout-panel" aria-label={props.panelLabel ?? m.value.spacesPanel} hidden={closed && settled.value}>
          <div class="kjun-side-navigation-layout-panel-head">
            {(typeof title === "string" ? title !== "" : hasContent(title)) ? <div class="kjun-side-navigation-layout-panel-title">{title}</div> : null}
            {drawer
              ? <button type="button" class="kjun-side-navigation-toggle kjun-side-navigation-layout-panel-toggle" aria-label={m.value.close} onClick={closeDrawer}>
                  <KjunIcon name="x" size={tokens.extensions.sideNavigation.iconSize} /></button>
              : !closed || !settled.value ? toggle(true) : null}
          </div>
          {slots.nav?.({ collapsed: false, drawer, closeDrawer })}
        </section>,
      ];
    };
    const renderSpaces = () => {
      if (narrow.value) return <div class="kjun-side-navigation-layout" data-drawer="">
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
        <KjunDrawer open={props.navOpen} onUpdate:open={(next: boolean) => emit("update:navOpen", next)} position="left" ariaLabel={props.drawerLabel ?? m.value.mainNavigation}
          width={spacesColumnWidth(tokens.extensions.sideNavigation, props.panelSurface, false)} closable={false} noPadding>
          {{ default: () => <div class="kjun-side-navigation-layout-band" data-panel-surface={props.panelSurface}>{band(true)}</div> }}</KjunDrawer>
      </div>;
      return <div class="kjun-side-navigation-layout" data-spaces="" data-panel-surface={props.panelSurface} data-panel-collapsed={props.panelCollapsed ? "" : undefined}
        data-sticky={props.sticky ? undefined : "false"} style={props.sticky && props.stickyOffset > 0 ? { "--_kjun-side-navigation-layout-top": props.stickyOffset + "px" } : undefined}>
        <div class="kjun-side-navigation-layout-nav">{band(false)}</div>
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
      </div>;
    };

    return () => {
      if (spaced()) return renderSpaces();
      const menu = (state: Omit<SideNavigationLayoutState, "closeDrawer">) => slots.nav?.({ ...state, closeDrawer });
      if (narrow.value) return <div class="kjun-side-navigation-layout" data-drawer="">
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
        <KjunDrawer open={props.navOpen} onUpdate:open={(next: boolean) => emit("update:navOpen", next)} position="left" ariaLabel={props.drawerLabel ?? m.value.mainNavigation}
          width={tokens.extensions.sideNavigation.width[props.width]}>{{ default: () => menu({ collapsed: false, drawer: true }) }}</KjunDrawer>
      </div>;
      return <div class="kjun-side-navigation-layout" data-width={props.width === "md" ? undefined : props.width} data-collapsed={props.collapsed ? "" : undefined}
        data-rail-labels={props.collapsed && props.railLabels ? "" : undefined} data-sticky={props.sticky ? undefined : "false"}
        style={props.sticky && props.stickyOffset > 0 ? { "--_kjun-side-navigation-layout-top": props.stickyOffset + "px" } : undefined}>
        <div class="kjun-side-navigation-layout-nav">{menu({ collapsed: props.collapsed, drawer: false })}</div>
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
      </div>;
    };
  },
});
