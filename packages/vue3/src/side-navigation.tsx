import { useKjunMessages } from "./runtime/messages";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isSideParent, sideNavigationCurrentParents, sideNavigationSections, toggleSideParent,
  type SideNavigationDestination, type SideNavigationEntry, type SideNavigationItem } from "../../../shared/package-runtime/side-navigation";
import { ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
export type { SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry } from "../../../shared/package-runtime/side-navigation";

const kjunSideNavigationProps = {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: { type: Array as PropType<SideNavigationEntry[]>, required: true },
  /** The current destination's key (a child's key when the page is under a parent). */
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  /** v-model:expanded: the open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open. */
  expanded: { type: Array as PropType<string[]>, default: undefined },
} as const;
export type KjunSideNavigationProps = ExtractPublicPropTypes<typeof kjunSideNavigationProps>;
/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children.
 * Events: navigate(key, event), prevent the event to route in the app; reselect(key, event), the current destination was pressed again; update:expanded. */
export const KjunSideNavigation = defineComponent({
  name: "KjunSideNavigation",
  props: kjunSideNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true, "update:expanded": (_expanded: string[]) => true },
  setup(props, { emit }) {
    const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
    const own = ref(sideNavigationCurrentParents(props.items, props.value));
    // Moving to a page under a closed parent opens it; parents the person opened stay as they are.
    watch(() => props.value, value => { own.value = [...new Set([...own.value, ...sideNavigationCurrentParents(props.items, value)])]; });
    const toggle = (open: readonly string[], key: string) => { const next = toggleSideParent(open, key); if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    return () => {
      const open = props.expanded ?? own.value;
      const link = (item: SideNavigationDestination, child = false) => {
        const selected = item.key === props.value, mark = navigationBadge(item.badge);
        // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
        return <a class="kjun-side-navigation-item" data-child={child ? "" : undefined} href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabindex={item.disabled ? -1 : undefined}
          aria-label={mark ? navigationLabel(item.label, item.badge, m.value.newContent, m.value.newCount) : undefined} aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
          onClick={(event: MouseEvent) => {
            if (item.disabled) { event.preventDefault(); return; }
            emit("navigate", item.key, event);
            if (selected) emit("reselect", item.key, event);
          }}>
          {item.icon && <KjunIcon name={item.icon} class="kjun-side-navigation-icon" filled={selected} size={geometry.iconSize} />}
          <span class="kjun-side-navigation-label">{item.label}</span>
          {mark && <span class="kjun-navigation-badge" data-dot={mark.dot || undefined} aria-hidden="true">{mark.text}</span>}
        </a>;
      };
      const row = (item: SideNavigationItem) => {
        if (!isSideParent(item)) return <li key={item.key}>{link(item)}</li>;
        const shown = open.includes(item.key), panel = id + "-" + item.key;
        return <li key={item.key}>
          <button type="button" class="kjun-side-navigation-item" aria-expanded={shown} aria-controls={panel} disabled={item.disabled} onClick={() => toggle(open, item.key)}
            // A closed parent stands for the current page inside it, so the place in the menu is never lost.
            data-current-within={!shown && item.children.some(child => child.key === props.value) ? "" : undefined}>
            {item.icon && <KjunIcon name={item.icon} class="kjun-side-navigation-icon" size={geometry.iconSize} />}
            <span class="kjun-side-navigation-label">{item.label}</span>
            <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />
          </button>
          <div id={panel}><KjunCollapse open={shown}><ul class="kjun-side-navigation-children">{item.children.map(child => <li key={child.key}>{link(child, true)}</li>)}</ul></KjunCollapse></div>
        </li>;
      };
      return <nav class="kjun-side-navigation" aria-label={props.ariaLabel ?? m.value.mainNavigation}>
        {sideNavigationSections(props.items).map((section, index) => section.title
          ? <div key={index} class="kjun-side-navigation-section" role="group" aria-labelledby={id + "-title-" + index}>
              <div id={id + "-title-" + index} class="kjun-side-navigation-title">{section.title}</div>
              <ul>{section.items.map(row)}</ul>
            </div>
          : <ul key={index}>{section.items.map(row)}</ul>)}
      </nav>;
    };
  },
});
