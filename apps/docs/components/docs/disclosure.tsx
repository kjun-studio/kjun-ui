'use client';
import { createContext, useContext, useId, useState, type HTMLAttributes } from 'react';
import { DsButton, type DsButtonProps } from '@kjun/react';

const Context = createContext<{ open: boolean; change(open: boolean): void; id: string } | null>(null);
function useDisclosure() {
  const value = useContext(Context);
  if (!value) throw Error('Disclosure controls require a disclosure.');
  return value;
}
// Page disclosures keep URL/session-owned state while KJUN owns the trigger.
export function Collapsible({ open: controlled, onOpenChange, children, ...props }: HTMLAttributes<HTMLDivElement> & {
  open?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  const [own, setOwn] = useState(false), id = useId();
  const open = controlled ?? own;
  return <Context.Provider value={{ open, id, change: next => { setOwn(next); onOpenChange?.(next); } }}>
    <div {...props}>{children}</div>
  </Context.Provider>;
}
export function CollapsibleTrigger({ onClick, ...props }: DsButtonProps) {
  const { open, change, id } = useDisclosure();
  return <DsButton size="sm" variant="ghost" aria-expanded={open} aria-controls={id}
    {...props} onClick={event => { onClick?.(event); if (!event.defaultPrevented) change(!open); }} />;
}
export function CollapsibleContent({ keepMounted = false, children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { keepMounted?: boolean }) {
  const { open, id } = useDisclosure();
  return open || keepMounted ? <div id={id} className={'docs-disclosure-content ' + className} {...props} hidden={!open}>{children}</div> : null;
}
