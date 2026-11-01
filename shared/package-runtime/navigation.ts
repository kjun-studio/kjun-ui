import { useEffect, useRef, useState } from "react";
import { registerOpened, toggleOpened, trimToSingle, unregisterOpened } from "./accordion-state";

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
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set<string>());
  useEffect(() => {
    if (!multiple) setOpened(trimToSingle);
  }, [multiple]);
  return {
    opened,
    toggle: (id: string) => setOpened(previous => toggleOpened(previous, id, multiple)),
    register: (id: string, defaultOpen: boolean) => {
      setOpened(previous => registerOpened(previous, id, defaultOpen, multiple));
      return () => setOpened(previous => unregisterOpened(previous, id));
    },
  };
}
