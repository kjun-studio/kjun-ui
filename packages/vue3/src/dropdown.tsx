import { useKjunMessages } from "./runtime/messages";
import { cloneVNode, computed, defineComponent, inject, isVNode, mergeProps, onUpdated, provide, ref, shallowRef, watch, nextTick,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type ButtonSize, type ButtonVariant } from "@kjun-ui/tokens";
import { isFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { KjunButton, KjunIcon } from "./button";
import { FloatingPanel, focusReturnProp, readFocusReturn } from "./floating-panel";
import { useKjunId } from "./input";
import { KjunTooltip } from "./popover";
import { useFocusVisible } from "./runtime/focus-visible";

interface MenuContext { close: () => void; focused: { value: HTMLElement | null }; visible: { value: boolean } }
const kjunDropdownKey: InjectionKey<MenuContext> = Symbol("kjunDropdown");
const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>(':is([role="menuitem"], [role="menuitemradio"]):not([data-disabled])')];

const kjunDropdownProps = {
  /** v-model:open; omit for internal visibility. */
  open: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  placement: { type: String as PropType<"bottom-start" | "bottom-end" | "top-start" | "top-end">, default: "bottom-start" },
  menuId: { type: String, default: undefined },
  triggerId: { type: String, default: undefined },
  menuClass: { type: String, default: "" },
  /** Where focus goes when the menu closes by choosing or Escape, instead of the trigger (e.g. an edited cell). Web only. */
  returnFocus: focusReturnProp,
} as const;
export type KjunDropdownProps = ExtractPublicPropTypes<typeof kjunDropdownProps>;
/**
 * Slots: trigger (a KjunButton, optionally inside a KjunTooltip), default (KjunDropdownItem / KjunDropdownDivider).
 * Events: open, close. The menu follows react-aria's Menu: first item focused, arrows, Home/End and typeahead.
 */
export const KjunDropdown = defineComponent({
  name: "KjunDropdown",
  inheritAttrs: false,
  props: kjunDropdownProps,
  emits: { "update:open": (_open: boolean) => true, open: () => true, close: () => true },
  slots: Object as SlotsType<{
    trigger?: () => VNodeChild;
    default?: () => VNodeChild;
  }>,
  setup(props, { attrs, slots, emit }) {
    const internal = ref(false), unavailable = ref(false);
    const requested = computed(() => props.open ?? internal.value);
    const open = computed(() => requested.value && !props.disabled && !unavailable.value);
    const wrapper = ref<HTMLElement | null>(null), menu = ref<HTMLElement | null>(null);
    const uid = useKjunId("kjun-");
    const focused = shallowRef<HTMLElement | null>(null), visible = ref(false);
    const button = () => wrapper.value?.querySelector<HTMLButtonElement>("button") ?? null;
    const controlId = () => props.triggerId || button()?.id || uid;
    const popupId = computed(() => props.menuId || uid + "-menu");
    const change = (value: boolean) => {
      // The rendered button also covers its minimum loading interval.
      if (value === requested.value || (value && (props.disabled || button()?.disabled))) return;
      if (props.open === undefined) internal.value = value;
      emit("update:open", value);
    };
    // Lifecycle events describe accepted visibility, not a request the parent may reject.
    watch(open, (value, previous) => { if (value) emit("open"); else if (previous) emit("close"); }, { immediate: true });
    provide(kjunDropdownKey, { close: () => change(false), focused, visible });
    // React clones the trigger with these attributes; here they go on the rendered button.
    const bindTrigger = () => {
      const node = button();
      if (!node) return;
      // Like React: an explicit triggerId wins, otherwise the trigger keeps its own id.
      if (props.triggerId) node.id = props.triggerId;
      else if (!node.id) node.id = controlId();
      node.setAttribute("aria-haspopup", "menu");
      node.setAttribute("aria-expanded", String(open.value));
      if (open.value) node.setAttribute("aria-controls", popupId.value); else node.removeAttribute("aria-controls");
      // A disabled or loading trigger closes its menu, like React's `unavailable`.
      unavailable.value = node.disabled;
    };
    // A child's minimum loading interval can end without rerendering this component.
    watch(wrapper, (element, _previous, onCleanup) => {
      if (!element) return;
      const observer = new MutationObserver(bindTrigger);
      observer.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled"] });
      onCleanup(() => observer.disconnect());
    }, { flush: "post" });
    watch(() => [open.value, props.disabled, wrapper.value], bindTrigger, { flush: "post", immediate: true });
    onUpdated(bindTrigger);
    watch([requested, () => props.disabled, unavailable], ([value, disabled, blocked]) => {
      if (value && (disabled || blocked)) change(false);
    });
    const focusItem = (item: HTMLElement | undefined) => {
      if (!item) return;
      focused.value = item;
      visible.value = isFocusVisible();
      item.focus({ preventScroll: true });
    };
    // Autofocus the first item, like react-aria's autoFocus="first".
    watch([menu, open], ([element, shown], _previous, onCleanup) => {
      if (!element || !shown) return;
      let cancelled = false;
      onCleanup(() => { cancelled = true; });
      nextTick(() => { if (!cancelled && open.value && menu.value === element) focusItem(items(element)[0]); });
    }, { flush: "post" });
    watch(open, value => { if (!value) { focused.value = null; visible.value = false; } });
    // Let Vue restore the original disabled/aria-disabled props when the wrapper is re-enabled.
    const disabledTrigger = (node: VNodeChild): VNodeChild => Array.isArray(node) ? node.map(disabledTrigger)
      : isVNode(node) ? cloneVNode(node, { disabled: true, "aria-disabled": "true" }) : node;
    let typed = "", typedAt = 0;
    const onMenuKeydown = (event: KeyboardEvent) => {
      const list = items(menu.value!), current = list.indexOf(document.activeElement as HTMLElement);
      const go = (index: number) => { event.preventDefault(); focusItem(list[index]); };
      if (event.key === "ArrowDown") go(current < 0 ? 0 : Math.min(list.length - 1, current + 1));
      else if (event.key === "ArrowUp") go(current < 0 ? list.length - 1 : Math.max(0, current - 1));
      else if (event.key === "Home" || event.key === "PageUp") go(0);
      else if (event.key === "End" || event.key === "PageDown") go(list.length - 1);
      else if (event.key === "Tab") change(false);
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
        const now = Date.now();
        typed = (now - typedAt > 1000 ? "" : typed) + event.key.toLocaleLowerCase();
        typedAt = now;
        const start = Math.max(0, current);
        const order = [...list.slice(start), ...list.slice(0, start)];
        const match = order.find(item => (item.dataset.textValue || item.textContent || "").trim().toLocaleLowerCase().startsWith(typed));
        if (match) go(list.indexOf(match));
      }
    };
    return () => (
      <>
        <div {...mergeProps(attrs, { class: "kjun-layer-trigger",
          onClickCapture: (event: MouseEvent) => { if (!event.defaultPrevented) change(!open.value); },
          onKeydown: (event: KeyboardEvent) => { if (!event.defaultPrevented && ["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); change(true); } },
        })} ref={wrapper}>
          <span>{props.disabled ? disabledTrigger(slots.trigger?.()) : slots.trigger?.()}</span>
        </div>
        <FloatingPanel open={open.value} onOpenChange={change} trigger={() => wrapper.value} placement={props.placement} panelClass="kjun-dropdown"
          returnFocus={props.returnFocus === undefined ? undefined : () => readFocusReturn(props.returnFocus)}>
          {{ default: () => (
            <div ref={menu} id={popupId.value} aria-labelledby={controlId()} class={"kjun-menu " + props.menuClass} role="menu" tabindex={-1}
              onKeydown={onMenuKeydown} onFocus={() => focusItem(focused.value ?? items(menu.value!)[0])}>
              {slots.default?.()}
            </div>
          ) }}
        </FloatingPanel>
      </>
    );
  },
});

const kjunDropdownItemProps = {
  id: { type: String, default: undefined },
  variant: { type: String as PropType<"default" | "danger">, default: "default" },
  icon: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  selected: { type: Boolean as PropType<boolean | null>, default: null },
  textValue: { type: String, default: undefined },
} as const;
export type KjunDropdownItemProps = ExtractPublicPropTypes<typeof kjunDropdownItemProps>;
/** Default slot: the item label. Event: click (then the menu closes). */
export const KjunDropdownItem = defineComponent({
  name: "KjunDropdownItem",
  props: kjunDropdownItemProps,
  emits: { click: (_event: MouseEvent | KeyboardEvent) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const menu = inject(kjunDropdownKey, null);
    const item = ref<HTMLElement | null>(null);
    const focus = useFocusVisible();
    const action = (event: MouseEvent | KeyboardEvent) => { if (props.disabled) return; emit("click", event); menu?.close(); };
    return () => {
      const isFocused = !!item.value && menu?.focused.value === item.value;
      return (
        <div ref={item} id={props.id} class="kjun-menu-item" data-variant={props.variant}
          // A boolean `selected` makes this a single-choice item, like Native's radio.
          role={props.selected === null ? "menuitem" : "menuitemradio"} aria-checked={props.selected === null ? undefined : props.selected}
          data-kjun-selected={props.selected === true || undefined} data-text-value={props.textValue}
          tabindex={props.disabled ? undefined : isFocused ? 0 : -1} aria-disabled={props.disabled ? "true" : undefined}
          data-disabled={props.disabled || undefined} data-focused={isFocused || undefined}
          data-focus-visible={(isFocused && menu?.visible.value) || undefined}
          onClick={action}
          onKeydown={(event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!event.repeat) action(event); } }}
          // react-aria moves focus to the hovered item.
          onPointermove={() => { if (!props.disabled && item.value && document.activeElement !== item.value) { if (menu) { menu.focused.value = item.value; menu.visible.value = false; } item.value.focus({ preventScroll: true }); } }}
          onFocus={() => { focus.onFocus(); if (menu && item.value) { menu.focused.value = item.value; menu.visible.value = isFocusVisible(); } }}
          onBlur={focus.onBlur}>
          {props.icon && <KjunIcon name={props.icon} class="kjun-menu-icon" size={tokens.extensions.menu.iconSize} />}
          <span>{slots.default?.()}</span>
          {props.selected !== null && <KjunIcon name="check" class="kjun-menu-check" size={tokens.extensions.menu.iconSize}
            style={{ visibility: props.selected ? "visible" : "hidden" }} />}
        </div>
      );
    };
  },
});

export const KjunDropdownDivider = defineComponent({
  name: "KjunDropdownDivider",
  setup: () => () => <div role="separator" class="kjun-menu-divider" />,
});

const kjunMenuButtonProps = {
  ...kjunDropdownProps,
  label: { type: String, default: undefined },
  size: { type: String as PropType<ButtonSize>, default: "md" },
  variant: { type: String as PropType<ButtonVariant>, default: "secondary" },
  /** Show a square dots-vertical button; label remains its accessible name. */
  compact: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  tooltip: { type: String, default: undefined },
  tooltipPlacement: { type: String as PropType<"top" | "bottom" | "left" | "right">, default: undefined },
  tooltipDelay: { type: Number, default: undefined },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunMenuButtonProps = ExtractPublicPropTypes<typeof kjunMenuButtonProps>;
/** Default slot: menu items. Events: open, close. */
export const KjunMenuButton = defineComponent({
  name: "KjunMenuButton",
  props: kjunMenuButtonProps,
  emits: { "update:open": (_open: boolean) => true, open: () => true, close: () => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const open = ref(false);
    return () => {
      const button = () => (
        <KjunButton class="kjun-menu-button" size={props.size} variant={props.variant} disabled={props.disabled} loading={props.loading}
          prefixIcon={props.compact || !props.label ? "dots-vertical" : undefined}
          suffixIcon={!props.compact && props.label ? open.value ? "chevron-up" : "chevron-down" : undefined}
          ariaLabel={props.ariaLabel || props.label || props.tooltip || m.value.menu}>
          {{ default: () => props.compact ? undefined : props.label }}
        </KjunButton>
      );
      return (
        <KjunDropdown open={props.open} onUpdate:open={(value: boolean) => emit("update:open", value)} disabled={props.disabled} placement={props.placement} menuId={props.menuId} triggerId={props.triggerId} menuClass={props.menuClass} returnFocus={props.returnFocus}
          onOpen={() => { open.value = true; emit("open"); }} onClose={() => { open.value = false; emit("close"); }}>
          {{
            trigger: () => props.tooltip
              ? <KjunTooltip content={open.value ? "" : props.tooltip} placement={props.tooltipPlacement} delay={props.tooltipDelay}>{{ default: button }}</KjunTooltip>
              : button(),
            default: () => slots.default?.(),
          }}
        </KjunDropdown>
      );
    };
  },
});
