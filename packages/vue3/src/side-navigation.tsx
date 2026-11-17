import { useKjunMessages } from "./runtime/messages";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { checkSideNavigation, isPlainNavigationClick, isSideParent, isTitledSection, sideGroupState, sideNavigationGroupRail, sideNavigationIdPart, sideNavigationInitial,
  sideNavigationInitialGroups, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideParentState,
  sideRailGroupState, sideSectionToggles, toggleSideParent, warnNoWiden, type SideNavigationAction, type SideNavigationCollapsedParent, type SideNavigationDestination,
  type SideNavigationEntry, type SideNavigationItem, type SideNavigationParent, type SideNavigationRail, type SideNavigationSection, type SideNavigationTitledSection } from "../../../shared/package-runtime/side-navigation";
import { scrollSideNavigationRow, sideNavigationCurrentRow } from "../../../shared/package-runtime/side-navigation-scroll";
import { computed, getCurrentInstance, ref, useId, watch, type Component, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { hasContent } from "./runtime/slots";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { KjunPopover, KjunTooltip } from "./popover";
export type { SideNavigationAction, SideNavigationCollapsedParent, SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

const kjunSideNavigationProps = {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: { type: Array as PropType<SideNavigationEntry[]>, required: true },
  /** The current destination's key (a child's key when the page is under a parent). */
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  /** v-model:expanded: the open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open.
   * update:expanded also reports a parent opened by moving to a page under it. */
  expanded: { type: Array as PropType<string[]>, default: undefined },
  /** v-model:collapsed: icons only, for a narrowed column. Names show as tooltips, and children stay hidden behind their parent. */
  collapsed: { type: Boolean, default: false },
  /** Group titles become toggles that show or hide their group. A group's own collapsible overrides this. The group of
   * the current destination starts open, and so do groups marked defaultOpen. */
  collapsibleGroups: { type: Boolean, default: false },
  /** v-model:expandedGroups: the open groups by key (a group's key, else its title). Without it the navigation keeps the list itself.
   * update:expandedGroups also reports a group opened by moving to a page in it. */
  expandedGroups: { type: Array as PropType<string[]>, default: undefined },
  /** A closed group's title ends with how many rows it holds (a dot instead while one of them has a badge). */
  groupCounts: { type: Boolean, default: false },
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail: { type: String as PropType<SideNavigationRail>, default: "items" },
  /** While collapsed: a short name under each icon, in a 72 wide column. The current page, hover and press fill a 56 by 32
   * indicator around the icon, a count stays a number, and no tooltip is needed. */
  railLabels: { type: Boolean, default: false },
  /** While collapsed, pressing a parent or a rail group: "widen" emits update:collapsed false with it open;
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent: { type: String as PropType<SideNavigationCollapsedParent>, default: "widen" },
  /** "compact": 32 tall rows and 30 tall children under a mouse, and counts as quiet numbers, for long lists (documentation,
   * settings). A touch pointer keeps the touch heights. */
  density: { type: String as PropType<"default" | "compact">, default: "default" },
  /** A button at the end of the footer that asks to collapse or widen the column (update:collapsed). */
  collapseToggle: { type: Boolean, default: false },
  /** Renders enabled links with the app's router link (RouterLink, NuxtLink) or another tag instead of <a>. It receives the
   * href under linkProp, class, the aria-* and data-* attributes, onClick and a default slot, and must render an <a>. */
  linkAs: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
  /** The prop linkAs receives the href under: "to" for RouterLink. */
  linkProp: { type: String, default: "href" },
  /** Brings the current row into the menu's own scrolling column when the menu mounts and when the page changes. */
  scrollToCurrent: { type: Boolean, default: true },
} as const;
export type KjunSideNavigationProps = ExtractPublicPropTypes<typeof kjunSideNavigationProps>;
type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean };
const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true };
const actionCount = (count: number) => ({ "--_kjun-side-navigation-action-count": count });

/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children.
 * Events: navigate(key, event), a plain click on a destination of this tab (modified clicks and target links are left to the browser),
 * prevent the event to route in the app; reselect(key, event), the current destination was pressed again; action(key, actionKey, event),
 * an action button of a row (the row's key) or a group title (the group's key) was pressed; update:expanded; update:collapsed, also when a
 * parent or group is pressed while collapsed (collapsedParent="widen") or the collapse toggle is pressed; update:expandedGroups.
 * Slots: header({ collapsed }) above the list, such as a logo, a workspace switcher or search; footer({ collapsed }) below it, such as
 * the account. With a header or footer only the list scrolls. */
export const KjunSideNavigation = defineComponent({
  name: "KjunSideNavigation",
  props: kjunSideNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true,
    action: (_key: string, _action: string, _event: MouseEvent) => true,
    "update:expanded": (_expanded: string[]) => true, "update:collapsed": (_collapsed: boolean) => true, "update:expandedGroups": (_expandedGroups: string[]) => true },
  slots: Object as SlotsType<{ header?: (scope: { collapsed: boolean }) => VNodeChild; footer?: (scope: { collapsed: boolean }) => VNodeChild }>,
  setup(props, { emit, slots }) {
    const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
    const instance = getCurrentInstance(), nav = ref<HTMLElement | null>(null);
    const sections = computed(() => sideNavigationSections(props.items));
    watch(() => props.items, items => checkSideNavigation(items), { immediate: true });
    const own = ref([...sideNavigationWithCurrentParents([], props.items, props.value)]);
    const open = () => props.expanded ?? own.value;
    const update = (next: string[]) => { if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    const ownGroups = ref(sideNavigationInitialGroups(props.items, props.value));
    const openGroups = () => props.expandedGroups ?? ownGroups.value;
    const updateGroups = (next: string[]) => { if (props.expandedGroups === undefined) ownGroups.value = next; emit("update:expandedGroups", next); };
    const toggles = () => sections.value.some(section => sideSectionToggles(section, props.collapsibleGroups));
    // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
    // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
    // Groups do the same while any can be closed.
    watch(() => [props.value, JSON.stringify([sideNavigationWithCurrentParents([], props.items, props.value), sideNavigationWithCurrentGroups([], props.items, props.value)])], () => {
      const next = sideNavigationWithCurrentParents(open(), props.items, props.value);
      if (next !== open()) update([...next]);
      if (!toggles()) return;
      const groups = sideNavigationWithCurrentGroups(openGroups(), props.items, props.value);
      if (groups !== openGroups()) updateGroups([...groups]);
    });
    // The current row comes into the menu's own column: at once on mount, after a parent or group has opened on a change.
    let scrolled = false;
    watch([() => props.value, () => props.scrollToCurrent], (_, __, onCleanup) => {
      if (!props.scrollToCurrent) return;
      const first = !scrolled; scrolled = true;
      const timer = setTimeout(() => scrollSideNavigationRow(sideNavigationCurrentRow(nav.value), first), first ? 0 : tokens.motion.collapse);
      onCleanup(() => clearTimeout(timer));
    }, { immediate: true });
    // Widening: names wait for the column and fade in (data-expanding); a flyout closes with the rail it belongs to.
    // A group pressed in a rail of groups is brought into view once the column has widened.
    const flyout = ref<string | null>(null), expanding = ref(false);
    let pending: string | null = null;
    watch(() => props.collapsed, (collapsed, _, onCleanup) => {
      expanding.value = false;
      if (collapsed) return;
      flyout.value = null;
      if (pending) { scrollSideNavigationRow(document.getElementById(pending)); pending = null; }
      expanding.value = true;
      const timer = setTimeout(() => { expanding.value = false; }, tokens.motion.control * 2);
      onCleanup(() => clearTimeout(timer));
    }, { flush: "post" });
    // Vue cannot read a listener from emits, so the widen request looks for v-model:collapsed's handler on the vnode.
    const widen = () => { if (!instance?.vnode.props?.["onUpdate:collapsed"]) warnNoWiden(); emit("update:collapsed", false); };
    const toggle = (key: string) => update(toggleSideParent(open(), key));
    // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
    const reveal = (key: string) => { if (!open().includes(key)) toggle(key); widen(); };
    const titleId = (key: string) => id + "-title-" + sideNavigationIdPart(key);
    const revealGroup = (key: string) => {
      if (!openGroups().includes(key) && sections.value.some(section => section.key === key && sideSectionToggles(section, props.collapsibleGroups))) updateGroups([...openGroups(), key]);
      pending = titleId(key); widen();
    };

    return () => {
      const collapsed = props.collapsed, opened = open(), groups = openGroups(), value = props.value;
      const flyoutMode = collapsed && props.collapsedParent === "flyout";
      const labelled = collapsed && props.railLabels, base: Mode = { collapsed, labelled };

      const badge = (text: string, dot: boolean) => <span class="kjun-navigation-badge" data-dot={dot || undefined} aria-hidden="true">{text}</span>;
      const glyph = (mode: Mode, icon: string | undefined, label: string, filled: boolean, mark?: VNodeChild) => (icon || mode.collapsed) ? <span class="kjun-side-navigation-glyph">
        {icon ? <KjunIcon name={icon} class="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
          : <span class="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
        {mode.collapsed ? mark : null}
      </span> : null;
      // With names under the icons a collapsed menu reads on its own: no tooltips, and the names stay on screen.
      const named = (mode: Mode, label: string, row: () => VNode) => mode.collapsed && !mode.labelled ? <KjunTooltip content={label} placement="right">{{ default: row }}</KjunTooltip> : row();
      const labelClass = (mode: Mode) => "kjun-side-navigation-label" + (mode.collapsed && !mode.labelled ? " kjun-sr-only" : "");
      const actionButtons = (key: string, actions: readonly SideNavigationAction[]) => <span class="kjun-side-navigation-actions">
        {actions.map(action => <KjunTooltip key={action.key} content={action.label}>{{ default: () =>
          <button type="button" class="kjun-side-navigation-action" aria-label={action.label} onClick={(event: MouseEvent) => emit("action", key, action.key, event)}>
            <KjunIcon name={action.icon} size={geometry.actionIconSize} />
          </button> }}
        </KjunTooltip>)}
      </span>;
      // A panel beside a collapsed icon, holding what the icon stands for. It is non-modal: Tab leaves it, an outside press
      // closes it, and → opens it from the keyboard.
      const flyoutPanel = (key: string, title: string, trigger: () => VNodeChild, content: () => VNodeChild) =>
        <KjunPopover open={flyout.value === key} onUpdate:open={(next: boolean) => { flyout.value = next ? key : null; }} modal={false} placement="right" focusOnOpen>
          {{ trigger, header: () => title, default: content }}
        </KjunPopover>;
      const openOnArrow = (key: string) => (event: KeyboardEvent) => { if (event.key === "ArrowRight") { event.preventDefault(); flyout.value = key; } };

      const link = (mode: Mode, item: SideNavigationDestination, child = false) => {
        const selected = item.key === value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item);
        const routed = !item.disabled && props.linkAs !== undefined;
        // Typed as "a": the router link must render an <a> with these attributes. Disabled items always render a plain <a>.
        const Link = (routed ? props.linkAs : "a") as unknown as "a";
        const target = item.disabled ? undefined : item.href;
        // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
        return <Link {...{ [routed ? props.linkProp : "href"]: target }} class="kjun-side-navigation-item" data-child={child ? "" : undefined} role={item.disabled ? "link" : undefined} tabindex={item.disabled ? -1 : undefined}
          target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
          aria-label={mark || elsewhere ? navigationLabel(item.label, item.badge, m.value.newContent, m.value.newCount) + (elsewhere ? m.value.newWindow : "") : undefined}
          aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
          onClick={(event: MouseEvent) => {
            if (item.disabled) { event.preventDefault(); return; }
            if (elsewhere || !isPlainNavigationClick(event)) return;
            emit("navigate", item.key, event);
            if (selected) emit("reselect", item.key, event);
            if (mode.flyout) flyout.value = null;
          }}>
          {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
              Beside a labelled rail's wider indicator the number fits. */}
          {child ? null : glyph(mode, item.icon, item.label, selected, mark ? mode.labelled ? badge(mark.text, mark.dot) : badge("", true) : null)}
          <span class={labelClass(mode)}>{item.label}</span>
          {!mode.collapsed && mark ? badge(mark.text, mark.dot) : null}
          {!mode.collapsed && elsewhere ? <KjunIcon name="external-link" class="kjun-side-navigation-trailing" size={geometry.chevronSize} /> : null}
        </Link>;
      };
      // A destination's row: the link, and its actions beside it (a button cannot sit inside a link).
      const destination = (mode: Mode, item: SideNavigationDestination, child = false) => {
        const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
        return <li key={item.key} class="kjun-side-navigation-row" data-actions={actions ? "" : undefined} style={actions ? actionCount(actions.length) : undefined}>
          {named(mode, item.label, () => link(mode, item, child))}
          {actions ? actionButtons(item.key, actions) : null}
        </li>;
      };
      const parent = (mode: Mode, item: SideNavigationParent) => {
        const flies = mode.collapsed && flyoutMode && !item.disabled, panel = id + "-parent-" + sideNavigationIdPart(item.key);
        const { shown, within, dot } = sideParentState(item, { open: opened, collapsed: mode.collapsed, value });
        const button = () => <button type="button" class="kjun-side-navigation-item" aria-expanded={flies ? undefined : shown} aria-controls={flies ? undefined : panel}
          // aria-disabled instead of disabled: the row keeps its tooltip and its name while it cannot open.
          aria-disabled={item.disabled || undefined} tabindex={item.disabled ? -1 : undefined}
          aria-label={dot ? navigationLabel(item.label, true, m.value.newContent) : undefined} onKeydown={flies ? openOnArrow(item.key) : undefined}
          onClick={flies || item.disabled ? undefined : () => mode.collapsed ? reveal(item.key) : toggle(item.key)}
          // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
          data-current-within={within ? "" : undefined}>
          {glyph(mode, item.icon, item.label, false, dot ? badge("", true) : null)}
          <span class={labelClass(mode)}>{item.label}</span>
          {!mode.collapsed && dot ? badge("", true) : null}
          {mode.collapsed ? null : <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
        </button>;
        return <li key={item.key} class="kjun-side-navigation-row">
          {flies ? flyoutPanel(item.key, item.label, () => named(mode, item.label, button),
            () => <ul class="kjun-side-navigation-flyout" data-parent="">{item.children.map(child => destination(FLYOUT, child, true))}</ul>)
            : named(mode, item.label, button)}
          {flies ? null : <div id={panel}><KjunCollapse open={shown}><ul class="kjun-side-navigation-children">{item.children.map(child => destination(mode, child, true))}</ul></KjunCollapse></div>}
        </li>;
      };
      const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);

      // A titled group's heading: its title (static or a toggle) and the group's action.
      const heading = (section: SideNavigationTitledSection, title: VNodeChild) => {
        const action = !collapsed && section.action;
        return <div class="kjun-side-navigation-heading" data-actions={action ? "" : undefined} style={action ? actionCount(1) : undefined}>
          {title}{action ? actionButtons(section.key, [action]) : null}
        </div>;
      };
      // A group title that opens and closes its group. Its small chevron follows the name; the end holds a dot for a badge
      // inside, or the number of rows (groupCounts). Closed over the current page, the name takes full ink.
      const groupToggle = (section: SideNavigationTitledSection, rows: VNodeChild) => {
        const { shown, within, dot, count } = sideGroupState(section, { openGroups: groups, value }), panel = id + "-group-" + sideNavigationIdPart(section.key);
        return [
          heading(section, <button type="button" id={titleId(section.key)} class="kjun-side-navigation-title" data-toggle="" aria-expanded={shown} aria-controls={panel}
            aria-label={dot ? navigationLabel(section.title, true, m.value.newContent) : undefined} data-current-within={within ? "" : undefined}
            onClick={() => updateGroups(toggleSideParent(groups, section.key))}>
            <span class="kjun-side-navigation-label">{section.title}</span>
            <KjunIcon name="chevron-right" class="kjun-side-navigation-chevron" size={geometry.groupChevronSize} />
            {dot ? badge("", true) : !shown && props.groupCounts ? <span class="kjun-side-navigation-count" aria-hidden="true">{count}</span> : null}
          </button>),
          <div id={panel}><KjunCollapse open={shown}><ul class="kjun-side-navigation-group-items">{rows}</ul></KjunCollapse></div>,
        ];
      };
      const section = (entry: SideNavigationSection, index: number) => {
        const rows = entry.items.map(item => row(base, item));
        if (!isTitledSection(entry)) return <ul key={"loose:" + (entry.items[0]?.key ?? index)}>{rows}</ul>;
        const toggled = !collapsed && sideSectionToggles(entry, props.collapsibleGroups);
        return <div key={"group:" + entry.key} class="kjun-side-navigation-section" role="group" aria-labelledby={titleId(entry.key)} data-toggles={toggled ? "" : undefined}>
          {toggled ? groupToggle(entry, rows) : [
            heading(entry, <div id={titleId(entry.key)} class={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{entry.title}</div>),
            <ul>{rows}</ul>,
          ]}
        </div>;
      };
      // A group in a rail of groups: its icon (or initial), half the selection fill while it holds the current page, and a
      // dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows beside it (flyout).
      const railGroup = (group: SideNavigationTitledSection) => {
        const { within, dot } = sideRailGroupState(group, value);
        const button = () => <button type="button" class="kjun-side-navigation-item" aria-expanded={flyoutMode ? undefined : false}
          aria-label={dot ? navigationLabel(group.title, true, m.value.newContent) : undefined} data-current-within={within ? "" : undefined}
          onKeydown={flyoutMode ? openOnArrow("group:" + group.key) : undefined} onClick={flyoutMode ? undefined : () => revealGroup(group.key)}>
          {glyph(base, group.icon, group.title, false, dot ? badge("", true) : null)}
          <span class={labelClass(base)}>{group.title}</span>
        </button>;
        return <li key={"group:" + group.key} class="kjun-side-navigation-row">
          {flyoutMode ? flyoutPanel("group:" + group.key, group.title, () => named(base, group.title, button),
            () => <ul class="kjun-side-navigation-flyout">{group.items.map(item => row(FLYOUT, item))}</ul>)
            : named(base, group.title, button)}
        </li>;
      };

      const top = slots.header?.({ collapsed }), bottom = slots.footer?.({ collapsed }), listId = id + "-list";
      const hasTop = hasContent(top), hasBottom = hasContent(bottom);
      const toggleLabel = collapsed ? m.value.expandNavigation : m.value.collapseNavigation;
      const toggleButton = props.collapseToggle ? <KjunTooltip content={toggleLabel} placement="right">{{ default: () =>
        <button type="button" class="kjun-side-navigation-toggle" aria-label={toggleLabel} aria-expanded={!collapsed} aria-controls={listId} onClick={() => emit("update:collapsed", !collapsed)}>
          <KjunIcon name={collapsed ? "layout-sidebar-left-expand" : "layout-sidebar-left-collapse"} size={geometry.iconSize} />
        </button> }}
      </KjunTooltip> : null;
      const railOfGroups = collapsed && props.rail === "groups";
      return <nav ref={nav} class="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} data-rail={railOfGroups ? "groups" : undefined} data-rail-labels={labelled ? "" : undefined}
        data-density={props.density === "compact" ? "compact" : undefined} data-chrome={hasTop || hasBottom || props.collapseToggle ? "" : undefined} data-expanding={expanding.value ? "" : undefined}
        aria-label={props.ariaLabel ?? m.value.mainNavigation}>
        {hasTop ? <div class="kjun-side-navigation-header">{top}</div> : null}
        <div id={listId} class="kjun-side-navigation-list">
          {railOfGroups
            ? <ul>{sideNavigationGroupRail(props.items).map(entry => "group" in entry ? railGroup(entry.group) : row(base, entry.item))}</ul>
            : sections.value.map(section)}
        </div>
        {hasBottom || toggleButton ? <div class="kjun-side-navigation-footer">
          {hasBottom ? <div class="kjun-side-navigation-footer-content">{bottom}</div> : null}
          {toggleButton}
        </div> : null}
      </nav>;
    };
  },
});
