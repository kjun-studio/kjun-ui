import { useKjunMessages } from "./runtime/messages";
import { defineComponent, provide, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { kjunTopNavigationKey } from "./runtime/keys";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

const kjunTopNavigationProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  safeAreaTop: { type: Number, default: 0 },
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
        <header class="kjun-top-navigation" data-surface={props.surface ? undefined : "false"} style={css({ paddingTop: Math.max(0, props.safeAreaTop) })}>
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

export interface NavigationDestination { key: string; label: string; href: string; icon?: string; badge?: string | number; disabled?: boolean }
const kjunBottomNavigationProps = {
  items: { type: Array as PropType<NavigationDestination[]>, required: true },
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  safeAreaBottom: { type: Number, default: 0 },
  keyboardVisible: { type: Boolean, default: false },
  hideOnKeyboard: { type: Boolean, default: true },
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface: { type: Boolean, default: true },
} as const;
export type KjunBottomNavigationProps = ExtractPublicPropTypes<typeof kjunBottomNavigationProps>;
/** Event: navigate(key, event); prevent the event to route in the app. */
export const KjunBottomNavigation = defineComponent({
  name: "KjunBottomNavigation",
  props: kjunBottomNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    return () => {
      const hasIcons = props.items.some(item => item.icon);
      if (props.keyboardVisible && props.hideOnKeyboard) return null;
      return (
        <nav class="kjun-bottom-navigation" data-icons={hasIcons || undefined} data-surface={props.surface ? undefined : "false"} aria-label={(props.ariaLabel ?? m.value.mainNavigation)} style={css({ paddingBottom: Math.max(0, props.safeAreaBottom) })}>
          {props.items.map(item => {
            const badge = item.badge != null && <span class="kjun-navigation-badge" aria-hidden="true">{item.badge}</span>;
            return (
              <a key={item.key} href={item.disabled ? undefined : item.href} aria-label={item.label + (item.badge != null ? ", " + item.badge : "")}
                aria-disabled={item.disabled || undefined} aria-current={props.value === item.key ? "page" : undefined}
                onClick={(event: MouseEvent) => { if (item.disabled) event.preventDefault(); else emit("navigate", item.key, event); }}>
                {hasIcons && <span class="kjun-navigation-icon">{item.icon && <KjunIcon name={item.icon} size={tokens.extensions.bottomNavigation.iconSize} />}{badge}</span>}
                <span class="kjun-navigation-label">{item.label}{!hasIcons && badge}</span>
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
  safeAreaBottom: { type: Number, default: 0 },
  keyboardVisible: { type: Boolean, default: false },
  hideOnKeyboard: { type: Boolean, default: false },
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface: { type: Boolean, default: true },
} as const;
export type KjunBottomActionBarProps = ExtractPublicPropTypes<typeof kjunBottomActionBarProps>;
export const KjunBottomActionBar = defineComponent({
  name: "KjunBottomActionBar",
  props: kjunBottomActionBarProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => props.keyboardVisible && props.hideOnKeyboard ? null : (
      <div class="kjun-bottom-action-bar" data-surface={props.surface ? undefined : "false"} style={css({ paddingBottom: tokens.extensions.navigation.padding + Math.max(0, props.safeAreaBottom) })}>
        <div class="kjun-bottom-action-content">{props.description && <p>{props.description}</p>}<div class="kjun-navigation-actions">{slots.default?.()}</div></div>
      </div>
    );
  },
});
