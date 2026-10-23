import { installLayerKeyboard } from './layer-keyboard';
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { chooseReturnTarget, createLayerState, type FocusTarget, type LayerKind } from './layer-state';
const fallback = createLayerState();
const LayerContext = createContext(fallback);
export const LayerScope = createContext<string | undefined>(undefined);
export function LayerProvider({ children, escapeKeyUpFallback = false }: { children: ReactNode; escapeKeyUpFallback?: boolean }) {
  const parent = useContext(LayerContext);
  const [state] = useState(() => parent === fallback ? createLayerState() : parent);
  useLayoutEffect(() => {
    if (parent !== fallback || typeof document === 'undefined') return;
    return installLayerKeyboard(document, state, escapeKeyUpFallback);
  }, [state, parent, escapeKeyUpFallback]);
  return <LayerContext.Provider value={state}>{children}</LayerContext.Provider>;
}
export function useLayerState() {
  const state = useContext(LayerContext);
  useSyncExternalStore(state.subscribe, state.snapshot, state.snapshot);
  return state;
}
/** The requested state can remain true while a new window suppresses its popup. */
export function usePopupExpanded(open: boolean, trigger: { current: FocusTarget | null }) {
  const state = useLayerState(), target = focusTrigger(trigger.current);
  return open && ![...state.entries.values()].some(layer => layer.kind === 'popup' && layer.blocked && layer.returnTarget === target);
}
export function usePopupFocusGuard(trigger: { current: FocusTarget | null }) {
  const state = useContext(LayerContext);
  return {
    canOpen: () => !state.isRestoredFocus(focusTrigger(trigger.current)),
    clear: () => state.clearRestoredFocus(focusTrigger(trigger.current)),
  };
}
export function useActiveLayerScope() {
  const state = useLayerState(), parent = useContext(LayerScope);
  return state.windowOf(parent) === state.topWindow()?.id;
}
function currentFocus(): FocusTarget | null {
  return typeof document === 'undefined' ? null : document.activeElement as HTMLElement;
}
// React Native defines a global HTMLElement for its host elements, which have no matches, closest or
// querySelector. Check for the DOM methods themselves instead of `instanceof HTMLElement`.
function domElement(target: unknown): target is HTMLElement {
  const node = target as Partial<HTMLElement> | null | undefined;
  return typeof node?.matches === 'function' && typeof node.closest === 'function' && typeof node.querySelector === 'function';
}
export function focusTrigger(target: FocusTarget | null | undefined) {
  if (domElement(target)) {
    return target.matches('button,input,[href],[tabindex]') ? target :
      target.querySelector<HTMLElement>('button,input,[href],[tabindex]') || target;
  }
  return target;
}
export function isRestorableFocus(item: FocusTarget | null | undefined) {
  return item?.isConnected !== false && !(domElement(item) && item.closest('[inert]'));
}
function restoreFocus(target: FocusTarget | null | undefined, state: ReturnType<typeof createLayerState>, id: string, fallback?: FocusTarget | null) {
  // Overlay content finishes its own focus cleanup after this update.
  const restore = () => {
    if (state.entries.has(id)) return;
    if (isRestorableFocus(target)) target?.focus?.({ preventScroll: true });
    // A chosen return target can vanish during the exit motion; the trigger is the next choice.
    else if (fallback && fallback !== target && isRestorableFocus(fallback)) fallback.focus?.({ preventScroll: true });
    else state.topWindow()?.root?.focus?.({ preventScroll: true });
  };
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(restore);
  else queueMicrotask(restore);
}
export function useLayer(open: boolean, present: boolean, kind: LayerKind, close: () => void,
  trigger?: { current: FocusTarget | null }, returnFocus?: () => FocusTarget | null | false | undefined) {
  const state = useLayerState(), parent = useContext(LayerScope), id = useId();
  const callback = useRef(close); callback.current = close;
  const returnRef = useRef(returnFocus); returnRef.current = returnFocus;
  const fallbackFocus = useRef<FocusTarget | null | undefined>(null);
  // A Popover's returnFocus replaces where focus goes back; the trigger stays the fallback.
  const removeLayer = () => {
    const removed = state.remove(id, currentFocus());
    if (removed) fallbackFocus.current = removed;
    return removed && returnRef.current ? chooseReturnTarget(returnRef.current(), removed) : removed;
  };
  const openingFocus = useRef<FocusTarget | null>(null);
  const wasOpen = useRef(false);
  const pendingFocus = useRef<FocusTarget | null | undefined>(null);
  if (open && !wasOpen.current) openingFocus.current = currentFocus();
  wasOpen.current = open;
  useLayoutEffect(() => {
    if (open) {
      pendingFocus.current = null;
      state.open(id, kind, parent, () => callback.current(), focusTrigger(trigger?.current) || openingFocus.current);
    }
    else if (kind === 'window' && present) state.markClosing(id);
    // Suppressed controlled popups stay latched until the owner acknowledges false.
    else if (kind !== 'window' || !present) {
      const target = removeLayer();
      if (target) pendingFocus.current = target;
      if (!present && pendingFocus.current) {
        restoreFocus(pendingFocus.current, state, id, fallbackFocus.current);
        pendingFocus.current = null;
      }
    }
  }, [open, present, state, id, kind, parent, trigger]);
  useLayoutEffect(() => () => {
    const target = removeLayer();
    if (target || pendingFocus.current) restoreFocus(target || pendingFocus.current, state, id, fallbackFocus.current);
  }, [state, id]);
  const entry = state.entries.get(id);
  return { id, state, keyboardManaged: state !== fallback, scopeActive: state.windowOf(parent) === state.topWindow()?.id, blocked: !!entry?.blocked, active: entry ? state.isActive(id) : open,
    zIndex: state.zIndex(id, kind === 'window' ? 'backdrop' : kind),
    close: () => state.requestClose(id),
  };
}
