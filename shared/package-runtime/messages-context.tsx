import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { stableValue } from './stable-value';
import { defaultMessageScope, resolveMessageScope, type KjunMessages, type KjunMessageScope } from './messages';

// React and Native read KjunProvider's locale/messages here; Vue 3 has its own provide/inject.
export const KjunMessageContext = createContext<KjunMessageScope>(defaultMessageScope);
export function KjunMessagesProvider({ locale, messages, children }: { locale?: string; messages?: Partial<KjunMessages>; children: ReactNode }) {
  const parent = useContext(KjunMessageContext);
  // Inline messages with the same contents keep one scope, so consumers do not re-render for nothing.
  const [stable] = useState(stableValue<Partial<KjunMessages> | undefined>), own = stable(messages);
  const value = useMemo(() => resolveMessageScope(parent, locale, own), [parent, locale, own]);
  return <KjunMessageContext.Provider value={value}>{children}</KjunMessageContext.Provider>;
}
export const useKjunMessageScope = () => useContext(KjunMessageContext);
export const useKjunMessages = () => useContext(KjunMessageContext).messages;
