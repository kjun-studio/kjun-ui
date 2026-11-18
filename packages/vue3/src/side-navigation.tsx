import { useKjunMessages } from "./runtime/messages";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { navigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { checkSideNavigation, isPlainNavigationClick, isSideParent, isTitledSection, sideFlyoutKey, sideGroupState, sideItemsHoldCurrent, sideNavigationGroupRail,
  sideNavigationIdPart, sideNavigationInitial, sideNavigationInitialGroups, sideNavigationLinkLabel, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationShownLabel,
  sideNavigationShownTitle, sideNavigationToggleName, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideParentState, sideRailGroupState, sideSectionEmpty, sideSectionRows,
  sideSectionToggles, toggleSideParent, warnNoWiden, type SideNavigationAction, type SideNavigationBadgeTone, type SideNavigationCollapsedParent, type SideNavigationDestination,
  type SideNavigationEntry, type SideNavigationHeadingLevel, type SideNavigationItem, type SideNavigationParent, type SideNavigationRail, type SideNavigationSection,
  type SideNavigationSubParent, type SideNavigationTitledSection } from "../../../shared/package-runtime/side-navigation";
import { closeSideNavigationFlyout, sideNavigationArrowKey, sideNavigationOpensFlyout, type SideNavigationArrowOwner } from "../../../shared/package-runtime/side-navigation-keys";
import { scrollSideNavigationRow, sideNavigationCurrentRow } from "../../../shared/package-runtime/side-navigation-scroll";
import { computed, getCurrentInstance, nextTick, ref, useId, watch, type Component, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { provideFallbackIcons } from "./runtime/icons";
import { hasContent } from "./runtime/slots";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { KjunPopover, KjunTooltip } from "./popover";
export type { SideNavigationAction, SideNavigationBadgeTone, SideNavigationCollapsedParent, SideNavigationDestination, SideNavigationHeadingLevel, SideNavigationParent,
  SideNavigationSubParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

const kjunSideNavigationProps = {
  /** Destinations, parents with up to two levels under them, and titled groups of either. A destination has the bottom
   * navigation's shape. */
  items: { type: Array as PropType<SideNavigationEntry[]>, required: true },
  /** The current destination's key (a child's key when the page is under a parent); null for a page outside the menu. */
  value: { type: [String, null] as PropType<string | null>, required: true },
  ariaLabel: { type: String, default: undefined },
  /** v-model:expanded: the open parents, at both levels. Without it the navigation keeps the list itself, starting with the parents of the
   * current destination open. update:expanded also reports a parent opened by moving to a page under it. */
  expanded: { type: Array as PropType<string[]>, default: undefined },
  /** v-model:collapsed: icons only, for a narrowed column. Names show as tooltips, and children stay hidden behind their parent. */
  collapsed: { type: Boolean, default: false },
  /** Group titles become toggles that show or hide their group. A group's own collapsible overrides this. The group of
   * the current destination starts open, and so do groups marked defaultOpen. */
  collapsibleGroups: { type: Boolean, default: false },
  /** v-model:expandedGroups: the open groups by key (a group's key, else its title). Without it the navigation keeps the list itself.
   * update:expandedGroups also reports a group opened by moving to a page in it. */
  expandedGroups: { type: Array as PropType<string[]>, default: undefined },
  /** A group title that opens and closes ends with how many rows its group holds (a dot instead while a closed group has
   * a badge inside). */
  groupCounts: { type: Boolean, default: false },
  /** v-model:showAll: the groups (by key) showing every row past their limit. Without it the navigation keeps the list itself. */
  showAll: { type: Array as PropType<string[]>, default: undefined },
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail: { type: String as PropType<SideNavigationRail>, default: "items" },
  /** While collapsed: a short name (shortLabel, else the label) under each icon, in a 72 wide column. The current page,
   * hover and press fill a 56 by 32 indicator around the icon, a count stays a number, and a tooltip shows only a name
   * that was shortened. */
  railLabels: { type: Boolean, default: false },
  /** While collapsed, pressing a parent or a rail group: "widen" emits update:collapsed false with it open;
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent: { type: String as PropType<SideNavigationCollapsedParent>, default: "widen" },
  /** "compact": 32 tall rows and 30 tall children under a mouse, and counts as quiet numbers, for long lists (documentation,
   * settings). A touch pointer keeps the touch heights. */
  density: { type: String as PropType<"default" | "compact">, default: "default" },
  /** The level of the group titles' headings (default 2), to fit the page's outline. */
  headingLevel: { type: Number as PropType<SideNavigationHeadingLevel>, default: 2 },
  /** A button at the end of the footer that asks to collapse or widen the column (update:collapsed). */
  collapseToggle: { type: Boolean, default: false },
  /** Renders enabled links with the app's router link (RouterLink, NuxtLink) or another tag instead of <a>. It receives the
   * href under linkProp, class, the aria-* and data-* attributes, onClick and a default slot, and must render an <a>. */
  linkAs: { type: [String, Object, Function] as PropType<string | Component>, default: undefined },
  /** The prop linkAs receives the href under: "to" for RouterLink. */
  linkProp: { type: String, default: "href" },
  /** Brings the current row into the menu's own scrolling column when the menu mounts, when the page changes and when
   * items that hold it arrive. */
  scrollToCurrent: { type: Boolean, default: true },
} as const;
export type KjunSideNavigationProps = ExtractPublicPropTypes<typeof kjunSideNavigationProps>;
type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean };
const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true };
const actionCount = (count: number) => ({ "--_kjun-side-navigation-action-count": count });

/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and up to two levels of children.
 * Events: navigate(key, event), a plain click on a destination of this tab (modified clicks and target links are left to the browser),
 * prevent the event to route in the app (with linkAs the router link already navigates: use it only for side effects such as closing a drawer);
 * reselect(key, event), the current destination was pressed again; action(key, actionKey, event),
 * an action button of a row (the row's key) or a group title (the group's key) was pressed; update:expanded; update:collapsed, also when a
 * parent or group is pressed while collapsed (collapsedParent="widen") or the collapse toggle is pressed; update:expandedGroups; update:showAll.
 * Slots: header({ collapsed }) above the list, such as a logo, a workspace switcher or search; footer({ collapsed }) below it, such as
 * the account. With a header or footer only the list scrolls. */
export const KjunSideNavigation = defineComponent({
  name: "KjunSideNavigation",
  props: kjunSideNavigationProps,
  emits: { navigate: (_key: string, _event: MouseEvent) => true, reselect: (_key: string, _event: MouseEvent) => true,
    action: (_key: string, _action: string, _event: MouseEvent) => true,
    "update:expanded": (_expanded: string[]) => true, "update:collapsed": (_collapsed: boolean) => true, "update:expandedGroups": (_expandedGroups: string[]) => true,
    "update:showAll": (_showAll: string[]) => true },
  slots: Object as SlotsType<{ header?: (scope: { collapsed: boolean }) => VNodeChild; footer?: (scope: { collapsed: boolean }) => VNodeChild }>,
  setup(props, { emit, slots }) {
    const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
    // The sidebar icons of the collapse toggle are outside the default icon set, so the navigation carries them itself.
    provideFallbackIcons(componentIcons);
    const instance = getCurrentInstance(), nav = ref<HTMLElement | null>(null);
    const sections = computed(() => sideNavigationSections(props.items));
    watch(() => props.items, items => checkSideNavigation(items), { immediate: true });
    const own = ref([...sideNavigationWithCurrentParents([], props.items, props.value)]);
    const open = () => props.expanded ?? own.value;
    const update = (next: string[]) => { if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    const ownGroups = ref(sideNavigationInitialGroups(props.items, props.value));
    const openGroups = () => props.expandedGroups ?? ownGroups.value;
    const updateGroups = (next: string[]) => { if (props.expandedGroups === undefined) ownGroups.value = next; emit("update:expandedGroups", next); };
    const ownShowAll = ref<string[]>([]);
    const allShown = () => props.showAll ?? ownShowAll.value;
    const updateShowAll = (next: string[]) => { if (props.showAll === undefined) ownShowAll.value = next; emit("update:showAll", next); };
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
    // The current row comes into the menu's own column: at once the first time it is there (on mount, or when the items
    // that hold it arrive), and after a parent or group has opened when the page changes.
    const present = computed(() => sections.value.some(section => sideItemsHoldCurrent(section.items, props.value)));
    let scrolled = false;
    watch([() => props.value, present, () => props.scrollToCurrent], (_, __, onCleanup) => {
      if (!props.scrollToCurrent || !present.value) return;
      const first = !scrolled; scrolled = true;
      const timer = setTimeout(() => scrollSideNavigationRow(sideNavigationCurrentRow(nav.value), first), first ? 0 : tokens.motion.collapse);
      onCleanup(() => clearTimeout(timer));
    }, { immediate: true });
    // Widening: names wait for the column and fade in (data-expanding); a flyout closes with the rail it belongs to.
    const flyout = ref<string | null>(null), expanding = ref(false);
    watch(() => props.collapsed, (collapsed, _, onCleanup) => {
      // Narrowing again inside the window ends it at once (its timer is cleared with this watcher).
      expanding.value = false;
      if (collapsed) return;
      flyout.value = null;
      expanding.value = true;
      const timer = setTimeout(() => { expanding.value = false; }, tokens.motion.control * 2);
      onCleanup(() => clearTimeout(timer));
    }, { flush: "post" });
    // A group pressed in a rail of groups is brought into view once the column has finished widening.
    let pending: string | null = null;
    watch(() => props.collapsed, (collapsed, _, onCleanup) => {
      if (collapsed || !pending) return;
      const target = pending; pending = null;
      const timer = setTimeout(() => scrollSideNavigationRow(document.getElementById(target)), tokens.motion.collapse);
      onCleanup(() => clearTimeout(timer));
    }, { flush: "post" });
    // Vue cannot read a listener from emits, so the widen request looks for v-model:collapsed's handler on the vnode.
    const widen = () => { if (!instance?.vnode.props?.["onUpdate:collapsed"]) warnNoWiden(); emit("update:collapsed", false); };
    const setParent = (key: string, next: boolean) => { if (open().includes(key) !== next) update(toggleSideParent(open(), key)); };
    // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
    const reveal = (key: string) => { setParent(key, true); widen(); };
    const titleId = (key: string) => id + "-title-" + sideNavigationIdPart(key);
    const revealGroup = (key: string) => {
      if (!openGroups().includes(key) && sections.value.some(section => section.key === key && sideSectionToggles(section, props.collapsibleGroups))) updateGroups([...openGroups(), key]);
      pending = titleId(key); widen();
    };
    // ← and → in an open menu or a flyout (Tab still walks every row); "out" from a flyout's outer row closes the flyout.
    const flyoutTrigger = (key: string) => id + "-fly-" + sideNavigationIdPart(key);
    const leaveFlyout = () => { const key = flyout.value; if (key) closeSideNavigationFlyout(() => { flyout.value = null; }, flyoutTrigger(key)); };
    const arrows = (mode: Mode, event: KeyboardEvent, own?: SideNavigationArrowOwner) => sideNavigationArrowKey(event, own, mode.flyout ? leaveFlyout : undefined);

    return () => {
      const collapsed = props.collapsed, opened = open(), groups = openGroups(), shownAll = allShown(), value = props.value;
      const flyoutMode = collapsed && props.collapsedParent === "flyout";
      const labelled = collapsed && props.railLabels, base: Mode = { collapsed, labelled };
      const Heading = ("h" + props.headingLevel) as "h2";

      const badge = (text: string, dot: boolean, tone?: SideNavigationBadgeTone | null) =>
        <span class="kjun-navigation-badge" data-dot={dot || undefined} data-tone={tone === "neutral" ? "neutral" : undefined} aria-hidden="true">{text}</span>;
      const opens = () => <span class="kjun-side-navigation-opens" aria-hidden="true"><KjunIcon name="chevron-right" size={geometry.opensMarkerSize} /></span>;
      const glyph = (mode: Mode, icon: string | undefined, label: string, filled: boolean, mark?: VNodeChild) => (icon || mode.collapsed) ? <span class="kjun-side-navigation-glyph">
        {icon ? <KjunIcon name={icon} class="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
          : <span class="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
        {mode.collapsed ? mark : null}
      </span> : null;
      // While only icons show, the name is a tooltip; under a labelled rail's icons only a shortened name needs one.
      const named = (mode: Mode, label: string, shown: string, row: () => VNode) =>
        mode.collapsed && (!mode.labelled || shown !== label) ? <KjunTooltip content={label} placement="right">{{ default: row }}</KjunTooltip> : row();
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
      const openOnArrow = (key: string) => (event: KeyboardEvent) => { if (sideNavigationOpensFlyout(event)) { event.preventDefault(); flyout.value = key; } };

      const link = (mode: Mode, item: SideNavigationDestination, depth: 0 | 1 | 2) => {
        const selected = item.key === value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item), shown = sideNavigationShownLabel(item, mode.labelled);
        const routed = !item.disabled && props.linkAs !== undefined;
        // Typed as "a": the router link must render an <a> with these attributes. Disabled items always render a plain <a>.
        const Link = (routed ? props.linkAs : "a") as unknown as "a";
        const target = item.disabled ? undefined : item.href;
        // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
        return <Link {...{ [routed ? props.linkProp : "href"]: target }} class="kjun-side-navigation-item"
          data-child={depth ? "" : undefined} data-depth={depth === 2 ? "2" : undefined} role={item.disabled ? "link" : undefined} tabindex={item.disabled ? -1 : undefined}
          target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
          aria-label={sideNavigationLinkLabel(item, m.value, mode.labelled)} aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
          onKeydown={mode.collapsed ? undefined : (event: KeyboardEvent) => arrows(mode, event)}
          onClick={(event: MouseEvent) => {
            if (item.disabled) { event.preventDefault(); return; }
            if (elsewhere || !isPlainNavigationClick(event)) return;
            emit("navigate", item.key, event);
            if (selected) emit("reselect", item.key, event);
            if (mode.flyout) flyout.value = null;
          }}>
          {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
              Beside a labelled rail's wider indicator the number fits. */}
          {depth ? null : glyph(mode, item.icon, item.label, selected, mark ? mode.labelled ? badge(mark.text, mark.dot, item.badgeTone) : badge("", true, item.badgeTone) : null)}
          <span class={labelClass(mode)}>{shown}</span>
          {!mode.collapsed && mark ? badge(mark.text, mark.dot, item.badgeTone) : null}
          {!mode.collapsed && elsewhere ? <KjunIcon name="external-link" class="kjun-side-navigation-trailing" size={geometry.chevronSize} /> : null}
        </Link>;
      };
      // A destination's row: the link, and its actions beside it (a button cannot sit inside a link).
      const destination = (mode: Mode, item: SideNavigationDestination, depth: 0 | 1 | 2 = 0) => {
        const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
        return <li key={item.key} class="kjun-side-navigation-row" data-actions={actions ? "" : undefined} style={actions ? actionCount(actions.length) : undefined}>
          {named(mode, item.label, sideNavigationShownLabel(item, mode.labelled), () => link(mode, item, depth))}
          {actions ? actionButtons(item.key, actions) : null}
        </li>;
      };
      // A parent inside a parent: a child row with a chevron that opens its destinations one step further in, in a full menu
      // and in a flyout alike.
      const subParent = (mode: Mode, item: SideNavigationSubParent) => {
        const panel = id + "-parent-" + sideNavigationIdPart(item.key), { shown, within, dot, tone } = sideParentState(item, { open: opened, collapsed: false, value });
        return <li key={item.key} class="kjun-side-navigation-row">
          <button type="button" class="kjun-side-navigation-item" data-child="" aria-expanded={shown} aria-controls={panel}
            aria-disabled={item.disabled || undefined} tabindex={item.disabled ? -1 : undefined} aria-label={dot ? sideNavigationToggleName(item.label, dot, m.value) : undefined}
            data-current-within={within ? "" : undefined} onClick={item.disabled ? undefined : () => setParent(item.key, !shown)}
            onKeydown={item.disabled ? undefined : (event: KeyboardEvent) => arrows(mode, event, { shown, panel, set: next => setParent(item.key, next) })}>
            <span class="kjun-side-navigation-label">{item.label}</span>
            {dot ? badge("", true, tone) : null}
            <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />
          </button>
          <div id={panel} data-side-panel=""><KjunCollapse open={shown}><ul class="kjun-side-navigation-children">{item.children.map(child => destination(mode, child, 2))}</ul></KjunCollapse></div>
        </li>;
      };
      const childRow = (mode: Mode, child: SideNavigationParent["children"][number]) => isSideParent(child) ? subParent(mode, child) : destination(mode, child, 1);
      const parent = (mode: Mode, item: SideNavigationParent) => {
        const flies = mode.collapsed && flyoutMode && !item.disabled, panel = id + "-parent-" + sideNavigationIdPart(item.key), shown = sideNavigationShownLabel(item, mode.labelled);
        const state = sideParentState(item, { open: opened, collapsed: mode.collapsed, value });
        const button = () => <button type="button" id={flies ? flyoutTrigger(sideFlyoutKey("parent", item.key)) : undefined} class="kjun-side-navigation-item" aria-expanded={flies ? undefined : state.shown}
          aria-controls={flies ? undefined : panel}
          // aria-disabled instead of disabled: the row keeps its tooltip and its name while it cannot open.
          aria-disabled={item.disabled || undefined} tabindex={item.disabled ? -1 : undefined}
          aria-label={state.dot || shown !== item.label ? sideNavigationToggleName(item.label, state.dot, m.value) : undefined}
          onKeydown={item.disabled ? undefined : flies ? openOnArrow(sideFlyoutKey("parent", item.key)) : mode.collapsed ? undefined
            : (event: KeyboardEvent) => arrows(mode, event, { shown: state.shown, panel, set: next => setParent(item.key, next) })}
          onClick={flies || item.disabled ? undefined : () => mode.collapsed ? reveal(item.key) : setParent(item.key, !state.shown)}
          // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
          data-current-within={state.within ? "" : undefined}>
          {glyph(mode, item.icon, item.label, false, [state.dot ? badge("", true, state.tone) : null, item.disabled ? null : opens()])}
          <span class={labelClass(mode)}>{shown}</span>
          {!mode.collapsed && state.dot ? badge("", true, state.tone) : null}
          {mode.collapsed ? null : <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
        </button>;
        return <li key={item.key} class="kjun-side-navigation-row">
          {flies ? flyoutPanel(sideFlyoutKey("parent", item.key), item.label, () => named(mode, item.label, shown, button),
            () => <ul class="kjun-side-navigation-flyout" data-parent="">{item.children.map(child => childRow(FLYOUT, child))}</ul>)
            : named(mode, item.label, shown, button)}
          {flies ? null : <div id={panel} data-side-panel=""><KjunCollapse open={state.shown}><ul class="kjun-side-navigation-children">{item.children.map(child => childRow(mode, child))}</ul></KjunCollapse></div>}
        </li>;
      };
      const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);
      // An empty group's line in place of its rows: quiet text where a child row's name starts, never a link.
      const emptyRow = (text: string) => <li key=":empty" class="kjun-side-navigation-row"><p class="kjun-side-navigation-empty">{text}</p></li>;
      // A group's rows under its limit, and the row that shows the rest or folds them again. Icons only, every row shows.
      const groupRows = (mode: Mode, section: SideNavigationSection) => {
        if (mode.collapsed) return section.items.map(item => row(mode, item));
        const none = sideSectionEmpty(section);
        if (none) return [emptyRow(none)];
        const { items: visible, hidden, expandable, expanded: all } = sideSectionRows(section, { value, showAll: shownAll });
        if (!expandable) return visible.map(item => row(mode, item));
        const key = section.key!, iconic = section.items.some(item => item.icon);
        // After "N more" the first row it revealed takes focus, found by its place once the list has grown, so the keyboard
        // continues where the list grew.
        const toggle = (event: MouseEvent) => {
          const list = (event.currentTarget as HTMLElement).closest("ul"), first = all ? -1 : section.items.findIndex(item => !visible.includes(item));
          updateShowAll(toggleSideParent(shownAll, key));
          if (first >= 0) nextTick(() => list?.children[first]?.querySelector<HTMLElement>(".kjun-side-navigation-item")?.focus());
        };
        return [...visible.map(item => row(mode, item)), <li key=":more" class="kjun-side-navigation-row">
          <button type="button" class="kjun-side-navigation-item kjun-side-navigation-more" aria-expanded={all} onClick={toggle} onKeydown={(event: KeyboardEvent) => arrows(mode, event)}>
            {iconic ? glyph(mode, all ? "chevron-up" : "dots", "", false) : null}
            <span class="kjun-side-navigation-label">{all ? m.value.showFewerItems : m.value.showMoreItems(hidden)}</span>
          </button>
        </li>];
      };

      // A titled group's heading: its title (static or a toggle) and the group's action.
      const heading = (section: SideNavigationTitledSection, title: VNodeChild) => {
        const action = !collapsed && section.action;
        return <div class="kjun-side-navigation-heading" data-actions={action ? "" : undefined} style={action ? actionCount(1) : undefined}>
          {title}{action ? actionButtons(section.key, [action]) : null}
        </div>;
      };
      // A group title that opens and closes its group, inside its heading. Its end holds what a parent row's end holds: a dot
      // for a badge inside a closed group, or the number of rows (groupCounts), then a chevron that turns over when open.
      // Closed over the current page, the name takes full ink.
      const groupToggle = (section: SideNavigationTitledSection, rows: VNodeChild) => {
        const { shown, within, dot, tone, count } = sideGroupState(section, { openGroups: groups, value }), panel = id + "-group-" + sideNavigationIdPart(section.key);
        const set = (next: boolean) => { if (shown !== next) updateGroups(toggleSideParent(groups, section.key)); };
        return [
          heading(section, <Heading class="kjun-side-navigation-title-heading">
            <button type="button" id={titleId(section.key)} class="kjun-side-navigation-title" data-toggle="" aria-expanded={shown} aria-controls={panel}
              aria-label={dot ? sideNavigationToggleName(section.title, dot, m.value) : undefined} data-current-within={within ? "" : undefined}
              onClick={() => set(!shown)} onKeydown={(event: KeyboardEvent) => arrows(base, event, { shown, panel, set })}>
              <span class="kjun-side-navigation-label">{section.title}</span>
              {dot ? badge("", true, tone) : props.groupCounts ? <span class="kjun-side-navigation-count" aria-hidden="true">{count}</span> : null}
              <KjunIcon name="chevron-down" class="kjun-side-navigation-chevron" size={geometry.groupChevronSize} />
            </button>
          </Heading>),
          <div id={panel} data-side-panel=""><KjunCollapse open={shown}><ul class="kjun-side-navigation-group-items">{rows}</ul></KjunCollapse></div>,
        ];
      };
      const section = (entry: SideNavigationSection, index: number) => {
        const rows = groupRows(base, entry);
        if (!isTitledSection(entry)) return <ul key={"loose:" + (entry.items[0]?.key ?? index)}>{rows}</ul>;
        const toggled = !collapsed && sideSectionToggles(entry, props.collapsibleGroups);
        return <div key={"group:" + entry.key} class="kjun-side-navigation-section" role="group" aria-labelledby={titleId(entry.key)} data-toggles={toggled ? "" : undefined}>
          {toggled ? groupToggle(entry, rows) : [
            heading(entry, <Heading id={titleId(entry.key)} class={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{entry.title}</Heading>),
            <ul>{rows}</ul>,
          ]}
        </div>;
      };
      // A group in a rail of groups: its icon (or initial) with the opens mark, half the selection fill while it holds the
      // current page, and a dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows
      // beside it (flyout).
      const railGroup = (group: SideNavigationTitledSection) => {
        const { within, dot, tone } = sideRailGroupState(group, value), shown = sideNavigationShownTitle(group, labelled), key = sideFlyoutKey("group", group.key);
        const button = () => <button type="button" id={flyoutMode ? flyoutTrigger(key) : undefined} class="kjun-side-navigation-item" aria-label={dot || shown !== group.title ? sideNavigationToggleName(group.title, dot, m.value) : undefined}
          data-current-within={within ? "" : undefined} onKeydown={flyoutMode ? openOnArrow(key) : undefined} onClick={flyoutMode ? undefined : () => revealGroup(group.key)}>
          {glyph(base, group.icon, group.title, false, [dot ? badge("", true, tone) : null, opens()])}
          <span class={labelClass(base)}>{shown}</span>
        </button>;
        return <li key={key} class="kjun-side-navigation-row">
          {flyoutMode ? flyoutPanel(key, group.title, () => named(base, group.title, shown, button),
            () => <ul class="kjun-side-navigation-flyout">{sideSectionEmpty(group) ? emptyRow(group.empty!) : group.items.map(item => row(FLYOUT, item))}</ul>)
            : named(base, group.title, shown, button)}
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
