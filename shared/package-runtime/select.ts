import { useEffect, useRef, useState } from "react";

/** A request does not change controlled state. Reset only on logical dismissal. */
export function useSelectState(controlled: boolean | undefined, disabled: boolean, pageSize: number, onOpenChange?: (open: boolean) => void) {
  const [internal, setInternal] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const [session, setSession] = useState(0);
  const isControlled = typeof controlled === "boolean";
  const open = !disabled && (isControlled ? controlled : internal);
  const previousOpen = useRef(open);
  useEffect(() => {
    if (disabled && !isControlled) setInternal(false);
    if (previousOpen.current && !open) {
      setQuery("");
      setLimit(pageSize);
      setSession(value => value + 1);
    }
    previousOpen.current = open;
  }, [open, disabled, isControlled, pageSize]);
  useEffect(() => { setLimit(pageSize); }, [pageSize]);
  const changeOpen = (next: boolean) => {
    if (next === open || (next && disabled)) return;
    if (!isControlled) setInternal(next);
    onOpenChange?.(next);
  };
  const search = (next: string) => { setQuery(next); setLimit(pageSize); };
  return { open, query, limit, session, changeOpen, search, showMore: () => setLimit(value => value + pageSize) };
}
