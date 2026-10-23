import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultMessageScope, resolveMessageScope, type KjunMessages, type KjunMessageScope } from './messages';

// React and Native read KjunProvider's locale/messages here; Vue 3 has its own provide/inject.
const MessageContext = createContext<KjunMessageScope>(defaultMessageScope);
export function KjunMessagesProvider({ locale, messages, children }: { locale?: string; messages?: Partial<KjunMessages>; children: ReactNode }) {
  const parent = useContext(MessageContext);
  const value = useMemo(() => resolveMessageScope(parent, locale, messages), [parent, locale, messages]);
  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}
export const useKjunMessageScope = () => useContext(MessageContext);
export const useKjunMessages = () => useContext(MessageContext).messages;
