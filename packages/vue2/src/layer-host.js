import { tokens } from "@kjun-ui/tokens";
import { createLayerState } from '../../../shared/package-runtime/layer-state.ts';
import { createPortalScope } from '../../../shared/package-runtime/portal-scope';
import { installLayerKeyboard } from '../../../shared/package-runtime/layer-keyboard';
const portals = new Set();
const selector = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
function trigger(vm) {
  const node = vm.$refs.trigger || vm.$refs.input || vm.$el;
  const element = node?.$el || node;
  return element?.matches?.(selector) ? element : element?.querySelector?.(selector);
}
export function containsLayer(root, target) {
  return root?.contains(target) || [...portals].some(portal =>
    (root === portal.anchor || root?.contains(portal.anchor)) && portal.el.contains(target));
}
export function activeFocusElements(element) {
  const scope = [...portals].find(portal => portal.el.contains(element));
  if (!scope) return [...element.querySelectorAll(selector)];
  const state = scope.host.state, top = state.top(), nodes = [];
  // A menu with roving tabindex still belongs to this window's input scope.
  for (const portal of portals) if (portal.host.state === state &&
    (portal.kind === 'toast' || portal.id === top?.id || (top?.kind === 'window' && portal.id === scope.id))) {
    nodes.push(...portal.el.querySelectorAll(selector));
  }
  return nodes.length ? nodes : [...element.querySelectorAll(selector)];
}
export function createVueLayerHost(parent) {
  const state = parent?.state || createLayerState();
  const host = { state, root: null, content: null, element: null, scope: undefined, children: new Set() };
  let portalScope;
  parent?.children.add(host);
  const sync = () => {
    if (host.content) host.content.inert = state.windowOf(host.scope?.()) !== state.topWindow()?.id;
    for (const portal of portals) if (portal.host === host) {
      const { el, id, kind } = portal;
      const entry = state.entries.get(id);
      portal.vm.kjunLayerBlocked = !!entry?.blocked;
      const inactive = kind !== 'toast' && (!entry || entry.closing || !state.isActive(id));
      el.inert = inactive;
      if (inactive) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
      if (entry?.blocked) el.style.setProperty('display', 'none', 'important');
      if (kind === 'window' && entry?.root) entry.root.style.zIndex = String(state.zIndex(id, 'content'));
      if (kind === 'tooltip') el.style.boxShadow = 'var(--_kjun-tooltip-elevation)';
      el.style.zIndex = String(state.zIndex(kind === 'toast' ? state.topWindow()?.id : id,
        kind === 'window' ? 'backdrop' : kind));
    }
  };
  const unsubscribe = state.subscribe(sync);
  let removeKeyboard;
  host.attach = () => {
    if (parent && host.root && parent.element && !portalScope) {
      portalScope = createPortalScope(host.root, parent.element);
      while (host.element.firstChild) portalScope.element.appendChild(host.element.firstChild);
      host.element = portalScope.element;
    }
    for (const child of host.children) child.attach();
  };
  host.mount = (root, content, element, scope) => {
    Object.assign(host, { root, content, element, scope });
    host.attach();
    if (!parent) removeKeyboard = installLayerKeyboard(document, state);
    sync();
  };
  host.sync = sync;
  host.destroy = () => {
    unsubscribe();
    removeKeyboard?.();
    if (host.content) host.content.inert = false;
    portalScope?.destroy();
    parent?.children.delete(host);
  };
  return host;
}
function mount(el, binding, vnode) {
  const vm = vnode.context, host = vm.kjunLayers;
  if (!host) return;
  const kind = binding.value;
  const id = `vue-layer-${vm._uid}`;
  vm._kjunLayerId = id;
  let ancestor = vm.$parent;
  while (ancestor && !host.state.entries.has(ancestor._kjunLayerId)) ancestor = ancestor.$parent;
  const portal = { el, id, kind, host, vm, anchor: vm.$el };
  portals.add(portal); el._kjunPortal = portal;
  const previous = kind === 'window' ? vm._kjunReturnTarget || document.activeElement : document.activeElement;
  const dismiss = () => {
    if (kind === 'window') { if (vm.closeOnEsc !== false) vm.close(); }
    else if (kind === 'tooltip') vm.hide();
    else if (vm.closeDropdown) vm.closeDropdown();
    else vm.close();
  };
  if (kind !== 'toast') {
    Object.assign(portal, { parent: ancestor?._kjunLayerId, dismiss });
    const entry = host.state.open(id, kind, ancestor?._kjunLayerId, dismiss, kind === 'window' ? previous : trigger(vm));
    entry.root = el.querySelector('[role="dialog"]') || el;
    if (kind === 'window') vm._kjunReturnTarget = entry.returnTarget;
  }
  vm.$nextTick(() => {
    if (!el._kjunPortal || vm._isDestroyed) return;
    // Moving a node blurs its focused descendant; an opening popup may already have focused one.
    const focused = el.contains(document.activeElement) ? document.activeElement : null;
    host.element?.appendChild(el);
    if (focused?.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
    host.sync();
    vm.updatePosition?.(); vm.updateDropdownPosition?.();
    if (binding.modifiers.field) {
      portal.position = () => {
        const input = trigger(vm);
        if (!input) return;
        const rect = input.getBoundingClientRect(), height = Math.min(el.scrollHeight, tokens.extensions.menu.listMaxHeight);
        const top = rect.bottom + tokens.extensions.floating.fieldGap + height <= innerHeight - tokens.extensions.floating.viewportInset || rect.top < height + tokens.extensions.floating.viewportInset ? rect.bottom + tokens.extensions.floating.fieldGap : Math.max(tokens.extensions.floating.viewportInset, rect.top - height - tokens.extensions.floating.fieldGap);
        Object.assign(el.style, { position: 'fixed', marginTop: '0px', left: Math.max(tokens.extensions.floating.viewportInset, rect.left) + 'px', top: top + 'px', width: Math.min(rect.width, innerWidth - 2 * tokens.extensions.floating.viewportInset) + 'px', maxHeight: Math.max(0, Math.min(tokens.extensions.menu.listMaxHeight, innerHeight - top - tokens.extensions.floating.viewportInset)) + 'px' });
      };
      portal.position(); window.addEventListener('scroll', portal.position, true); window.addEventListener('resize', portal.position);
      portal.observer = new ResizeObserver(portal.position); portal.observer.observe(el);
    }
  });
}
export function setWindowLayerOpen(el, open) {
  const portal = el._kjunPortal;
  if (!portal || portal.kind !== 'window') return;
  const { host, id, parent, dismiss, vm } = portal;
  if (open) host.state.open(id, 'window', parent, dismiss, vm._kjunReturnTarget);
  else host.state.markClosing(id);
  host.sync();
}
function unmount(el) {
  const portal = el._kjunPortal;
  if (!portal) return;
  const { host, id, kind } = portal;
  portals.delete(portal); delete el._kjunPortal;
  window.removeEventListener('scroll', portal.position, true); window.removeEventListener('resize', portal.position);
  portal.observer?.disconnect();
  const target = kind === 'toast' ? null : host.state.remove(id, document.activeElement);
  if (target) requestAnimationFrame(() => {
    if (!host.state.entries.has(id)) {
      if (target.isConnected && !target.closest?.('[inert]')) target.focus?.({ preventScroll: true });
      else host.state.topWindow()?.root?.focus?.({ preventScroll: true });
    }
  });
}
export const layerMixin = {
  data: () => ({ kjunLayerBlocked: false }),
  methods: {
    canOpenOnFocus() { return !this.kjunLayers?.state.isRestoredFocus(trigger(this)); },
    clearRestoredFocus() { this.kjunLayers?.state.clearRestoredFocus(trigger(this)); },
  },
  inject: { kjunLayers: { default: null } },
  directives: { 'kjun-layer': { inserted: mount, componentUpdated(el) { el._kjunPortal?.host.sync(); }, unbind: unmount } },
};
