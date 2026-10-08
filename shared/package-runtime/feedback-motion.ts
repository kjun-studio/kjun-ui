import { tokens } from "@kjun/tokens";
import { useLayoutEffect, useRef, useState } from 'react';
import type { FeedbackRequest, ToastItem } from '@kjun/tokens';

export interface PresentedToast { toast: ToastItem; exiting: boolean; born: number }
export function usePresentedToasts(toasts: ToastItem[], reduced: boolean) {
  const [items, setItems] = useState<PresentedToast[]>([]);
  const removals = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useLayoutEffect(() => {
    const ids = new Set(toasts.map(toast => toast.id));
    setItems(previous => {
      const old = new Map(previous.map(item => [item.toast.id, item]));
      const next = toasts.map(toast => ({ toast, exiting: false, born: old.get(toast.id)?.born ?? Date.now() }));
      for (const item of previous) if (!ids.has(item.toast.id) && !reduced) {
        next.push({ ...item, exiting: true });
        if (!removals.current.has(item.toast.id)) removals.current.set(item.toast.id, setTimeout(() => {
          removals.current.delete(item.toast.id);
          setItems(current => current.filter(value => value.toast.id !== item.toast.id));
        }, tokens.motion.toastExit));
      }
      return next;
    });
    if (reduced) { for (const timer of removals.current.values()) clearTimeout(timer); removals.current.clear(); }
  }, [toasts, reduced]);
  useLayoutEffect(() => () => { for (const timer of removals.current.values()) clearTimeout(timer); removals.current.clear(); }, []);
  return items;
}

// Retain the request being painted without postponing controller.settle or its Promise.
export function usePresentedRequest(current: FeedbackRequest | null, reduced: boolean) {
  const [request, setRequest] = useState(current);
  useLayoutEffect(() => {
    if (!request || request.id === current?.id || reduced) { setRequest(current); return; }
    const timer = setTimeout(() => setRequest(current), tokens.motion.layerExit);
    return () => clearTimeout(timer);
  }, [current, request, reduced]);
  return { request, open: !!request && current?.id === request.id };
}
