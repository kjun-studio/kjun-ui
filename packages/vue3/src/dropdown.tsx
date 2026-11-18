import { menuButtonChevron, menuButtonIcon } from "../../../shared/package-runtime/menu-button";
import { useKjunMessages } from "./runtime/messages";
import { cloneVNode, computed, inject, isVNode, mergeProps, onUpdated, provide, ref, shallowRef, watch, nextTick,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type ButtonSize, type ButtonVariant } from "@kjun-ui/tokens";
import { isFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { KjunButton, KjunIcon } from "./button";
import { FloatingPanel, focusReturnProp, readFocusReturn } from "./floating-panel";
import { useKjunId } from "./input";
import { KjunTooltip } from "./popover";
import { useFocusVisible } from "./runtime/focus-visible";
import { createTypeahead } from "../../../shared/package-runtime/typeahead";

// Submenus open in place: the menu shows one level at a time, with a back row at the top of a submenu.
interface MenuContext { close: () => void; focused: { value: HTMLElement | null }; visible: { value: boolean }; view: { value: string }; open: (key: string) => void; back: () => void }
const kjunDropdownKey: InjectionKey<MenuContext> = Symbol("kjunDropdown");
// A ref, so a submenu whose label (and so its key) changes keeps its items in step.
const kjunMenuLevelKey: InjectionKey<{ value: string }> = Symbol("kjunMenuLevel");
const topLevel = { value: "" };
// A section with a v-model makes its items with a `value` one single choice; a submenu's items leave it.
interface Choice { value: string | null; select: (value: string) => void }
const kjunMenuChoiceKey: InjectionKey<{ get: () => Choice | null }> = Symbol("kjunMenuChoice");
const noChoice = { get: () => null };
const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>(':is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not([data-disabled])')];
// Typeahead reads the label only, not its description or shortcut.
const itemText = (item: HTMLElement) => item.dataset.textValue || item.querySelector(".kjun-menu-label > span")?.textContent || item.textContent || "";

const kjunDropdownProps = {
  /** v-model:open; omit for internal visibility. */
  open: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  placement: { type: String as PropType<"bottom-start" | "bottom-end" | "top-start" | "top-end">, default: "bottom-start" },
  menuId: { type: String, default: undefined },
  triggerId: { type: String, default: undefined },
  menuClass: { type: String, default: "" },
  /** compact: 32px rows for desktop tables and toolbars (touch keeps 44px). */
  density: { type: String as PropType<"comfortable" | "compact">, default: "comfortable" },
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
    const stack = ref<string[]>([]), view = computed(() => stack.value[stack.value.length - 1] ?? "");
    // A keyboard opening lands on the first item (the last for ↑); a pointer opening paints nothing until the pointer or a key moves.
    let byKeyboard: false | "first" | "last" = false;
    // Going back from a submenu returns focus to the row that opened it.
    let returnTo = "";
    const button = () => wrapper.value?.querySelector<HTMLButtonElement>("button") ?? null;
    // A loading Button stays focusable and says aria-busy, also through its minimum loading interval.
    const blocked = (node: HTMLButtonElement | null) => !!node && (node.disabled || node.getAttribute("aria-busy") === "true");
    const controlId = () => props.triggerId || button()?.id || uid;
    const popupId = computed(() => props.menuId || uid + "-menu");
    const change = (value: boolean) => {
      // The rendered button also covers its minimum loading interval.
      if (value === requested.value || (value && (props.disabled || blocked(button())))) return;
      if (props.open === undefined) internal.value = value;
      emit("update:open", value);
    };
    // Lifecycle events describe accepted visibility, not a request the parent may reject.
    watch(open, (value, previous) => { if (value) emit("open"); else if (previous) emit("close"); }, { immediate: true });
    const openSubmenu = (key: string) => { byKeyboard = "first"; returnTo = ""; focused.value = null; stack.value = [...stack.value, key]; };
    const back = () => { returnTo = view.value; byKeyboard = "first"; focused.value = null; stack.value = stack.value.slice(0, -1); };
    provide(kjunDropdownKey, { close: () => change(false), focused, visible, view, open: openSubmenu, back });
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
      unavailable.value = blocked(node);
    };
    // A child's minimum loading interval can end without rerendering this component.
    watch(wrapper, (element, _previous, onCleanup) => {
      if (!element) return;
      const observer = new MutationObserver(bindTrigger);
      observer.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "aria-busy"] });
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
    // Like react-aria: a keyboard opening (and each submenu) focuses the first item; a pointer opening focuses the menu itself.
    watch([menu, open, view], ([element, shown], _previous, onCleanup) => {
      if (!element || !shown) return;
      let cancelled = false;
      onCleanup(() => { cancelled = true; });
      nextTick(() => {
        if (cancelled || !open.value || menu.value !== element) return;
        const list = items(element), row = returnTo && list.find(item => item.dataset.submenu === returnTo);
        returnTo = "";
        if (row) focusItem(row);
        else if (byKeyboard) focusItem(byKeyboard === "last" ? list[list.length - 1] : list[0]);
        else element.focus({ preventScroll: true });
      });
    }, { flush: "post" });
    watch(open, value => { if (!value) { focused.value = null; visible.value = false; stack.value = []; } });
    // Clone on both transitions so compiled slots receive a full props diff. Otherwise their
    // dynamic-prop list can restore disabled while leaving our injected aria-disabled behind.
    const renderTrigger = (node: VNodeChild): VNodeChild => Array.isArray(node) ? node.map(renderTrigger)
      : isVNode(node) ? cloneVNode(node, props.disabled ? { disabled: true, "aria-disabled": "true" } : {}) : node;
    const typeahead = createTypeahead();
    const onMenuKeydown = (event: KeyboardEvent) => {
      const element = menu.value;
      // An item can handle Enter/Space and close or unmount the menu before this event bubbles.
      if (event.defaultPrevented || !open.value || !element) return;
      const list = items(element), current = list.indexOf(document.activeElement as HTMLElement);
      const go = (index: number) => { event.preventDefault(); focusItem(list[index]); };
      const submenu = (document.activeElement as HTMLElement | null)?.dataset.submenu;
      if (event.key === "ArrowRight" && submenu) { event.preventDefault(); openSubmenu(submenu); return; }
      if (event.key === "ArrowLeft" && view.value) { event.preventDefault(); back(); return; }
      // Escape in a submenu steps back one level; at the top it closes the menu.
      if (event.key === "Escape" && view.value) { event.preventDefault(); event.stopPropagation(); back(); return; }
      if (event.key === "ArrowDown") go(current < 0 ? 0 : Math.min(list.length - 1, current + 1));
      else if (event.key === "ArrowUp") go(current < 0 ? list.length - 1 : Math.max(0, current - 1));
      else if (event.key === "Home" || event.key === "PageUp") go(0);
      else if (event.key === "End" || event.key === "PageDown") go(list.length - 1);
      else if (event.key === "Tab") change(false);
      else if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
        const match = typeahead(event.key, list.map(itemText), current);
        if (match >= 0) go(match);
      }
    };
    return () => (
      <>
        <div {...mergeProps(attrs, { class: "kjun-layer-trigger",
          // A click from Enter or Space has no pointer detail.
          onClickCapture: (event: MouseEvent) => { if (!event.defaultPrevented) { byKeyboard = event.detail === 0 && "first"; change(!open.value); } },
          onKeydown: (event: KeyboardEvent) => { if (!event.defaultPrevented && ["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); byKeyboard = event.key === "ArrowUp" ? "last" : "first"; change(true); } },
        })} ref={wrapper}>
          <span>{renderTrigger(slots.trigger?.())}</span>
        </div>
        <FloatingPanel open={open.value} onOpenChange={change} trigger={() => wrapper.value} placement={props.placement} panelClass="kjun-dropdown"
          returnFocus={props.returnFocus === undefined ? undefined : () => readFocusReturn(props.returnFocus)}>
          {{ default: () => (
            <div ref={menu} id={popupId.value} aria-labelledby={controlId()} class={"kjun-menu " + props.menuClass} role="menu" tabindex={-1}
              data-density={props.density === "compact" ? "compact" : undefined}
              onKeydown={onMenuKeydown} onFocus={(event: FocusEvent) => { if (event.target === menu.value && focused.value?.isConnected) focusItem(focused.value); }}>
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
  /** Single choice: a check in the leading column, announced as a radio item. */
  selected: { type: Boolean as PropType<boolean | null>, default: null },
  /** Independent toggle: a check in the leading column, announced as a checkbox item. */
  checked: { type: Boolean as PropType<boolean | null>, default: null },
  /** Second line under the label. */
  description: { type: String, default: undefined },
  /** Keyboard hint shown at the end, such as "⌘D". It only describes; wiring the keys is the app's job. */
  shortcut: { type: String, default: undefined },
  textValue: { type: String, default: undefined },
  /** Keeps the menu open after choosing, for toggles the user flips several times. */
  keepOpen: { type: Boolean, default: false },
  /** Inside a KjunDropdownSection with v-model: the value this single choice stands for. */
  value: { type: String, default: undefined },
  /** Makes the item a link; the browser follows it. */
  href: { type: String, default: undefined },
  target: { type: String, default: undefined },
} as const;
export type KjunDropdownItemProps = ExtractPublicPropTypes<typeof kjunDropdownItemProps>;
const itemBody = (props: { icon?: string; check?: boolean | null; description?: string; shortcut?: string; chevron?: boolean }, label: VNodeChild) => {
  const size = tokens.extensions.menu.iconSize;
  return [
    props.check != null && <KjunIcon name="check" class="kjun-menu-check" size={size} style={{ visibility: props.check ? "visible" : "hidden" }} />,
    props.icon && <KjunIcon name={props.icon} class="kjun-menu-icon" size={size} />,
    <span class="kjun-menu-label"><span>{label}</span>{props.description && <span class="kjun-menu-description">{props.description}</span>}</span>,
    props.shortcut && <kbd class="kjun-menu-shortcut">{props.shortcut}</kbd>,
    props.chevron && <KjunIcon name="chevron-right" class="kjun-menu-chevron" size={size} />,
  ];
};
/** Pointer and keyboard behaviour shared by items, submenu rows and back rows. */
function useMenuRow(disabled: () => boolean, action: (event: MouseEvent | KeyboardEvent) => void) {
  const menu = inject(kjunDropdownKey, null);
  const item = ref<HTMLElement | null>(null);
  const focus = useFocusVisible();
  return {
    menu, item,
    attrs: () => {
      const isFocused = !!item.value && menu?.focused.value === item.value;
      return {
        tabindex: disabled() ? undefined : isFocused ? 0 : -1, "aria-disabled": disabled() ? ("true" as const) : undefined,
        "data-disabled": disabled() || undefined, "data-focused": isFocused || undefined,
        "data-focus-visible": (isFocused && menu?.visible.value) || undefined,
        onClick: (event: MouseEvent) => { if (!disabled()) action(event); },
        onKeydown: (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!event.repeat && !disabled()) action(event); } },
        // react-aria moves focus to the hovered item.
        onPointermove: () => { if (!disabled() && item.value && document.activeElement !== item.value) { if (menu) { menu.focused.value = item.value; menu.visible.value = false; } item.value.focus({ preventScroll: true }); } },
        onFocus: () => { focus.onFocus(); if (menu && item.value) { menu.focused.value = item.value; menu.visible.value = isFocusVisible(); } },
        onBlur: focus.onBlur,
      };
    },
  };
}
/** Default slot: the item label. Event: click (then the menu closes). */
export const KjunDropdownItem = defineComponent({
  name: "KjunDropdownItem",
  props: kjunDropdownItemProps,
  emits: { click: (_event: MouseEvent | KeyboardEvent) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const level = inject(kjunMenuLevelKey, topLevel), choice = inject(kjunMenuChoiceKey, noChoice);
    const group = () => props.value === undefined ? null : choice.get();
    const row = useMenuRow(() => props.disabled, event => {
      emit("click", event);
      group()?.select(props.value!);
      // A link row follows its href on click; a key press follows it here.
      if (props.href && event instanceof KeyboardEvent) (row.item.value as HTMLAnchorElement | null)?.click();
      if (!props.keepOpen) row.menu?.close();
    });
    return () => {
      if ((row.menu?.view.value ?? "") !== level.value) return null;
      const current = group(), selected = current ? current.value === props.value : props.selected;
      const state = selected ?? props.checked;
      const Tag = props.href ? "a" : "div";
      const label = slots.default?.();
      // A plain-text label is its own typeahead text; anything else falls back to the rendered label.
      const only = Array.isArray(label) && label.length === 1 ? label[0] : undefined;
      const text = props.textValue ?? (isVNode(only) && typeof only.children === "string" ? only.children : undefined);
      return (
        <Tag ref={row.item} id={props.id} class="kjun-menu-item" data-variant={props.variant} href={props.disabled ? undefined : props.href} target={props.target}
          // A boolean `selected` makes this a single-choice item and `checked` a toggle, like Native's radio and checkbox.
          role={selected !== null ? "menuitemradio" : props.checked !== null ? "menuitemcheckbox" : "menuitem"} aria-checked={state === null ? undefined : state}
          aria-keyshortcuts={props.shortcut} data-kjun-selected={selected === true || undefined} data-text-value={text} {...row.attrs()}>
          {itemBody({ icon: props.icon, check: state, description: props.description, shortcut: props.shortcut }, label)}
        </Tag>
      );
    };
  },
});

const kjunDropdownSectionProps = {
  /** Small heading over the group; it names the group for screen readers. */
  title: { type: String, default: undefined },
  /** Names the group for screen readers when it has no visible title. */
  ariaLabel: { type: String, default: undefined },
  /** v-model: makes the items with a `value` one single choice; the item whose value matches shows the check. null chooses none. */
  modelValue: { type: String as PropType<string | null>, default: undefined },
} as const;
export type KjunDropdownSectionProps = ExtractPublicPropTypes<typeof kjunDropdownSectionProps>;
/** Default slot: items of the group. Events: update:modelValue, change (the chosen item's value). */
export const KjunDropdownSection = defineComponent({
  name: "KjunDropdownSection",
  props: kjunDropdownSectionProps,
  emits: { "update:modelValue": (_value: string) => true, change: (_value: string) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const menu = inject(kjunDropdownKey, null), level = inject(kjunMenuLevelKey, topLevel), parent = inject(kjunMenuChoiceKey, noChoice);
    const select = (value: string) => { emit("update:modelValue", value); emit("change", value); };
    provide(kjunMenuChoiceKey, { get: () => props.modelValue === undefined ? parent.get() : { value: props.modelValue, select } });
    const titleId = useKjunId("kjun-menu-section-");
    // Outside its own level the group draws nothing itself, but a submenu inside it may be the level shown.
    return () => (menu?.view.value ?? "") !== level.value ? slots.default?.() : (
      <div class="kjun-menu-section" role="group" aria-labelledby={props.title ? titleId : undefined} aria-label={props.title ? undefined : props.ariaLabel}>
        {props.title && <div id={titleId} class="kjun-menu-section-title" aria-hidden="true">{props.title}</div>}
        {slots.default?.()}
      </div>
    );
  },
});

const kjunDropdownSubmenuProps = {
  /** Stable key for the submenu; defaults to the label. Give each submenu its own id when two at one level share a label. */
  id: { type: String, default: undefined },
  label: { type: String, required: true },
  icon: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
} as const;
export type KjunDropdownSubmenuProps = ExtractPublicPropTypes<typeof kjunDropdownSubmenuProps>;
/** An item that opens its own items (default slot) in place of the menu, with a back row; → opens it and ← returns. */
export const KjunDropdownSubmenu = defineComponent({
  name: "KjunDropdownSubmenu",
  props: kjunDropdownSubmenuProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    const level = inject(kjunMenuLevelKey, topLevel);
    const key = computed(() => (level.value ? level.value + "/" : "") + (props.id ?? props.label));
    provide(kjunMenuLevelKey, key);
    provide(kjunMenuChoiceKey, noChoice);
    const trigger = useMenuRow(() => props.disabled, () => trigger.menu?.open(key.value));
    const back = useMenuRow(() => false, () => back.menu?.back());
    return () => {
      const view = trigger.menu?.view.value ?? "";
      return [
        view === level.value && (
          <div ref={trigger.item} class="kjun-menu-item" role="menuitem" aria-haspopup="menu" data-submenu={key.value} data-text-value={props.label} {...trigger.attrs()}>
            {itemBody({ icon: props.icon, chevron: true }, props.label)}
          </div>
        ),
        view === key.value && (
          <div ref={back.item} class="kjun-menu-item kjun-menu-back" role="menuitem" aria-label={m.value.back + ", " + props.label} data-text-value={props.label} {...back.attrs()}>
            <KjunIcon name="chevron-left" class="kjun-menu-icon" size={tokens.extensions.menu.iconSize} /><span class="kjun-menu-label"><span>{props.label}</span></span>
          </div>
        ),
        slots.default?.(),
      ];
    };
  },
});

export const KjunDropdownDivider = defineComponent({
  name: "KjunDropdownDivider",
  setup() {
    const menu = inject(kjunDropdownKey, null), level = inject(kjunMenuLevelKey, topLevel);
    return () => (menu?.view.value ?? "") !== level.value ? null : <div role="separator" class="kjun-menu-divider" />;
  },
});

const kjunMenuButtonProps = {
  ...kjunDropdownProps,
  label: { type: String, default: undefined },
  size: { type: String as PropType<ButtonSize>, default: "md" },
  variant: { type: String as PropType<ButtonVariant>, default: "secondary" },
  /** Show a square dots-vertical button; label remains its accessible name. */
  compact: { type: Boolean, default: false },
  /** Icon before the label, or in place of dots-vertical when compact or unlabelled. */
  icon: { type: String, default: undefined },
  /** Show the chevron after a visible label (default true); false where the icon already says it opens a menu. */
  chevron: { type: Boolean, default: true },
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
          prefixIcon={menuButtonIcon(props.icon, props.compact, props.label)}
          suffixIcon={menuButtonChevron(props.chevron, props.compact, props.label, open.value)}
          ariaLabel={props.ariaLabel || props.label || props.tooltip || m.value.menu}>
          {{ default: () => props.compact ? undefined : props.label }}
        </KjunButton>
      );
      return (
        <KjunDropdown open={props.open} onUpdate:open={(value: boolean) => emit("update:open", value)} disabled={props.disabled} placement={props.placement} menuId={props.menuId} triggerId={props.triggerId} menuClass={props.menuClass} density={props.density} returnFocus={props.returnFocus}
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
