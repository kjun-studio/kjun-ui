'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DsButton, DsDrawer } from '@kjun-ui/react';

const Context = createContext<{
  mobile: boolean; open: boolean; openMobile: boolean;
  setOpenMobile(open: boolean): void; toggle(): void;
} | null>(null);
export function useSidebar() {
  const state = useContext(Context);
  if (!state) throw Error('Sidebar requires SidebarProvider.');
  return state;
}
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false), [open, setOpen] = useState(true), [openMobile, setOpenMobile] = useState(false);
  useEffect(() => {
    const query = matchMedia('(max-width: 767px)');
    const update = () => { setMobile(query.matches); setOpenMobile(false); };
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <Context.Provider value={{ mobile, open, openMobile, setOpenMobile,
    toggle: () => mobile ? setOpenMobile(value => !value) : setOpen(value => !value) }}>
    <div className="docs-shell">{children}</div>
  </Context.Provider>;
}
export function SidebarTrigger() {
  const state = useSidebar();
  return <DsButton className="docs-menu-trigger" variant="ghost" size="sm" prefixIcon="menu-2" ariaLabel="탐색 메뉴"
    aria-expanded={state.mobile ? state.openMobile : state.open} aria-controls="docs-navigation" onClick={state.toggle} />;
}
export function Sidebar({ children }: { children: ReactNode }) {
  const { mobile, open, openMobile, setOpenMobile } = useSidebar();
  return mobile ? <DsDrawer open={openMobile} onOpenChange={setOpenMobile} position="left" width="min(320px, 90vw)" title="문서 탐색" noPadding>
    <div className="docs-sidebar-content" id="docs-navigation">{children}</div>
  </DsDrawer> : <aside className="docs-sidebar" hidden={!open} id="docs-navigation">
    <div className="docs-sidebar-content">{children}</div>
  </aside>;
}
