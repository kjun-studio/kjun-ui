import { useEffect, useRef, useState } from "react";
import { openedFromValue, registerOpened, toggleOpened, trimToSingle, unregisterOpened } from "./accordion-state";

export function useInitialTab(value: string, candidate: string | undefined, change: (name: string) => void) {
  const requested = useRef(new Set<string>());
  useEffect(() => {
    if (value !== "") { requested.current.clear(); return; }
    if (candidate === undefined || candidate === "" || requested.current.has(candidate)) return;
    requested.current.add(candidate);
    change(candidate);
  }, [value, candidate, change]);
}

/** Which items of an Accordion are open. With value the group is controlled: it shows value only and onValueChange
 * requests each change; without it the group keeps its own set (from defaultValue and the items' defaultOpen) and reports changes. */
export function useAccordionState(multiple: boolean, control: { value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void } = {}) {
  const controlled = control.value !== undefined;
  const [own, setOwn] = useState<ReadonlySet<string>>(() => openedFromValue(control.defaultValue, multiple));
  const opened = controlled ? openedFromValue(control.value, multiple) : own;
  const latest = useRef({ opened, multiple, controlled, onValueChange: control.onValueChange });
  latest.current = { opened, multiple, controlled, onValueChange: control.onValueChange };
  useEffect(() => {
    if (!multiple && !controlled) setOwn(trimToSingle);
  }, [multiple]);
  return {
    opened,
    controlled,
    toggle: (id: string) => {
      const current = latest.current, next = toggleOpened(current.opened, id, current.multiple);
      if (!current.controlled) setOwn(next);
      current.onValueChange?.([...next]);
    },
    register: (id: string, defaultOpen: boolean) => {
      // A controlled group shows its value only, so an item's defaultOpen does not apply there.
      if (!latest.current.controlled) setOwn(previous => registerOpened(previous, id, defaultOpen, latest.current.multiple));
      return () => { if (!latest.current.controlled) setOwn(previous => unregisterOpened(previous, id)); };
    },
  };
}
