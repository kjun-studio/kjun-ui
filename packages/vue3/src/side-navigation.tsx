import { useKjunMessages } from "./runtime/messages";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideNavigationInitial, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentParents,
  sideParentHasBadge, sideParentHoldsCurrent, toggleSideParent,
  type SideNavigationDestination, type SideNavigationEntry, type SideNavigationItem } from "../../../shared/package-runtime/side-navigation";
import { ref, useId, watch, type ExtractPublicPropTypes, type PropType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { KjunTooltip } from "./popover";
export type { SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry } from "../../../shared/package-runtime/side-navigation";

const kjunSideNavigationProps = {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: { type: Array as PropType<SideNavigationEntry[]>, required: true },
  /** The current destination's key (a child's key when the page is under a parent). */
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  /** v-model:expanded: the open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open.
   * update:expanded also reports a parent opened by moving to a page under it. */
  expanded: { type: Array as PropType<string[]>, default: undefined },
  /** v-model:collapsed: icons only, for a narrowed column. Names show as tooltips, and children stay hidden behind their parent;
   * pressing a parent emits update:collapsed false. */
  collapsed: { type: Boolean, default: false },
} as const;
export type KjunSideNavigationProps = ExtractPublicPropTypes<typeof kjunSideNavigationProps>;
/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children.
 * Events: navigate(key, event), a plain click on a destination of this tab (modified clicks and target links are left to the browser),
 * prevent the event to route in the app; reselect(key, event), the current destination was pressed again; update:expanded; update:collapsed. */
export const KjunSideNavigation = defineComponent({
  name: "KjunSideNavigation",
  props: kjunSideNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true,
    "update:expanded": (_expanded: string[]) => true, "update:collapsed": (_collapsed: boolean) => true },
  setup(props, { emit }) {
    const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
    const own = ref(sideNavigationWithCurrentParents([], props.items, props.value) as string[]);
    const open = () => props.expanded ?? own.value;
    const update = (next: string[]) => { if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
    // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
    watch(() => [props.value, JSON.stringify(sideNavigationWithCurrentParents([], props.items, props.value))], () => {
      const next = sideNavigationWithCurrentParents(open(), props.items, props.value);
      if (next !== open()) update([...next]);
    });
    const toggle = (key: string) => update(toggleSideParent(open(), key));
    // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
    const reveal = (key: string) => { if (!open().includes(key)) toggle(key); emit("update:collapsed", false); };
    return () => {
      const collapsed = props.collapsed, opened = open();
      const badge = (text: string, dot: boolean) => <span class="kjun-navigation-badge" data-dot={dot || undefined} aria-hidden="true">{text}</span>;
      const glyph = (icon: string | undefined, label: string, filled: boolean, mark?: VNodeChild) => (icon || collapsed) ? <span class="kjun-side-navigation-glyph">
        {icon ? <KjunIcon name={icon} class="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
          : <span class="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
        {collapsed ? mark : null}
      </span> : null;
      const named = (label: string, row: VNode) => collapsed ? <KjunTooltip content={label} placement="right">{row}</KjunTooltip> : row;
      const labelClass = "kjun-side-navigation-label" + (collapsed ? " kjun-sr-only" : "");
      const link = (item: SideNavigationDestination, child = false) => {
        const selected = item.key === props.value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item);
        const shown = mark ? badge(mark.text, mark.dot) : null;
        // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
        return <a class="kjun-side-navigation-item" data-child={child ? "" : undefined} href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabindex={item.disabled ? -1 : undefined}
          target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
          aria-label={mark || elsewhere ? navigationLabel(item.label, item.badge, m.value.newContent, m.value.newCount) + (elsewhere ? m.value.newWindow : "") : undefined}
          aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
          onClick={(event: MouseEvent) => {
            if (item.disabled) { event.preventDefault(); return; }
            if (elsewhere || !isPlainNavigationClick(event)) return;
            emit("navigate", item.key, event);
            if (selected) emit("reselect", item.key, event);
          }}>
          {child ? null : glyph(item.icon, item.label, selected, shown)}
          <span class={labelClass}>{item.label}</span>
          {collapsed ? null : shown}
          {!collapsed && elsewhere ? <KjunIcon name="external-link" class="kjun-side-navigation-trailing" size={geometry.chevronSize} /> : null}
        </a>;
      };
      const row = (item: SideNavigationItem, panel: string) => {
        if (!isSideParent(item)) return <li key={item.key}>{named(item.label, link(item))}</li>;
        const shown = opened.includes(item.key) && !collapsed, dot = !shown && sideParentHasBadge(item);
        return <li key={item.key}>
          {named(item.label, <button type="button" class="kjun-side-navigation-item" aria-expanded={shown} aria-controls={panel} disabled={item.disabled}
            aria-label={dot ? navigationLabel(item.label, true, m.value.newContent) : undefined} onClick={() => collapsed ? reveal(item.key) : toggle(item.key)}
            // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
            data-current-within={!shown && sideParentHoldsCurrent(item, props.value) ? "" : undefined}>
            {glyph(item.icon, item.label, false, dot ? badge("", true) : null)}
            <span class={labelClass}>{item.label}</span>
            {!collapsed && dot ? badge("", true) : null}
            {collapsed ? null : <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
          </button>)}
          <div id={panel}><KjunCollapse open={shown}><ul class="kjun-side-navigation-children">{item.children.map(child => <li key={child.key}>{link(child, true)}</li>)}</ul></KjunCollapse></div>
        </li>;
      };
      return <nav class="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} aria-label={props.ariaLabel ?? m.value.mainNavigation}>
        {sideNavigationSections(props.items).map((section, index) => {
          const rows = section.items.map((item, at) => row(item, id + "-panel-" + index + "-" + at));
          return section.title
            ? <div key={index} class="kjun-side-navigation-section" role="group" aria-labelledby={id + "-title-" + index}>
                <div id={id + "-title-" + index} class={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{section.title}</div>
                <ul>{rows}</ul>
              </div>
            : <ul key={index}>{rows}</ul>;
        })}
      </nav>;
    };
  },
});
