import { useEffect, useRef, useState } from "react";
import type { createFeedbackController } from "@kjun-ui/tokens";
import type { PresentedToast } from "./toast-presence";
import { toastPresentation, toastStackLayout } from "./toast-presentation";

type Controller = ReturnType<typeof createFeedbackController>;
/** Stack state shared by the React and Native stacks: what to draw, whether it is expanded, and what screen readers
 * should hear about toasts that are folded or waiting and so have no card of their own to announce them. */
export function useToastStack(items: PresentedToast[], controller: Controller, { placement, narrow }: { placement: "top" | "bottom"; narrow: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const stack = toastStackLayout(items, { placement, narrow, expanded });
  const total = items.filter((item) => !item.exiting).length;
  // An expanded stack folds again once a single toast is left; while open, every toast holds still.
  useEffect(() => { if (expanded && total <= 1) setExpanded(false); }, [expanded, total]);
  useEffect(() => {
    if (!expanded) return;
    const hold = Symbol("expanded");
    controller.holdAll(hold);
    return () => controller.releaseAll(hold);
  }, [expanded, controller]);
  const heard = useRef(new Set<number>()), [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    // A drawn card announces itself; an unseen toast is spoken once, the first time it arrives unseen.
    const fresh = stack.unseen.filter((item) => !heard.current.has(item.toast.id));
    for (const item of [...stack.items, ...stack.unseen]) heard.current.add(item.toast.id);
    const ids = new Set(items.map((item) => item.toast.id));
    for (const id of heard.current) if (!ids.has(id)) heard.current.delete(id);
    if (fresh.length) setAnnouncement(fresh.map((item) => toastPresentation(item.toast).spoken).join(" "));
  });
  return { stack, expanded, setExpanded, announcement };
}
