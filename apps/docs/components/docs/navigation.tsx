'use client';
import Link from '@/components/docs/doc-link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Sidebar, useSidebar } from './sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './disclosure';
import { categories, components, documents, navigationDocuments, type DiscoveryDocument } from '@/lib/discovery';
const storageKey = 'kjun-docs-navigation-v1';

export function Navigation({ id }: { id: string }) {
  const { setOpenMobile } = useSidebar();
  const current = documents.find(document => document.id === id);
  const defaults = { ...(current?.category ? { [current.category]: true } : {}), ...(current?.parent ? { [current.parent]: true } : {}), ...(current?.parentPageId ? { [current.parentPageId]: true } : {}) };
  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaults);
  useEffect(() => {
    let saved: Record<string, boolean> = {};
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { /* Storage is optional. */ }
    setExpanded(previous => ({ ...previous, ...saved,
      ...(current?.component ? { [current.category!]: true } : {}),
      ...(current?.parent ? { [current.parent]: true } : {}),
      ...(current?.parentPageId ? { [current.parentPageId]: true } : {}),
    }));
  }, [id, current?.component, current?.category, current?.parent, current?.parentPageId]);
  const toggle = (key: string, open: boolean) => setExpanded(previous => {
    const next = { ...previous, [key]: open };
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Private browsing still works. */ }
    return next;
  });
  const documentLink = (document: DiscoveryDocument) => <Link href={document.path}
    aria-current={document.id === id ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
    {document.title}
  </Link>;
  return <Sidebar>
    <div className="docs-sidebar-header"><Link className="wordmark" href="/" aria-label="KJUN UI 홈">
      <span className="symbol-space"><Image unoptimized src="/brand/kjun-symbol.svg" alt="" width={28} height={21} /></span>
      <strong>KJUN</strong><span>UI</span>
    </Link></div>
    <div className="docs-sidebar-scroll"><nav className="doc-nav" aria-label="문서 탐색">
      {['Get started', 'Foundations'].map(group => <div className="nav-group" key={group}>
        <small>{group.toUpperCase()}</small>
        {navigationDocuments.filter(document => document.group === group && !document.parentPageId).map(document => {
          const children = navigationDocuments.filter(child => child.parentPageId === document.id);
          return children.length ? <Collapsible key={document.id} open={!!expanded[document.id]}
            onOpenChange={open => toggle(document.id, open)}>
            <div className="nav-parent-row">{documentLink(document)}
              <CollapsibleTrigger className="nav-child-trigger" aria-label={`${document.title} 주제`} prefixIcon="chevron-down" />
            </div>
            <CollapsibleContent className="nav-children">{children.map(child => <div key={child.id}>{documentLink(child)}</div>)}</CollapsibleContent>
          </Collapsible> : <div key={document.id}>{documentLink(document)}</div>;
        })}
      </div>)}
      <div className="nav-group"><small>COMPONENTS</small>
        {documentLink(documents.find(document => document.id === 'components')!)}
        {categories.map(category => <Collapsible className="nav-category" key={category.id}
          open={!!expanded[category.id]} onOpenChange={open => toggle(category.id, open)}>
          <CollapsibleTrigger className="nav-category-trigger" aria-label={`${category.label} 분류`} suffixIcon="chevron-down">
            <span>{category.label}</span><span className="nav-count">{category.count}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {components.filter(document => document.category === category.id && !document.parent).map(document => {
              const children = components.filter(child => child.parent === document.component);
              return children.length ? <Collapsible key={document.id} open={!!expanded[document.component!]}
                onOpenChange={open => toggle(document.component!, open)}>
                <div className="nav-parent-row">{documentLink(document)}
                  <CollapsibleTrigger className="nav-child-trigger" aria-label={`${document.title} 하위 구성`} prefixIcon="chevron-down" />
                </div>
                <CollapsibleContent className="nav-children">{children.map(child => <div key={child.id}>{documentLink(child)}</div>)}</CollapsibleContent>
              </Collapsible> : <div key={document.id}>{documentLink(document)}</div>;
            })}
          </CollapsibleContent>
        </Collapsible>)}
      </div>
    </nav></div>
  </Sidebar>;
}
