import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { KjunIconRegistry } from '@kjun/icons';
import { defaultIcons, mergeIcons, resolveIcon, withFallbackIcons } from './icon-registry';

const IconContext = createContext<KjunIconRegistry>(defaultIcons);
export function IconProvider({ icons, children }: { icons?: KjunIconRegistry; children: ReactNode }) {
  const parent = useContext(IconContext);
  const value = useMemo(() => mergeIcons(parent, icons), [parent, icons]);
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}
export function IconFallbacks({ icons, children }: { icons: KjunIconRegistry; children: ReactNode }) {
  const parent = useContext(IconContext);
  const value = useMemo(() => withFallbackIcons(parent, icons), [parent, icons]);
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}
export function useIcon(name: string, filled: boolean) {
  return resolveIcon(useContext(IconContext), name, filled);
}
