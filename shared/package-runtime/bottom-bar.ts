// Bottom bars (KjunBottomNavigation, KjunFloatingNavigation, KjunBottomActionBar) report their height so floating edge components
// such as KjunFab sit above them without the app passing the height by hand.

/** Heights by bar; the total is what a floating component must clear. Native keeps one per outermost KjunProvider. */
export interface BottomBarStore {
  set(key: object, height: number): void;
  remove(key: object): void;
  subscribe(listener: () => void): () => void;
  total(): number;
}
export function createBottomBarStore(): BottomBarStore {
  const heights = new Map<object, number>(), listeners = new Set<() => void>();
  let total = 0;
  const update = () => {
    let next = 0;
    heights.forEach(height => { next += height; });
    if (next === total) return;
    total = next;
    listeners.forEach(listener => listener());
  };
  return {
    set(key, height) { heights.set(key, Number.isFinite(height) ? Math.max(0, height) : 0); update(); },
    remove(key) { heights.delete(key); update(); },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    total: () => total,
  };
}

const webStores = new WeakMap<HTMLElement, BottomBarStore>();
/**
 * Web: writes the bar's height (with its bottom margin) as --_kjun-bottom-bar on the outermost KjunProvider scope while the bar is mounted.
 * A bar the app hides (display: none) measures 0. Returns the cleanup.
 */
export function trackBottomBar(element: HTMLElement | null): () => void {
  if (!element || typeof ResizeObserver === "undefined") return () => {};
  let scope: HTMLElement | null = null;
  for (let node = element.parentElement; node; node = node.parentElement) if (node.classList.contains("kjun-scope")) scope = node;
  if (!scope) return () => {};
  const host = scope;
  let store = webStores.get(host);
  if (!store) {
    const created = store = createBottomBarStore();
    webStores.set(host, created);
    created.subscribe(() => {
      if (created.total()) host.style.setProperty("--_kjun-bottom-bar", created.total() + "px");
      else host.style.removeProperty("--_kjun-bottom-bar");
    });
  }
  // A floating bar stands off the bottom edge by its margin, which a component above it must clear as well.
  const measure = () => element.getBoundingClientRect().height + (parseFloat(getComputedStyle(element).marginBottom) || 0);
  const bars = store, observer = new ResizeObserver(() => bars.set(element, measure()));
  observer.observe(element);
  return () => { observer.disconnect(); bars.remove(element); };
}

/** A FAB's extra bottom offset in px; anything that is not a positive number counts as 0. */
export const fabOffset = (offsetBottom: unknown) => typeof offsetBottom === "number" && offsetBottom > 0 && Number.isFinite(offsetBottom) ? offsetBottom : 0;
