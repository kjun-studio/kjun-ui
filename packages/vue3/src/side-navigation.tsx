import { useKjunMessages } from "./runtime/messages";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideItemsHaveBadge, sideItemsHoldCurrent, sideNavigationGroupRail, sideNavigationInitial, sideNavigationOpensElsewhere,
  sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideParentHasBadge, sideParentHoldsCurrent, toggleSideParent,
  type SideNavigationDestination, type SideNavigationEntry, type SideNavigationItem, type SideNavigationRail, type SideNavigationSection } from "../../../shared/package-runtime/side-navigation";
import { nextTick, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { KjunTooltip } from "./popover";
export type { SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

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
  /** Group titles become toggles that show or hide their group. The group of the current destination starts open. */
  collapsibleGroups: { type: Boolean, default: false },
  /** v-model:expandedGroups: the open groups by key (a group's key, else its title). Without it the navigation keeps the list itself.
   * update:expandedGroups also reports a group opened by moving to a page in it. */
  expandedGroups: { type: Array as PropType<string[]>, default: undefined },
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon), which
   * emits update:collapsed false with that group open and in view. Loose items between groups keep their own row. */
  rail: { type: String as PropType<SideNavigationRail>, default: "items" },
  /** While collapsed: a short name under each icon, in a 72 wide column. The current page, hover and press fill a 56 by 32
   * indicator around the icon, a count stays a number, and no tooltip is needed. */
  railLabels: { type: Boolean, default: false },
  /** "compact": 32 tall rows and 30 tall children under a mouse, and counts as quiet numbers, for long lists (documentation,
   * settings). A touch pointer keeps the touch heights. */
  density: { type: String as PropType<"default" | "compact">, default: "default" },
} as const;
export type KjunSideNavigationProps = ExtractPublicPropTypes<typeof kjunSideNavigationProps>;
/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children.
 * Events: navigate(key, event), a plain click on a destination of this tab (modified clicks and target links are left to the browser),
 * prevent the event to route in the app; reselect(key, event), the current destination was pressed again; update:expanded; update:collapsed;
 * update:expandedGroups. */
export const KjunSideNavigation = defineComponent({
  name: "KjunSideNavigation",
  props: kjunSideNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true,
    "update:expanded": (_expanded: string[]) => true, "update:collapsed": (_collapsed: boolean) => true, "update:expandedGroups": (_expandedGroups: string[]) => true },
  setup(props, { emit }) {
    const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
    const own = ref(sideNavigationWithCurrentParents([], props.items, props.value) as string[]);
    const open = () => props.expanded ?? own.value;
    const update = (next: string[]) => { if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    const ownGroups = ref(sideNavigationWithCurrentGroups([], props.items, props.value) as string[]);
    const openGroups = () => props.expandedGroups ?? ownGroups.value;
    const updateGroups = (next: string[]) => { if (props.expandedGroups === undefined) ownGroups.value = next; emit("update:expandedGroups", next); };
    // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
    // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
    // Groups do the same while they can be closed.
    watch(() => [props.value, JSON.stringify([sideNavigationWithCurrentParents([], props.items, props.value), sideNavigationWithCurrentGroups([], props.items, props.value)])], () => {
      const next = sideNavigationWithCurrentParents(open(), props.items, props.value);
      if (next !== open()) update([...next]);
      if (!props.collapsibleGroups) return;
      const groups = sideNavigationWithCurrentGroups(openGroups(), props.items, props.value);
      if (groups !== openGroups()) updateGroups([...groups]);
    });
    // A group pressed in a rail of groups is brought into view once the column has widened.
    let pending: string | null = null;
    watch(() => props.collapsed, collapsed => {
      if (collapsed || !pending) return;
      const target = pending; pending = null;
      nextTick(() => document.getElementById(target)?.scrollIntoView?.({ block: "nearest" }));
    });
    const revealGroup = (key: string, title: string) => {
      if (props.collapsibleGroups && !openGroups().includes(key)) updateGroups([...openGroups(), key]);
      pending = title; emit("update:collapsed", false);
    };
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
      // With names under the icons a collapsed menu reads on its own: no tooltips, and the names stay on screen.
      const labelled = collapsed && props.railLabels;
      const named = (label: string, row: VNode) => collapsed && !labelled ? <KjunTooltip content={label} placement="right">{row}</KjunTooltip> : row;
      const labelClass = "kjun-side-navigation-label" + (collapsed && !labelled ? " kjun-sr-only" : "");
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
          {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
              Beside a labelled rail's wider indicator the number fits. */}
          {child ? null : glyph(item.icon, item.label, selected, mark ? labelled ? badge(mark.text, mark.dot) : badge("", true) : null)}
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
      const groups = openGroups(), sections = sideNavigationSections(props.items);
      const titleId = (key: string) => id + "-title-" + sections.findIndex(section => section.key === key);
      // A group in a rail of groups: its icon (or initial), the selection fill while it holds the current page, and a dot
      // when an item in it has a badge. Pressing it asks for the full width with the group open.
      const groupRow = (group: SideNavigationSection & { key: string; title: string }) => {
        const within = sideItemsHoldCurrent(group.items, props.value), dot = sideItemsHaveBadge(group.items);
        return <li key={"group:" + group.key}>{named(group.title, <button type="button" class="kjun-side-navigation-item" aria-expanded={false}
          aria-label={dot ? navigationLabel(group.title, true, m.value.newContent) : undefined} data-current-within={within ? "" : undefined}
          onClick={() => revealGroup(group.key, titleId(group.key))}>
          {glyph(group.icon, group.title, false, dot ? badge("", true) : null)}
          <span class={labelClass}>{group.title}</span>
        </button>)}</li>;
      };
      // A group title that opens and closes its group; closed over the current page it takes the selection fill, like a parent.
      const groupToggle = (section: SideNavigationSection, index: number, rows: VNodeChild) => {
        const key = section.key!, shown = groups.includes(key), panel = id + "-group-" + index;
        const within = !shown && sideItemsHoldCurrent(section.items, props.value), dot = !shown && sideItemsHaveBadge(section.items);
        return [
          <button type="button" id={id + "-title-" + index} class="kjun-side-navigation-title" data-toggle="" aria-expanded={shown} aria-controls={panel}
            aria-label={dot ? navigationLabel(section.title!, true, m.value.newContent) : undefined} data-current-within={within ? "" : undefined}
            onClick={() => updateGroups(toggleSideParent(groups, key))}>
            <span class="kjun-side-navigation-label">{section.title}</span>
            {dot ? badge("", true) : null}
            <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />
          </button>,
          <div id={panel}><KjunCollapse open={shown}><ul class="kjun-side-navigation-group-items">{rows}</ul></KjunCollapse></div>,
        ];
      };
      const nav = (rail: boolean, content: VNodeChild) => <nav class="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} data-rail={rail ? "groups" : undefined} data-rail-labels={labelled ? "" : undefined}
        data-density={props.density === "compact" ? "compact" : undefined}
        data-collapsible-groups={props.collapsibleGroups && !collapsed ? "" : undefined} aria-label={props.ariaLabel ?? m.value.mainNavigation}>{content}</nav>;
      if (collapsed && props.rail === "groups") return nav(true, <ul>{sideNavigationGroupRail(props.items).map((entry, at) =>
        "group" in entry ? groupRow(entry.group) : row(entry.item, id + "-rail-" + at))}</ul>);
      return nav(false, sections.map((section, index) => {
        const rows = section.items.map((item, at) => row(item, id + "-panel-" + index + "-" + at));
        return section.title
          ? <div key={index} class="kjun-side-navigation-section" role="group" aria-labelledby={id + "-title-" + index}>
              {props.collapsibleGroups && !collapsed ? groupToggle(section, index, rows) : [
                <div id={id + "-title-" + index} class={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{section.title}</div>,
                <ul>{rows}</ul>,
              ]}
            </div>
          : <ul key={index}>{rows}</ul>;
      }));
    };
  },
});
