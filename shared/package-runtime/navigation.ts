import { useEffect, useRef, useState } from "react";

export function useInitialTab(value: string, candidate: string | undefined, change: (name: string) => void) {
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (value !== "") { requested.current.clear(); return; }
    if (candidate === undefined || candidate === "" || requested.current.has(candidate)) return;
    requested.current.add(candidate);
    change(candidate);
  }, [value, candidate, change]);
}

export function useAccordionState(multiple: boolean) {
  const [opened, setOpened] = useState(new Set<string>());
  useEffect(() => {
    if (!multiple) setOpened(previous => previous.size > 1 ? new Set([...previous].slice(-1)) : previous);
  }, [multiple]);
  return {
    opened,
    toggle: (id: string) => setOpened(previous => {
      const next = new Set(multiple ? previous : []);
      if (previous.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    register: (id: string, defaultOpen: boolean) => {
      if (defaultOpen) setOpened(previous => multiple || !previous.size ? new Set([...previous, id]) : previous);
      return () => setOpened(previous => {
        if (!previous.has(id)) return previous;
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    },
  };
}
