import { tokens } from "@kjun-ui/tokens";
import { useLayoutEffect, useRef, useState } from 'react';
import type { FeedbackRequest, ToastItem } from '@kjun-ui/tokens';
import { createToastPresence, type PresentedToast } from './toast-presence';

export type { PresentedToast };
export function usePresentedToasts(toasts: ToastItem[], reduced: boolean) {
  const [items, setItems] = useState<PresentedToast[]>([]);
  const presence = useRef<ReturnType<typeof createToastPresence> | null>(null);
  presence.current ??= createToastPresence(setItems);
  useLayoutEffect(() => { presence.current!.sync(toasts, reduced); }, [toasts, reduced]);
  useLayoutEffect(() => () => presence.current!.destroy(), []);
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
