import { computed, inject, onBeforeUnmount, onMounted, provide, shallowRef, useId, watch, type InjectionKey, type Ref } from "vue";
import { installLayerKeyboard } from "../../../../shared/package-runtime/layer-keyboard";
import { chooseReturnTarget, createLayerState, type FocusTarget, type LayerKind } from "../../../../shared/package-runtime/layer-state";

// The Vue form of shared/package-runtime/use-layer.tsx: one layer stack per outermost Provider.
type LayerState = ReturnType<typeof createLayerState>;
interface LayerContext { state: LayerState; version: Ref<number>; managed: boolean }
const kjunLayersKey: InjectionKey<LayerContext> = Symbol("kjunLayers");
/** The window that encloses a layer's content; nested popups and windows belong to it. */
export const kjunLayerScopeKey: InjectionKey<string | undefined> = Symbol("kjunLayerScope");

function subscribe(state: LayerState) {
  const version = shallowRef(0);
  const unsubscribe = state.subscribe(() => { version.value++; });
  onBeforeUnmount(unsubscribe);
  return version;
}
let fallback: LayerContext | undefined;
function fallbackContext() {
  // Layers outside any Provider share one stack without keyboard ownership, like React's fallback.
  if (!fallback) {
    const state = createLayerState(), version = shallowRef(0);
    state.subscribe(() => { version.value++; });
    fallback = { state, version, managed: false };
  }
  return fallback;
}

export function provideLayers() {
  const parent = inject(kjunLayersKey, null);
  if (parent) { provide(kjunLayersKey, parent); return parent; }
  const state = createLayerState();
  const context: LayerContext = { state, version: subscribe(state), managed: true };
  let uninstall: (() => void) | undefined;
  onMounted(() => { uninstall = installLayerKeyboard(document, state); });
  onBeforeUnmount(() => uninstall?.());
  provide(kjunLayersKey, context);
  return context;
}

export function useLayerContext() {
  return inject(kjunLayersKey, null) ?? fallbackContext();
}

const currentFocus = (): FocusTarget | null => typeof document === "undefined" ? null : document.activeElement as HTMLElement;
export function focusTrigger(target: FocusTarget | null | undefined) {
  if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement)
    return target.matches("button,input,[href],[tabindex]") ? target
      : target.querySelector<HTMLElement>("button,input,[href],[tabindex]") || target;
  return target;
}
function restoreFocus(target: FocusTarget | null | undefined, state: LayerState, id: string) {
  // Overlay content finishes its own focus cleanup after this update.
  const restore = () => {
    if (state.entries.has(id)) return;
    if (target?.isConnected !== false && !(typeof HTMLElement !== "undefined" && target instanceof HTMLElement && target.closest("[inert]")))
      target?.focus?.({ preventScroll: true });
    else state.topWindow()?.root?.focus?.({ preventScroll: true });
  };
  if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(restore);
  else queueMicrotask(restore);
}

/** The requested state can remain true while a new window suppresses its popup. */
export function usePopupExpanded(open: () => boolean, trigger: () => FocusTarget | null) {
  const { state, version } = useLayerContext();
  return computed(() => {
    void version.value;
    const target = focusTrigger(trigger());
    return open() && ![...state.entries.values()].some(layer => layer.kind === "popup" && layer.blocked && layer.returnTarget === target);
  });
}

export function useLayer(open: () => boolean, present: () => boolean, kind: LayerKind, close: () => void, trigger?: () => FocusTarget | null,
  returnFocus?: () => FocusTarget | null | false | undefined) {
  const context = useLayerContext(), { state, version } = context;
  const parent = inject(kjunLayerScopeKey, undefined);
  const id = "kjun-layer-" + useId();
  let openingFocus: FocusTarget | null = null, pendingFocus: FocusTarget | null | undefined = null;
  // A Popover's returnFocus replaces where focus goes back; false leaves focus where it is.
  const removeLayer = () => {
    const removed = state.remove(id, currentFocus());
    return removed && returnFocus ? chooseReturnTarget(returnFocus(), removed) : removed;
  };
  // Sync flush runs as the state changes, before the DOM updates: focus is still on the opener.
  watch(open, (value, previous) => { if (value && !previous) openingFocus = currentFocus(); }, { flush: "sync", immediate: true });
  watch([open, present], ([isOpen, isPresent]) => {
    if (isOpen) {
      pendingFocus = null;
      state.open(id, kind, parent, () => close(), focusTrigger(trigger?.()) || openingFocus);
    } else if (kind === "window" && isPresent) state.markClosing(id);
    // Suppressed controlled popups stay latched until the owner acknowledges false.
    else if (kind !== "window" || !isPresent) {
      const target = removeLayer();
      if (target) pendingFocus = target;
      if (!isPresent && pendingFocus) { restoreFocus(pendingFocus, state, id); pendingFocus = null; }
    }
  }, { flush: "sync", immediate: true });
  onBeforeUnmount(() => {
    const target = removeLayer();
    if (target || pendingFocus) restoreFocus(target || pendingFocus, state, id);
  });
  return {
    id, state, keyboardManaged: context.managed,
    scopeActive: computed(() => { void version.value; return state.windowOf(parent) === state.topWindow()?.id; }),
    blocked: computed(() => { void version.value; return !!state.entries.get(id)?.blocked; }),
    active: computed(() => { void version.value; return state.entries.get(id) ? state.isActive(id) : open(); }),
    zIndex: computed(() => { void version.value; return state.zIndex(id, kind === "window" ? "backdrop" : kind); }),
    close: () => state.requestClose(id),
  };
}
export type Layer = ReturnType<typeof useLayer>;

/** A popup closed by Escape returns focus to its field; that focus must not reopen it. */
export function usePopupFocusGuard(trigger: () => FocusTarget | null) {
  const { state } = useLayerContext();
  return {
    canOpen: () => !state.isRestoredFocus(focusTrigger(trigger())),
    clear: () => state.clearRestoredFocus(focusTrigger(trigger())),
  };
}
