import { useKjunMessages } from "./runtime/messages";
import { sideNavigationRailRequest, type SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunDrawer } from "./drawer";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";

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
} as const;
export type KjunSideNavigationLayoutProps = ExtractPublicPropTypes<typeof kjunSideNavigationLayoutProps>;

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
 * menu in the drawer and close the drawer after navigating; default, the page beside the menu. Events: update:navOpen,
 * update:collapsed. */
export const KjunSideNavigationLayout = defineComponent({
  name: "KjunSideNavigationLayout",
  props: kjunSideNavigationLayoutProps,
  emits: { "update:navOpen": (_open: boolean) => true, "update:collapsed": (_collapsed: boolean) => true },
  slots: Object as SlotsType<{ nav?: (state: SideNavigationLayoutState) => VNodeChild; default?: () => VNodeChild }>,
  setup(props, { emit, slots }) {
    const m = useKjunMessages();
    // Widening past the breakpoint takes the drawer away, so it closes rather than opening again on the next narrowing.
    const narrow = useNarrow(() => props.breakpoint, next => { if (!next && props.navOpen) emit("update:navOpen", false); });
    let wasBelow: boolean | null = null;
    const below = useNarrow(() => props.railBreakpoint, () => {});
    watch([below, () => props.railBreakpoint], () => {
      if (props.railBreakpoint <= 0) { wasBelow = null; return; }
      const request = sideNavigationRailRequest(wasBelow, below.value, props.collapsed);
      wasBelow = below.value;
      if (request !== null) emit("update:collapsed", request);
    }, { immediate: true });
    const closeDrawer = () => { if (props.navOpen) emit("update:navOpen", false); };

    return () => {
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
