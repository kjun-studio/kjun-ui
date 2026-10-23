import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultMessageScope, resolveMessageScope, type KjunMessages, type KjunMessageScope } from './messages';

// React and Native read KjunProvider's locale/messages here; Vue 3 has its own provide/inject.
export const KjunMessageContext = createContext<KjunMessageScope>(defaultMessageScope);
export function KjunMessagesProvider({ locale, messages, children }: { locale?: string; messages?: Partial<KjunMessages>; children: ReactNode }) {
  const parent = useContext(KjunMessageContext);
  const value = useMemo(() => resolveMessageScope(parent, locale, messages), [parent, locale, messages]);
  return <KjunMessageContext.Provider value={value}>{children}</KjunMessageContext.Provider>;
}
export const useKjunMessageScope = () => useContext(KjunMessageContext);
export const useKjunMessages = () => useContext(KjunMessageContext).messages;
