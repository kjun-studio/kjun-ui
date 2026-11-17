import { useKjunMessages } from "./runtime/messages";
import type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunDrawer } from "./drawer";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";

/** Where the menu is drawn: in the column (collapsed or open) or in the drawer of a narrow screen, which is always open. */
export type SideNavigationLayoutState = { collapsed: boolean; drawer: boolean };

const kjunSideNavigationLayoutProps = {
  /** The column shrinks to the rail of icons. Pass the same value to the menu. */
  collapsed: { type: Boolean, default: false },
  /** The menu shows names under its icons while collapsed (KjunSideNavigation railLabels), so the rail is wider. */
  railLabels: { type: Boolean, default: false },
  /** The open column's width: sm 224, md 256 (default), lg 288. */
  width: { type: String as PropType<SideNavigationWidth>, default: "md" },
  /** The column stays in view as the page scrolls (default), the viewport's height, scrolling on its own. false lets it
   * scroll away with the page. */
  sticky: { type: Boolean, default: true },
  /** Below this viewport width the column goes away and the menu opens in a drawer from the start edge (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint: { type: Number, default: tokens.responsive.sideNavigationLayout },
  /** v-model:navOpen: the drawer of a narrow screen. Open it from the app's own menu button, and close it on the menu's navigate. */
  navOpen: { type: Boolean, default: false },
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel: { type: String, default: undefined },
} as const;
export type KjunSideNavigationLayoutProps = ExtractPublicPropTypes<typeof kjunSideNavigationLayoutProps>;

/** A page with a side menu: a column that keeps the menu's width tokens (open or collapsed, sticky by default) beside the
 * page, and a drawer for the menu below a breakpoint. The column's width follows collapsed with the collapse motion.
 * Slots: nav({ collapsed, drawer }), the menu, usually a KjunSideNavigation: pass collapsed on, and show the full menu in
 * the drawer; default, the page beside the menu. Events: update:navOpen. */
export const KjunSideNavigationLayout = defineComponent({
  name: "KjunSideNavigationLayout",
  props: kjunSideNavigationLayoutProps,
  emits: { "update:navOpen": (_open: boolean) => true },
  slots: Object as SlotsType<{ nav?: (state: SideNavigationLayoutState) => VNodeChild; default?: () => VNodeChild }>,
  setup(props, { emit, slots }) {
    const m = useKjunMessages();
    // Whether the viewport is narrower than the breakpoint. The server and the first render take the wide layout.
    const narrow = ref(false);
    let media: MediaQueryList | null = null;
    const sync = () => { narrow.value = props.breakpoint > 0 && !!media?.matches; };
    const stop = () => { media?.removeEventListener("change", sync); media = null; };
    const listen = () => {
      stop();
      if (typeof matchMedia === "function") { media = matchMedia(`(width < ${props.breakpoint}px)`); media.addEventListener("change", sync); }
      sync();
    };
    onMounted(listen);
    watch(() => props.breakpoint, listen);
    onBeforeUnmount(stop);

    return () => {
      const menu = (state: SideNavigationLayoutState) => slots.nav?.(state);
      if (narrow.value) return <div class="kjun-side-navigation-layout" data-drawer="">
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
        <KjunDrawer open={props.navOpen} onUpdate:open={(next: boolean) => emit("update:navOpen", next)} position="left" ariaLabel={props.drawerLabel ?? m.value.mainNavigation}
          width={tokens.extensions.sideNavigation.width[props.width]}>{{ default: () => menu({ collapsed: false, drawer: true }) }}</KjunDrawer>
      </div>;
      return <div class="kjun-side-navigation-layout" data-width={props.width === "md" ? undefined : props.width} data-collapsed={props.collapsed ? "" : undefined}
        data-rail-labels={props.collapsed && props.railLabels ? "" : undefined} data-sticky={props.sticky ? undefined : "false"}>
        <div class="kjun-side-navigation-layout-nav">{menu({ collapsed: props.collapsed, drawer: false })}</div>
        <div class="kjun-side-navigation-layout-main">{slots.default?.()}</div>
      </div>;
    };
  },
});
