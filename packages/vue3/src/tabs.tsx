import { useKjunMessages } from "./runtime/messages";
import { Fragment, camelize, computed, defineComponent, inject, onBeforeUnmount, onMounted, onUpdated, provide, ref, watch,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type VNode, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { isFocusVisible, installFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { manageTabList, panelNeedsFocus } from "../../../shared/package-runtime/tab-keyboard";
import { KjunIcon } from "./button";
import { useSelectionIndicator } from "./controls";
import { useKjunId } from "./input";

export interface TabItem {
  name: string;
  label: string;
  icon?: string;
  badge?: string | number | null;
  badgeVariant?: "danger" | "success" | "warning" | "info";
  disabled?: boolean;
}
export interface TabMenuEvent { name: string; x: number; y: number; pointer: "mouse" | "touch" }

interface TabsContext { selected: () => string; tabId: (name: string) => string; panelId: (name: string) => string }
const kjunTabsKey: InjectionKey<TabsContext> = Symbol("kjunTabs");

/** Pane props read from the default slot, like React reads its TabPane children. */
function paneItems(nodes: VNode[] | undefined): TabItem[] {
  const items: TabItem[] = [];
  for (const node of nodes ?? []) {
    if (node.type === Fragment) { items.push(...paneItems(node.children as VNode[])); continue; }
    if (node.type !== KjunTabPane || !node.props) continue;
    const props = Object.fromEntries(Object.entries(node.props).map(([key, value]) => [camelize(key), value]));
    // A bare `disabled` attribute in a template arrives as "".
    items.push({ ...props, disabled: props.disabled === "" || !!props.disabled } as TabItem);
  }
  return items;
}

/** A single initial request per candidate when the controlled value is empty. */
function useInitialTab(value: () => string, candidate: () => string | undefined, change: (name: string) => void) {
  const requested = new Set<string>();
  watch([value, candidate], ([current, next]) => {
    if (current !== "") { requested.clear(); return; }
    if (next === undefined || next === "" || requested.has(next)) return;
    requested.add(next);
    change(next);
  }, { immediate: true, flush: "post" });
}

const kjunTabsProps = {
  modelValue: { type: String, default: "" },
  items: { type: Array as PropType<TabItem[]>, default: () => [] },
  density: { type: String as PropType<"comfortable" | "compact">, default: "comfortable" },
  variant: { type: String as PropType<"underline" | "pills">, default: "underline" },
  /** Keep the header inside its scroll container while the tab panels scroll. */
  stickyHeader: { type: Boolean, default: false },
  stickyOffset: { type: [Number, String] as PropType<number | string>, default: 0 },
  ariaLabel: { type: String, default: undefined },
  /** Declared as a prop so the tab menu only engages when the app listens. */
  onTabMenu: { type: Function as PropType<(event: TabMenuEvent) => void>, default: undefined },
} as const;
export type KjunTabsProps = ExtractPublicPropTypes<typeof kjunTabsProps>;
/** v-model is the selected tab name. Slots: default (KjunTabPane), actions. Events: change, tab-menu. */
export const KjunTabs = defineComponent({
  name: "KjunTabs",
  props: kjunTabsProps,
  emits: { "update:modelValue": (_name: string) => true, change: (_name: string) => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const { group, indicator } = useSelectionIndicator(true);
    const listId = useKjunId("kjun-");
    const panes = ref<TabItem[]>([]);
    const tabs = computed(() => props.items.length ? props.items : panes.value);
    const change = (name: string) => { emit("update:modelValue", name); emit("change", name); };
    useInitialTab(() => props.modelValue, () => tabs.value.find(tab => !tab.disabled)?.name, change);
    provide(kjunTabsKey, {
      selected: () => props.modelValue,
      tabId: name => `${listId}-tab-${name}`,
      panelId: name => `${listId}-tabpanel-${name}`,
    });
    const list = ref<HTMLElement | null>(null), root = ref<HTMLElement | null>(null);
    const focused = ref<string | null>(null), visible = ref(false), hovered = ref<string | null>(null), within = ref(false);
    let stop: (() => void) | undefined, uninstall: (() => void) | undefined;
    const select = (name: string) => { if (name !== props.modelValue) change(name); };
    onMounted(() => { uninstall = installFocusVisible(document); if (list.value) stop = manageTabList(list.value, select); });
    onBeforeUnmount(() => { stop?.(); uninstall?.(); clear(); });

    let timer: ReturnType<typeof setTimeout> | undefined, press: { name: string; x: number; y: number } | null = null;
    const canOpenMenu = (name: string) => !!props.onTabMenu && tabs.value.some(tab => tab.name === name && !tab.disabled);
    function clear() { clearTimeout(timer); press = null; }
    watch([tabs, () => props.onTabMenu], () => { if (press && !canOpenMenu(press.name)) clear(); }, { flush: "sync" });

    return () => {
      const content = slots.default?.() as VNode[] | undefined;
      // Pane props come from this render's slot; keep the list in step without another render pass.
      const fromSlot = paneItems(content);
      if (JSON.stringify(fromSlot) !== JSON.stringify(panes.value)) panes.value = fromSlot;
      const panelNames = new Set(fromSlot.map(pane => pane.name));
      const tabList = props.items.length ? props.items : fromSlot;
      return (
        <div ref={root} class="kjun-tabs" data-variant={props.variant} data-density={props.density} data-orientation="horizontal"
          data-focused={within.value || undefined}
          onFocusin={() => { within.value = true; }} onFocusout={(event: FocusEvent) => { if (!root.value?.contains(event.relatedTarget as Node)) within.value = false; }}>
          <div class="kjun-tabs-header" data-sticky={props.stickyHeader || undefined}
            style={props.stickyHeader ? { position: "sticky", top: typeof props.stickyOffset === "number" ? `${props.stickyOffset}px` : props.stickyOffset,
              zIndex: tokens.layers.page.sticky, background: "var(--_kjun-color-surface)" } : undefined}>
            <div class="kjun-tabs-track" ref={group} tabindex={-1}>
              <div ref={list} class="kjun-tabs-list" id={listId} role="tablist" aria-label={(props.ariaLabel ?? m.value.tabs)} aria-orientation="horizontal"
                data-orientation="horizontal" tabindex={-1}>
                {tabList.map(tab => {
                  const selected = tab.name === props.modelValue;
                  return (
                    <div key={tab.name} id={`${listId}-tab-${tab.name}`} data-tab-name={tab.name} class="kjun-tab" role="tab"
                      tabindex={selected && !tab.disabled ? 0 : -1} aria-selected={selected ? "true" : "false"}
                      aria-controls={selected && panelNames.has(tab.name) ? `${listId}-tabpanel-${tab.name}` : undefined}
                      aria-disabled={tab.disabled ? "true" : undefined} data-disabled={tab.disabled || undefined}
                      data-selected={selected || undefined} data-hovered={hovered.value === tab.name || undefined}
                      data-focused={focused.value === tab.name || undefined} data-focus-visible={(focused.value === tab.name && visible.value) || undefined}
                      onFocus={() => { focused.value = tab.name; visible.value = isFocusVisible(); }}
                      onBlur={() => { if (focused.value === tab.name) focused.value = null; }}
                      onPointerenter={(event: PointerEvent) => { if (event.pointerType === "mouse" && !tab.disabled) hovered.value = tab.name; }}
                      onPointerleave={() => { if (hovered.value === tab.name) hovered.value = null; }}
                      onClick={() => { if (!tab.disabled) select(tab.name); }}
                      onContextmenu={(event: MouseEvent) => {
                        if (props.onTabMenu && !tab.disabled) {
                          event.preventDefault();
                          props.onTabMenu({ name: tab.name, x: event.clientX, y: event.clientY, pointer: "mouse" });
                        }
                      }}
                      onTouchstart={(event: TouchEvent) => {
                        clear();
                        if (!canOpenMenu(tab.name)) return;
                        const touch = event.touches[0];
                        if (!touch) return;
                        press = { name: tab.name, x: touch.clientX, y: touch.clientY };
                        timer = setTimeout(() => {
                          const pending = press;
                          clear();
                          if (pending && canOpenMenu(pending.name)) props.onTabMenu?.({ ...pending, pointer: "touch" });
                        }, 500);
                      }}
                      onTouchmove={(event: TouchEvent) => {
                        const touch = event.touches[0];
                        if (press && touch && (Math.abs(touch.clientX - press.x) > 10 || Math.abs(touch.clientY - press.y) > 10)) clear();
                      }}
                      onTouchend={clear} onTouchcancel={clear}>
                      {tab.icon && <KjunIcon name={tab.icon} size={tokens.extensions.tabs.iconSize} />} <span class="kjun-motion-label" data-label={tab.label}><span>{tab.label}</span></span>
                      {tab.badge != null && (
                        <span class="kjun-tab-badge" style={{ color: tab.badgeVariant ? `var(--_kjun-color-${tab.badgeVariant})` : undefined }}>{tab.badge}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span ref={indicator} class="kjun-tab-indicator" aria-hidden="true" hidden />
            </div>
            {slots.actions?.()}
          </div>
          {content?.length ? <div class="kjun-tab-content">{content}</div> : null}
        </div>
      );
    };
  },
});

const kjunTabPaneProps = {
  name: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: undefined },
  badge: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  badgeVariant: { type: String as PropType<TabItem["badgeVariant"]>, default: undefined },
  disabled: { type: Boolean, default: false },
} as const;
export type KjunTabPaneProps = ExtractPublicPropTypes<typeof kjunTabPaneProps>;
/** Panels stay mounted; an unselected panel is inert and hidden so its state survives. */
export const KjunTabPane = defineComponent({
  name: "KjunTabPane",
  props: kjunTabPaneProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const tabs = inject(kjunTabsKey, null);
    const panel = ref<HTMLElement | null>(null);
    const selected = () => tabs?.selected() === props.name;
    // react-aria's panel is a tab stop only while it starts with readable content.
    const sync = () => {
      const el = panel.value;
      if (!el) return;
      // Write only on change: the observer below would otherwise see its own write.
      const stop = selected() && panelNeedsFocus(el);
      if (stop && el.getAttribute("tabindex") !== "0") el.tabIndex = 0;
      else if (!stop && el.hasAttribute("tabindex")) el.removeAttribute("tabindex");
    };
    let observer: MutationObserver | undefined;
    onMounted(() => {
      sync();
      observer = new MutationObserver(sync);
      if (panel.value) observer.observe(panel.value, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "tabindex", "hidden", "aria-hidden"] });
    });
    onUpdated(sync);
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const active = selected();
      return (
        <div ref={panel} class="kjun-tab-panel" id={active ? tabs?.panelId(props.name) : undefined} role={active ? "tabpanel" : undefined}
          aria-labelledby={active ? tabs?.tabId(props.name) : undefined} inert={!active} data-inert={active ? undefined : "true"}
          style={{ display: active ? undefined : "none" }}>
          {slots.default?.()}
        </div>
      );
    };
  },
});
