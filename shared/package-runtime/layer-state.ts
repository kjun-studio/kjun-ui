/** Internal window ownership. Paint order, dismissal and surface appearance are independent. */
export type LayerKind = 'window' | 'popup' | 'tooltip';
export interface FocusTarget { focus?: (options?: { preventScroll?: boolean }) => void; isConnected?: boolean }
export interface LayerEntry {
  id: string;
  kind: LayerKind;
  parent?: string;
  owner?: string;
  order: number;
  windowOrder: number;
  blocked: boolean;
  closing: boolean;
  closeRequested: boolean;
  dismiss: () => void;
  returnTarget?: FocusTarget | null;
  root?: FocusTarget | null;
}
export function createLayerState() {
  const entries = new Map<string, LayerEntry>(), listeners = new Set<() => void>();
  const restoredFocus = new WeakSet<FocusTarget>();
  let revision = 0, sequence = 0, windowSequence = 0;
  let recentPopup: { target?: FocusTarget | null; focused?: FocusTarget | null; owner?: string } | undefined;
  const notify = () => { revision++; for (const listener of [...listeners]) listener(); };
  const windows = () => [...entries.values()].filter(layer => layer.kind === 'window');
  const topWindow = () => windows().sort((a, b) => a.order - b.order).at(-1);
  const windowOf = (id?: string): string | undefined => {
    const layer = id ? entries.get(id) : undefined;
    return layer?.kind === 'window' ? id : layer?.owner;
  };
  const active = (layer: LayerEntry) => !layer.blocked &&
    (layer.kind === 'window' ? topWindow()?.id === layer.id : topWindow()?.id === layer.owner);
  const top = () => [...entries.values()].filter(active).sort((a, b) => a.order - b.order).at(-1);
  function dismiss(layer: LayerEntry) {
    if (layer.closeRequested) return;
    layer.closeRequested = true;
    layer.dismiss();
  }
  function returnFromPopup(layer?: LayerEntry) {
    let target = layer?.returnTarget;
    while (layer?.parent) {
      const parent = entries.get(layer.parent);
      if (!parent || parent.kind === 'window') break;
      target = parent.returnTarget || target;
      layer = parent;
    }
    return target;
  }
  return {
    entries, topWindow, top, windowOf,
    isRestoredFocus(target?: FocusTarget | null) { return !!target && restoredFocus.has(target); },
    clearRestoredFocus(target?: FocusTarget | null) { if (target) restoredFocus.delete(target); },
    markClosing(id: string) {
      const layer = entries.get(id);
      if (!layer || layer.closing) return;
      layer.closing = true;
      const children = [...entries.values()].filter(item => item.owner === id && item.kind !== 'window');
      for (const child of children) child.blocked = true;
      notify();
      for (const child of children) dismiss(child);
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    snapshot: () => revision,
    open(id: string, kind: LayerKind, parent: string | undefined, dismissCallback: () => void, returnTarget?: FocusTarget | null) {
      const existing = entries.get(id);
      if (existing && !existing.closing) { existing.dismiss = dismissCallback; return existing; }
      const previous = topWindow();
      const popup = [...entries.values()].filter(layer => layer.kind !== 'window' && active(layer)).at(-1);
      const recentTarget = recentPopup && returnTarget === recentPopup.focused ? recentPopup.target : undefined;
      const layer: LayerEntry = { id, kind, parent,
        owner: existing ? existing.owner : windowOf(parent) ?? (kind === 'window' ? previous?.id : undefined),
        order: ++sequence, windowOrder: kind === 'window' ? ++windowSequence : 0, blocked: false, closing: false, closeRequested: false, dismiss: dismissCallback,
        root: existing?.root,
        returnTarget: existing?.returnTarget || (kind === 'window' ? (popup ? returnFromPopup(popup) : recentTarget) || returnTarget : returnTarget),
      };
      entries.set(id, layer);
      if (kind === 'window') {
        // Latch suppression before notifying consumers or invoking user callbacks.
        const obsolete = [...entries.values()].filter(item => item.kind !== 'window');
        for (const item of obsolete) item.blocked = true;
        notify();
        for (const item of obsolete) dismiss(item);
      } else {
        layer.blocked = layer.owner !== topWindow()?.id;
        notify();
        if (layer.blocked) dismiss(layer);
      }
      return layer;
    },
    remove(id: string, focused?: FocusTarget | null) {
      const layer = entries.get(id);
      if (!layer) return;
      const wasTop = topWindow()?.id === id;
      const wasPopup = layer.kind === 'popup' && top()?.id === id;
      if (layer.kind !== 'window' && !layer.blocked) {
        // Menu actions can close the menu before the same event mounts a window.
        const recent = { target: returnFromPopup(layer), focused, owner: layer.owner };
        recentPopup = recent;
        setTimeout(() => { if (recentPopup === recent) recentPopup = undefined; }, 0);
      }
      entries.delete(id);
      const obsolete = [...entries.values()].filter(item => item.owner === id && item.kind !== 'window');
      for (const item of obsolete) item.blocked = true;
      notify();
      for (const item of obsolete) dismiss(item);
      const target = wasTop || wasPopup ? layer.returnTarget || topWindow()?.root : undefined;
      if (target) restoredFocus.add(target);
      return target;
    },
    requestClose(id: string) { const layer = entries.get(id); if (layer && active(layer) && top()?.id === id) layer.dismiss(); },
    isActive(id: string) { const layer = entries.get(id); return !!layer && active(layer); },
    isBlocked(id: string) { return entries.get(id)?.blocked ?? false; },
    // These offsets are implementation details, never design tokens or configuration.
    zIndex(id?: string, role: 'backdrop' | 'content' | 'popup' | 'tooltip' | 'toast' = 'content') {
      const owner = windowOf(id), order = owner ? entries.get(owner)?.windowOrder || 0 : 0;
      return 1000 + order * 100 + { backdrop: 0, content: 1, popup: 10, tooltip: 20, toast: 30 }[role];
    },
  };
}
export type LayerState = ReturnType<typeof createLayerState>;
