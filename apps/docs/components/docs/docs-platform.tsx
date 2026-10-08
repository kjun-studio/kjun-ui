'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DsSelect } from '@kjun-ui/react';
import { platformNames, type PlatformName } from '../../../../shared/demo-config';
import { isPlatform, platformHref, platformStorageKey, resolvePlatform } from '../../../../shared/docs-platform';

interface DocsPlatformState {
  platform: PlatformName | null;
  selectPlatform(platform: PlatformName): void;
  href(path: string): string;
}
const Context = createContext<DocsPlatformState | null>(null);

export function DocsPlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<PlatformName | null>(null);
  const current = useRef<PlatformName | null>(null);
  const pathname = usePathname(), search = useSearchParams().toString();
  const apply = useCallback((next: PlatformName, push: boolean) => {
    current.current = next;
    setPlatform(next);
    try { sessionStorage.setItem(platformStorageKey, next); } catch { /* URL and in-memory state still work. */ }
    const url = new URL(location.href);
    url.searchParams.set('platform', next);
    if (url.href !== location.href) window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url);
  }, []);
  useEffect(() => {
    const restore = () => {
      let saved: unknown = current.current;
      try { saved = sessionStorage.getItem(platformStorageKey) || saved; } catch { /* Storage is optional. */ }
      apply(resolvePlatform(location.search, saved), false);
    };
    restore();
    window.addEventListener('popstate', restore);
    window.addEventListener('pageshow', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('pageshow', restore); };
  }, [pathname, search, apply]);
  const selectPlatform = useCallback((next: PlatformName) => { if (isPlatform(next)) apply(next, true); }, [apply]);
  const value = useMemo(() => ({ platform, selectPlatform, href: (path: string) => platformHref(path, platform) }), [platform, selectPlatform]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDocsPlatform() {
  const context = useContext(Context);
  if (!context) throw Error('Document content requires DocsPlatformProvider.');
  return context;
}

export function PlatformLoading() {
  return <p className="platform-loading" role="status">문서 플랫폼을 확인하는 중…</p>;
}

export function DocsPlatformSelect() {
  const { platform, selectPlatform } = useDocsPlatform();
  return <div className="docs-platform-select">
    <DsSelect value={platform} disabled={!platform} size="sm" ariaLabel="문서 플랫폼" placeholder="플랫폼 확인 중…"
      options={Object.entries(platformNames).map(([value, label]) => ({ value, label }))}
      onValueChange={value => { if (isPlatform(value)) selectPlatform(value); }} />
  </div>;
}
