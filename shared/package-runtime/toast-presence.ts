import { tokens, type ToastItem } from "@kjun-ui/tokens";
import { toastEntryDelay } from "./toast-entry";

export interface PresentedToast { toast: ToastItem; exiting: boolean; born: number }
/** What the stacks draw from the controller's toasts: a leaving toast stays for its exit motion, and toasts that
 * arrive within one stack move of the last arrival wait, then enter together. Framework wrappers only call sync. */
export function createToastPresence(publish: (items: PresentedToast[]) => void) {
  let items: PresentedToast[] = [], shown = new Set<number>(), lastEntry = -Infinity;
  let latest: { toasts: ToastItem[]; reduced: boolean } = { toasts: [], reduced: false };
  let entry: ReturnType<typeof setTimeout> | undefined;
  const removals = new Map<number, ReturnType<typeof setTimeout>>();
  const set = (next: PresentedToast[]) => { items = next; publish(next); };
  const clearRemovals = () => { for (const timer of removals.values()) clearTimeout(timer); removals.clear(); };
  const sync = (toasts: ToastItem[], reduced: boolean) => {
    latest = { toasts, reduced };
    const ids = new Set(toasts.map((toast) => toast.id));
    const fresh = toasts.some((toast) => !shown.has(toast.id));
    const wait = fresh ? toastEntryDelay(lastEntry, Date.now(), reduced) : 0;
    clearTimeout(entry);
    if (wait > 0) entry = setTimeout(() => sync(latest.toasts, latest.reduced), wait);
    // While waiting, a new toast is held back; toasts already on screen still update and leave.
    const visible = wait > 0 ? toasts.filter((toast) => shown.has(toast.id)) : toasts;
    if (fresh && wait <= 0) lastEntry = Date.now();
    shown = new Set(visible.map((toast) => toast.id));
    const old = new Map(items.map((item) => [item.toast.id, item]));
    const next = visible.map((toast) => ({ toast, exiting: false, born: old.get(toast.id)?.born ?? Date.now() }));
    for (const item of items) if (!ids.has(item.toast.id) && !reduced) {
      next.push({ ...item, exiting: true });
      if (!removals.has(item.toast.id)) removals.set(item.toast.id, setTimeout(() => {
        removals.delete(item.toast.id);
        set(items.filter((value) => value.toast.id !== item.toast.id));
      }, tokens.motion.toastExit));
    }
    if (reduced) clearRemovals();
    set(next);
  };
  return { sync, destroy() { clearTimeout(entry); clearRemovals(); } };
}
